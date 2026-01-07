import { Metadata } from "next"
import DashboardPageLayout from "@/components/dashboard/layout"
import { Shield } from "lucide-react"
import { readFile } from "fs/promises"
import { join } from "path"
import { MarkdownRenderer } from "@/components/docs/markdown-renderer"

export const metadata: Metadata = {
  title: "Privacy Policy | KINK IT",
  description: "KINK IT Privacy Policy - How we protect your data and respect your privacy",
}

export default async function PrivacyPolicyPage() {
  // Try to read the privacy policy markdown file
  let privacyContent = ""
  try {
    const filePath = join(process.cwd(), "docs", "PRIVACY_POLICY.md")
    privacyContent = await readFile(filePath, "utf-8")
  } catch (error) {
    // If file doesn't exist yet, use placeholder content
    privacyContent = "# Privacy Policy\n\n*Privacy policy content will be displayed here.*"
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Privacy Policy",
        description: "How we protect your data and respect your privacy",
        icon: Shield,
      }}
    >
      <div className="prose prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-sidebar-accent prose-pre:border prose-pre:border-border prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-ul:text-muted-foreground prose-ol:text-muted-foreground max-w-none">
        <div className="bg-card border border-border rounded-lg p-6 md:p-8">
          <MarkdownRenderer content={privacyContent} />
        </div>
      </div>
    </DashboardPageLayout>
  )
}

