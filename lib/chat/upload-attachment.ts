/**
 * Utility functions for uploading chat message attachments to Supabase Storage
 */

import { createClient } from "@/lib/supabase/client"
import type { FileAttachment } from "@/components/chat/file-upload-handler"

export interface UploadedAttachment {
  url: string
  path: string
  fileName: string
  fileSize: number
  mimeType: string
  type: "image" | "video" | "audio" | "document" | "file"
}

/**
 * Upload a single file attachment to Supabase Storage
 */
export async function uploadChatAttachment(
  file: FileAttachment,
  userId: string
): Promise<UploadedAttachment> {
  const supabase = createClient()

  // Determine attachment type based on file type
  const getAttachmentType = (fileType: string): "image" | "video" | "audio" | "document" | "file" => {
    if (fileType.startsWith("image/")) return "image"
    if (fileType.startsWith("video/")) return "video"
    if (fileType.startsWith("audio/")) return "audio"
    if (fileType.includes("pdf") || fileType.includes("document") || fileType.includes("text")) return "document"
    return "file"
  }

  const attachmentType = getAttachmentType(file.file.type)
  const timestamp = Date.now()
  const extension = file.file.name.split(".").pop() || "bin"
  const sanitizedFileName = file.file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const filename = `chat_${timestamp}_${sanitizedFileName}`
  const filePath = `${userId}/attachments/${filename}`

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload to Supabase Storage (accepts ArrayBuffer or Uint8Array)
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("chat-attachments")
    .upload(filePath, arrayBuffer, {
      contentType: file.file.type,
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    console.error("[Chat] Error uploading attachment:", uploadError)
    throw new Error(`Failed to upload file: ${uploadError.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("chat-attachments").getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: filePath,
    fileName: file.file.name,
    fileSize: file.file.size,
    mimeType: file.file.type,
    type: attachmentType,
  }
}

/**
 * Upload multiple file attachments to Supabase Storage
 */
export async function uploadChatAttachments(
  files: FileAttachment[],
  userId: string
): Promise<UploadedAttachment[]> {
  const uploadPromises = files.map((file) => uploadChatAttachment(file, userId))
  return Promise.all(uploadPromises)
}
