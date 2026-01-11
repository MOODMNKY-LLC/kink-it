import { Metadata } from "next"
import DashboardPageLayout from "@/components/dashboard/layout"
import { FileText } from "lucide-react"
import { readFile } from "fs/promises"
import { join } from "path"
import { MarkdownRenderer } from "@/components/docs/markdown-renderer"

export const metadata: Metadata = {
  title: "Terms of Service | KINK IT",
  description: "KINK IT Terms of Service - Terms and conditions for using KINK IT",
}

export default async function TermsOfServicePage() {
  // Try to read the terms of service markdown file
  let termsContent = ""
  try {
    const filePath = join(process.cwd(), "docs", "TERMS_OF_SERVICE.md")
    termsContent = await readFile(filePath, "utf-8")
  } catch (error) {
    // If file doesn't exist yet, use placeholder content
    termsContent = "# Terms of Service\n\n*Terms of service content will be displayed here.*"
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Terms of Service",
        description: "Terms and conditions for using KINK IT",
        icon: FileText,
      }}
    >
      <div className="prose prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-sidebar-accent prose-pre:border prose-pre:border-border prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-ul:text-muted-foreground prose-ol:text-muted-foreground max-w-none">
        <div className="bg-card border border-border rounded-lg p-6 md:p-8">
          <MarkdownRenderer content={termsContent} />
        </div>
      </div>
    </DashboardPageLayout>
  )
}
