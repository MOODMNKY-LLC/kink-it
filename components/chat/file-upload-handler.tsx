"use client"

import React, { useCallback, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, File, Image as ImageIcon, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface FileAttachment {
  id: string
  file: File
  preview?: string
  type: "image" | "file"
}

interface FileUploadHandlerProps {
  files: FileAttachment[]
  onFilesChange: (files: FileAttachment[]) => void
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
  className?: string
}

export function FileUploadHandler({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSizeMB = 10,
  accept = "image/*,.pdf,.doc,.docx,.txt",
  className,
}: FileUploadHandlerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`
    }
    return null
  }

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return

      const newFiles: FileAttachment[] = []
      const errors: string[] = []

      Array.from(selectedFiles).forEach((file) => {
        if (files.length + newFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`)
          return
        }

        const error = validateFile(file)
        if (error) {
          errors.push(`${file.name}: ${error}`)
          return
        }

        const isImage = file.type.startsWith("image/")
        const attachment: FileAttachment = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          type: isImage ? "image" : "file",
        }

        if (isImage) {
          const reader = new FileReader()
          reader.onload = (e) => {
            attachment.preview = e.target?.result as string
            onFilesChange([...files, ...newFiles, attachment])
          }
          reader.readAsDataURL(file)
        } else {
          newFiles.push(attachment)
        }
      })

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error))
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles])
      }
    },
    [files, maxFiles, maxSizeMB, onFilesChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeFile = useCallback(
    (id: string) => {
      onFilesChange(files.filter((f) => f.id !== id))
    },
    [files, onFilesChange]
  )

  return (
    <div className={cn("space-y-2", className)}>
      {/* File List */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((attachment, index) => (
            <div key={`file-${attachment.id}-${index}`} className="relative group flex items-center gap-2 bg-muted rounded-lg p-2 pr-8">
              {attachment.preview ? (
                <img
                  src={attachment.preview}
                  alt={attachment.file.name}
                  className="h-12 w-12 object-cover rounded"
                />
              ) : (
                <div className="h-12 w-12 flex items-center justify-center bg-background rounded">
                  {attachment.type === "image" ? (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <File className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{attachment.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(attachment.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(attachment.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">
          Drag files here or{" "}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-primary hover:underline"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-muted-foreground">
          Max {maxFiles} files, {maxSizeMB}MB each
        </p>
      </div>
    </div>
  )
}
