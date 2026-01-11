import { ReactNode } from "react"
import DashboardPageLayout from "@/components/dashboard/layout"
import { Sparkles } from "lucide-react"

interface PlaygroundLayoutProps {
  children: ReactNode
}

export default function PlaygroundLayout({ children }: PlaygroundLayoutProps) {
  return (
    <DashboardPageLayout
      header={{
        title: "Playground",
        description: "Creative tools and utilities for KINK IT",
        icon: Sparkles,
      }}
    >
      {children}
    </DashboardPageLayout>
  )
}
