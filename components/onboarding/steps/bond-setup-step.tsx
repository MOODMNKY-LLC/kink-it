"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bullet } from "@/components/ui/bullet"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Plus, Search, Shield, Circle, Triskelion } from "lucide-react"
import { toast } from "sonner"

interface BondSetupStepProps {
  onNext: (data: Record<string, any>) => void
  onBack: () => void
  initialData?: Record<string, any>
}

export default function BondSetupStep({ onNext, onBack, initialData }: BondSetupStepProps) {
  const [mode, setMode] = useState<"create" | "join">(initialData?.bond_mode || "create")
  const [isLoading, setIsLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [bondName, setBondName] = useState(initialData?.bond_name || "")
  const [bondDescription, setBondDescription] = useState(initialData?.bond_description || "")
  const [bondType, setBondType] = useState<"dyad" | "polycule" | "household" | "dynamic">(
    initialData?.bond_type || "dynamic"
  )
  const [inviteCode, setInviteCode] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedBond, setSelectedBond] = useState<string | null>(null)

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
        // Provide more detailed error message
        const errorMsg = data.error || "Failed to create bond"
        const details = data.details ? `: ${data.details}` : ""
        throw new Error(`${errorMsg}${details}`)
      }

      toast.success("Bond created successfully")
      onNext({
        bond_id: data.bond.id,
        bond_name: data.bond.name,
        bond_type: data.bond.bond_type,
        bond_mode: "create",
      })
    } catch (error) {
      console.error("Error creating bond:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create bond")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchBonds = async () => {
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
      onNext({
        bond_id: data.bond.id,
        bond_name: data.bond.name,
        bond_type: data.bond.bond_type,
        bond_mode: "join",
      })
    } catch (error) {
      console.error("Error joining bond:", error)
      toast.error(error instanceof Error ? error.message : "Failed to join bond")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    onNext({ bond_skipped: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Connect Your Dynamic</h2>
        <p className="text-muted-foreground">
          Bonds connect you with your partner(s) in KINK IT. Create a new bond to start managing your dynamic together, or join an existing one using an invite code from your partner.
        </p>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-sm font-medium uppercase">
            <Bullet />
            Bond Setup
          </CardTitle>
          <CardDescription>
            Bonds enable shared tasks, rules, rewards, and communication between partners. Create one to invite your partner, or join theirs if they've already set it up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="bond-name">Bond Name</Label>
                <Input
                  id="bond-name"
                  placeholder="e.g., Our Dynamic, The Household, Our Bond"
                  value={bondName}
                  onChange={(e) => setBondName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Give your bond a name that represents your relationship or dynamic
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bond-description">Description (Optional)</Label>
                <Input
                  id="bond-description"
                  placeholder="Brief description of your bond"
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
                    <SelectItem value="dynamic">Dynamic (Flexible Structure)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {bondType === "dyad" && "Traditional two-person D/s relationship"}
                  {bondType === "polycule" && "Multi-person polyamorous network"}
                  {bondType === "household" && "Traditional leather family/household structure"}
                  {bondType === "dynamic" && "Flexible power exchange dynamic"}
                </p>
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
            </div>
          ) : (
            <div className="space-y-4 pt-4 border-t">
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
                        handleSearchBonds()
                      }
                    }}
                  />
                  <Button
                    onClick={handleSearchBonds}
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
                <p className="text-xs text-muted-foreground">
                  Get the invite code from your partner or bond creator
                </p>
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
                            <Badge variant="secondary" className="mt-2">
                              {bond.bond_type}
                            </Badge>
                          </div>
                          {selectedBond === bond.id && (
                            <div className="text-primary">
                              <Users className="w-5 h-5" />
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
                    <Users className="mr-2 h-4 w-4" />
                    Join Bond
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onBack} className="flex-1" disabled={isLoading}>
              Back
            </Button>
            <Button variant="ghost" onClick={handleSkip} className="flex-1" disabled={isLoading}>
              Skip for Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
