import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("[Onboarding Progress] ❌ Failed to parse request body:", error)
      return NextResponse.json(
        { error: "Invalid request body", details: error instanceof Error ? error.message : String(error) },
        { status: 400 }
      )
    }

    const { step, data } = body

    if (step === undefined || step === null) {
      return NextResponse.json(
        { error: "step is required" },
        { status: 400 }
      )
    }

    if (data === undefined || data === null) {
      return NextResponse.json(
        { error: "data is required" },
        { status: 400 }
      )
    }

    console.log(`[Onboarding Progress] Received save request: step=${step}, data=`, data)
    console.log(`[Onboarding Progress] Data keys:`, data ? Object.keys(data) : 'no data')

    // Get current onboarding_data to merge with new data
    // This ensures we never lose previous step data if the client doesn't send it
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("onboarding_data")
      .eq("id", user.id)
      .single()

    let currentOnboardingData: any = {}
    try {
      if (currentProfile?.onboarding_data) {
        currentOnboardingData = typeof currentProfile.onboarding_data === 'string'
          ? JSON.parse(currentProfile.onboarding_data)
          : currentProfile.onboarding_data
      }
    } catch (e) {
      console.warn("[Onboarding Progress] Failed to parse existing onboarding_data, starting fresh:", e)
      currentOnboardingData = {}
    }

    // Merge incoming data with existing onboarding_data
    // Client sends merged data, but we merge again to be safe
    const mergedOnboardingData = { ...currentOnboardingData, ...data }
    console.log(`[Onboarding Progress] Merged onboarding_data:`, {
      existing: currentOnboardingData,
      incoming: data,
      merged: mergedOnboardingData,
    })

    // Prepare update object
    const updateData: any = {
      onboarding_step: step,
      onboarding_data: mergedOnboardingData,
      updated_at: new Date().toISOString(),
    }

    // If dynamic_role is in the data, update profile.dynamic_role
    // This ensures dynamic_role is saved to the profile for easy access
    if (data?.dynamic_role) {
      updateData.dynamic_role = data.dynamic_role
      console.log(`[Onboarding Progress] Updating profile.dynamic_role to ${data.dynamic_role}`)
    }

    // If bond_id is in the data, verify it exists and user is a member before updating
    // This ensures bond_id is saved even if bond creation API update failed
    if (data?.bond_id) {
      // First check if profile.bond_id already matches - if so, skip validation
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("bond_id")
        .eq("id", user.id)
        .single()

      // If bond_id already matches, no need to update or validate
      if (currentProfile?.bond_id === data.bond_id) {
        console.log(`[Onboarding Progress] ✓ Profile.bond_id already set to ${data.bond_id}, skipping update`)
      } else {
        // Verify bond exists - use maybeSingle to handle RLS gracefully
        const { data: bond, error: bondCheckError } = await supabase
          .from("bonds")
          .select("id")
          .eq("id", data.bond_id)
          .maybeSingle()

        if (bondCheckError) {
          console.error("[Onboarding Progress] ❌ Error checking bond:", {
            bond_id: data.bond_id,
            error: bondCheckError,
          })
          // Don't fail - might be RLS issue, let the database constraint handle it
          console.warn("[Onboarding Progress] ⚠ Bond check failed, proceeding anyway (will fail at DB level if invalid)")
        } else if (!bond) {
          console.error("[Onboarding Progress] ❌ Bond not found:", {
            bond_id: data.bond_id,
          })
          return NextResponse.json(
            {
              error: "Bond not found",
              details: `The bond with ID ${data.bond_id} does not exist. Please create a new bond or join an existing one.`,
              code: "BOND_NOT_FOUND",
            },
            { status: 404 }
          )
        }

        // Verify user is a member of the bond - use maybeSingle to handle RLS gracefully
        const { data: bondMember, error: memberCheckError } = await supabase
          .from("bond_members")
          .select("id")
          .eq("bond_id", data.bond_id)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle()

        if (memberCheckError) {
          console.error("[Onboarding Progress] ❌ Error checking bond membership:", {
            bond_id: data.bond_id,
            user_id: user.id,
            error: memberCheckError,
          })
          // Don't fail - might be RLS issue, let the database constraint handle it
          console.warn("[Onboarding Progress] ⚠ Membership check failed, proceeding anyway (will fail at DB level if invalid)")
        } else if (!bondMember) {
          console.error("[Onboarding Progress] ❌ User is not a member of bond:", {
            bond_id: data.bond_id,
            user_id: user.id,
          })
          return NextResponse.json(
            {
              error: "Not a bond member",
              details: `You are not a member of this bond. Please join the bond first.`,
              code: "NOT_BOND_MEMBER",
            },
            { status: 403 }
          )
        }

        // Bond exists and user is a member - safe to update
        updateData.bond_id = data.bond_id
        console.log(`[Onboarding Progress] ✓ Verified bond exists and user is member, updating profile.bond_id to ${data.bond_id}`)
      }
    }

    // Update profile with onboarding progress
    console.log(`[Onboarding Progress] Updating profile ${user.id} with:`, updateData)
    const { error, data: updatedProfile } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select("onboarding_step, onboarding_data, bond_id")
      .single()

    if (error) {
      console.error("[Onboarding Progress] ❌ Error updating onboarding progress:", error)
      console.error("[Onboarding Progress] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        { 
          error: error.message || "Failed to update onboarding progress",
          code: error.code,
          details: error.details,
        },
        { status: 500 }
      )
    }

    console.log(`[Onboarding Progress] ✓ Successfully updated profile:`, {
      onboarding_step: updatedProfile?.onboarding_step,
      onboarding_data: updatedProfile?.onboarding_data,
      bond_id: updatedProfile?.bond_id,
    })

    // Log successful update for debugging
    if (data?.bond_id) {
      console.log(`[Onboarding Progress] ✓ Successfully updated profile.bond_id: ${updatedProfile?.bond_id}`)
    }

    return NextResponse.json({
      success: true,
      step,
      completed: step >= 4, // 4 is the final step (Welcome Splash)
    })
  } catch (error) {
    console.error("Error in onboarding progress endpoint:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails = error instanceof Error ? {
      name: error.name,
      stack: error.stack,
    } : {}
    return NextResponse.json(
      { 
        error: errorMessage || "Internal server error",
        ...errorDetails,
      },
      { status: 500 }
    )
  }
}
