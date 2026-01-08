"use client"

import React from "react";
import { NotFoundClient } from "./not-found-client";

// Force dynamic rendering to prevent static generation (Next.js 15.5.9 bug workaround)
// Using edge runtime prevents static generation entirely (edge cannot be statically generated)
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0 // Explicitly disable caching/static generation

export default function NotFound() {
  return <NotFoundClient />;
}
