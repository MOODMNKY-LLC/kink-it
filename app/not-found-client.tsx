"use client"

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { KinkyIcon } from "@/components/kinky/kinky-avatar";
import { KinkyErrorState } from "@/components/kinky/kinky-error-state";

export function NotFoundClient() {
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
