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
      const imageFiles: FileAttachment[] = []
      const errors: string[] = []

      Array.from(selectedFiles).forEach((file) => {
        if (files.length + newFiles.length + imageFiles.length >= maxFiles) {
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
          imageFiles.push(attachment)
          // Generate preview for image
          const reader = new FileReader()
          reader.onload = (e) => {
            attachment.preview = e.target?.result as string
            // Update files state with the new preview
            onFilesChange((prevFiles) => {
              // Check if this attachment is already in the list
              const existingIndex = prevFiles.findIndex(f => f.id === attachment.id)
              if (existingIndex >= 0) {
                // Update existing file with preview
                const updated = [...prevFiles]
                updated[existingIndex] = attachment
                return updated
              }
              // Add new file with preview
              return [...prevFiles, attachment]
            })
          }
          reader.onerror = () => {
            console.error(`Failed to load preview for ${file.name}`)
            // Still add the file even if preview fails
            onFilesChange((prevFiles) => {
              const existingIndex = prevFiles.findIndex(f => f.id === attachment.id)
              if (existingIndex < 0) {
                return [...prevFiles, attachment]
              }
              return prevFiles
            })
          }
          reader.readAsDataURL(file)
        } else {
          newFiles.push(attachment)
        }
      })

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error))
      }

      // Add non-image files immediately
      if (newFiles.length > 0) {
        onFilesChange((prevFiles) => [...prevFiles, ...newFiles])
      }

      // Add image files immediately (previews will be added asynchronously)
      if (imageFiles.length > 0) {
        onFilesChange((prevFiles) => [...prevFiles, ...imageFiles])
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
      {/* File List - Shows all files with image previews inline */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Files:</p>
          <div className="flex flex-wrap gap-2">
            {files.map((attachment, index) => (
              <div
                key={`file-${attachment.id}-${index}`}
                className="relative group"
              >
                {attachment.type === "image" && attachment.preview ? (
                  // Image preview - larger thumbnail
                  <div className="relative overflow-hidden rounded-lg border-2 border-border bg-muted">
                    <img
                      src={attachment.preview}
                      alt={attachment.file.name}
                      className="h-24 w-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => removeFile(attachment.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1">
                      <p className="text-[10px] truncate px-1">{attachment.file.name}</p>
                      <p className="text-[10px] opacity-80 px-1">
                        {(attachment.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  // Regular file - compact display
                  <div className="relative group flex items-center gap-2 bg-muted rounded-lg p-2 pr-8 min-w-[200px]">
                    <div className="h-10 w-10 flex items-center justify-center bg-background rounded shrink-0">
                      {attachment.type === "image" ? (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <File className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
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
                )}
              </div>
            ))}
          </div>
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
