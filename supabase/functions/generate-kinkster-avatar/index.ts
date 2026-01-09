/**
 * Supabase Edge Function: Generate Kinkster Avatar
 * 
 * Generates avatar images using OpenAI DALL-E 3 and stores them in Supabase Storage.
 * Uses background tasks for async image processing to respond quickly to clients.
 * 
 * Routes:
 * POST /generate-kinkster-avatar - Generate and store avatar
 */

import { createClient } from "npm:@supabase/supabase-js@2.39.3"

const AVATAR_GENERATION_PRESETS = {
  artStyle: "Bara art style, digital art, character portrait, professional illustration, bold detailed illustrations emphasizing muscular physique, strong linework with detailed anatomy and muscle definition, mature masculine character design, realistic proportions with stylized elements, emphasis on physical strength and masculinity, dynamic poses that showcase physique",
  lighting: "dramatic lighting, professional portrait lighting, cinematic lighting, strong directional lighting that emphasizes muscle definition, clear highlights and shadows to showcase physique, professional portrait lighting that flatters muscular build",
  composition: "centered composition, character portrait, high detail, professional quality, character-focused framing that showcases full physique, dynamic poses that emphasize strength and presence, poses that naturally display muscle definition",
  quality: "high quality, 4k resolution, detailed, professional, polished",
  theme: "mature, sophisticated, artistic, tasteful, elegant, refined, with strong masculine aesthetic",
}

interface GenerationProps {
  physical?: {
    height?: string
    weight?: string
    build?: string
    hair?: string
    beard?: string
    eyes?: string
    skin_tone?: string
  }
  clothing?: {
    top?: string[]
    bottom?: string[]
    footwear?: string[]
    accessories?: string[]
  }
  character_accessories?: {
    decorative_collar?: boolean
    character_mask?: boolean
    ornamental_chains?: boolean
    long_socks?: boolean
    leather?: string[]
    fashion_straps?: boolean
  }
  // Legacy support - map old kink_accessories to new character_accessories
  kink_accessories?: {
    collars?: boolean
    pup_mask?: boolean
    locks?: boolean
    long_socks?: boolean
    leather?: string[]
    harness?: boolean
  }
  background?: {
    type?: "solid" | "gradient" | "environment" | "minimal"
    color?: string
    environment?: string
  }
}

interface CharacterData {
  name: string
  appearance_description?: string
  physical_attributes?: Record<string, any>
  archetype?: string
  role_preferences?: string[]
  personality_traits?: string[]
  props?: GenerationProps
}

interface RequestPayload {
  user_id: string
  kinkster_id?: string
  character_data: CharacterData
  // custom_prompt removed - always use synthesized prompt from character_data.props
  props?: GenerationProps
}

function propsToPrompt(props: GenerationProps): string[] {
  const parts: string[] = []

  // Physical attributes
  if (props.physical) {
    const physical = props.physical
    const physicalParts: string[] = []
    if (physical.build) physicalParts.push(physical.build)
    if (physical.height) physicalParts.push(`${physical.height} height`)
    if (physical.hair) physicalParts.push(physical.hair)
    if (physical.beard) physicalParts.push(physical.beard)
    if (physical.eyes) physicalParts.push(physical.eyes)
    if (physical.skin_tone) physicalParts.push(`${physical.skin_tone} skin tone`)
    if (physicalParts.length > 0) parts.push(physicalParts.join(", "))
  }

  // Clothing
  if (props.clothing) {
    const clothingParts: string[] = []
    if (props.clothing.top && props.clothing.top.length > 0) {
      clothingParts.push(`wearing ${props.clothing.top.join(" and ")}`)
    }
    if (props.clothing.bottom && props.clothing.bottom.length > 0) {
      clothingParts.push(props.clothing.bottom.join(" and "))
    }
    if (props.clothing.footwear && props.clothing.footwear.length > 0) {
      clothingParts.push(props.clothing.footwear.join(" and "))
    }
    if (props.clothing.accessories && props.clothing.accessories.length > 0) {
      clothingParts.push(`with ${props.clothing.accessories.join(", ")}`)
    }
    if (clothingParts.length > 0) parts.push(clothingParts.join(", "))
  }

  // Character accessories (with legacy kink_accessories support)
  const accessories = props.character_accessories || props.kink_accessories
  if (accessories) {
    const accessoryParts: string[] = []
    
    // Support both new (character_accessories) and legacy (kink_accessories) property names
    if (accessories.decorative_collar || (accessories as any).collars) {
      accessoryParts.push("wearing a tasteful leather collar")
    }
    if (accessories.character_mask || (accessories as any).pup_mask) {
      accessoryParts.push("sporting a stylish pup mask")
    }
    if (accessories.ornamental_chains || (accessories as any).locks) {
      accessoryParts.push("adorned with decorative locks")
    }
    if (accessories.long_socks) {
      accessoryParts.push("wearing long socks")
    }
    if (accessories.fashion_straps || (accessories as any).harness) {
      accessoryParts.push("wearing a leather harness")
    }
    if (accessories.leather && accessories.leather.length > 0) {
      // Map harness to straps for leather items
      const leatherItems = accessories.leather.map(item => 
        item === "harness" ? "straps" : item
      )
      accessoryParts.push(`featuring ${leatherItems.join(" and ")} in leather`)
    }
    
    if (accessoryParts.length > 0) {
      parts.push(accessoryParts.join(", "))
    }
  }

  // Background
  if (props.background) {
    if (props.background.type === "solid" && props.background.color) {
      parts.push(`solid ${props.background.color} background`)
    } else if (props.background.type === "gradient" && props.background.color) {
      parts.push(`${props.background.color} gradient background`)
    } else if (props.background.type === "environment" && props.background.environment) {
      parts.push(`${props.background.environment} environment`)
    }
    // Removed 'description' - no custom descriptions allowed
  }

  return parts
}

function buildAvatarPrompt(characterData: CharacterData): string {
  const {
    name,
    appearance_description,
    physical_attributes,
    archetype,
    role_preferences,
    personality_traits,
    props,
  } = characterData

  // Build physical description
  let physicalDesc = appearance_description || ""
  
  // Use props if provided, otherwise use physical_attributes
  if (props?.physical) {
    const physicalParts = propsToPrompt({ physical: props.physical })
    if (physicalParts.length > 0) {
      physicalDesc = physicalDesc
        ? `${physicalDesc}, ${physicalParts[0]}`
        : physicalParts[0]
    }
  } else if (physical_attributes) {
    const parts: string[] = []
    if (physical_attributes.height) parts.push(`${physical_attributes.height} height`)
    if (physical_attributes.build) parts.push(`${physical_attributes.build} build`)
    if (physical_attributes.hair) parts.push(`${physical_attributes.hair} hair`)
    if (physical_attributes.beard) parts.push(physical_attributes.beard)
    if (physical_attributes.eyes) parts.push(`${physical_attributes.eyes} eyes`)
    if (physical_attributes.skin_tone) parts.push(`${physical_attributes.skin_tone} skin`)
    
    if (parts.length > 0) {
      physicalDesc = physicalDesc
        ? `${physicalDesc}, ${parts.join(", ")}`
        : parts.join(", ")
    }
  }

  // Build character context
  const contextParts: string[] = []
  if (archetype) contextParts.push(`archetype: ${archetype}`)
  if (role_preferences && role_preferences.length > 0) {
    contextParts.push(`role: ${role_preferences.join(", ")}`)
  }
  if (personality_traits && personality_traits.length > 0) {
    contextParts.push(`personality: ${personality_traits.slice(0, 3).join(", ")}`)
  }

  // Build props-based descriptions
  const propsDescriptions: string[] = []
  
  // Clothing from props
  if (props?.clothing) {
    const clothingParts = propsToPrompt({ clothing: props.clothing })
    if (clothingParts.length > 0) {
      propsDescriptions.push(clothingParts[0])
    }
  } else if (!physicalDesc && !props?.physical) {
    propsDescriptions.push("wearing stylish, tasteful clothing")
  }

  // Character accessories from props (with legacy kink_accessories support)
  const accessories = props?.character_accessories || props?.kink_accessories
  if (accessories) {
    const accessoryParts = propsToPrompt({ character_accessories: accessories, kink_accessories: accessories })
    if (accessoryParts.length > 0) {
      propsDescriptions.push(accessoryParts[0])
    }
  }

  // Background from props
  if (props?.background) {
    const bgParts = propsToPrompt({ background: props.background })
    if (bgParts.length > 0) {
      propsDescriptions.push(bgParts[0])
    }
  }

  // Construct final prompt with Bara style first
  const promptParts = [
    AVATAR_GENERATION_PRESETS.artStyle,
    `character portrait of ${name}`,
    physicalDesc || "distinctive appearance",
    contextParts.length > 0 ? `reflecting ${contextParts.join(", ")}` : "",
    ...propsDescriptions,
    propsDescriptions.length === 0 && !props?.clothing ? "wearing stylish, tasteful clothing" : "",
    "confident pose, expressive eyes",
    AVATAR_GENERATION_PRESETS.lighting,
    AVATAR_GENERATION_PRESETS.composition,
    AVATAR_GENERATION_PRESETS.quality,
    AVATAR_GENERATION_PRESETS.theme,
    "Bara style: emphasis on muscular, masculine character with detailed anatomy",
  ].filter(Boolean)

  const rawPrompt = promptParts.join(", ")
  
  // Optimize prompt (duplicated from lib/image/prompt-optimizer.ts due to Deno limitations)
  return optimizePromptForDALLE3(rawPrompt)
}

// Duplicated prompt optimization function (can't import from lib/image/prompt-optimizer.ts in Deno)
function optimizePromptForDALLE3(prompt: string): string {
  if (!prompt || prompt.trim().length === 0) {
    return prompt
  }

  const parts = prompt.split(",").map((p) => p.trim()).filter(Boolean)
  const seenTerms = new Set<string>()
  const optimizedParts: string[] = []

  const styleParts: string[] = []
  const characterParts: string[] = []
  const detailParts: string[] = []

  for (const part of parts) {
    const lowerPart = part.toLowerCase()

    if (
      lowerPart.includes("bara") ||
      lowerPart.includes("art style") ||
      lowerPart.includes("digital art") ||
      lowerPart.includes("illustration") ||
      lowerPart.includes("lighting") ||
      lowerPart.includes("composition") ||
      lowerPart.includes("quality") ||
      lowerPart.includes("theme") ||
      lowerPart.includes("aesthetic")
    ) {
      if (!seenTerms.has(lowerPart)) {
        styleParts.push(part)
        seenTerms.add(lowerPart)
      }
      continue
    }

    if (
      lowerPart.includes("character") ||
      lowerPart.includes("portrait") ||
      lowerPart.includes("of ") ||
      lowerPart.startsWith("reflecting")
    ) {
      if (!seenTerms.has(lowerPart)) {
        characterParts.push(part)
        seenTerms.add(lowerPart)
      }
      continue
    }

    if (!seenTerms.has(lowerPart)) {
      detailParts.push(part)
      seenTerms.add(lowerPart)
    }
  }

  const baraStyle = styleParts.find((p) => p.toLowerCase().includes("bara"))
  if (baraStyle) {
    optimizedParts.push(baraStyle)
    styleParts.splice(styleParts.indexOf(baraStyle), 1)
  }

  optimizedParts.push(...styleParts)
  optimizedParts.push(...characterParts)
  optimizedParts.push(...detailParts)

  let optimized = optimizedParts.join(", ")
  
  // Remove redundant phrases
  optimized = optimized.replace(/bara art style[^,]*,\s*bara[^,]*/gi, (match) => match.split(",")[0])
  optimized = optimized.replace(/character portrait[^,]*,\s*character[^,]*/gi, (match) => match.split(",")[0])
  optimized = optimized.replace(/muscular[^,]*,\s*muscular[^,]*/gi, (match) => match.split(",")[0])

  if (!optimized.toLowerCase().includes("bara style:")) {
    optimized += ", Bara style: emphasis on muscular, masculine character with detailed anatomy"
  }

  return optimized.trim()
}

async function downloadAndStoreImage(
  imageUrl: string,
  userId: string,
  kinksterId: string | undefined,
  supabase: ReturnType<typeof createClient>
): Promise<{ storage_url: string; storage_path: string }> {
  console.log(`[downloadAndStoreImage] Starting download from: ${imageUrl.substring(0, 50)}...`)
  const downloadStartTime = Date.now()
  
  // Download image
  console.log(`[downloadAndStoreImage] Fetching image...`)
  const imageResponse = await fetch(imageUrl)
  const fetchDuration = Date.now() - downloadStartTime
  console.log(`[downloadAndStoreImage] Fetch completed (${fetchDuration}ms), status: ${imageResponse.status}`)
  
  if (!imageResponse.ok) {
    console.error(`[downloadAndStoreImage] Fetch failed: ${imageResponse.status} ${imageResponse.statusText}`)
    throw new Error(`Failed to download image: ${imageResponse.statusText}`)
  }

  // Convert to buffer
  console.log(`[downloadAndStoreImage] Converting to buffer...`)
  const bufferStartTime = Date.now()
  const arrayBuffer = await imageResponse.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)
  const bufferDuration = Date.now() - bufferStartTime
  console.log(`[downloadAndStoreImage] Buffer created (${bufferDuration}ms), size: ${buffer.length} bytes`)

  // Determine file extension
  const contentType = imageResponse.headers.get("content-type") || "image/png"
  const extension = contentType.includes("jpeg") || contentType.includes("jpg")
    ? "jpg"
    : contentType.includes("webp")
    ? "webp"
    : "png"
  console.log(`[downloadAndStoreImage] Content type: ${contentType}, extension: ${extension}`)

  // Generate unique filename
  const timestamp = Date.now()
  const filename = kinksterId
    ? `avatar_${timestamp}_${kinksterId}.${extension}`
    : `avatar_${timestamp}.${extension}`
  const filePath = `${userId}/kinksters/${filename}`
  console.log(`[downloadAndStoreImage] File path: ${filePath}`)

  // Upload to Supabase Storage
  console.log(`[downloadAndStoreImage] Uploading to storage bucket: kinkster-avatars`)
  const uploadStartTime = Date.now()
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("kinkster-avatars")
    .upload(filePath, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    })
  const uploadDuration = Date.now() - uploadStartTime
  console.log(`[downloadAndStoreImage] Upload completed (${uploadDuration}ms)`)

  if (uploadError) {
    console.error(`[downloadAndStoreImage] Upload error:`, uploadError)
    throw new Error(`Failed to upload to storage: ${uploadError.message}`)
  }

  console.log(`[downloadAndStoreImage] Upload data:`, uploadData)

  // Get public URL - construct it manually to ensure it uses the public-facing URL
  console.log(`[downloadAndStoreImage] Constructing public URL...`)
  
  // Construct the storage URL path
  const storagePath = `/storage/v1/object/public/kinkster-avatars/${filePath}`
  
  // Determine the public API URL
  // In local dev, SUPABASE_URL is http://kong:8000 (internal Docker network)
  // In production, SUPABASE_URL is https://[project-id].supabase.co
  // We need to construct the public URL that the client can access
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const isLocalDev = supabaseUrl.includes("kong:8000") || 
                     supabaseUrl.includes("127.0.0.1:8000") ||
                     supabaseUrl.includes("localhost:8000")
  const isProduction = supabaseUrl.includes("supabase.co")
  
  let publicApiUrl = ""
  
  if (isLocalDev) {
    // Local development - use public API URL (port 55321, TLS enabled per config.toml)
    // Check if we have a custom public URL set (useful for testing)
    publicApiUrl = Deno.env.get("SUPABASE_PUBLIC_URL") || "https://127.0.0.1:55321"
    console.log(`[downloadAndStoreImage] Local dev detected, using public API URL: ${publicApiUrl}`)
  } else if (isProduction) {
    // Production - use the Supabase project URL as-is
    // Remove any trailing slashes and ensure it's a clean URL
    publicApiUrl = supabaseUrl.replace(/\/$/, "").replace(/\/+$/, "")
    console.log(`[downloadAndStoreImage] Production detected, using Supabase URL: ${publicApiUrl}`)
  } else {
    // Fallback - use SUPABASE_URL if available, otherwise default to local dev
    // This handles edge cases like custom Supabase instances
    publicApiUrl = supabaseUrl.replace(/\/$/, "") || Deno.env.get("SUPABASE_PUBLIC_URL") || "https://127.0.0.1:55321"
    console.log(`[downloadAndStoreImage] Using fallback URL: ${publicApiUrl}`)
  }
  
  // Construct final URL - ensure no double slashes
  const transformedUrl = `${publicApiUrl.replace(/\/$/, "")}${storagePath}`
  console.log(`[downloadAndStoreImage] Final storage URL: ${transformedUrl}`)
  console.log(`[downloadAndStoreImage] Environment: ${isLocalDev ? "LOCAL" : isProduction ? "PRODUCTION" : "UNKNOWN"}`)

  const totalDuration = Date.now() - downloadStartTime
  console.log(`[downloadAndStoreImage] ✅ Complete in ${totalDuration}ms`)

  return {
    storage_url: transformedUrl,
    storage_path: filePath,
  }
}

async function broadcastProgress(
  userId: string,
  kinksterId: string | undefined,
  status: "generating" | "downloading" | "uploading" | "completed" | "error",
  message?: string,
  data?: Record<string, any>
) {
  const broadcastStartTime = Date.now()
  console.log(`[broadcastProgress] Starting broadcast: status=${status}, message=${message}`)
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error(`[broadcastProgress] Missing Supabase configuration - URL: ${supabaseUrl ? "present" : "missing"}, Key: ${serviceRoleKey ? "present" : "missing"}`)
      return
    }

    const topic = kinksterId
      ? `kinkster:${kinksterId}:avatar`
      : `user:${userId}:avatar`
    
    console.log(`[broadcastProgress] Topic: ${topic}`)

    // Use Realtime REST API to broadcast messages from Edge Functions
    // The client library's realtime.send() doesn't work in Edge Functions
    const broadcastUrl = `${supabaseUrl}/realtime/v1/api/broadcast`
    console.log(`[broadcastProgress] Broadcast URL: ${broadcastUrl}`)
    
    const payload = {
      messages: [
        {
          topic: topic,
          event: "avatar_generation_progress",
          payload: {
            status,
            message,
            timestamp: new Date().toISOString(),
            ...data,
          },
        },
      ],
    }
    console.log(`[broadcastProgress] Payload: ${JSON.stringify(payload)}`)
    
    const fetchStartTime = Date.now()
    const response = await fetch(broadcastUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(payload),
    })
    const fetchDuration = Date.now() - fetchStartTime
    console.log(`[broadcastProgress] Fetch completed (${fetchDuration}ms), status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error(`[broadcastProgress] ❌ Failed: ${response.status} ${errorText}`)
    } else {
      const totalDuration = Date.now() - broadcastStartTime
      console.log(`[broadcastProgress] ✅ Success (${totalDuration}ms)`)
    }
  } catch (error: any) {
    const errorDuration = Date.now() - broadcastStartTime
    console.error(`[broadcastProgress] ❌ Exception after ${errorDuration}ms:`)
    console.error(`[broadcastProgress] Error type:`, error?.constructor?.name || typeof error)
    console.error(`[broadcastProgress] Error message:`, error?.message || String(error))
    console.error(`[broadcastProgress] Error stack:`, error?.stack || "No stack trace")
  }
}

console.info("Kinkster Avatar Generation Edge Function started")

Deno.serve(async (req: Request) => {
  console.log("=== Edge Function Request Received ===")
  console.log("Method:", req.method)
  console.log("URL:", req.url)
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request")
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    console.log("Processing POST request...")
    let payload: RequestPayload
    try {
      payload = await req.json()
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError)
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload", details: parseError.message }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    const { user_id, kinkster_id, character_data, props } = payload
    
    // Validate required fields
    if (!user_id) {
      console.error("Validation error: user_id is missing")
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    if (!character_data) {
      console.error("Validation error: character_data is missing")
      return new Response(
        JSON.stringify({ error: "character_data is required" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    if (!character_data.name) {
      console.error("Validation error: character_data.name is missing")
      return new Response(
        JSON.stringify({ error: "character_data.name is required" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }
    
    // Merge props into character_data if provided
    const finalCharacterData = props
      ? { ...character_data, props }
      : character_data

    // Initialize Supabase client
    console.log("Initializing Supabase client...")
    let supabase: ReturnType<typeof createClient>
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase environment variables")
        console.error("SUPABASE_URL:", supabaseUrl ? "present" : "missing")
        console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "present" : "missing")
        return new Response(
          JSON.stringify({ error: "Supabase configuration missing" }),
          {
            status: 500,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        )
      }
      
      supabase = createClient(supabaseUrl, supabaseServiceKey)
      console.log("Supabase client initialized")
    } catch (error: any) {
      console.error("Error initializing Supabase client:", error)
      return new Response(
        JSON.stringify({ error: "Failed to initialize Supabase client", details: error.message }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    // Get OpenAI API key from secrets
    console.log("Checking OpenAI API key...")
    // Try both possible environment variable names (Supabase maps secrets differently)
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("openai_api_key")
    
    if (!openaiApiKey) {
      console.error("OpenAI API key not configured")
      console.error("Available env vars:", Object.keys(Deno.env.toObject()).filter(k => k.toLowerCase().includes("openai")))
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }
    
    // Log API key info (safely - only first 10 chars and last 4 chars)
    const keyLength = openaiApiKey.length
    const keyPreview = openaiApiKey.length > 14 
      ? `${openaiApiKey.substring(0, 10)}...${openaiApiKey.substring(keyLength - 4)}`
      : "***REDACTED***"
    console.log(`OpenAI API key found (length: ${keyLength}, preview: ${keyPreview})`)
    
    // Validate API key format (should start with "sk-" and be at least 20 chars)
    if (!openaiApiKey.startsWith("sk-") || openaiApiKey.length < 20) {
      console.error(`Invalid API key format: starts with "sk-": ${openaiApiKey.startsWith("sk-")}, length: ${openaiApiKey.length}`)
      return new Response(
        JSON.stringify({ error: "Invalid OpenAI API key format" }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    // Build prompt (always synthesized from character_data.props, automatically optimized)
    let prompt: string
    try {
      console.log("Building prompt from character data:", JSON.stringify(finalCharacterData))
      prompt = buildAvatarPrompt(finalCharacterData)
      console.log("Prompt built successfully, length:", prompt.length)
    } catch (error: any) {
      console.error("Error building prompt:", error)
      console.error("Error stack:", error.stack)
      return new Response(
        JSON.stringify({ error: "Failed to build prompt", details: error.message }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    // Respond immediately - all processing happens in background to prevent timeout
    let response: any
    try {
      response = {
        prompt: prompt,
        generation_config: {
          model: "dall-e-3",
          size: "1024x1024",
          quality: "standard",
        },
        status: "processing", // Indicates background processing
        kinkster_id: kinkster_id,
      }
      console.log("Response object created")
    } catch (error: any) {
      console.error("Error creating response object:", error)
      return new Response(
        JSON.stringify({ error: "Failed to create response", details: error.message }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    // Start background task for entire process (OpenAI generation + download + storage)
    // This prevents timeout by returning immediately
    console.log("Setting up background task...")
    console.log("EdgeRuntime available:", typeof EdgeRuntime !== "undefined")
    console.log("EdgeRuntime.waitUntil available:", typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil !== undefined)
    
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      console.log("EdgeRuntime.waitUntil available, starting background task")
      try {
              EdgeRuntime.waitUntil(
                (async () => {
                  const taskStartTime = Date.now()
                  console.log(`[Background Task] Started at ${new Date().toISOString()}`)
                  console.log(`[Background Task] User ID: ${user_id}`)
                  console.log(`[Background Task] Kinkster ID: ${kinkster_id || "none"}`)
                  console.log(`[Background Task] Prompt length: ${prompt.length}`)
                  
                  try {
                    console.log(`[Background Task] Step 1: Broadcasting generation started`)
                    await broadcastProgress(user_id, kinkster_id, "generating", "Generating avatar with OpenAI...")
                    console.log(`[Background Task] Step 1: Complete (${Date.now() - taskStartTime}ms)`)

                    console.log(`[Background Task] Step 2: Calling OpenAI DALL-E 3 API...`)
                    console.log(`[Background Task] OpenAI API URL: https://api.openai.com/v1/images/generations`)
                    console.log(`[Background Task] API Key length: ${openaiApiKey?.length || 0}`)
                    console.log(`[Background Task] API Key preview: ${openaiApiKey ? (openaiApiKey.length > 14 ? `${openaiApiKey.substring(0, 10)}...${openaiApiKey.substring(openaiApiKey.length - 4)}` : "***REDACTED***") : "MISSING"}`)
                    console.log(`[Background Task] Request payload: ${JSON.stringify({
                      model: "dall-e-3",
                      size: "1024x1024",
                      quality: "standard",
                      prompt_length: prompt.length,
                    })}`)
                    
                    const openaiStartTime = Date.now()
                    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${openaiApiKey}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        model: "dall-e-3",
                        prompt: prompt,
                        size: "1024x1024",
                        quality: "standard",
                        n: 1,
                      }),
                    })
                    
                    const openaiDuration = Date.now() - openaiStartTime
                    console.log(`[Background Task] Step 2: OpenAI API responded (${openaiDuration}ms)`)
                    console.log(`[Background Task] OpenAI response status: ${openaiResponse.status} ${openaiResponse.statusText}`)

                    if (!openaiResponse.ok) {
                      const errorData = await openaiResponse.json().catch(() => ({}))
                      console.error(`[Background Task] OpenAI API error:`, errorData)
                      await broadcastProgress(
                        user_id,
                        kinkster_id,
                        "error",
                        `OpenAI API error: ${openaiResponse.statusText}`,
                        { error: errorData }
                      )
                      return
                    }

                    console.log(`[Background Task] Step 3: Parsing OpenAI response...`)
                    const openaiData = await openaiResponse.json()
                    console.log(`[Background Task] OpenAI response keys:`, Object.keys(openaiData))
                    console.log(`[Background Task] OpenAI data.data length:`, openaiData.data?.length)
                    
                    const imageUrl = openaiData.data?.[0]?.url
                    console.log(`[Background Task] Image URL received: ${imageUrl ? "Yes" : "No"}`)
                    if (imageUrl) {
                      console.log(`[Background Task] Image URL: ${imageUrl.substring(0, 50)}...`)
                    }

                    if (!imageUrl) {
                      console.error(`[Background Task] No image URL in response:`, JSON.stringify(openaiData))
                      await broadcastProgress(user_id, kinkster_id, "error", "No image URL returned from OpenAI")
                      return
                    }

                    console.log(`[Background Task] Step 4: Broadcasting downloading status...`)
                    await broadcastProgress(user_id, kinkster_id, "downloading", "Downloading image...")
                    console.log(`[Background Task] Step 4: Complete (${Date.now() - taskStartTime}ms)`)

                    console.log(`[Background Task] Step 5: Downloading and storing image...`)
                    const downloadStartTime = Date.now()
                    const { storage_url, storage_path } = await downloadAndStoreImage(
                      imageUrl,
                      user_id,
                      kinkster_id,
                      supabase
                    )
                    const downloadDuration = Date.now() - downloadStartTime
                    console.log(`[Background Task] Step 5: Complete (${downloadDuration}ms)`)
                    console.log(`[Background Task] Storage URL: ${storage_url}`)
                    console.log(`[Background Task] Storage path: ${storage_path}`)

                    console.log(`[Background Task] Step 6: Broadcasting uploading status...`)
                    await broadcastProgress(user_id, kinkster_id, "uploading", "Uploading to storage...")
                    console.log(`[Background Task] Step 6: Complete (${Date.now() - taskStartTime}ms)`)

                    console.log(`[Background Task] Step 7: Updating kinkster record...`)
                    if (kinkster_id) {
                      const updateStartTime = Date.now()
                      const { data: updateData, error: updateError } = await supabase
                        .from("kinksters")
                        .update({
                          avatar_url: storage_url,
                          updated_at: new Date().toISOString(),
                        })
                        .eq("id", kinkster_id)
                        .eq("user_id", user_id)
                      
                      const updateDuration = Date.now() - updateStartTime
                      if (updateError) {
                        console.error(`[Background Task] Database update error:`, updateError)
                      } else {
                        console.log(`[Background Task] Step 7: Complete (${updateDuration}ms)`)
                        console.log(`[Background Task] Updated kinkster:`, updateData)
                      }
                    } else {
                      console.log(`[Background Task] Step 7: Skipped (no kinkster_id)`)
                    }

                    console.log(`[Background Task] Step 8: Broadcasting completion...`)
                    await broadcastProgress(
                      user_id,
                      kinkster_id,
                      "completed",
                      "Avatar generated and stored successfully",
                      {
                        storage_url,
                        storage_path,
                      }
                    )
                    console.log(`[Background Task] Step 8: Complete (${Date.now() - taskStartTime}ms)`)

                    const totalDuration = Date.now() - taskStartTime
                    console.log(`[Background Task] ✅ COMPLETED SUCCESSFULLY in ${totalDuration}ms`)
                    console.log(`[Background Task] Final storage URL: ${storage_url}`)
                  } catch (error: any) {
                    const errorDuration = Date.now() - taskStartTime
                    console.error(`[Background Task] ❌ ERROR after ${errorDuration}ms:`)
                    console.error(`[Background Task] Error type:`, error?.constructor?.name || typeof error)
                    console.error(`[Background Task] Error message:`, error?.message || String(error))
                    console.error(`[Background Task] Error stack:`, error?.stack || "No stack trace")
                    console.error(`[Background Task] Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)))
                    
                    await broadcastProgress(
                      user_id,
                      kinkster_id,
                      "error",
                      `Background processing failed: ${error.message}`,
                      { error: error.message }
                    )
                  }
                })()
              )
        console.log("Background task scheduled successfully")
      } catch (bgError: any) {
        console.error("Error setting up background task:", bgError)
        // Continue anyway - return response even if background task fails to set up
      }
    } else {
      // Fallback: EdgeRuntime.waitUntil not available - log warning and return processing status
      console.warn("EdgeRuntime.waitUntil not available - background processing may not work")
      console.log("Returning response with processing status - client should wait for Realtime updates")
    }

    // Return 200 OK immediately - processing happens in background
    // Supabase functions.invoke treats 2xx as success
    console.log("Preparing to return response...")
    console.log("Response data:", JSON.stringify(response))
    
    try {
      const responseBody = JSON.stringify(response)
      console.log("Response body serialized, length:", responseBody.length)
      
      const httpResponse = new Response(responseBody, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      })
      
      console.log("Response created successfully")
      console.log("Response status:", httpResponse.status)
      console.log("Response headers:", Object.fromEntries(httpResponse.headers.entries()))
      
      return httpResponse
    } catch (responseError: any) {
      console.error("Error creating response:", responseError)
      // Fallback response if something goes wrong
      return new Response(
        JSON.stringify({ 
          error: "Failed to create response", 
          details: responseError.message,
          status: "error" 
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }
  } catch (error: any) {
    console.error("=== Edge Function Error ===")
    console.error("Error type:", error?.constructor?.name || typeof error)
    console.error("Error message:", error?.message || String(error))
    console.error("Error stack:", error?.stack || "No stack trace")
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
    
    // Ensure we always return a proper Response, even if error serialization fails
    try {
      const errorResponse = {
        error: error?.message || "Internal server error",
        details: error?.stack ? error.stack.split("\n").slice(0, 5).join("\n") : undefined,
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    } catch (responseError: any) {
      // Fallback if even error response creation fails
      console.error("Failed to create error response:", responseError)
      return new Response(
        "Internal server error",
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }
  }
})

