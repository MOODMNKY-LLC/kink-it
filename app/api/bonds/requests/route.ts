import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

/**
 * Get join requests for bonds the user manages
 * GET /api/bonds/requests?bond_id=xxx&status=pending
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
    const bondId = searchParams.get("bond_id")
    const status = searchParams.get("status")

    // Check if user is admin first
    const { data: profile } = await supabase
      .from("profiles")
      .select("system_role")
      .eq("id", user.id)
      .single()

    const isAdmin = profile?.system_role === "admin"

    // If admin, use admin client to bypass RLS and get all requests
    if (isAdmin) {
      const adminClient = createAdminClient()
      
      let adminQuery = adminClient
        .from("bond_join_requests")
        .select(`
          *,
          bond:bonds(id, name, bond_type, bond_status),
          requester:profiles!bond_join_requests_user_id_fkey(id, display_name, full_name, email, dynamic_role),
          reviewer:profiles!bond_join_requests_reviewed_by_fkey(id, display_name, full_name, email)
        `)
        .order("created_at", { ascending: false })

      if (bondId) {
        adminQuery = adminQuery.eq("bond_id", bondId)
      }

      if (status) {
        adminQuery = adminQuery.eq("status", status)
      }

      const { data: allRequests, error: adminError } = await adminQuery

      if (adminError) {
        console.error("Error fetching all requests:", adminError)
        return NextResponse.json(
          { 
            error: "Failed to fetch join requests",
            details: adminError.message,
            code: adminError.code,
            hint: adminError.hint
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        requests: allRequests || [],
        total: (allRequests || []).length,
      })
    }

    // Get bonds the user manages (creator)
    const { data: createdBonds } = await supabase
      .from("bonds")
      .select("id")
      .eq("created_by", user.id)

    // Also include bonds where user is a manager
    const { data: managedBonds } = await supabase
      .from("bond_members")
      .select("bond_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("can_manage", true)

    const managedBondIds = [
      ...(createdBonds || []).map((b) => b.id),
      ...(managedBonds || []).map((m) => m.bond_id),
    ].filter((id, index, self) => self.indexOf(id) === index) // Remove duplicates

    // If user doesn't manage any bonds, return empty array
    if (managedBondIds.length === 0) {
      return NextResponse.json({
        success: true,
        requests: [],
        total: 0,
      })
    }

    // Build query for join requests
    let requestsQuery = supabase
      .from("bond_join_requests")
      .select(`
        *,
        bond:bonds(id, name, bond_type, bond_status),
        requester:profiles!bond_join_requests_user_id_fkey(id, display_name, full_name, email, dynamic_role),
        reviewer:profiles!bond_join_requests_reviewed_by_fkey(id, display_name, full_name, email)
      `)
      .in("bond_id", managedBondIds)
      .order("created_at", { ascending: false })

    // Apply filters
    if (bondId) {
      requestsQuery = requestsQuery.eq("bond_id", bondId)
    }

    if (status) {
      requestsQuery = requestsQuery.eq("status", status)
    }

    const { data: requests, error: requestsError } = await requestsQuery

    if (requestsError) {
      console.error("Error fetching join requests:", requestsError)
      return NextResponse.json(
        { 
          error: "Failed to fetch join requests",
          details: requestsError.message,
          code: requestsError.code,
          hint: requestsError.hint
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      requests: requests || [],
      total: (requests || []).length,
    })
  } catch (error) {
    console.error("Error in get join requests:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
