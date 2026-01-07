"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, CheckCircle2, Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import type { DynamicRole } from "@/types/profile"
import { AddToNotionButtonGeneric } from "@/components/playground/shared/add-to-notion-button-generic"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Contract {
  id: string
  title: string
  content: string
  version: number
  status: "draft" | "pending_signature" | "active" | "archived" | "superseded"
  created_at: string
  effective_from: string | null
  effective_until: string | null
}

interface ContractSignature {
  user_id: string
  signature_status: "pending" | "signed" | "declined"
  signed_at: string | null
}

interface ContractPageClientProps {
  userId: string
  userRole: DynamicRole
  bondId: string | null
}

export function ContractPageClient({ userId, userRole, bondId }: ContractPageClientProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [signatures, setSignatures] = useState<Record<string, ContractSignature[]>>({})

  useEffect(() => {
    loadContracts()
  }, [bondId])

  const loadContracts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (bondId) params.append("bond_id", bondId)

      const response = await fetch(`/api/contracts?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setContracts(data.contracts || [])
        // Load signatures for each contract
        for (const contract of data.contracts || []) {
          loadSignatures(contract.id)
        }
      } else {
        toast.error(data.error || "Failed to load contracts")
      }
    } catch (error) {
      toast.error("Failed to load contracts")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSignatures = async (contractId: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`)
      const data = await response.json()
      if (response.ok && data.signatures) {
        setSignatures((prev) => ({ ...prev, [contractId]: data.signatures }))
      }
    } catch (error) {
      console.error("Failed to load signatures", error)
    }
  }

  const handleCreateContract = async (formData: FormData) => {
    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          content: formData.get("content"),
          bond_id: bondId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Contract created successfully")
        setShowCreateDialog(false)
        loadContracts()
      } else {
        toast.error(data.error || "Failed to create contract")
      }
    } catch (error) {
      toast.error("Failed to create contract")
      console.error(error)
    }
  }

  const handleSignContract = async (contractId: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature_data: { signed_at: new Date().toISOString() },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Contract signed successfully")
        loadSignatures(contractId)
        loadContracts()
      } else {
        toast.error(data.error || "Failed to sign contract")
      }
    } catch (error) {
      toast.error("Failed to sign contract")
      console.error(error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-muted text-muted-foreground"
      case "pending_signature":
        return "bg-warning/20 text-warning border-warning/40"
      case "active":
        return "bg-success/20 text-success border-success/40"
      case "archived":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const hasUserSigned = (contractId: string) => {
    const contractSignatures = signatures[contractId] || []
    return contractSignatures.some(
      (sig) => sig.user_id === userId && sig.signature_status === "signed"
    )
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading contracts...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {userRole === "dominant" && (
        <div className="flex justify-end">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary/10 hover:bg-primary/20 border-2 border-primary/40 backdrop-blur-sm text-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02]">
                <Plus className="h-4 w-4 mr-2" />
                Create Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/20 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Contract</DialogTitle>
                <DialogDescription>
                  Create a new relationship contract (Covenant)
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateContract} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Contract Title</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    className="bg-muted/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Contract Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    rows={12}
                    required
                    className="bg-muted/50 border-border backdrop-blur-sm font-mono text-sm"
                    placeholder="Enter contract terms and conditions..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                  >
                    Create Contract
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {contracts.length === 0 ? (
        <Card className="border-primary/20 bg-card/90 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {userRole === "dominant"
                ? "No contracts created yet. Create your first contract to get started."
                : "No contracts available at this time."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => (
            <Card
              key={contract.id}
              className="border-primary/20 bg-card/90 backdrop-blur-xl hover:border-primary/40 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{contract.title}</CardTitle>
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                      <Badge variant="outline">v{contract.version}</Badge>
                    </div>
                    <CardDescription>
                      Created {new Date(contract.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {userRole === "dominant" && (
                    <AddToNotionButtonGeneric
                      tableName="contracts"
                      itemId={contract.id}
                      syncEndpoint="/api/notion/sync-contract"
                      variant="ghost"
                      size="sm"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-md p-4 max-h-48 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {contract.content}
                    </pre>
                  </div>
                  {contract.status === "pending_signature" && !hasUserSigned(contract.id) && (
                    <Button
                      onClick={() => handleSignContract(contract.id)}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Sign Contract
                    </Button>
                  )}
                  {hasUserSigned(contract.id) && (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">You have signed this contract</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

