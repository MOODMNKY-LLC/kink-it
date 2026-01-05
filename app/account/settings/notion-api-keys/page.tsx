"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Trash2, TestTube, Key, Shield, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ApiKey {
  id: string
  key_name: string
  key_hash: string
  is_active: boolean
  last_used_at: string | null
  last_validated_at: string | null
  created_at: string
  updated_at: string
}

export default function NotionApiKeysPage() {
  const supabase = createClient()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null)
  const [keyName, setKeyName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/notion/api-keys")
      if (!response.ok) {
        throw new Error("Failed to fetch API keys")
      }
      const data = await response.json()
      setApiKeys(data.apiKeys || [])
    } catch (error) {
      console.error("Error fetching API keys:", error)
      toast.error("Failed to load API keys")
    } finally {
      setLoading(false)
    }
  }

  const handleAddKey = async () => {
    if (!keyName.trim() || !apiKey.trim()) {
      toast.error("Please provide both a name and API key")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/notion/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_name: keyName.trim(),
          api_key: apiKey.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add API key")
      }

      toast.success("API key added successfully")
      setDialogOpen(false)
      setKeyName("")
      setApiKey("")
      fetchApiKeys()
    } catch (error: any) {
      console.error("Error adding API key:", error)
      toast.error(error.message || "Failed to add API key")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/notion/api-keys/${keyId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete API key")
      }

      toast.success("API key deleted successfully")
      fetchApiKeys()
    } catch (error) {
      console.error("Error deleting API key:", error)
      toast.error("Failed to delete API key")
    }
  }

  const handleTestKey = async (keyId: string) => {
    setTestingKeyId(keyId)
    try {
      const response = await fetch(`/api/notion/api-keys/${keyId}/test`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success && data.valid) {
        toast.success("API key is valid and working correctly")
        fetchApiKeys() // Refresh to update last_validated_at
      } else {
        toast.error(data.error || "API key validation failed")
      }
    } catch (error) {
      console.error("Error testing API key:", error)
      toast.error("Failed to test API key")
    } finally {
      setTestingKeyId(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notion API Keys</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Notion API keys for enhanced integration capabilities. These keys allow you to
          access your private Notion workspaces and perform advanced operations.
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Security Notice</AlertTitle>
        <AlertDescription>
          Your API keys are encrypted and stored securely. They are never displayed in full and are
          only decrypted when needed for API calls. Never share your API keys with anyone.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Your API Keys</h2>
          <p className="text-sm text-muted-foreground">
            {apiKeys.length} {apiKeys.length === 1 ? "key" : "keys"} configured
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Notion API Key</DialogTitle>
              <DialogDescription>
                Enter a name for this API key and paste your Notion integration token. The key will
                be validated before storage.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Personal Workspace, Team Integration"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="api-key">Notion API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="secret_... or ntn_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your API key starts with &quot;secret_&quot; or &quot;ntn_&quot;
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddKey} disabled={submitting}>
                {submitting ? "Adding..." : "Add Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading API keys...</div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No API keys configured</h3>
          <p className="text-muted-foreground mb-4">
            Add your first Notion API key to enable enhanced integration features.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add API Key
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key Hash</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Last Validated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.key_name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {key.key_hash}...
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant={key.is_active ? "default" : "secondary"}>
                    {key.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(key.last_used_at)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(key.last_validated_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestKey(key.id)}
                      disabled={testingKeyId === key.id}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

