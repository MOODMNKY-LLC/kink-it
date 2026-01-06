"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Profile } from "@/types/profile"
import { formatDistanceToNow } from "date-fns"
import { KinkyEmptyState } from "@/components/kinky/kinky-empty-state"

interface BondsListProps {
  profile: Profile | null
}

interface Bond {
  id: string
  name: string
  description: string | null
  bond_type: string
  bond_status: string
  created_at: string
  last_activity_at: string | null
  member_count?: number
  role_in_bond?: string
}

export function BondsList({ profile }: BondsListProps) {
  const [bonds, setBonds] = useState<Bond[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchBonds()
  }, [])

  const fetchBonds = async () => {
    const supabase = createClient()
    const { data: memberships } = await supabase
      .from("bond_members")
      .select(`
        bond_id,
        role_in_bond,
        bond:bonds(
          id,
          name,
          description,
          bond_type,
          bond_status,
          created_at,
          last_activity_at
        )
      `)
      .eq("user_id", profile?.id)
      .eq("is_active", true)

    if (!memberships) {
      setLoading(false)
      return
    }

    // Get member counts
    const bondsWithCounts = await Promise.all(
      memberships.map(async (membership: any) => {
        const { count } = await supabase
          .from("bond_members")
          .select("*", { count: "exact", head: true })
          .eq("bond_id", membership.bond.bond.id)
          .eq("is_active", true)

        return {
          ...membership.bond.bond,
          role_in_bond: membership.role_in_bond,
          member_count: count || 0,
        }
      })
    )

    setBonds(bondsWithCounts)
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading bonds...</div>
  }

  if (bonds.length === 0) {
    return (
      <KinkyEmptyState
        title="No bonds yet"
        description="Create a new bond or join an existing one to get started"
        actionLabel="Create Bond"
        onAction={() => router.push("/account/profile")}
        size="md"
      />
    )
  }

  return (
    <div className="space-y-4">
      {bonds.map((bond) => (
        <Card key={bond.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle>{bond.name}</CardTitle>
                  <Badge variant="outline">{bond.bond_type}</Badge>
                  <Badge variant="outline">{bond.bond_status}</Badge>
                </div>
                {bond.description && (
                  <CardDescription>{bond.description}</CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {bond.member_count || 0} members
                </span>
                <span>Your role: {bond.role_in_bond}</span>
                {bond.last_activity_at && (
                  <span>
                    Active {formatDistanceToNow(new Date(bond.last_activity_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              <Button asChild>
                <Link href={`/bonds/${bond.id}`}>
                  View Bond
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

