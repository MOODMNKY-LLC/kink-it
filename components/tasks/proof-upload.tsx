'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X } from 'lucide-react'
import Image from 'next/image'

interface ProofUploadProps {
  onUpload: (file: File) => Promise<void>
  existingProof?: string
  taskId: string
}

export function ProofUpload({ onUpload, existingProof, taskId }: ProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(existingProof || null)
  const [uploading, setUploading] = useState(false)

  const handleCapture = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      await onUpload(file)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload proof. Please try again.')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
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
          <Camera className="mr-2 h-4 w-4" />
          {preview ? 'Change Photo' : 'Capture Proof'}
        </Button>
        {preview && (
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
          <Image
            src={preview}
            alt="Proof"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Upload className="h-8 w-8 animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

