"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MagicCard } from "@/components/ui/magic-card"
import { 
  Search, 
  Users, 
  Clock, 
  UserPlus,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import type { Profile } from "@/types/profile"

interface DiscoverableBond {
  id: string
  name: string
  description: string | null
  bond_type: string
  bond_status: string
  created_at: string
  invite_code: string | null
  is_private: boolean
  member_count: number
  creator_name: string
  has_pending_request: boolean
  request_status: string | null
}

interface BondDiscoveryProps {
  profile: Profile | null
}

export function BondDiscovery({ profile }: BondDiscoveryProps) {
  const [bonds, setBonds] = useState<DiscoverableBond[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedBond, setSelectedBond] = useState<DiscoverableBond | null>(null)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [requestMessage, setRequestMessage] = useState("")
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    fetchBonds()
  }, [searchQuery, typeFilter, statusFilter])

  const fetchBonds = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (typeFilter !== "all") params.set("type", typeFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)

      const response = await fetch(`/api/bonds/browse?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch bonds")
      }

      setBonds(data.bonds || [])
    } catch (error) {
      console.error("Error fetching bonds:", error)
      toast.error("Failed to load bonds")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestJoin = async () => {
    if (!selectedBond) return

    setRequesting(true)
    try {
      const response = await fetch("/api/bonds/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bond_id: selectedBond.id,
          message: requestMessage.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send join request")
      }

      toast.success("Join request sent! The bond admin will review it.")
      setRequestDialogOpen(false)
      setRequestMessage("")
      fetchBonds() // Refresh to show pending status
    } catch (error) {
      console.error("Error requesting to join:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send join request")
    } finally {
      setRequesting(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "forming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Discover Bonds</h1>
        <p className="text-muted-foreground mt-2">
          Browse public bonds and request to join communities that interest you
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bonds by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="forming">Forming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bonds Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading bonds...</p>
        </div>
      ) : bonds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "No bonds match your filters"
                : "No public bonds available at the moment"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bonds.map((bond) => (
            <MagicCard key={bond.id} gradientFrom="#9E7AFF" gradientTo="#FE8BBB">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{bond.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {bond.description || "No description"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={getTypeColor(bond.bond_type)}>
                        {bond.bond_type}
                      </Badge>
                      <Badge className={getStatusColor(bond.bond_status)}>
                        {bond.bond_status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{bond.member_count} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(bond.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created by {bond.creator_name}
                  </div>

                  {bond.has_pending_request ? (
                    <div className="flex items-center gap-2 text-sm">
                      {bond.request_status === "pending" ? (
                        <>
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="text-yellow-600 dark:text-yellow-400">
                            Request pending review
                          </span>
                        </>
                      ) : bond.request_status === "approved" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">
                            Request approved
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600 dark:text-red-400">
                            Request rejected
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <Dialog
                      open={requestDialogOpen && selectedBond?.id === bond.id}
                      onOpenChange={(open) => {
                        setRequestDialogOpen(open)
                        if (!open) {
                          setSelectedBond(null)
                          setRequestMessage("")
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          onClick={() => setSelectedBond(bond)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Request to Join
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request to Join {bond.name}</DialogTitle>
                          <DialogDescription>
                            Send a request to join this bond. The bond admin will
                            review your request.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="message">Message (Optional)</Label>
                            <Textarea
                              id="message"
                              placeholder="Tell them why you'd like to join..."
                              value={requestMessage}
                              onChange={(e) => setRequestMessage(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setRequestDialogOpen(false)
                                setSelectedBond(null)
                                setRequestMessage("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleRequestJoin}
                              disabled={requesting}
                            >
                              {requesting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Send Request
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            </MagicCard>
          ))}
        </div>
      )}
    </div>
  )
}
