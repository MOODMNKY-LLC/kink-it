import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/auth/get-user"

/**
 * Upload proof file for a task
 * Supports photo and video uploads to Supabase Storage
 * 
 * POST /api/tasks/[id]/proof/upload
 * Body: FormData with 'file' field
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const taskId = params.id
    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      )
    }

    // Verify user has access to this task
    const supabase = await createClient()
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, assigned_to, assigned_by")
      .eq("id", taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    // Check if user is assigned to or assigned this task
    if (task.assigned_to !== profile.id && task.assigned_by !== profile.id) {
      return NextResponse.json(
        { error: "Unauthorized to upload proof for this task" },
        { status: 403 }
      )
    }

    // Get file from FormData
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images and videos are allowed." },
        { status: 400 }
      )
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      )
    }

    // Determine proof type
    const proofType = file.type.startsWith("image/") ? "photo" : "video"

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || 
      (file.type.startsWith("image/") ? "png" : "mp4")
    const filename = `proof_${timestamp}.${extension}`
    const filePath = `${profile.id}/tasks/${taskId}/${filename}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("task-proofs")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading proof:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload proof file" },
        { status: 500 }
      )
    }

    // Get signed URL (private bucket, so we need signed URL)
    const { data: urlData, error: urlError } = await supabase.storage
      .from("task-proofs")
      .createSignedUrl(filePath, 3600 * 24 * 365) // 1 year expiry

    if (urlError || !urlData) {
      console.error("Error creating signed URL:", urlError)
      return NextResponse.json(
        { error: "Failed to generate proof URL" },
        { status: 500 }
      )
    }

    // Create proof record in database
    const { data: proofData, error: proofError } = await supabase
      .from("task_proof")
      .insert({
        task_id: taskId,
        proof_type: proofType,
        proof_url: urlData.signedUrl,
        created_by: profile.id,
      })
      .select()
      .single()

    if (proofError) {
      console.error("Error creating proof record:", proofError)
      // Try to delete uploaded file
      await supabase.storage.from("task-proofs").remove([filePath])
      return NextResponse.json(
        { error: "Failed to create proof record" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      proof_id: proofData.id,
      proof_url: urlData.signedUrl,
      proof_type: proofType,
      storage_path: filePath,
      file_size: file.size,
      content_type: file.type,
    })
  } catch (error: any) {
    console.error("Error uploading proof:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload proof" },
      { status: 500 }
    )
  }
}



