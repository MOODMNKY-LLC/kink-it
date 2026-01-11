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

    const body = await request.json()
    const { step, data } = body

    console.log(`[Onboarding Progress] Received save request: step=${step}, data=`, data)
    console.log(`[Onboarding Progress] Data keys:`, data ? Object.keys(data) : 'no data')

    // Prepare update object
    const updateData: any = {
      onboarding_step: step,
      onboarding_data: data,
      updated_at: new Date().toISOString(),
    }

    // If dynamic_role is in the data, update profile.dynamic_role
    // This ensures dynamic_role is saved to the profile for easy access
    if (data?.dynamic_role) {
      updateData.dynamic_role = data.dynamic_role
      console.log(`[Onboarding Progress] Updating profile.dynamic_role to ${data.dynamic_role}`)
    }

    // If bond_id is in the data, update profile.bond_id
    // This ensures bond_id is saved even if bond creation API update failed
    if (data?.bond_id) {
      updateData.bond_id = data.bond_id
      console.log(`[Onboarding Progress] Updating profile.bond_id to ${data.bond_id}`)
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
      return NextResponse.json({ error: error.message }, { status: 500 })
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
