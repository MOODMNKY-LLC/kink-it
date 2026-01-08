import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * Browse discoverable bonds
 * GET /api/bonds/browse?search=query&type=dyad&status=active
 * 
 * Returns bonds that are:
 * - Not private (is_private = false) OR have invite codes (discoverable via invite)
 * - Status is 'forming' or 'active' (accepting members)
 * - User is not already a member
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const bondType = searchParams.get("type")
    const bondStatus = searchParams.get("status")

    // Build query for discoverable bonds
    // Discoverable = not private (is_private = false)
    // Note: Bonds with invite codes can still be joined via invite code method
    let query = supabase
      .from("bonds")
      .select(`
        id,
        name,
        description,
        bond_type,
        bond_status,
        created_at,
        invite_code,
        is_private,
        creator:profiles!bonds_created_by_fkey(display_name, full_name, email)
      `)
      .in("bond_status", ["forming", "active"])
      .eq("is_private", false) // Only public/discoverable bonds
      .order("created_at", { ascending: false })
      .limit(50)

    // Apply filters
    if (bondType) {
      query = query.eq("bond_type", bondType)
    }

    if (bondStatus) {
      query = query.eq("bond_status", bondStatus)
    }

    const { data: bonds, error: bondsError } = await query

    if (bondsError) {
      console.error("Error fetching bonds:", bondsError)
      return NextResponse.json(
        { error: "Failed to fetch bonds" },
        { status: 500 }
      )
    }

    // Filter out bonds user is already a member of
    const { data: memberships } = await supabase
      .from("bond_members")
      .select("bond_id")
      .eq("user_id", user.id)
      .eq("is_active", true)

    const memberBondIds = new Set((memberships || []).map((m) => m.bond_id))

    // Filter and enrich bonds
    const discoverableBonds = await Promise.all(
      (bonds || [])
        .filter((bond) => !memberBondIds.has(bond.id))
        .map(async (bond: any) => {
          // Get member count
          const { count } = await supabase
            .from("bond_members")
            .select("*", { count: "exact", head: true })
            .eq("bond_id", bond.id)
            .eq("is_active", true)

          // Check if user has pending request
          const { data: pendingRequest } = await supabase
            .from("bond_join_requests")
            .select("id, status")
            .eq("bond_id", bond.id)
            .eq("user_id", user.id)
            .eq("status", "pending")
            .maybeSingle()

          // Apply search filter
          const matchesSearch =
            !search ||
            bond.name.toLowerCase().includes(search.toLowerCase()) ||
            bond.description?.toLowerCase().includes(search.toLowerCase())

          if (!matchesSearch) return null

          return {
            id: bond.id,
            name: bond.name,
            description: bond.description,
            bond_type: bond.bond_type,
            bond_status: bond.bond_status,
            created_at: bond.created_at,
            invite_code: bond.invite_code,
            is_private: bond.is_private,
            member_count: count || 0,
            creator_name:
              bond.creator?.display_name ||
              bond.creator?.full_name ||
              bond.creator?.email ||
              "Unknown",
            has_pending_request: !!pendingRequest,
            request_status: pendingRequest?.status || null,
          }
        })
    )

    // Filter out nulls from search
    const filteredBonds = discoverableBonds.filter((b) => b !== null)

    return NextResponse.json({
      success: true,
      bonds: filteredBonds,
      total: filteredBonds.length,
    })
  } catch (error) {
    console.error("Error in browse bonds:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
