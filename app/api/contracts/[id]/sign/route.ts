import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
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

  // Verify contract exists and is pending signature
  const { data: contract } = await supabase
    .from("contracts")
    .select("status, bond_id")
    .eq("id", params.id)
    .single()

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  }

  if (contract.status !== "pending_signature") {
    return NextResponse.json(
      { error: "Contract is not pending signature" },
      { status: 400 }
    )
  }

  const body = await req.json()
  const { signature_data } = body

  // Insert or update signature
  const { data: signature, error } = await supabase
    .from("contract_signatures")
    .upsert({
      contract_id: params.id,
      user_id: user.id,
      signature_status: "signed",
      signed_at: new Date().toISOString(),
      signature_data,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check if all bond members have signed
  const { data: bondMembers } = await supabase
    .from("bond_members")
    .select("user_id")
    .eq("bond_id", contract.bond_id)
    .eq("is_active", true)

  const { data: signatures } = await supabase
    .from("contract_signatures")
    .select("user_id")
    .eq("contract_id", params.id)
    .eq("signature_status", "signed")

  if (bondMembers && signatures && bondMembers.length === signatures.length) {
    // All members signed, update contract status
    await supabase
      .from("contracts")
      .update({ status: "active" })
      .eq("id", params.id)
  }

  return NextResponse.json({ signature }, { status: 201 })
}
