"use client"

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { KinkyIcon } from "@/components/kinky/kinky-avatar";
import { KinkyErrorState } from "@/components/kinky/kinky-error-state";

// Force dynamic rendering to avoid Next.js 15.5.9 static generation bug
export const dynamic = 'force-dynamic'

// Note: Made fully client-side to avoid Next.js 15.5.9 static generation bug
// This is a known Next.js issue with Html import during static generation
// Production works fine as it uses runtime rendering
export default function NotFound() {
  return (
    <DashboardPageLayout
      header={{
        title: "Not found",
        description: "Page not found",
        icon: KinkyIcon,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-10 flex-1">
        <KinkyErrorState
          title="404 - Page Not Found"
          description="Looks like this page wandered off. Let me help you find your way back."
          size="lg"
          actionLabel="Go Home"
          onAction={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          }}
        />
      </div>
    </DashboardPageLayout>
  );
}
