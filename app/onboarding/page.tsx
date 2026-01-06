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
  const dbStep = profile?.onboarding_step || 1
  const currentStep = urlStep && urlStep >= 1 && urlStep <= 6 ? urlStep : dbStep

  return (
    <div className="min-h-screen bg-background">
      <OnboardingWizard 
        initialStep={currentStep}
        urlParams={params}
      />
    </div>
  )
}


