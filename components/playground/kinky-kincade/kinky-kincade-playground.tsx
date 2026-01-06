/**
 * Kinky Kincade Playground - Main Component
 * Combines our controlled props system with nano banana pro's flexible generation
 */

"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { InputSection } from "./input-section"
import { OutputSection } from "./output-section"
import { GenerationHistory } from "./generation-history"
import { FullscreenViewer } from "./fullscreen-viewer"
import { GlobalDropZone } from "./global-drop-zone"
import { useGenerationHistory } from "./hooks/use-generation-history"
import { useImageUpload } from "./hooks/use-image-upload"
import { useKinkyKincadeGeneration } from "./hooks/use-kinky-kincade-generation"
import { DEFAULT_ASPECT_RATIO } from "./constants"
import type { Generation } from "./types"
import type { GenerationProps } from "@/lib/image/props"
import { KINKY_DEFAULT_PROPS } from "@/lib/image/props"
import { createClient } from "@/lib/supabase/client"

export function KinkyKincadePlayground() {
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO)
  const [useUrls, setUseUrls] = useState(false)
  const [mode, setMode] = useState<"props" | "prompt">("props")
  const [props, setProps] = useState<GenerationProps>(KINKY_DEFAULT_PROPS)
  const [kinkItMode, setKinkItMode] = useState(true) // KINK IT Mode: Apply bara style normalization (default ON)
  const [selectedModel, setSelectedModel] = useState<"dalle-3" | "gemini-3-pro">("dalle-3")
  const [dropZoneHover, setDropZoneHover] = useState<1 | 2 | null>(null)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState("")
  const [apiKeyMissing, setApiKeyMissing] = useState(false)
  const [historySidebarOpen, setHistorySidebarOpen] = useState(true) // Right sidebar for history (default open)
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Initialize hooks
  const {
    generations,
    setGenerations,
    addGeneration,
    deleteGeneration,
    isLoading: historyLoading,
  } = useGenerationHistory((message, type) => {
    if (type === "success") {
      toast.success(message)
    } else {
      toast.error(message)
    }
  })

  const {
    image1,
    image1Preview,
    image1Url,
    image2,
    image2Preview,
    image2Url,
    isConvertingHeic,
    heicProgress,
    handleImageUpload,
    handleUrlChange,
    clearImage,
    showToast,
  } = useImageUpload()

  // Set toast ref
  useEffect(() => {
    showToast.current = (message: string, type?: "success" | "error") => {
      if (type === "success") {
        toast.success(message)
      } else {
        toast.error(message)
      }
    }
  }, [showToast])

  const {
    selectedGenerationId,
    setSelectedGenerationId,
    imageLoaded,
    setImageLoaded,
    generateImage,
    cancelGeneration,
    loadGeneratedAsInput,
  } = useKinkyKincadeGeneration({
    prompt,
    aspectRatio,
    image1,
    image2,
    image1Url,
    image2Url,
    useUrls,
    generations,
    setGenerations,
    addGeneration,
    onToast: (message, type) => {
      if (type === "success") {
        toast.success(message)
      } else {
        toast.error(message)
      }
    },
    onImageUpload: handleImageUpload,
    onApiKeyMissing: () => setApiKeyMissing(true),
    props: mode === "props" ? props : undefined,
    model: selectedModel,
    kinkItMode,
  })

  const selectedGeneration = generations.find((g) => g.id === selectedGenerationId) || generations[0]
  const isLoading = generations.some((g) => g.status === "loading")
  const hasImages = useUrls ? image1Url || image2Url : image1 || image2
  const canGenerate =
    (mode === "prompt" ? prompt.trim().length > 0 : true) &&
    (hasImages ? (useUrls ? image1Url : image1) : true)

  // Check API key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/check-api-key")
        const data = await response.json()
        if (!data.configured) {
          setApiKeyMissing(true)
        }
      } catch (error) {
        console.error("Error checking API key:", error)
      }
    }

    checkApiKey()
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTyping = activeElement?.tagName === "TEXTAREA" || activeElement?.tagName === "INPUT"

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isTyping) {
        e.preventDefault()
        if (canGenerate && !isLoading) {
          handleGenerate()
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "c" && !isTyping && selectedGeneration?.imageUrl) {
        e.preventDefault()
        handleCopy()
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "d" && !isTyping && selectedGeneration?.imageUrl) {
        e.preventDefault()
        handleDownload()
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "u" && !isTyping && selectedGeneration?.imageUrl) {
        e.preventDefault()
        loadGeneratedAsInput()
      }

      if (e.key === "Escape" && showFullscreen) {
        setShowFullscreen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [canGenerate, isLoading, selectedGeneration, showFullscreen])

  const handleGenerate = useCallback(() => {
    generateImage({
      prompt: mode === "prompt" ? prompt : undefined,
      aspectRatio,
      image1,
      image2,
      image1Url,
      image2Url,
      useUrls,
      props: mode === "props" ? props : undefined,
      model: selectedModel,
    })
  }, [
    generateImage,
    prompt,
    aspectRatio,
    image1,
    image2,
    image1Url,
    image2Url,
    useUrls,
    props,
    mode,
    selectedModel,
  ])

  const handleClearAll = useCallback(() => {
    setPrompt("")
    clearImage(1)
    clearImage(2)
    if (image1Url) handleUrlChange("", 1)
    if (image2Url) handleUrlChange("", 2)
    setProps(KINKY_DEFAULT_PROPS)
  }, [clearImage, handleUrlChange, image1Url, image2Url])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      if (canGenerate && !isLoading) {
        handleGenerate()
      }
    }
  }, [canGenerate, isLoading, handleGenerate])

  const handlePromptPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) {
          handleImageUpload(file, 1)
          toast.success("Image pasted into Input 1")
        }
      }
    }
  }, [handleImageUpload])

  const handleImageFullscreen = useCallback((url: string) => {
    setFullscreenImageUrl(url)
    setShowFullscreen(true)
  }, [])

  const handleOpenFullscreen = useCallback(() => {
    if (selectedGeneration?.imageUrl) {
      handleImageFullscreen(selectedGeneration.imageUrl)
    }
  }, [selectedGeneration, handleImageFullscreen])

  const handleCopy = useCallback(async () => {
    if (!selectedGeneration?.imageUrl) return

    try {
      const response = await fetch(selectedGeneration.imageUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ])
      toast.success("Image copied to clipboard")
    } catch (error) {
      console.error("Error copying image:", error)
      toast.error("Failed to copy image")
    }
  }, [selectedGeneration])

  const handleDownload = useCallback(async () => {
    if (!selectedGeneration?.imageUrl) return

    try {
      const response = await fetch(selectedGeneration.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `kinky-kincade-${selectedGeneration.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success("Image downloaded")
    } catch (error) {
      console.error("Error downloading image:", error)
      toast.error("Failed to download image")
    }
  }, [selectedGeneration])

  const handleOpenInNewTab = useCallback(() => {
    if (selectedGeneration?.imageUrl) {
      window.open(selectedGeneration.imageUrl, "_blank")
    }
  }, [selectedGeneration])

  const handleNavigateFullscreen = useCallback(
    (direction: "prev" | "next") => {
      const completedGenerations = generations.filter((g) => g.status === "complete" && g.imageUrl)
      const currentIndex = completedGenerations.findIndex((g) => g.id === selectedGenerationId)

      if (currentIndex === -1) return

      let newIndex
      if (direction === "prev") {
        newIndex = currentIndex - 1
      } else {
        newIndex = currentIndex + 1
      }

      if (newIndex >= 0 && newIndex < completedGenerations.length) {
        const newGeneration = completedGenerations[newIndex]
        setSelectedGenerationId(newGeneration.id)
        setFullscreenImageUrl(newGeneration.imageUrl!)
      }
    },
    [generations, selectedGenerationId, setSelectedGenerationId]
  )

  const handleGlobalDrop = useCallback(
    (e: React.DragEvent, slot?: 1 | 2) => {
      e.preventDefault()
      e.stopPropagation()
      setDropZoneHover(null)

      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file, slot || 1)
      }
    },
    [handleImageUpload]
  )

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-black text-white">
      {/* Global Drop Zone */}
      {dropZoneHover !== null && (
        <GlobalDropZone
          dropZoneHover={dropZoneHover}
          onSetDropZoneHover={setDropZoneHover}
          onDrop={handleGlobalDrop}
        />
      )}

      {/* Main Layout */}
      <div className="flex flex-1 min-w-0">
        {/* Left Panel - Input */}
        <div className="flex flex-col w-full md:w-2/5 border-r border-gray-800/50 p-4 overflow-hidden bg-black/30 backdrop-blur-xl">
          <InputSection
            prompt={prompt}
            setPrompt={setPrompt}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            useUrls={useUrls}
            setUseUrls={setUseUrls}
            image1Preview={image1Preview}
            image2Preview={image2Preview}
            image1Url={image1Url}
            image2Url={image2Url}
            isConvertingHeic={isConvertingHeic}
            canGenerate={canGenerate}
            hasImages={hasImages}
            onGenerate={handleGenerate}
            onClearAll={handleClearAll}
            onImageUpload={handleImageUpload}
            onUrlChange={handleUrlChange}
            onClearImage={clearImage}
            onKeyDown={handleKeyDown}
            onPromptPaste={handlePromptPaste}
            onImageFullscreen={handleImageFullscreen}
            promptTextareaRef={promptTextareaRef}
            props={props}
            onPropsChange={setProps}
            mode={mode}
            setMode={setMode}
            kinkItMode={kinkItMode}
            onKinkItModeChange={setKinkItMode}
          />
        </div>

        {/* Right Panel - Output */}
        <div className="hidden md:flex flex-col w-3/5 border-l border-gray-800/50 p-4 overflow-hidden bg-black/30 backdrop-blur-xl">
          <OutputSection
            selectedGeneration={selectedGeneration}
            generations={generations}
            selectedGenerationId={selectedGenerationId}
            setSelectedGenerationId={setSelectedGenerationId}
            isConvertingHeic={isConvertingHeic}
            heicProgress={heicProgress}
            imageLoaded={imageLoaded}
            setImageLoaded={setImageLoaded}
            onCancelGeneration={cancelGeneration}
            onDeleteGeneration={deleteGeneration}
            onOpenFullscreen={handleOpenFullscreen}
            onLoadAsInput={loadGeneratedAsInput}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onOpenInNewTab={handleOpenInNewTab}
          />
        </div>
      </div>

      {/* Generation History Sidebar - Collapsible */}
      <div className="hidden lg:flex flex-col border-l border-gray-800/50 bg-black/30 backdrop-blur-xl transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: historySidebarOpen ? '288px' : '56px' }}
      >
        {/* Toggle Button */}
        <div className="flex-shrink-0 p-2 border-b border-gray-800/50">
          <button
            onClick={() => setHistorySidebarOpen(!historySidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-2 py-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded transition-colors"
            aria-label={historySidebarOpen ? "Collapse history" : "Expand history"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={historySidebarOpen ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
            {historySidebarOpen && (
              <span className="text-xs font-medium">History</span>
            )}
          </button>
        </div>

        {/* History Content */}
        {historySidebarOpen ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <GenerationHistory
              generations={generations}
              selectedId={selectedGenerationId || undefined}
              onSelect={setSelectedGenerationId}
              onCancel={cancelGeneration}
              onDelete={deleteGeneration}
              isLoading={historyLoading}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-2">
            <button
              onClick={() => setHistorySidebarOpen(true)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Expand history"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Viewer */}
      {showFullscreen && fullscreenImageUrl && (
        <FullscreenViewer
          imageUrl={fullscreenImageUrl}
          generations={generations}
          onClose={() => setShowFullscreen(false)}
          onNavigate={handleNavigateFullscreen}
        />
      )}

      {/* API Key Warning */}
      {apiKeyMissing && (
        <div className="fixed bottom-6 right-6 bg-zinc-900/95 border border-zinc-700/50 rounded-lg p-4 shadow-2xl max-w-sm z-50 backdrop-blur-sm">
          <div className="flex gap-3">
            <div className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5">⚠️</div>
            <div>
              <h3 className="text-zinc-200 font-semibold text-sm mb-1">AI Gateway API Key Required</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Gemini 3 Pro Image Preview requires an AI Gateway API key. DALL-E 3 will still work.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

