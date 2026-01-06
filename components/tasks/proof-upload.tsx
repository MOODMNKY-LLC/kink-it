'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { validateProofFile } from '@/lib/image/shared-utils'

interface ProofUploadProps {
  onUploadComplete?: (proofUrl: string, proofId: string) => void
  existingProof?: string
  taskId: string
}

export function ProofUpload({ onUploadComplete, existingProof, taskId }: ProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(existingProof || null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleCapture = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateProofFile(file)
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file to Supabase Storage via API
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/tasks/${taskId}/proof/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload proof')
      }

      const data = await response.json()
      setPreview(data.proof_url)
      toast.success('Proof uploaded successfully')
      
      if (onUploadComplete) {
        onUploadComplete(data.proof_url, data.proof_id)
      }
    } catch (error: any) {
      console.error('Upload failed:', error)
      toast.error(error.message || 'Failed to upload proof. Please try again.')
      setPreview(null)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    // TODO: Implement delete functionality if needed
    setPreview(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment" // Use back camera on mobile
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button
          onClick={handleCapture}
          disabled={uploading}
          className="touch-target"
          variant="outline"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              {preview ? 'Change Proof' : 'Upload Proof'}
            </>
          )}
        </Button>
        {preview && !uploading && (
          <Button
            onClick={handleRemove}
            disabled={uploading}
            className="touch-target"
            variant="outline"
            size="icon"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {preview && (
        <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-border">
          {preview.startsWith('data:') || preview.startsWith('http') ? (
            <Image
              src={preview}
              alt="Proof"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <p className="text-sm text-muted-foreground">Proof uploaded</p>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Uploading proof...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

