# Image Generator Architecture & User Workflow Analysis

**Generated**: 2026-01-06  
**Analysis Method**: Deep Thinking Protocol + v0 Architecture Review  
**v0 Chat**: [https://v0.app/chat/h6NSfk3gF8Z](https://v0.app/chat/h6NSfk3gF8Z)

## 📋 Overview

The KINK-IT image generation system is a sophisticated, multi-component architecture that enables users to generate AI avatars through a controlled, prop-based interface. The system enforces consistency through predefined options while providing real-time feedback and progress tracking.

**Key Differentiators:**
- ✅ **Controlled Props System**: All inputs use predefined dropdowns/toggles (no free text)
- ✅ **Automatic Prompt Synthesis**: Prompts are auto-generated from props (no manual editing)
- ✅ **DALL-E 3 Optimization**: Built-in prompt optimization for consistent Bara style
- ✅ **Dual Entry Points**: Standalone playground + KINKSTER creation wizard
- ✅ **Real-time Progress**: Supabase Realtime for live generation updates
- ✅ **Production Ready**: Edge Functions with background task processing

## 🏗️ Component Architecture

### Core Components

```
Image Generation System
├── Entry Points
│   ├── /playground (Standalone Generator)
│   └── /kinksters/create (KINKSTER Creation Wizard)
│
├── UI Components
│   ├── PropsSelector (Tabbed prop selection)
│   ├── PromptPreview (Read-only synthesized prompt)
│   ├── GenerationPanel (Main playground UI)
│   ├── AvatarGenerationStep (Wizard step)
│   └── SavePromptDialog (Prompt persistence)
│
├── Hooks
│   ├── use-avatar-generation (KINKSTER creation)
│   └── use-playground-generation (Standalone)
│
├── Utilities
│   ├── props.ts (Prop structures & validation)
│   ├── props-options.ts (Predefined options)
│   ├── shared-utils.ts (Prompt synthesis)
│   └── prompt-optimizer.ts (DALL-E 3 optimization)
│
└── Backend
    ├── Edge Function (generate-kinkster-avatar)
    └── API Routes (fallback/sync generation)
```

### Component Hierarchy

```
Playground Page (/playground)
└── GenerationPanel
    ├── PropsSelector
    │   ├── Tabs (Physical, Clothing, Accessories, Background)
    │   ├── Select dropdowns (predefined options)
    │   ├── Multi-select button groups (clothing)
    │   └── Checkboxes (kink accessories)
    ├── PromptPreview
    │   ├── Collapsible prompt display
    │   ├── Word count badge
    │   └── Save button → SavePromptDialog
    ├── Generate Button
    ├── Progress Indicator
    └── Image Display

KINKSTER Creation Wizard
└── AvatarGenerationStep
    ├── PropsSelector (same as above)
    ├── PromptPreview (same as above)
    ├── Generate Button
    ├── Progress Indicator
    └── Avatar Preview
```

## 🔄 User Workflow

### Workflow 1: Standalone Playground

1. **User navigates to `/playground`**
   - `GenerationPanel` component loads
   - Initializes with `KINKY_DEFAULT_PROPS`

2. **User selects props** (`PropsSelector`)
   - **Physical Tab**: Height, Weight, Build, Hair, Beard, Eyes, Skin Tone
   - **Clothing Tab**: Top, Bottom, Footwear, Accessories (multi-select)
   - **Accessories Tab**: Collars, Pup Mask, Locks, Long Socks, Harness, Leather items
   - **Background Tab**: Type (solid/gradient/environment), Color, Environment
   - Each selection updates `props` state immediately

3. **Prompt auto-synthesizes** (`PromptPreview`)
   - `useEffect` watches `props` changes
   - Calls `buildAvatarPrompt(characterData)` with current props
   - Displays synthesized prompt (read-only)
   - Shows word count badge when collapsed

4. **User can save prompt** (optional)
   - Clicks "Save" button → Opens `SavePromptDialog`
   - Enters prompt name
   - Saves to `saved_prompts` table in Supabase
   - Can be loaded later for reuse

5. **User clicks "Generate Avatar"**
   - `handleGenerate` function called
   - Calls `generateAvatar(characterData, props)` from `use-playground-generation`
   - Sets `isGenerating` state to `true`
   - Shows progress indicator

6. **Backend processing** (Edge Function)
   - `generate-kinkster-avatar` Edge Function invoked
   - Returns immediately with `status: "processing"`
   - Background task starts:
     - Calls OpenAI DALL-E 3 API
     - Downloads generated image
     - Uploads to Supabase Storage
     - Broadcasts progress via Realtime

7. **Real-time progress updates**
   - Hook subscribes to Realtime channel: `user:${userId}:avatar`
   - Receives broadcasts: `generating` → `downloading` → `uploading` → `completed`
   - Updates `progress` state
   - Shows progress bar and status messages

8. **Completion**
   - Receives `completed` event with `storage_url`
   - Calls `onComplete` callback
   - Updates `avatarUrl` state
   - Displays generated image
   - Shows "Regenerate" button

### Workflow 2: KINKSTER Creation Wizard

1. **User navigates to `/kinksters/create`**
   - Goes through wizard steps (Name, Personality, etc.)
   - Reaches "Avatar Generation" step

2. **User selects props** (same as Playground)
   - Uses same `PropsSelector` component
   - Props are specific to the KINKSTER being created

3. **Prompt preview** (same as Playground)
   - Shows synthesized prompt based on KINKSTER data + props

4. **User generates avatar**
   - Calls `generateAvatar` from `use-avatar-generation`
   - If `kinksterId` exists, subscribes to `kinkster:${kinksterId}:avatar`
   - Otherwise subscribes to `user:${userId}:avatar`

5. **Completion handling**
   - `onComplete` callback:
     - Sets `avatarUrl` state
     - Updates wizard data with `avatar_url` and `avatar_prompt`
     - Allows user to proceed to next step

## 📊 Data Flow

### Props Selection Flow

```
User Interaction
    ↓
PropsSelector Component
    ↓ (setProps)
React State (props)
    ↓ (useEffect)
CharacterData.props
    ↓
PromptPreview Component
    ↓ (buildAvatarPrompt)
Synthesized Prompt (string)
    ↓ (display)
UI Display
```

### Generation Flow

```
User Clicks Generate
    ↓
generateAvatar Hook Function
    ↓ (supabase.functions.invoke)
Edge Function (generate-kinkster-avatar)
    ↓ (immediate 200 response)
Background Task Starts
    ├─→ OpenAI DALL-E 3 API
    ├─→ Download Image
    ├─→ Upload to Storage
    └─→ Broadcast Progress (Realtime)
         ↓
Realtime Channel Subscription
    ↓ (onComplete callback)
Component State Update
    ↓
UI Re-render with Image
```

### State Management

```
Component Level State:
- props: GenerationProps (controlled by PropsSelector)
- avatarUrl: string (set on completion)
- progress: AvatarGenerationProgress (from Realtime)
- isGenerating: boolean (tracks generation status)
- previewPrompt: string (synthesized prompt)

Hook Level State:
- progress: AvatarGenerationProgress
- isGenerating: boolean

Backend State:
- Edge Function: Background task state
- Supabase Storage: Generated images
- Database: saved_prompts table
```

## 🔌 Integration Points

### Frontend → Backend

1. **Props Selection** → `props` state → `characterData.props`
2. **Generate Action** → `generateAvatar()` → Edge Function invocation
3. **Progress Updates** → Realtime subscription → `progress` state
4. **Completion** → `onComplete` callback → UI update

### Backend → Frontend

1. **Edge Function** → Immediate response (`status: "processing"`)
2. **Background Task** → OpenAI API → Image generation
3. **Realtime Broadcasts** → Progress updates → Hook state
4. **Storage URL** → Completion event → Component state

### Data Persistence

- **Props**: Stored in component state (not persisted)
- **Prompts**: Can be saved to `saved_prompts` table
- **Images**: Stored in Supabase Storage (`kinkster-avatars` bucket)
- **KINKSTER Data**: Avatar URL stored in `kinksters` table

## 🎨 UI/UX Patterns

### Controlled Inputs
- All props use predefined options (no free text)
- Dropdowns for single-select (height, weight, etc.)
- Multi-select button groups for clothing
- Checkboxes for boolean options (collars, harness, etc.)

### Real-time Feedback
- Progress indicator shows current stage
- Progress bar animates based on status
- Toast notifications for success/error
- Loading states during generation

### Prompt Transparency
- Read-only prompt preview
- Word count display
- Save functionality for reuse
- Collapsible to save screen space

### Error Handling
- Validation errors shown inline
- API errors displayed via toast
- Realtime connection errors logged
- Fallback to sync API if Edge Function fails

## 🔐 Security & Validation

### Props Validation
- All options validated against `props-options.ts`
- TypeScript types enforce structure
- `validateProps()` function checks combinations
- Warnings for conflicting options

### Access Control
- User authentication required
- RLS policies on storage bucket
- User-specific storage paths
- Realtime channel authorization

## 📈 Performance Optimizations

1. **Background Processing**: Edge Function returns immediately
2. **Realtime Updates**: Efficient progress broadcasting
3. **Image Optimization**: Supabase Storage CDN delivery
4. **Prompt Caching**: Saved prompts reduce regeneration
5. **Lazy Loading**: Components load on demand

## 🚀 Future Enhancements

Potential improvements based on architecture:
- Load saved prompts in PropsSelector
- Batch generation support
- Image editing/regeneration with variations
- Template system for common prop combinations
- Analytics on prop usage patterns
- Notion integration for prompt tracking

---

## 📐 Visual Component Hierarchy (Actual Implementation)

```
Application Root
├── /playground (Standalone Generator)
│   └── PlaygroundPage
│       └── GenerationPanel
│           ├── Mode Selection (Single/Batch/Template)
│           ├── TemplateSelector (if template mode)
│           ├── Character Data Editor (Name, Archetype, Appearance, Personality)
│           ├── PropsSelector
│           │   └── Tabs
│           │       ├── Physical (Height, Weight, Build, Hair, Beard, Eyes, Skin Tone)
│           │       ├── Clothing (Top[], Bottom[], Footwear[], Accessories[])
│           │       ├── Accessories (Collars, Pup Mask, Locks, Long Socks, Harness, Leather[])
│           │       └── Background (Type, Color, Environment)
│           ├── StylePresets
│           ├── PromptBuilder (wraps PromptPreview)
│           │   └── PromptPreview
│           │       ├── Collapsible prompt display
│           │       ├── Word count badge
│           │       ├── Copy button
│           │       └── Save button → SavePromptDialog
│           ├── Generation Options (Size, Quality)
│           ├── Generate Button
│           ├── Progress Indicator
│           └── Generated Image Display
│
└── /kinksters/create (KINKSTER Creation Wizard)
    └── KinksterCreationWizard
        └── AvatarGenerationStep
            ├── PropsSelector (same as above)
            ├── PromptPreview (same as above)
            ├── Generate Button
            ├── Progress Indicator
            └── Avatar Preview
```

## 🔄 Complete Data Flow (Step-by-Step)

### Phase 1: Props Selection

```
User Interaction
    ↓
PropsSelector Component
    ├─ User selects dropdown (e.g., Height: "tall")
    ├─ User toggles checkbox (e.g., Collars: true)
    └─ User multi-selects clothing (e.g., Top: ["tactical vest", "open vest"])
    ↓
onPropsChange Callback
    ↓
Component State Update (props state)
    ↓
useEffect Hook (watches props)
    ↓
characterData.props Updated
    ↓
PromptPreview Component
    ├─ useEffect watches characterData changes
    ├─ Calls buildAvatarPrompt(characterData)
    │   ├─ Extracts props from characterData
    │   ├─ Calls propsToPrompt(props)
    │   ├─ Combines with character data
    │   ├─ Applies AVATAR_GENERATION_PRESETS (Bara style)
    │   └─ Calls optimizePromptForDALLE3(prompt)
    └─ Updates synthesizedPrompt state
    ↓
UI Display (read-only prompt)
```

### Phase 2: Image Generation

```
User Clicks "Generate Avatar"
    ↓
handleGenerate Function
    ├─ Validates characterData.name exists
    ├─ Ensures props are included in characterData
    └─ Calls generateAvatar(characterData, props)
    ↓
Hook: use-avatar-generation or use-playground-generation
    ├─ Sets isGenerating = true
    ├─ Sets progress = { status: "generating", message: "Starting..." }
    └─ Calls supabase.functions.invoke("generate-kinkster-avatar")
        │
        ├─ Request Payload:
        │   {
        │     user_id: string,
        │     kinkster_id?: string,
        │     character_data: CharacterData (includes props),
        │   }
        │
        ↓
    Edge Function: generate-kinkster-avatar
        ├─ Validates user_id, character_data
        ├─ Builds prompt: buildAvatarPrompt(character_data)
        │   └─ Automatically optimized for DALL-E 3
        ├─ Returns immediately: { status: "processing", prompt: "...", ... }
        └─ Background Task Starts (EdgeRuntime.waitUntil)
            │
            ├─ Step 1: Broadcast "generating" → Realtime
            │
            ├─ Step 2: Call OpenAI DALL-E 3 API
            │   ├─ POST https://api.openai.com/v1/images/generations
            │   ├─ Body: { model: "dall-e-3", prompt: "...", size: "1024x1024" }
            │   └─ Response: { data: [{ url: "https://..." }] }
            │
            ├─ Step 3: Broadcast "downloading" → Realtime
            │
            ├─ Step 4: Download Image
            │   ├─ fetch(imageUrl)
            │   ├─ Convert to Uint8Array buffer
            │   └─ Determine file extension
            │
            ├─ Step 5: Upload to Supabase Storage
            │   ├─ Bucket: kinkster-avatars
            │   ├─ Path: {user_id}/kinksters/avatar_{timestamp}.{ext}
            │   └─ Get public URL (transformed for local/production)
            │
            ├─ Step 6: Broadcast "uploading" → Realtime
            │
            ├─ Step 7: Update Database (if kinkster_id exists)
            │   └─ UPDATE kinksters SET avatar_url = ...
            │
            └─ Step 8: Broadcast "completed" → Realtime
                └─ Payload: { storage_url, storage_path }
    ↓
Realtime Subscription (Client)
    ├─ Channel: user:{userId}:avatar or kinkster:{kinksterId}:avatar
    ├─ Event: "avatar_generation_progress"
    └─ Receives broadcasts:
        ├─ { status: "generating", message: "..." }
        ├─ { status: "downloading", message: "..." }
        ├─ { status: "uploading", message: "..." }
        └─ { status: "completed", storage_url: "...", storage_path: "..." }
    ↓
Hook State Update
    ├─ setProgress(progressData)
    ├─ If completed: setIsGenerating(false), call onComplete(storage_url)
    └─ If error: setIsGenerating(false), call onError(error)
    ↓
Component Re-render
    ├─ Progress indicator updates
    ├─ Progress bar animates
    └─ On completion: avatarUrl state updated, image displayed
```

## 🎯 User Workflow Patterns (Actual Implementation)

### Pattern 1: Standalone Playground Workflow

```
1. Navigate to /playground/image-generation
   └─ GenerationPanel loads with KINKY_DEFAULT_PROPS

2. Select Generation Mode
   ├─ Single Image (default)
   ├─ Batch Generation (coming soon)
   └─ From Template

3. (Optional) Select Template
   └─ TemplateSelector → Updates characterData

4. Edit Character Data (optional)
   ├─ Name
   ├─ Archetype
   ├─ Appearance Description
   └─ Personality Traits

5. Select Props (PropsSelector)
   ├─ Physical Tab: Height, Weight, Build, Hair, Beard, Eyes, Skin Tone
   ├─ Clothing Tab: Top[], Bottom[], Footwear[], Accessories[]
   ├─ Accessories Tab: Collars, Pup Mask, Locks, Long Socks, Harness, Leather[]
   └─ Background Tab: Type, Color, Environment

6. Prompt Auto-Synthesizes (PromptPreview)
   ├─ Watches props changes
   ├─ Calls buildAvatarPrompt()
   ├─ Applies optimization
   └─ Displays read-only prompt

7. (Optional) Save Prompt
   └─ SavePromptDialog → Saves to saved_prompts table

8. Configure Generation Options
   ├─ Image Size: 1024×1024, 1792×1024, or 1024×1792
   └─ Quality: Standard or HD

9. Click "Generate Image"
   └─ Calls use-playground-generation.generate()

10. Watch Real-time Progress
    ├─ Progress bar updates
    ├─ Status messages: "Generating..." → "Downloading..." → "Uploading..."
    └─ Toast notifications

11. View Generated Image
    ├─ Image displays in panel
    ├─ "Generate Another" button appears
    └─ "Reset" button available
```

### Pattern 2: KINKSTER Creation Wizard Workflow

```
1. Navigate to /kinksters/create
   └─ KinksterCreationWizard starts

2. Complete Previous Steps
   ├─ Step 1: Basic Info (Name, Role, Archetype)
   ├─ Step 2: Appearance
   ├─ Step 3: Personality
   └─ Step 4: Stats

3. Reach Avatar Generation Step
   └─ AvatarGenerationStep component loads

4. Select Props (same as Playground)
   └─ PropsSelector with tabs

5. Prompt Preview Updates
   └─ Shows synthesized prompt based on KINKSTER data + props

6. Click "Generate Avatar"
   └─ Calls use-avatar-generation.generateAvatar()

7. Real-time Progress
   └─ Same as Playground workflow

8. On Completion
   ├─ Avatar URL set in wizard state
   ├─ Prompt saved to wizard state
   └─ "Next" button enabled

9. Proceed to Review Step
   └─ Avatar included in final KINKSTER data
```

## 🔌 Integration Points (Actual Implementation)

### Frontend → Backend

| Component | Action | Endpoint/Function | Payload |
|-----------|--------|------------------|---------|
| `use-avatar-generation` | Generate | `supabase.functions.invoke("generate-kinkster-avatar")` | `{ user_id, kinkster_id?, character_data, props }` |
| `use-playground-generation` | Generate | `POST /api/kinksters/avatar/generate` | `{ characterData, size, quality, props }` |
| `SavePromptDialog` | Save | `supabase.from("saved_prompts").insert()` | `{ name, prompt, props, character_data }` |
| `PromptPreview` | Synthesize | `buildAvatarPrompt(characterData)` (client-side) | `CharacterData` |

### Backend → Frontend

| Source | Event | Channel | Payload |
|--------|-------|---------|---------|
| Edge Function | Progress | `user:{userId}:avatar` or `kinkster:{kinksterId}:avatar` | `{ status, message, timestamp, storage_url?, storage_path? }` |
| Edge Function | Completion | Same channel | `{ status: "completed", storage_url, storage_path }` |
| Edge Function | Error | Same channel | `{ status: "error", message, error }` |

### Storage & Persistence

| Data | Storage | Location |
|------|---------|----------|
| Generated Images | Supabase Storage | `kinkster-avatars/{user_id}/kinksters/avatar_{timestamp}.{ext}` |
| Saved Prompts | PostgreSQL | `saved_prompts` table |
| KINKSTER Avatars | PostgreSQL | `kinksters.avatar_url` column |
| Props State | React State | Component memory (not persisted) |

## 🎨 UI Component Details

### PropsSelector Component Structure

```typescript
PropsSelector
├─ Card Container
├─ CardHeader
│   ├─ Title: "Customize Appearance"
│   ├─ Description: "Select props to customize your character"
│   └─ Reset Button (resets to KINKY_DEFAULT_PROPS)
├─ Tabs Component
│   ├─ TabsList
│   │   ├─ Physical Tab Trigger
│   │   ├─ Clothing Tab Trigger
│   │   ├─ Accessories Tab Trigger
│   │   └─ Background Tab Trigger
│   │
│   ├─ Physical TabContent
│   │   ├─ Height Select
│   │   ├─ Weight Select
│   │   ├─ Build Select
│   │   ├─ Hair Select
│   │   ├─ Beard Select
│   │   ├─ Eyes Select
│   │   └─ Skin Tone Select
│   │
│   ├─ Clothing TabContent
│   │   ├─ Top Multi-Select Button Group
│   │   ├─ Bottom Multi-Select Button Group
│   │   ├─ Footwear Multi-Select Button Group
│   │   └─ Accessories Multi-Select Button Group
│   │
│   ├─ Accessories TabContent
│   │   ├─ Collars Checkbox
│   │   ├─ Pup Mask Checkbox
│   │   ├─ Locks Checkbox
│   │   ├─ Long Socks Checkbox
│   │   ├─ Harness Checkbox
│   │   └─ Leather Multi-Select Button Group
│   │
│   └─ Background TabContent
│       ├─ Type Select (solid/gradient/environment/minimal)
│       ├─ Color Select (if solid/gradient)
│       └─ Environment Select (if environment)
└─ State Management
    └─ Props state passed to parent via onPropsChange
```

### PromptPreview Component Structure

```typescript
PromptPreview
├─ Card Container
├─ CardHeader
│   ├─ Collapsible Trigger
│   │   ├─ Sparkles Icon
│   │   ├─ Title: "Synthesized Prompt"
│   │   ├─ Word Count Badge (when collapsed)
│   │   └─ Chevron Icon
│   ├─ Optimization Badge (when optimizing)
│   ├─ Bara Style Badge (if detected)
│   └─ Save Button
├─ CollapsibleContent
│   ├─ Prompt Display (read-only)
│   │   └─ Monospace font, scrollable
│   ├─ Statistics Bar
│   │   ├─ Word Count
│   │   ├─ Character Count
│   │   ├─ Part Count
│   │   └─ Copy Button
│   └─ Info Box
│       └─ Explanation of auto-synthesis
└─ SavePromptDialog (conditional)
    ├─ Name Input
    ├─ Prompt Preview
    └─ Save/Cancel Buttons
```

### GenerationPanel Component Structure

```typescript
GenerationPanel
├─ Mode Selection Card
│   ├─ Single Image Button
│   ├─ Batch Generation Button (disabled)
│   └─ From Template Button
├─ TemplateSelector (conditional, if template mode)
├─ Character Data Editor Card
│   ├─ Name Input
│   ├─ Archetype Input
│   ├─ Appearance Description Textarea
│   └─ Personality Traits Input
├─ PropsSelector Card
├─ StylePresets Card
├─ PromptBuilder Card (wraps PromptPreview)
├─ Generation Options Card
│   ├─ Image Size Select
│   └─ Quality Select
└─ Generation Card
    ├─ Generate Button (when idle)
    ├─ Progress Indicator (when generating)
    │   ├─ Progress Bar
    │   └─ Status Message
    ├─ Error Display (if error)
    └─ Generated Image Display (when complete)
        ├─ Image Component (Next.js Image)
        ├─ Generate Another Button
        └─ Reset Button
```

## 📊 State Management Flow

### Component-Level State

```typescript
// GenerationPanel
const [mode, setMode] = useState<"single" | "batch" | "template">("single")
const [characterData, setCharacterData] = useState<CharacterData>(...)
const [props, setProps] = useState<GenerationProps>(KINKY_DEFAULT_PROPS)
const [size, setSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024")
const [quality, setQuality] = useState<"standard" | "hd">("standard")

// PropsSelector
const [activeTab, setActiveTab] = useState<"physical" | "clothing" | "accessories" | "background">("physical")

// PromptPreview
const [synthesizedPrompt, setSynthesizedPrompt] = useState<string>("")
const [isOptimizing, setIsOptimizing] = useState(false)
const [isOpen, setIsOpen] = useState(false)
const [showSaveDialog, setShowSaveDialog] = useState(false)

// Hook State (use-avatar-generation)
const [progress, setProgress] = useState<AvatarGenerationProgress | null>(null)
const [isGenerating, setIsGenerating] = useState(false)
```

### State Synchronization

```
PropsSelector
    ↓ (onPropsChange)
Parent Component (props state)
    ↓ (useEffect)
characterData.props updated
    ↓ (useEffect in PromptPreview)
buildAvatarPrompt(characterData)
    ↓
synthesizedPrompt state updated
    ↓
UI displays updated prompt
```

## 🔍 Key Implementation Details

### Prompt Synthesis Process

1. **Props Selection** → User selects from predefined options
2. **Props Validation** → `validateProps()` checks against `props-options.ts`
3. **Props to Prompt** → `propsToPrompt()` converts props to prompt parts
4. **Character Data Merge** → Props combined with character data
5. **Style Presets** → Bara style presets applied
6. **Prompt Optimization** → `optimizePromptForDALLE3()` refines prompt
7. **Final Prompt** → Displayed in PromptPreview (read-only)

### Realtime Subscription Pattern

```typescript
// Channel naming
const topic = kinksterId
  ? `kinkster:${kinksterId}:avatar`
  : `user:${userId}:avatar`

// Channel configuration
const channel = supabase.channel(topic, {
  config: {
    broadcast: { self: true, ack: true },
    private: true, // Required for RLS
  },
})

// Event subscription
channel.on("broadcast", { event: "avatar_generation_progress" }, (payload) => {
  const progressData = payload.payload as AvatarGenerationProgress
  // Handle progress updates
})
```

### URL Transformation Logic

```typescript
// Edge Function (downloadAndStoreImage)
if (supabaseUrl.includes("kong:8000")) {
  // Local dev: Transform to public URL
  publicApiUrl = "https://127.0.0.1:55321"
} else if (supabaseUrl.includes("supabase.co")) {
  // Production: Use as-is
  publicApiUrl = supabaseUrl
}

// Client Component (fallback)
if (storageUrl.includes("kong:8000")) {
  // Transform internal URL to public
  transformedUrl = `${NEXT_PUBLIC_SUPABASE_URL}${urlPath}`
}
```

## 🎯 Comparison: v0 Architecture vs Actual Implementation

| Aspect | v0 Suggested | Actual Implementation | Status |
|--------|--------------|----------------------|--------|
| State Management | Zustand/Jotai | React useState + useEffect | ✅ Simpler, works well |
| Props System | Generic prop types | Predefined options (props-options.ts) | ✅ More controlled |
| Prompt Editing | Editable textarea | Read-only auto-synthesis | ✅ Locked in (as requested) |
| WebSocket | Generic WebSocket | Supabase Realtime | ✅ Integrated |
| Component Layout | 3-column grid | Vertical stack with cards | ✅ Better mobile UX |
| Image Storage | Generic CDN | Supabase Storage | ✅ Integrated |
| Prompt Optimization | AI SDK generateText | Custom optimizer (DALL-E 3 specific) | ✅ More targeted |

## 📝 Notes from v0 Analysis

The v0 chat provided excellent architectural insights, but our actual implementation differs in several key ways:

1. **More Controlled**: We use predefined options instead of free-form inputs
2. **Simpler State**: React state instead of Zustand (sufficient for our needs)
3. **Locked Prompts**: No manual editing (auto-synthesis only)
4. **Production Ready**: Edge Functions with background tasks
5. **Integrated**: Uses Supabase throughout (Storage, Realtime, Database)

The v0 architecture is more generic and flexible, while ours is more specialized and controlled—perfect for ensuring consistency and brand alignment.

