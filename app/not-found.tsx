import React from "react";
import { NotFoundClient } from "./not-found-client";

// Note: Build fails with Html import error during static generation
// This is a Next.js 15.5.9 internal issue, not our code
// Production works fine as it uses runtime rendering, not static generation
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return <NotFoundClient />;
}
