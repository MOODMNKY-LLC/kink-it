/**
 * Input Section Component for Kinky Kincade Playground
 * Combines our PropsSelector with nano banana pro's flexible input methods
 */

"use client"

import React, { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Trash2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageUploadBox } from "./image-upload-box"
import { MobilePropsSelector } from "./mobile-props-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { GenerationProps } from "@/lib/image/props"
import { ASPECT_RATIO_OPTIONS } from "./constants"

interface InputSectionProps {
  prompt: string
  setPrompt: (prompt: string) => void
  aspectRatio: string
  setAspectRatio: (ratio: string) => void
  useUrls: boolean
  setUseUrls: (use: boolean) => void
  image1Preview: string | null
  image2Preview: string | null
  image1Url: string
  image2Url: string
  isConvertingHeic: boolean
  canGenerate: boolean
  hasImages: boolean
  onGenerate: () => void
  onClearAll: () => void
  onImageUpload: (file: File, slot: 1 | 2) => Promise<void>
  onUrlChange: (url: string, slot: 1 | 2) => void
  onClearImage: (slot: 1 | 2) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onPromptPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
  onImageFullscreen: (url: string) => void
  promptTextareaRef: React.RefObject<HTMLTextAreaElement>
  props: GenerationProps
  onPropsChange: (props: GenerationProps) => void
  mode: "props" | "prompt" // "props" uses PropsSelector, "prompt" uses textarea
  setMode: (mode: "props" | "prompt") => void
  kinkItMode: boolean // KINK IT Mode: Apply bara style normalization
  onKinkItModeChange: (enabled: boolean) => void
}

export function InputSection({
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  useUrls,
  setUseUrls,
  image1Preview,
  image2Preview,
  image1Url,
  image2Url,
  isConvertingHeic,
  canGenerate,
  hasImages,
  onGenerate,
  onClearAll,
  onImageUpload,
  onUrlChange,
  onClearImage,
  onKeyDown,
  onPromptPaste,
  onImageFullscreen,
  promptTextareaRef,
  props,
  onPropsChange,
  mode,
  setMode,
  kinkItMode,
  onKinkItModeChange,
}: InputSectionProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="space-y-4 min-h-0 flex flex-col">
        {/* Top Controls Bar - Compact */}
        <div className="flex items-center justify-between gap-3 flex-shrink-0">
          {/* Mode Toggle - Compact */}
          <div className="inline-flex bg-black/30 backdrop-blur-md border border-gray-700/50 rounded-md p-0.5">
            <button
              onClick={() => setMode("props")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium transition-all rounded",
                mode === "props" ? "bg-white text-black" : "text-gray-400 hover:text-white"
              )}
            >
              Props
            </button>
            <button
              onClick={() => setMode("prompt")}
              className={cn(
                "px-2.5 py-1 text-xs font-medium transition-all rounded",
                mode === "prompt" ? "bg-white text-black" : "text-gray-400 hover:text-white"
              )}
            >
              Prompt
            </button>
          </div>
          
          {/* KINK IT Toggle */}
          <div className="flex items-center gap-2 px-2 py-1 bg-black/30 backdrop-blur-md border border-gray-700/50 rounded-md">
            <Sparkles className="h-3.5 w-3.5 text-gray-400" />
            <div className="flex flex-col">
              <Label htmlFor="kink-it-mode" className="text-xs font-medium cursor-pointer">
                KINK IT
              </Label>
              <span className="text-[10px] text-gray-500 leading-tight">Apply our unique style</span>
            </div>
            <Switch
              id="kink-it-mode"
              checked={kinkItMode}
              onCheckedChange={onKinkItModeChange}
              className="ml-1"
            />
          </div>

          {/* Aspect Ratio and Clear - Compact */}
          <div className="flex items-center gap-2">
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="w-20 h-8 px-2 bg-black/30 backdrop-blur-md border-gray-700/50 text-xs">
                <SelectValue placeholder="1:1" />
              </SelectTrigger>
              <SelectContent className="bg-black/80 backdrop-blur-xl border-gray-700/50">
                {ASPECT_RATIO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]">{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={onClearAll}
              disabled={!prompt.trim() && !hasImages}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Props Selector or Prompt Textarea */}
        {mode === "props" ? (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <MobilePropsSelector
              props={props}
              onPropsChange={onPropsChange}
              defaultToKinky={true}
            />
          </div>
        ) : (
          <Textarea
            ref={promptTextareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPromptPaste}
            placeholder="Describe your image concept... KINK IT will transform it into our universe."
            className="w-full flex-1 min-h-[120px] p-3 bg-black/30 backdrop-blur-md border border-gray-700/50 resize-none focus:outline-none focus:ring-1 focus:ring-white text-white text-sm rounded"
            style={{
              fontSize: "14px",
              WebkitUserSelect: "text",
              userSelect: "text",
            }}
          />
        )}

        {/* Image Upload Section */}
        <div className="space-y-3 flex-shrink-0">
          <div>
            <div className="flex items-center justify-between mb-2 select-none">
              <Label className="text-xs font-medium text-gray-400">Images (optional)</Label>
              <div className="inline-flex bg-black/30 backdrop-blur-md border border-gray-700/50 rounded-md p-0.5">
                <button
                  onClick={() => setUseUrls(false)}
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium transition-all rounded",
                    !useUrls ? "bg-white text-black" : "text-gray-400 hover:text-white"
                  )}
                >
                  Files
                </button>
                <button
                  onClick={() => setUseUrls(true)}
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium transition-all rounded",
                    useUrls ? "bg-white text-black" : "text-gray-400 hover:text-white"
                  )}
                >
                  URLs
                </button>
              </div>
            </div>

            {useUrls ? (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="url"
                    value={image1Url}
                    onChange={(e) => onUrlChange(e.target.value, 1)}
                    placeholder="Image URL 1"
                    className="w-full h-8 px-2 pr-7 bg-black/30 backdrop-blur-md border border-gray-700/50 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white rounded"
                  />
                  {image1Url && (
                    <button
                      onClick={() => onClearImage(1)}
                      className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={image2Url}
                    onChange={(e) => onUrlChange(e.target.value, 2)}
                    placeholder="Image URL 2"
                    className="w-full h-8 px-2 pr-7 bg-black/30 backdrop-blur-md border border-gray-700/50 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white rounded"
                  />
                  {image2Url && (
                    <button
                      onClick={() => onClearImage(2)}
                      className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="select-none">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <ImageUploadBox
                    imageNumber={1}
                    preview={image1Preview || ""}
                    onDrop={(e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith("image/")) {
                        onImageUpload(file, 1)
                      }
                    }}
                    onClear={() => onClearImage(1)}
                    onSelect={() => {
                      if (image1Preview) {
                        onImageFullscreen(image1Preview)
                      } else {
                        document.getElementById("file1")?.click()
                      }
                    }}
                  />
                  <input
                    id="file1"
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        onImageUpload(file, 1)
                        e.target.value = ""
                      }
                    }}
                  />

                  <ImageUploadBox
                    imageNumber={2}
                    preview={image2Preview || ""}
                    onDrop={(e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith("image/")) {
                        onImageUpload(file, 2)
                      }
                    }}
                    onClear={() => onClearImage(2)}
                    onSelect={() => {
                      if (image2Preview) {
                        onImageFullscreen(image2Preview)
                      } else {
                        document.getElementById("file2")?.click()
                      }
                    }}
                  />
                  <input
                    id="file2"
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        onImageUpload(file, 2)
                        e.target.value = ""
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex-shrink-0 pt-1">
          <Button
            onClick={onGenerate}
            disabled={!canGenerate || isConvertingHeic}
            className="w-full h-10 text-sm font-semibold bg-white text-black hover:bg-gray-200 disabled:opacity-50"
          >
            {isConvertingHeic ? "Converting..." : "Generate"}
          </Button>
        </div>
      </div>
    </div>
  )
}

