import React from "react";
import Image from "next/image";
import DashboardPageLayout from "@/components/dashboard/layout";
import CuteRobotIcon from "@/components/icons/cute-robot";

export default function NotFound() {
  return (
    <DashboardPageLayout
      header={{
        title: "Not found",
        description: "page under construction",
        icon: CuteRobotIcon,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-10 flex-1">
        <picture className="w-1/4 aspect-square grayscale opacity-50">
          {/* Using regular img tag for animated GIF to avoid Next.js Image hydration issues */}
          <img
            src="/assets/bot_greenprint.gif"
            alt="Security Status"
            width={1000}
            height={1000}
            className="size-full object-contain"
            loading="lazy"
          />
        </picture>

        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-xl font-bold uppercase text-muted-foreground">
            Not found, yet
          </h1>
          <p className="text-sm max-w-sm text-center text-muted-foreground text-balance">
            Fork on v0 and start promoting your way to new pages.
          </p>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
