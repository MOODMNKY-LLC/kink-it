import React from "react";

interface DashboardPageLayoutProps {
  children: React.ReactNode;

  header: {
    title: string;
    description?: string;
    icon?: React.ElementType;
  };
}

export default function DashboardPageLayout({
  children,
  header,
}: DashboardPageLayoutProps) {
  const IconComponent = header.icon;
  
  return (
    <div className="flex flex-col relative w-full gap-1 min-h-full">
      <div className="flex items-center lg:items-baseline gap-2.5 md:gap-4 px-4 md:px-6 py-3 md:pb-4 lg:pt-7 ring-2 ring-pop sticky top-header-mobile lg:top-0 bg-background/95 backdrop-blur-sm z-20 safe-area-top">
        {IconComponent && (
          <div className="max-lg:contents rounded bg-primary size-10 md:size-9 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center my-auto touch-target-small">
            <IconComponent className="ml-1 lg:ml-0 opacity-50 md:opacity-100 size-5" />
          </div>
        )}
        <h1 className="text-xl lg:text-4xl font-display leading-[1] mb-1 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          {header.title}
        </h1>
        {header.description && (
          <span className="ml-auto text-xs md:text-sm text-foreground/70 block">
            {header.description}
          </span>
        )}
      </div>
      <div className="min-h-full flex-1 flex flex-col gap-8 md:gap-14 px-3 lg:px-6 py-6 md:py-10 ring-2 ring-pop bg-background">
        {children}
      </div>
    </div>
  );
}
