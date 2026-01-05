import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import OnboardingWizard from "@/components/onboarding/onboarding-wizard"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { step?: string; discord_installed?: string; error?: string }
}) {
  await requireAuth()
  const profile = await getUserProfile()
  const supabase = await createClient()

  // If onboarding is already completed, redirect to dashboard
  if (profile?.onboarding_completed) {
    redirect("/")
  }

  // Get current onboarding step from URL params (priority) or database
  const urlStep = searchParams?.step ? parseInt(searchParams.step, 10) : null
  const dbStep = profile?.onboarding_step || 1
  const currentStep = urlStep && urlStep >= 1 && urlStep <= 6 ? urlStep : dbStep

  return (
    <div className="min-h-screen bg-background">
      <OnboardingWizard 
        initialStep={currentStep}
        urlParams={searchParams}
      />
    </div>
  )
}


