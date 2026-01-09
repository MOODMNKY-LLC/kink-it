import React from "react";
import { NotFoundClient } from "./not-found-client";

// Force dynamic rendering to prevent static generation (Next.js 15.5.9 bug workaround)
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return <NotFoundClient />;
}
