"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bullet } from "@/components/ui/bullet"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Plus, Search, Shield, Circle, Triskelion, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  const [showSeedDataPrompt, setShowSeedDataPrompt] = useState(false)
  const [createdBondId, setCreatedBondId] = useState<string | null>(null)
  const [copyingSeedData, setCopyingSeedData] = useState(false)

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

      // Validate response structure
      if (!data.bond || !data.bond.id) {
        console.error("[BondSetupStep] ❌ Invalid bond creation response:", data)
        throw new Error("Invalid response from bond creation API. Please try again.")
      }

      // Validate bond_id is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(data.bond.id)) {
        console.error("[BondSetupStep] ❌ Invalid bond_id format in response:", data.bond.id)
        throw new Error("Invalid bond ID received. Please try again.")
      }

      console.log(`[BondSetupStep] ✓ Bond created successfully: ${data.bond.id}`)
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

  const handleCopySeedData = async (copy: boolean) => {
    if (!createdBondId) {
      console.error("[BondSetupStep] handleCopySeedData called but createdBondId is null")
      toast.error("Bond ID is missing. Please create a bond first.")
      return
    }

    // Validate bond_id format (should be a valid UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(createdBondId)) {
      console.error("[BondSetupStep] Invalid bond_id format:", createdBondId)
      toast.error("Invalid bond ID format. Please create a new bond.")
      return
    }

    setShowSeedDataPrompt(false)

    if (!copy) {
      // User skipped, proceed to next step
      console.log(`[BondSetupStep] User skipped seed data, proceeding with bond_id: ${createdBondId}`)
      onNext({
        bond_id: createdBondId,
        bond_name: bondName,
        bond_type: bondType,
        bond_mode: "create",
        seed_data_copied: false,
      })
      return
    }

    // User wants seed data, copy it
    setCopyingSeedData(true)
    try {
      console.log(`[BondSetupStep] Copying seed data to bond: ${createdBondId}`)
      const response = await fetch("/api/bonds/copy-seed-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bond_id: createdBondId }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || "Failed to copy seed data"
        console.error(`[BondSetupStep] Seed data copy failed:`, errorMsg)
        throw new Error(errorMsg)
      }

      const copiedCount = data.data?.copied?.total || 0
      console.log(`[BondSetupStep] ✓ Successfully copied ${copiedCount} items to bond ${createdBondId}`)
      toast.success(`Added ${copiedCount} example items to your bond!`)
      
      // Proceed to next step
      onNext({
        bond_id: createdBondId,
        bond_name: bondName,
        bond_type: bondType,
        bond_mode: "create",
        seed_data_copied: true,
      })
    } catch (error) {
      console.error("[BondSetupStep] Error copying seed data:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to copy seed data"
      toast.error(errorMessage)
      
      // If bond doesn't exist error, don't proceed - user needs to create bond again
      if (errorMessage.includes("Bond not found") || errorMessage.includes("does not exist")) {
        console.error("[BondSetupStep] ❌ Bond doesn't exist, cannot proceed. User should create bond again.")
        toast.error("The bond was not found. Please create a new bond.")
        // Reset state so user can try again
        setCreatedBondId(null)
        setShowSeedDataPrompt(false)
        return
      }
      
      // For other errors, still proceed to next step (seed data copy is optional)
      console.warn("[BondSetupStep] ⚠ Proceeding despite seed data copy failure")
      onNext({
        bond_id: createdBondId,
        bond_name: bondName,
        bond_type: bondType,
        bond_mode: "create",
        seed_data_copied: false,
      })
    } finally {
      setCopyingSeedData(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bullet />
            <span>Bond Setup</span>
          </CardTitle>
          <CardDescription>
            Create a new bond or join an existing one using an invite code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={mode === "create" ? "default" : "outline"}
              onClick={() => setMode("create")}
              className="flex-1"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Bond
            </Button>
            <Button
              variant={mode === "join" ? "default" : "outline"}
              onClick={() => setMode("join")}
              className="flex-1"
            >
              <Search className="mr-2 h-4 w-4" />
              Join Bond
            </Button>
          </div>

          {mode === "create" ? (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="bond-name">Bond Name *</Label>
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
