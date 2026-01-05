import { requireAuth, getUserProfile } from "@/lib/auth/get-user"
import DashboardPageLayout from "@/components/dashboard/layout"
import { Library } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ResourcesPage() {
  await requireAuth()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Resource Library",
        description: "Educational content, bookmarked resources, and curated guides",
        icon: Library,
      }}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resource Library</CardTitle>
            <CardDescription>
              Educational content, bookmarked resources, how-to guides, community links, and curated content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This module provides a comprehensive library of educational resources, guides, bookmarks, and curated
                content to support your D/s relationship journey. Discover articles, videos, community forums, and
                expert guidance.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Resource Types</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Articles and blog posts</li>
                    <li>How-to guides</li>
                    <li>Video tutorials</li>
                    <li>Community forums</li>
                    <li>Book recommendations</li>
                    <li>Podcast episodes</li>
                    <li>External links</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Resource Management</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Add resources (Dominant)</li>
                    <li>Categorize resources</li>
                    <li>Tag resources</li>
                    <li>Bookmark favorites</li>
                    <li>Share resources with partner</li>
                    <li>Rate resources</li>
                    <li>Add notes</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Resource Discovery</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Browse by category</li>
                    <li>Search resources</li>
                    <li>Filter by type</li>
                    <li>Sort by rating or date</li>
                    <li>Recommended resources</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground italic">
                  This module is currently under development. Full functionality will be available in Phase 4 of
                  development.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  )
}


