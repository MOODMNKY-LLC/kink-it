import DashboardPageLayout from "@/components/dashboard/layout"
import BracketsIcon from "@/components/icons/brackets"
import { NotionDocRenderer } from "@/components/notion/notion-doc-renderer"
import { notionGuides } from "@/lib/notion-guides"

export default function GuidesPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Guides & Documentation",
        description: "Learn how to use KINK IT effectively",
        icon: BracketsIcon,
      }}
    >
      <div className="space-y-6">
        {notionGuides.map((guide) => (
          <NotionDocRenderer key={guide.id} guide={guide} />
        ))}
      </div>
    </DashboardPageLayout>
  )
}
