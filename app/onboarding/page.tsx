import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import OnboardingWizard from "@/components/onboarding/onboarding-wizard"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; discord_installed?: string; error?: string }>
}) {
  await requireAuth()
  const profile = await getUserProfile()
  const supabase = await createClient()

  // If onboarding is already completed, redirect to dashboard
  if (profile?.onboarding_completed) {
    redirect("/")
  }

  // Await searchParams before accessing properties (Next.js 15 requirement)
  const params = await searchParams
  
  // Get current onboarding step from URL params (priority) or database
  const urlStep = params?.step ? parseInt(params.step, 10) : null
  
  // Validate that previous steps are actually completed before using dbStep
  // This prevents skipping steps even if onboarding_step is set incorrectly
  // We check actual data existence, not just onboarding_step value
  const dbStep = profile?.onboarding_step || 1
  let validatedStep = dbStep
  
  // Parse onboarding_data (it might be a JSON string or object)
  let onboardingData: any = null
  try {
    if (profile?.onboarding_data) {
      onboardingData = typeof profile.onboarding_data === 'string' 
        ? JSON.parse(profile.onboarding_data) 
        : profile.onboarding_data
    }
  } catch (e) {
    console.error("[Onboarding] Failed to parse onboarding_data:", e)
  }
  
  console.log(`[Onboarding] Starting validation: dbStep=${dbStep}`)
  console.log(`[Onboarding] onboarding_data (raw):`, profile?.onboarding_data)
  console.log(`[Onboarding] onboarding_data (parsed):`, onboardingData)
  console.log(`[Onboarding] Profile data:`, {
    dynamic_role: profile?.dynamic_role,
    bond_id: profile?.bond_id,
    onboarding_step: profile?.onboarding_step,
  })
  
  // Step 1 validation: Check if dynamic_role was set through onboarding
  // Primary: Check onboarding_data (source of truth for explicit user selection)
  // Fallback: Check profile.dynamic_role (in case onboarding_data save failed or hasn't completed yet)
  // This handles race conditions where the save hasn't completed before validation runs
  const hasStep1Data = (onboardingData?.dynamic_role !== undefined && onboardingData?.dynamic_role !== null) ||
                        (profile?.dynamic_role !== undefined && profile?.dynamic_role !== null)
  
  console.log(`[Onboarding] Step 1 data check:`, {
    onboardingData_dynamic_role: onboardingData?.dynamic_role,
    profile_dynamic_role: profile?.dynamic_role,
    hasStep1Data,
  })
  
  if (validatedStep >= 2 || hasStep1Data) {
    console.log(`[Onboarding] Step 1 validation: hasStep1Data=${hasStep1Data}, dynamic_role=${onboardingData?.dynamic_role}`)
    
    // If step 1 data exists, allow progression (even if onboarding_step is 1)
    if (hasStep1Data && validatedStep < 2) {
      console.log(`[Onboarding] ✓ Step 1 data found in onboarding_data, allowing progression`)
      validatedStep = 2
    } else if (!hasStep1Data && validatedStep >= 2) {
      // If onboarding_step >= 2 but no step 1 data, force back to step 1
      console.log(`[Onboarding] ❌ Step 1 not completed (no onboarding_data.dynamic_role), forcing back to step 1`)
      validatedStep = 1
      // Update database to reflect correct step
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ onboarding_step: 1 })
        .eq("id", profile!.id)
      if (updateError) {
        console.error("[Onboarding] Failed to update onboarding_step:", updateError)
      }
    } else {
      console.log(`[Onboarding] ✓ Step 1 validated`)
    }
  }
  
  // Step 2 validation: Check if bond_id exists AND step 2 data exists in onboarding_data
  // Also check if step 2 data exists to allow progression
  const hasBondId = !!profile?.bond_id
  const hasStep2Data = onboardingData?.bond_id !== undefined || 
                       onboardingData?.bond_mode !== undefined ||
                       onboardingData?.bond_name !== undefined
  
  if (validatedStep >= 3 || hasStep2Data) {
    console.log(`[Onboarding] Step 2 validation: hasBondId=${hasBondId}, hasStep2Data=${hasStep2Data}`)
    console.log(`[Onboarding] Step 2 data:`, {
      bond_id: onboardingData?.bond_id,
      bond_mode: onboardingData?.bond_mode,
      bond_name: onboardingData?.bond_name,
    })
    
    // If step 2 data exists, allow progression (even if onboarding_step is 2)
    if (hasStep2Data && validatedStep < 3) {
      console.log(`[Onboarding] ✓ Step 2 data found in onboarding_data, allowing progression`)
      validatedStep = 3
      // Also ensure profile.bond_id is set if it's in onboarding_data
      if (onboardingData?.bond_id && !profile?.bond_id) {
        console.log(`[Onboarding] Updating profile.bond_id from onboarding_data`)
        await supabase
          .from("profiles")
          .update({ bond_id: onboardingData.bond_id })
          .eq("id", profile!.id)
      }
    } else if ((!hasBondId || !hasStep2Data) && validatedStep >= 3) {
      // If onboarding_step >= 3 but no step 2 data, force back to step 2
      console.log(`[Onboarding] ❌ Step 2 not completed (bond_id: ${profile?.bond_id}, hasStep2Data: ${hasStep2Data}), forcing back to step 2`)
      validatedStep = 2
      // Update database to reflect correct step
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ onboarding_step: 2 })
        .eq("id", profile!.id)
      if (updateError) {
        console.error("[Onboarding] Failed to update onboarding_step:", updateError)
      }
    } else {
      console.log(`[Onboarding] ✓ Step 2 validated`)
    }
  }
  
  console.log(`[Onboarding] Validation complete: dbStep=${dbStep} → validatedStep=${validatedStep}`)
  
  // Use URL step only if it's valid AND not ahead of validated step
  // This prevents skipping steps via URL manipulation
  let currentStep = validatedStep
  if (urlStep && urlStep >= 1 && urlStep <= 4) {
    if (urlStep <= validatedStep) {
      // URL step is valid and not ahead of validated step
      currentStep = urlStep
      console.log(`[Onboarding] Using URL step ${urlStep} (validated step: ${validatedStep})`)
    } else {
      // URL step is ahead of validated step, ignore it
      console.warn(`[Onboarding] ⚠ URL step ${urlStep} is ahead of validated step ${validatedStep}, ignoring URL step`)
      currentStep = validatedStep
    }
  } else {
    // No URL step or invalid, use validated step
    currentStep = validatedStep
  }
  
  console.log(`[Onboarding] Final step determination: currentStep=${currentStep}`)
  
  // Log step determination for debugging
  if (dbStep !== validatedStep) {
    console.log(`[Onboarding] Step validation corrected: dbStep=${dbStep} → validated=${validatedStep}`)
    console.log(`[Onboarding] Profile data:`, {
      dynamic_role: profile?.dynamic_role,
      bond_id: profile?.bond_id,
      onboarding_step: profile?.onboarding_step,
      onboarding_data: profile?.onboarding_data,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingWizard 
        initialStep={currentStep}
        urlParams={params}
      />
    </div>
  )
}
