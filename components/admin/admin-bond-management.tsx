"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MagicCard } from "@/components/ui/magic-card"
import { NumberTicker } from "@/components/ui/number-ticker"
import { 
  Search, 
  Filter, 
  Users, 
  Shield, 
  TrendingUp, 
  Activity,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Bond {
  id: string
  name: string
  description: string | null
  bond_type: string
  bond_status: string
  created_by: string
  created_at: string
  updated_at: string
  last_activity_at: string | null
  invite_code: string | null
  member_count?: number
  creator_name?: string
}

interface BondStats {
  total: number
  active: number
  forming: number
  paused: number
  dissolved: number
  total_members: number
  avg_members_per_bond: number
}

interface JoinRequest {
  id: string
  bond_id: string
  user_id: string
  status: "pending" | "approved" | "rejected"
  message: string | null
  review_notes: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  bond: {
    id: string
    name: string
    bond_type: string
    bond_status: string
  }
  requester: {
    id: string
    display_name: string | null
    full_name: string | null
    email: string
    dynamic_role: string
  }
  reviewer: {
    id: string
    display_name: string | null
    full_name: string | null
    email: string
  } | null
}

export function AdminBondManagement() {
  const [bonds, setBonds] = useState<Bond[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [stats, setStats] = useState<BondStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>("pending")
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [processingRequest, setProcessingRequest] = useState(false)

  useEffect(() => {
    fetchBonds()
    fetchStats()
    fetchJoinRequests()
  }, [requestStatusFilter])

  const fetchBonds = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("bonds")
      .select(`
        *,
        creator:profiles!bonds_created_by_fkey(display_name, full_name, email)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bonds:", error)
      toast.error("Failed to load bonds")
      return
    }

    // Get member counts for each bond
    const bondsWithCounts = await Promise.all(
      (data || []).map(async (bond: any) => {
        const { count } = await supabase
          .from("bond_members")
          .select("*", { count: "exact", head: true })
          .eq("bond_id", bond.id)
          .eq("is_active", true)

        return {
          ...bond,
          member_count: count || 0,
          creator_name: bond.creator?.display_name || bond.creator?.full_name || bond.creator?.email || "Unknown",
        }
      })
    )

    setBonds(bondsWithCounts)
    setLoading(false)
  }

  const fetchStats = async () => {
    const supabase = createClient()
    
    // Get bond counts by status
    const { count: total } = await supabase
      .from("bonds")
      .select("*", { count: "exact", head: true })

    const { count: active } = await supabase
      .from("bonds")
      .select("*", { count: "exact", head: true })
      .eq("bond_status", "active")

    const { count: forming } = await supabase
      .from("bonds")
      .select("*", { count: "exact", head: true })
      .eq("bond_status", "forming")

    const { count: paused } = await supabase
      .from("bonds")
      .select("*", { count: "exact", head: true })
      .eq("bond_status", "paused")

    const { count: dissolved } = await supabase
      .from("bonds")
      .select("*", { count: "exact", head: true })
      .eq("bond_status", "dissolved")

    // Get total members
    const { count: totalMembers } = await supabase
      .from("bond_members")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    setStats({
      total: total || 0,
      active: active || 0,
      forming: forming || 0,
      paused: paused || 0,
      dissolved: dissolved || 0,
      total_members: totalMembers || 0,
      avg_members_per_bond: total && total > 0 ? Math.round((totalMembers || 0) / total) : 0,
    })
  }

  const fetchJoinRequests = async () => {
    setRequestsLoading(true)
    try {
      const params = new URLSearchParams()
      if (requestStatusFilter !== "all") {
        params.set("status", requestStatusFilter)
      }

      const response = await fetch(`/api/bonds/requests?${params.toString()}`)
      
      // Check for network errors (certificate issues, etc.)
      if (!response.ok && response.status === 0) {
        throw new Error("Network error: Unable to connect to server. Please check your connection and certificate settings.")
      }

      // Parse JSON only if response is ok or has error message
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        // If JSON parsing fails, response might be HTML error page or empty
        throw new Error(`Failed to parse response: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch join requests: ${response.status} ${response.statusText}`)
      }

      setJoinRequests(data.requests || [])
    } catch (error) {
      console.error("Error fetching join requests:", error)
      
      // Provide more specific error messages
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to load join requests"
      
      // Check if it's a network/certificate error
      const isNetworkError = errorMessage.includes("Failed to fetch") || 
                            errorMessage.includes("Network error") ||
                            errorMessage.includes("ERR_CERT")
      
      if (isNetworkError) {
        console.error("🔒 Network/Certificate Error Detected!")
        console.error("This might be due to certificate issues with Supabase.")
        console.error("Try navigating to https://127.0.0.1:55321 and accepting the certificate.")
      }
      
      toast.error(errorMessage)
    } finally {
      setRequestsLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequest(true)
    try {
      const response = await fetch(`/api/bonds/requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_notes: reviewNotes.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve request")
      }

      toast.success("Join request approved successfully")
      setSelectedRequest(null)
      setReviewNotes("")
      fetchJoinRequests()
      fetchBonds()
      fetchStats()
    } catch (error) {
      console.error("Error approving request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to approve request")
    } finally {
      setProcessingRequest(false)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(true)
    try {
      const response = await fetch(`/api/bonds/requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_notes: reviewNotes.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject request")
      }

      toast.success("Join request rejected")
      setSelectedRequest(null)
      setReviewNotes("")
      fetchJoinRequests()
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to reject request")
    } finally {
      setProcessingRequest(false)
    }
  }

  const filteredBonds = bonds.filter((bond) => {
    const matchesSearch =
      bond.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bond.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bond.invite_code?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || bond.bond_status === statusFilter
    const matchesType = typeFilter === "all" || bond.bond_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const handleDeleteBond = async (bondId: string) => {
    if (!confirm("Are you sure you want to delete this bond? This action cannot be undone.")) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("bonds")
      .delete()
      .eq("id", bondId)

    if (error) {
      toast.error("Failed to delete bond")
      return
    }

    toast.success("Bond deleted successfully")
    fetchBonds()
    fetchStats()
  }

  const handleUpdateStatus = async (bondId: string, newStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("bonds")
      .update({ bond_status: newStatus })
      .eq("id", bondId)

    if (error) {
      toast.error("Failed to update bond status")
      return
    }

    toast.success("Bond status updated")
    fetchBonds()
    fetchStats()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "forming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "dissolved":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "dyad":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "polycule":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
      case "household":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      case "dynamic":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MagicCard gradientFrom="#9E7AFF" gradientTo="#FE8BBB">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Bonds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <NumberTicker value={stats.total} />
                </div>
              </CardContent>
            </Card>
          </MagicCard>

          <MagicCard gradientFrom="#4FACFE" gradientTo="#00F2FE">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Active Bonds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <NumberTicker value={stats.active} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>
          </MagicCard>

          <MagicCard gradientFrom="#FE8BBB" gradientTo="#FF6B9D">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <NumberTicker value={stats.total_members} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {stats.avg_members_per_bond} per bond
                </p>
              </CardContent>
            </Card>
          </MagicCard>

          <MagicCard gradientFrom="#00F2FE" gradientTo="#4FACFE">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Forming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <NumberTicker value={stats.forming} />
                </div>
              </CardContent>
            </Card>
          </MagicCard>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Bond Management</CardTitle>
          <CardDescription>View and manage all bonds in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bonds" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bonds">Bonds</TabsTrigger>
              <TabsTrigger value="requests">
                Join Requests
                {joinRequests.filter((r) => r.status === "pending").length > 0 && (
                  <Badge className="ml-2" variant="destructive">
                    {joinRequests.filter((r) => r.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="bonds" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bonds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="forming">Forming</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="dissolved">Dissolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dyad">Dyad</SelectItem>
                <SelectItem value="polycule">Polycule</SelectItem>
                <SelectItem value="household">Household</SelectItem>
                <SelectItem value="dynamic">Dynamic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bonds Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading bonds...</div>
          ) : filteredBonds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No bonds found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBonds.map((bond) => (
                    <TableRow key={bond.id}>
                      <TableCell className="font-medium">{bond.name}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(bond.bond_type)}>
                          {bond.bond_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(bond.bond_status)}>
                          {bond.bond_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{bond.member_count || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {bond.creator_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(bond.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {bond.last_activity_at
                          ? formatDistanceToNow(new Date(bond.last_activity_at), {
                              addSuffix: true,
                            })
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedBond(bond)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Bond Details</DialogTitle>
                                <DialogDescription>
                                  View and manage bond information
                                </DialogDescription>
                              </DialogHeader>
                              {selectedBond && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Select
                                      value={selectedBond.bond_status}
                                      onValueChange={(value) =>
                                        handleUpdateStatus(selectedBond.id, value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="forming">Forming</SelectItem>
                                        <SelectItem value="paused">Paused</SelectItem>
                                        <SelectItem value="dissolved">Dissolved</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDeleteBond(selectedBond.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Bond
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
            </TabsContent>
            <TabsContent value="requests" className="space-y-4 mt-4">
              {/* Request Filters */}
              <div className="flex gap-4">
                <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Join Requests Table */}
              {requestsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading join requests...
                </div>
              ) : joinRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No join requests found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requester</TableHead>
                        <TableHead>Bond</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {joinRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>
                                {request.requester.display_name ||
                                  request.requester.full_name ||
                                  request.requester.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {request.requester.dynamic_role}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{request.bond.name}</div>
                              <Badge className={getTypeColor(request.bond.bond_type)}>
                                {request.bond.bond_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm text-muted-foreground truncate">
                              {request.message || "No message"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.status === "pending" ? (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            ) : request.status === "approved" ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(request.created_at), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell>
                            {request.status === "pending" ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedRequest(request)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Review
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Review Join Request</DialogTitle>
                                    <DialogDescription>
                                      Review the request and approve or reject it
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedRequest && (
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Requester</Label>
                                        <div className="mt-1">
                                          <div className="font-medium">
                                            {selectedRequest.requester.display_name ||
                                              selectedRequest.requester.full_name ||
                                              selectedRequest.requester.email}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            Role: {selectedRequest.requester.dynamic_role}
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <Label>Bond</Label>
                                        <div className="mt-1">
                                          <div className="font-medium">
                                            {selectedRequest.bond.name}
                                          </div>
                                          <Badge className={getTypeColor(selectedRequest.bond.bond_type)}>
                                            {selectedRequest.bond.bond_type}
                                          </Badge>
                                        </div>
                                      </div>
                                      {selectedRequest.message && (
                                        <div>
                                          <Label>Message</Label>
                                          <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                                            {selectedRequest.message}
                                          </div>
                                        </div>
                                      )}
                                      <div>
                                        <Label htmlFor="review-notes">
                                          Review Notes (Optional)
                                        </Label>
                                        <Textarea
                                          id="review-notes"
                                          placeholder="Add notes about your decision..."
                                          value={reviewNotes}
                                          onChange={(e) => setReviewNotes(e.target.value)}
                                          rows={3}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedRequest(null)
                                            setReviewNotes("")
                                          }}
                                          disabled={processingRequest}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => handleRejectRequest(selectedRequest.id)}
                                          disabled={processingRequest}
                                        >
                                          {processingRequest ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Processing...
                                            </>
                                          ) : (
                                            <>
                                              <XCircle className="h-4 w-4 mr-2" />
                                              Reject
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          onClick={() => handleApproveRequest(selectedRequest.id)}
                                          disabled={processingRequest}
                                        >
                                          {processingRequest ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Processing...
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle2 className="h-4 w-4 mr-2" />
                                              Approve
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                {request.reviewed_at &&
                                  `Reviewed ${formatDistanceToNow(new Date(request.reviewed_at), { addSuffix: true })}`}
                                {request.reviewer && (
                                  <div>by {request.reviewer.display_name || request.reviewer.full_name || request.reviewer.email}</div>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
