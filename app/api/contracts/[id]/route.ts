import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: contract, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  }

  // Get signatures
  const { data: signatures } = await supabase
    .from("contract_signatures")
    .select("*")
    .eq("contract_id", params.id)

  return NextResponse.json({
    contract,
    signatures: signatures || [],
  })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify user is dominant and owns the contract
  const { data: contract } = await supabase
    .from("contracts")
    .select("created_by, status")
    .eq("id", params.id)
    .single()

  if (!contract || contract.created_by !== user.id) {
    return NextResponse.json(
      { error: "Only the creator can update this contract" },
      { status: 403 }
    )
  }

  if (contract.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft contracts can be updated" },
      { status: 400 }
    )
  }

  const body = await req.json()
  const { title, content, status, effective_from, effective_until } = body

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (content !== undefined) updates.content = content
  if (status !== undefined) updates.status = status
  if (effective_from !== undefined) updates.effective_from = effective_from
  if (effective_until !== undefined) updates.effective_until = effective_until

  const { data: updatedContract, error } = await supabase
    .from("contracts")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contract: updatedContract })
}

