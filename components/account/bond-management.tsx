"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { Profile } from "@/types/profile"
import { Loader2, Users, Plus, Search, Link2, Unlink, Copy, Check } from "lucide-react"

interface BondInfo {
  id: string
  name: string
  description: string | null
  bond_type: string
  bond_status: string
  invite_code: string | null
  member_count?: number
}

interface BondManagementProps {
  profile: Profile
}

export function BondManagement({ profile }: BondManagementProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<"view" | "create" | "join">("view")
  const [currentBond, setCurrentBond] = useState<BondInfo | null>(null)
  const [bondName, setBondName] = useState("")
  const [bondDescription, setBondDescription] = useState("")
  const [bondType, setBondType] = useState<"dyad" | "polycule" | "household" | "dynamic">("dynamic")
  const [inviteCode, setInviteCode] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<BondInfo[]>([])
  const [selectedBond, setSelectedBond] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch current bond
  useEffect(() => {
    const fetchBond = async () => {
      if (profile.bond_id) {
        const { data: bond, error } = await supabase
          .from("bonds")
          .select("id, name, description, bond_type, bond_status, invite_code")
          .eq("id", profile.bond_id)
          .single()

        if (bond && !error) {
          // Get member count
          const { count } = await supabase
            .from("bond_members")
            .select("*", { count: "exact", head: true })
            .eq("bond_id", bond.id)
            .eq("is_active", true)

          setCurrentBond({
            ...bond,
            member_count: count || 0,
          })
        }
      } else {
        setCurrentBond(null)
      }
    }
    fetchBond()
  }, [profile.bond_id, supabase])

  const handleCreateBond = async () => {
    if (!bondName.trim()) {
      toast.error("Please enter a bond name")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/bonds/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bondName.trim(),
          description: bondDescription.trim(),
          bond_type: bondType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create bond")
      }

      toast.success("Bond created successfully")
      setMode("view")
      setBondName("")
      setBondDescription("")
      router.refresh()
    } catch (error) {
      console.error("Error creating bond:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create bond")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchBond = async () => {
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code")
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/bonds/search?code=${encodeURIComponent(inviteCode.trim())}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Bond not found")
      }

      setSearchResults([data.bond])
      setSelectedBond(data.bond.id)
    } catch (error) {
      console.error("Error searching bond:", error)
      toast.error(error instanceof Error ? error.message : "Bond not found")
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleJoinBond = async () => {
    if (!selectedBond) {
      toast.error("Please select a bond to join")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/bonds/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bond_id: selectedBond }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join bond")
      }

      toast.success("Successfully joined bond")
      setMode("view")
      setInviteCode("")
      setSearchResults([])
      setSelectedBond(null)
      router.refresh()
    } catch (error) {
      console.error("Error joining bond:", error)
      toast.error(error instanceof Error ? error.message : "Failed to join bond")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveBond = async () => {
    if (!confirm("Are you sure you want to leave this bond? This will affect task assignments and other features.")) {
      return
    }

    setIsLoading(true)
    try {
      // Update bond_members to set is_active = false
      const { error: memberError } = await supabase
        .from("bond_members")
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq("bond_id", currentBond?.id)
        .eq("user_id", profile.id)

      if (memberError) throw memberError

      // Update profile to remove bond_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ bond_id: null, updated_at: new Date().toISOString() })
        .eq("id", profile.id)

      if (profileError) throw profileError

      toast.success("Left bond successfully")
      setCurrentBond(null)
      router.refresh()
    } catch (error) {
      console.error("Error leaving bond:", error)
      toast.error(error instanceof Error ? error.message : "Failed to leave bond")
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteCode = () => {
    if (currentBond?.invite_code) {
      navigator.clipboard.writeText(currentBond.invite_code)
      setCopied(true)
      toast.success("Invite code copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (currentBond) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Bond Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage your relationship bond and members
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{currentBond.name}</CardTitle>
                <CardDescription>
                  {currentBond.description || "No description"}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="capitalize">
                {currentBond.bond_type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{currentBond.bond_status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Members</p>
                <p className="font-medium">{currentBond.member_count || 0}</p>
              </div>
            </div>

            {currentBond.invite_code && (
              <div className="space-y-2">
                <Label>Invite Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentBond.invite_code}
                    readOnly
                    className="bg-muted/50 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyInviteCode}
                    size="icon"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this code with others to invite them to your bond
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/bonds/${currentBond.id}`)}
                className="flex-1"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Manage Bond
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleLeaveBond}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Leaving...
                  </>
                ) : (
                  <>
                    <Unlink className="mr-2 h-4 w-4" />
                    Leave Bond
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Bond Management</h2>
          <p className="text-sm text-muted-foreground">
            Create or join a bond to connect with your partner(s)
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={mode === "create" ? "default" : "outline"}
          onClick={() => setMode("create")}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New
        </Button>
        <Button
          variant={mode === "join" ? "default" : "outline"}
          onClick={() => setMode("join")}
          className="flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Join Existing
        </Button>
      </div>

      {mode === "create" ? (
        <Card>
          <CardHeader>
            <CardTitle>Create New Bond</CardTitle>
            <CardDescription>
              Create a new bond for your relationship or dynamic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bond-name">Bond Name</Label>
              <Input
                id="bond-name"
                placeholder="e.g., Our Dynamic, The Household"
                value={bondName}
                onChange={(e) => setBondName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bond-description">Description (Optional)</Label>
              <Input
                id="bond-description"
                placeholder="Brief description"
                value={bondDescription}
                onChange={(e) => setBondDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bond-type">Bond Type</Label>
              <Select value={bondType} onValueChange={(value: any) => setBondType(value)}>
                <SelectTrigger id="bond-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dyad">Dyad (Two-Person)</SelectItem>
                  <SelectItem value="polycule">Polycule (Multi-Person)</SelectItem>
                  <SelectItem value="household">Household (Leather Family)</SelectItem>
                  <SelectItem value="dynamic">Dynamic (Flexible)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateBond}
              disabled={isLoading || !bondName.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Bond
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Join Existing Bond</CardTitle>
            <CardDescription>
              Join a bond using an invite code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-code"
                  placeholder="Enter bond invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchBond()
                    }
                  }}
                />
                <Button
                  onClick={handleSearchBond}
                  disabled={searching || !inviteCode.trim()}
                  variant="outline"
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Found Bond</Label>
                {searchResults.map((bond) => (
                  <Card
                    key={bond.id}
                    className={`cursor-pointer transition-colors ${
                      selectedBond === bond.id ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setSelectedBond(bond.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{bond.name}</h3>
                          {bond.description && (
                            <p className="text-sm text-muted-foreground">{bond.description}</p>
                          )}
                          <Badge variant="secondary" className="mt-2 capitalize">
                            {bond.bond_type}
                          </Badge>
                        </div>
                        {selectedBond === bond.id && (
                          <div className="text-primary">
                            <Link2 className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Button
              onClick={handleJoinBond}
              disabled={isLoading || !selectedBond}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Join Bond
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

