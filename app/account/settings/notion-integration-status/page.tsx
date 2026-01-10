"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { BlurFade } from "@/components/ui/blur-fade"
import { toast } from "sonner"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  FileText,
  ExternalLink,
  User,
  Key,
  Loader2,
  Plus,
  Trash2,
  TestTube,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotionSyncStatus } from "@/components/playground/shared/use-notion-sync-status"
import { NotionSyncStatusBadge } from "@/components/playground/shared/notion-sync-status-badge"
import { DataRecoveryFlow } from "@/components/notion/data-recovery-flow"
import { useNotionRecoveryDetection } from "@/hooks/use-notion-recovery-detection"

// Auto-scroll component that pauses on hover
function AutoScrollTable({
  children,
  className,
  resetKey,
}: {
  children: React.ReactNode
  className?: string
  resetKey?: number | string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Reset scroll position when resetKey changes (e.g., pagination)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [resetKey])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    // Only auto-scroll if content is scrollable
    const isScrollable = container.scrollHeight > container.clientHeight
    if (!isScrollable) return

    const startScrolling = () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }

      scrollIntervalRef.current = setInterval(() => {
        if (!isPaused && container) {
          const maxScroll = container.scrollHeight - container.clientHeight
          if (maxScroll <= 0) return // Not scrollable

          if (container.scrollTop >= maxScroll - 1) {
            // Reset to top when reaching bottom
            container.scrollTop = 0
          } else {
            container.scrollTop += 1
          }
        }
      }, 30) // Scroll every 30ms for smooth movement
    }

    startScrolling()

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [isPaused, resetKey])

  const handleMouseEnter = () => {
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  return (
    <div
      ref={scrollRef}
      className={cn(
        "overflow-y-auto",
        "[&::-webkit-scrollbar]:hidden",
        "[-ms-overflow-style:none]",
        "[scrollbar-width:none]",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}

interface DatabaseStatus {
  id: string
  title: string
  url: string
  type: string | null
  accessible: boolean
  synced: boolean
  synced_name?: string
  error?: string
  entry_count?: number
}

interface PageStatus {
  id: string
  title: string
  url: string
  accessible: boolean
  has_databases: boolean
  error?: string
}

interface IntegrationStatus {
  connected: boolean
  user?: {
    id: string
    name: string
    email?: string
    avatar_url?: string
  }
  api_key?: {
    id: string
    name: string
    last_validated_at: string | null
  }
  databases: DatabaseStatus[]
  pages: PageStatus[]
  synced_databases_count: number
  accessible_databases_count: number
  total_databases: number
  total_pages: number
  error?: string
  pagination?: {
    databases_page: number
    databases_per_page: number
    databases_total: number
    pages_page: number
    pages_per_page: number
    pages_total: number
  }
}

interface ApiKey {
  id: string
  key_name: string
  key_hash: string
  is_active: boolean
  last_used_at: string | null
  last_validated_at: string | null
  created_at: string
  updated_at: string
}

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50]

export default function NotionIntegrationStatusPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dbPage, setDbPage] = useState(1)
  const [dbPerPage, setDbPerPage] = useState(5)
  const [pagePage, setPagePage] = useState(1)
  const [pagePerPage, setPagePerPage] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null)
  const [keyName, setKeyName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const { status: syncStatus, syncNow, refresh: refreshSyncStatus } = useNotionSyncStatus()
  const { scenario: recoveryScenario, isLoading: checkingRecovery } = useNotionRecoveryDetection()
  const [showRecoveryFlow, setShowRecoveryFlow] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        db_page: dbPage.toString(),
        db_per_page: dbPerPage.toString(),
        page_page: pagePage.toString(),
        page_per_page: pagePerPage.toString(),
      })
      const response = await fetch(`/api/notion/integration-status?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch integration status")
      }
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Error fetching status:", error)
      toast.error("Failed to load integration status")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dbPage, dbPerPage, pagePage, pagePerPage])

  const fetchApiKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/notion/api-keys")
      if (!response.ok) {
        throw new Error("Failed to fetch API keys")
      }
      const data = await response.json()
      setApiKeys(data.apiKeys || [])
    } catch (error) {
      console.error("Error fetching API keys:", error)
      toast.error("Failed to load API keys")
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchStatus(), fetchApiKeys()])
  }, [fetchStatus, fetchApiKeys])

  const handleRefresh = () => {
    setRefreshing(true)
    Promise.all([fetchStatus(), fetchApiKeys(), refreshSyncStatus()])
  }

  const handleSyncTemplate = async () => {
    await syncNow()
    await fetchStatus()
  }

  const handleAddKey = async () => {
    if (!keyName.trim() || !apiKey.trim()) {
      toast.error("Please provide both a name and API key")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/notion/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_name: keyName.trim(),
          api_key: apiKey.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add API key")
      }

      toast.success("API key added successfully")
      setDialogOpen(false)
      setKeyName("")
      setApiKey("")
      await Promise.all([fetchApiKeys(), refreshSyncStatus()])
    } catch (error: any) {
      console.error("Error adding API key:", error)
      toast.error(error.message || "Failed to add API key")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/notion/api-keys/${keyId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete API key")
      }

      toast.success("API key deleted successfully")
      await Promise.all([fetchApiKeys(), refreshSyncStatus()])
    } catch (error) {
      console.error("Error deleting API key:", error)
      toast.error("Failed to delete API key")
    }
  }

  const handleTestKey = async (keyId: string) => {
    setTestingKeyId(keyId)
    try {
      const response = await fetch(`/api/notion/api-keys/${keyId}/test`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success && data.valid) {
        toast.success("API key is valid and working correctly")
        await fetchApiKeys()
      } else {
        toast.error(data.error || "API key validation failed")
      }
    } catch (error) {
      console.error("Error testing API key:", error)
      toast.error("Failed to test API key")
    } finally {
      setTestingKeyId(null)
    }
  }

  const getStatusIcon = (accessible: boolean, error?: string) => {
    if (error) {
      return <XCircle className="h-4 w-4 text-destructive" />
    }
    return accessible ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-yellow-500" />
    )
  }

  const getStatusBadge = (accessible: boolean, synced?: boolean, error?: string) => {
    if (error) {
      return <Badge variant="destructive">Error</Badge>
    }
    if (synced) {
      return <Badge variant="default">Synced</Badge>
    }
    return accessible ? (
      <Badge variant="secondary">Accessible</Badge>
    ) : (
      <Badge variant="outline">Limited Access</Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
    itemsPerPage: number,
    onItemsPerPageChange: (perPage: number) => void,
    totalItems: number
  ) => {
    if (totalPages <= 1) return null

    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {startItem}-{endItem} of {totalItems}
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value))
              onPageChange(1)
            }}
            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>
        <Pagination className="w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) onPageChange(currentPage - 1)
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 7) {
                pageNum = i + 1
              } else if (currentPage <= 4) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i
              } else {
                pageNum = currentPage - 3 + i
              }
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      onPageChange(pageNum)
                    }}
                    isActive={currentPage === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            {totalPages > 7 && currentPage < totalPages - 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) onPageChange(currentPage + 1)
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <BlurFade delay={0.1}>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to load status</AlertTitle>
            <AlertDescription>
              Unable to fetch integration status. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </BlurFade>
    )
  }

  const dbTotalPages = status.pagination
    ? Math.ceil(status.pagination.databases_total / dbPerPage)
    : 1
  const pageTotalPages = status.pagination
    ? Math.ceil(status.pagination.pages_total / pagePerPage)
    : 1

  return (
    <div className="space-y-6 [&_*::-webkit-scrollbar]:hidden [&_*]:[-ms-overflow-style:none] [&_*]:[scrollbar-width:none]">
      <BlurFade delay={0.1}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Notion Integration</h1>
            <p className="text-muted-foreground mt-2">
              Manage your Notion API keys and monitor integration status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotionSyncStatusBadge showButton={true} showBadge={true} />
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </BlurFade>

      {!status.connected && (
        <BlurFade delay={0.2}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Connected</AlertTitle>
            <AlertDescription>
              {status.error || "No active API key found. Please add a Notion API key to continue."}
            </AlertDescription>
          </Alert>
        </BlurFade>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {status.connected && (
            <>
              {/* Connection Status */}
              <BlurFade delay={0.2}>
                <Card className="backdrop-blur-sm bg-background/80 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Connection Status
                    </CardTitle>
                    <CardDescription>Your Notion integration is active and connected</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {status.user && (
                      <div className="flex items-center gap-4">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{status.user.name}</div>
                          {status.user.email && (
                            <div className="text-sm text-muted-foreground">{status.user.email}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {status.api_key && (
                      <div className="flex items-center gap-4">
                        <Key className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{status.api_key.name}</div>
                          {status.api_key.last_validated_at && (
                            <div className="text-sm text-muted-foreground">
                              Last validated: {new Date(status.api_key.last_validated_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </BlurFade>

              {/* Data Recovery Section */}
              {recoveryScenario?.needsRecovery && (
                <BlurFade delay={0.25}>
                  <Card className="backdrop-blur-sm bg-background/80 border-border/50 border-orange-500/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        Data Recovery Available
                      </CardTitle>
                      <CardDescription>
                        {recoveryScenario.reason}. You can recover your data from Notion.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Lost your data? No worries! We can recover it from your Notion workspace.
                            Your data in Notion is safe and can be restored to Supabase.
                          </AlertDescription>
                        </Alert>
                        <Button
                          onClick={() => setShowRecoveryFlow(true)}
                          className="w-full sm:w-auto"
                        >
                          Recover Data from Notion
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </BlurFade>
              )}

              {/* Summary Stats */}
              <BlurFade delay={0.3}>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="backdrop-blur-sm bg-background/80 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Databases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {status.total_databases || status.databases.length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {status.accessible_databases_count} accessible
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="backdrop-blur-sm bg-background/80 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Synced Databases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{status.synced_databases_count}</div>
                      <p className="text-xs text-muted-foreground">
                        {status.synced_databases_count === 0
                          ? "No databases synced yet"
                          : "Connected to app"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="backdrop-blur-sm bg-background/80 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Pages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{status.total_pages || status.pages.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {status.pages.filter((p) => p.has_databases).length} with databases
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </BlurFade>

              {/* Databases and Pages - Tab Configuration */}
              <BlurFade delay={0.4}>
                <Card className="backdrop-blur-sm bg-background/80 border-border/50 flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Databases & Pages
                    </CardTitle>
                    <CardDescription>
                      Browse your Notion databases and pages
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col min-h-0 pb-6">
                    <Tabs defaultValue="databases" className="w-full flex-1 flex flex-col min-h-0">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="databases" className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Databases ({status.total_databases || status.databases.length})
                        </TabsTrigger>
                        <TabsTrigger value="pages" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Pages ({status.total_pages || status.pages.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="databases" className="flex-1 flex flex-col min-h-0 mt-4">
                        {status.databases.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No databases found</div>
                        ) : (
                          <>
                            <AutoScrollTable
                              className="rounded-md border overflow-hidden flex-1 min-h-0"
                              resetKey={`db-${dbPage}-${dbPerPage}`}
                            >
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {status.databases.map((db) => (
                                    <TableRow key={db.id}>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          {getStatusIcon(db.accessible, db.error)}
                                          {getStatusBadge(db.accessible, db.synced, db.error)}
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        <div>{db.title}</div>
                                        {db.entry_count !== undefined && (
                                          <div className="text-xs text-muted-foreground">
                                            {db.entry_count >= 100 ? "100+" : db.entry_count} entries
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {db.type ? (
                                          <Badge variant="outline">{db.type}</Badge>
                                        ) : (
                                          <span className="text-muted-foreground">—</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => window.open(db.url, "_blank")}
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AutoScrollTable>
                            <div className="mt-6 pt-4 border-t">
                              {renderPagination(
                                dbPage,
                                dbTotalPages,
                                setDbPage,
                                dbPerPage,
                                setDbPerPage,
                                status.total_databases || status.databases.length
                              )}
                            </div>
                          </>
                        )}
                      </TabsContent>

                      <TabsContent value="pages" className="flex-1 flex flex-col min-h-0 mt-4">
                        {status.pages.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">No pages found</div>
                        ) : (
                          <>
                            <AutoScrollTable
                              className="rounded-md border overflow-hidden flex-1 min-h-0"
                              resetKey={`page-${pagePage}-${pagePerPage}`}
                            >
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Has DBs</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {status.pages.map((page) => (
                                    <TableRow key={page.id}>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          {getStatusIcon(page.accessible, page.error)}
                                          {getStatusBadge(page.accessible, undefined, page.error)}
                                        </div>
                                      </TableCell>
                                      <TableCell className="font-medium">{page.title}</TableCell>
                                      <TableCell>
                                        {page.has_databases ? (
                                          <Badge variant="default">Yes</Badge>
                                        ) : (
                                          <Badge variant="outline">No</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => window.open(page.url, "_blank")}
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AutoScrollTable>
                            <div className="mt-6 pt-4 border-t">
                              {renderPagination(
                                pagePage,
                                pageTotalPages,
                                setPagePage,
                                pagePerPage,
                                setPagePerPage,
                                status.total_pages || status.pages.length
                              )}
                            </div>
                          </>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </BlurFade>
            </>
          )}
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <BlurFade delay={0.1}>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Security Notice</AlertTitle>
              <AlertDescription>
                Your API keys are encrypted and stored securely. They are never displayed in full and
                are only decrypted when needed for API calls. Never share your API keys with anyone.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Your API Keys</h2>
                <p className="text-sm text-muted-foreground">
                  {apiKeys.length} {apiKeys.length === 1 ? "key" : "keys"} configured
                </p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Notion API Key</DialogTitle>
                    <DialogDescription>
                      Enter a name for this API key and paste your Notion integration token. The key
                      will be validated before storage.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="key-name">Key Name</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g., Personal Workspace, Team Integration"
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="api-key">Notion API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="secret_... or ntn_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your API key starts with &quot;secret_&quot; or &quot;ntn_&quot;
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddKey} disabled={submitting}>
                      {submitting ? "Adding..." : "Add Key"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-12 border rounded-lg backdrop-blur-sm bg-background/80">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No API keys configured</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first Notion API key to enable enhanced integration features.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add API Key
                </Button>
              </div>
            ) : (
              <Card className="backdrop-blur-sm bg-background/80 border-border/50">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key Hash</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Last Validated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.key_name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {key.key_hash}...
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={key.is_active ? "default" : "secondary"}>
                              {key.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(key.last_used_at)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(key.last_validated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTestKey(key.id)}
                                disabled={testingKeyId === key.id}
                              >
                                {testingKeyId === key.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <TestTube className="h-4 w-4" />
                                )}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteKey(key.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </BlurFade>
        </TabsContent>

        <TabsContent value="databases" className="space-y-6">
          <BlurFade delay={0.1}>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Databases and Pages Moved</AlertTitle>
              <AlertDescription>
                Databases and pages are now displayed in the Overview tab for easier access.
              </AlertDescription>
            </Alert>
          </BlurFade>
        </TabsContent>
      </Tabs>

      {/* Data Recovery Flow Dialog */}
      <DataRecoveryFlow
        open={showRecoveryFlow}
        onOpenChange={setShowRecoveryFlow}
      />
    </div>
  )
}
