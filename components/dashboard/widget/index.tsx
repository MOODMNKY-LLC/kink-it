"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TVNoise from "@/components/ui/tv-noise";
// Using regular img tag for animated GIFs to avoid hydration issues

interface WidgetProps {
  userName: string;
  timezone?: string;
  location?: string;
}

export default function Widget({ userName, timezone, location }: WidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    const dayOfWeek = date.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const restOfDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return { dayOfWeek, restOfDate };
  };

  const getGreeting = (date: Date, name: string): string => {
    const hour = date.getHours();
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const dateInfo = formatDate(currentTime);
  const greeting = getGreeting(currentTime, userName);

  return (
    <Card className="w-full aspect-[2] relative overflow-hidden">
      <TVNoise opacity={0.3} intensity={0.2} speed={40} />
      <CardContent className="bg-accent/30 flex-1 flex flex-col justify-between text-sm font-medium uppercase relative z-20">
        <div className="flex justify-between items-center">
          <span className="opacity-50">{dateInfo.dayOfWeek}</span>
          <span>{dateInfo.restOfDate}</span>
        </div>
        <div className="text-center">
          <div className="text-5xl font-display" suppressHydrationWarning>
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {greeting}
          </div>
        </div>

        {(location || timezone) && (
          <div className="flex justify-between items-center">
            {location && <span>{location}</span>}
            {timezone && (
              <Badge variant="secondary" className="bg-accent">
                {timezone}
              </Badge>
            )}
          </div>
        )}

        <div className="absolute inset-0 -z-[1]">
          {/* Using regular img tag for animated GIF to avoid Next.js Image hydration issues */}
          <img
            src="/assets/pc_blueprint.gif"
            alt="logo"
            width={250}
            height={250}
            className="size-full object-contain"
            loading="lazy"
          />
        </div>
      </CardContent>
    </Card>
  );
}
