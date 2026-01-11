"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Search, Users, X, Check } from "lucide-react"
import { toast } from "sonner"
import { KinkyAvatar } from "@/components/kinky/kinky-avatar"
import { cn } from "@/lib/utils"
import type { Kinkster } from "@/types/kinkster"

interface CharacterSelectorProps {
  onSelect: (character: Kinkster | null) => void
  onSelectMultiple?: (characters: Kinkster[]) => void
  selectedCharacterId?: string | null
  selectedCharacterIds?: string[]
  maxSelection?: number
  allowNone?: boolean
  className?: string
}

export function CharacterSelector({
  onSelect,
  onSelectMultiple,
  selectedCharacterId,
  selectedCharacterIds = [],
  maxSelection = 1,
  allowNone = true,
  className,
}: CharacterSelectorProps) {
  const [kinksters, setKinksters] = useState<Kinkster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [archetypeFilter, setArchetypeFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(
    selectedCharacterIds.length > 0 ? selectedCharacterIds : selectedCharacterId ? [selectedCharacterId] : []
  )
  const lastSyncedRef = useRef<string>("")

  // Fetch characters
  useEffect(() => {
    const fetchKinksters = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (archetypeFilter !== "all") params.append("archetype", archetypeFilter)
        if (roleFilter !== "all") params.append("role", roleFilter)
        if (searchQuery) params.append("search", searchQuery)

        const response = await fetch(`/api/kinksters/mine?${params.toString()}`)
        if (!response.ok) {
          throw new Error("Failed to fetch characters")
        }

        const data = await response.json()
        setKinksters(data.kinksters || [])
      } catch (error) {
        console.error("Error fetching kinksters:", error)
        toast.error("Failed to load characters")
      } finally {
        setIsLoading(false)
      }
    }

    fetchKinksters()
  }, [searchQuery, archetypeFilter, roleFilter])

  // Sync external selection with internal state (only if different to prevent loops)
  useEffect(() => {
    const externalIds = selectedCharacterIds.length > 0 
      ? selectedCharacterIds 
      : selectedCharacterId 
        ? [selectedCharacterId] 
        : []
    
    const externalIdsStr = [...externalIds].sort().join(",")
    
    // Only sync if external value actually changed
    if (lastSyncedRef.current === externalIdsStr) {
      return // Already synced, skip
    }
    
    // Update internal state only if different
    setInternalSelectedIds((currentIds) => {
      const currentIdsStr = [...currentIds].sort().join(",")
      
      if (currentIdsStr === externalIdsStr) {
        return currentIds // Same value, return same reference
      }
      
      // Update ref to track what we synced
      lastSyncedRef.current = externalIdsStr
      return externalIds.length > 0 ? externalIds : []
    })
  }, [selectedCharacterId, selectedCharacterIds])

  const handleCharacterClick = useCallback(
    (character: Kinkster) => {
      if (maxSelection === 1) {
        // Single selection mode
        const isSelected = internalSelectedIds.includes(character.id)
        const newIds = isSelected && allowNone ? [] : [character.id]
        
        // Update ref to prevent sync loop
        lastSyncedRef.current = newIds.sort().join(",")
        
        setInternalSelectedIds(newIds)
        onSelect(isSelected && allowNone ? null : character)
      } else {
        // Multi-selection mode
        const isSelected = internalSelectedIds.includes(character.id)
        let newSelection: string[]

        if (isSelected) {
          newSelection = internalSelectedIds.filter((id) => id !== character.id)
        } else {
          if (internalSelectedIds.length >= maxSelection) {
            toast.error(`Maximum ${maxSelection} characters can be selected`)
            return
          }
          newSelection = [...internalSelectedIds, character.id]
        }

        // Update ref to prevent sync loop
        lastSyncedRef.current = [...newSelection].sort().join(",")
        
        setInternalSelectedIds(newSelection)
        if (onSelectMultiple) {
          const selectedCharacters = kinksters.filter((k) => newSelection.includes(k.id))
          onSelectMultiple(selectedCharacters)
        }
      }
    },
    [internalSelectedIds, maxSelection, allowNone, onSelect, onSelectMultiple, kinksters]
  )

  // Get unique archetypes and roles for filters
  const archetypes = Array.from(new Set(kinksters.map((k) => k.archetype).filter(Boolean)))
  const roles = Array.from(
    new Set(kinksters.flatMap((k) => k.role_preferences || []).filter(Boolean))
  )

  // Filter characters based on search
  const filteredKinksters = kinksters.filter((kinkster) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        kinkster.name.toLowerCase().includes(query) ||
        kinkster.bio?.toLowerCase().includes(query) ||
        kinkster.appearance_description?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Character{maxSelection > 1 ? "s" : ""}
            </CardTitle>
            <CardDescription>
              {maxSelection > 1
                ? `Select up to ${maxSelection} characters for scene composition`
                : "Choose a character to place in the scene"}
            </CardDescription>
          </div>
          {internalSelectedIds.length > 0 && (
            <Badge variant="secondary">
              {internalSelectedIds.length} selected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search characters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="archetype">Archetype</Label>
            <Select value={archetypeFilter} onValueChange={setArchetypeFilter}>
              <SelectTrigger id="archetype">
                <SelectValue placeholder="All archetypes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All archetypes</SelectItem>
                {archetypes.map((archetype) => (
                  <SelectItem key={archetype} value={archetype}>
                    {archetype}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger id="role">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Character Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredKinksters.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No characters found</p>
            <p className="text-sm">
              {searchQuery || archetypeFilter !== "all" || roleFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first KINKSTER to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredKinksters.map((kinkster) => {
              const isSelected = internalSelectedIds.includes(kinkster.id)
              return (
                <Card
                  key={kinkster.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => handleCharacterClick(kinkster)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {kinkster.avatar_url ? (
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={kinkster.avatar_url} alt={kinkster.name} />
                            <AvatarFallback>
                              <KinkyAvatar size="md" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar className="h-16 w-16">
                            <AvatarFallback>
                              <KinkyAvatar size="md" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{kinkster.name}</h3>
                        {kinkster.archetype && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {kinkster.archetype}
                          </Badge>
                        )}
                        {kinkster.role_preferences && kinkster.role_preferences.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {kinkster.role_preferences.slice(0, 2).map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
