"use client"

/**
 * Studio Sidebar
 * 
 * Internal navigation sidebar for the Creative Studio.
 * Uses collapsible sections for mode navigation with sub-items.
 */

import React, { useCallback } from "react"
import { ChevronDown, ChevronRight, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { KinkyAvatar } from "@/components/kinky/kinky-avatar"
import { useCreativeStudio } from "./creative-studio-provider"
import {
  STUDIO_NAVIGATION,
  ASPECT_RATIO_OPTIONS,
} from "./constants"
import type {
  StudioMode,
  StudioSubMode,
  StudioNavItem,
  StudioNavSection,
} from "@/types/creative-studio"

// ============================================================================
// Sub-components
// ============================================================================

interface NavItemProps {
  item: StudioNavItem
  isActive: boolean
  onSelect: (mode: StudioMode, subMode?: StudioSubMode) => void
  currentSubMode: StudioSubMode
}

function NavItem({ item, isActive, onSelect, currentSubMode }: NavItemProps) {
  const hasSubItems = item.subItems && item.subItems.length > 0
  const Icon = item.icon

  const handleMainClick = useCallback(() => {
    onSelect(item.mode, item.defaultSubMode)
  }, [item.mode, item.defaultSubMode, onSelect])

  const handleSubItemClick = useCallback(
    (subMode: StudioSubMode) => {
      onSelect(item.mode, subMode)
    },
    [item.mode, onSelect]
  )

  if (!hasSubItems) {
    return (
      <button
        onClick={handleMainClick}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          "hover:bg-white/10",
          isActive
            ? "bg-white/15 text-white"
            : "text-white/70 hover:text-white"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.title}</span>
      </button>
    )
  }

  return (
    <Collapsible defaultOpen={isActive || item.isExpandedByDefault}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
            "hover:bg-white/10 group",
            isActive
              ? "bg-white/15 text-white"
              : "text-white/70 hover:text-white"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-left">{item.title}</span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=closed]:rotate-[-90deg]" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
          {item.subItems?.map((subItem) => {
            const SubIcon = subItem.icon
            const isSubActive = isActive && currentSubMode === subItem.subMode
            return (
              <button
                key={subItem.id}
                onClick={() => handleSubItemClick(subItem.subMode)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-all",
                  "hover:bg-white/10",
                  isSubActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{subItem.title}</span>
                {subItem.isComplete && (
                  <span className="ml-auto text-green-400">✓</span>
                )}
              </button>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface NavSectionProps {
  section: StudioNavSection
  currentMode: StudioMode
  currentSubMode: StudioSubMode
  onSelect: (mode: StudioMode, subMode?: StudioSubMode) => void
}

function NavSection({
  section,
  currentMode,
  currentSubMode,
  onSelect,
}: NavSectionProps) {
  return (
    <div className="space-y-1">
      <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/40">
        {section.title}
      </h3>
      {section.items.map((item) => {
        // Check if this item's mode is active (accounting for generate-props/generate-prompt)
        const isActive =
          currentMode === item.mode ||
          (item.mode === "generate-props" && currentMode === "generate-prompt") ||
          (item.mode === "generate-prompt" && currentMode === "generate-props")
        return (
          <NavItem
            key={item.id}
            item={item}
            isActive={isActive}
            onSelect={onSelect}
            currentSubMode={currentSubMode}
          />
        )
      })}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

interface StudioSidebarProps {
  className?: string
}

export function StudioSidebar({ className }: StudioSidebarProps) {
  const { state, dispatch, setMode } = useCreativeStudio()
  const { currentMode, currentSubMode, sidebarCollapsed } = state.ui
  const { settings } = state.propsState

  const handleModeSelect = useCallback(
    (mode: StudioMode, subMode?: StudioSubMode) => {
      setMode(mode, subMode)
    },
    [setMode]
  )

  const handleAspectRatioChange = useCallback(
    (value: string) => {
      dispatch({
        type: "SET_SETTINGS",
        payload: { aspectRatio: value as any },
      })
    },
    [dispatch]
  )

  const handleModelChange = useCallback(
    (value: string) => {
      dispatch({
        type: "SET_SETTINGS",
        payload: { model: value as any },
      })
    },
    [dispatch]
  )

  const handleKinkItModeChange = useCallback(
    (checked: boolean) => {
      dispatch({
        type: "SET_SETTINGS",
        payload: { kinkItMode: checked },
      })
    },
    [dispatch]
  )

  if (sidebarCollapsed) {
    // Collapsed state - show icons only
    return (
      <div
        className={cn(
          "flex h-full w-14 flex-col border-r border-white/20 bg-white/5 backdrop-blur-xl",
          className
        )}
      >
        <div className="flex h-14 items-center justify-center border-b border-white/20">
          <KinkyAvatar size={32} variant="icon" />
        </div>
        <ScrollArea className="flex-1 py-2">
          <div className="space-y-1 px-2">
            {STUDIO_NAVIGATION.flatMap((section) =>
              section.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  currentMode === item.mode ||
                  (item.mode === "generate-props" &&
                    currentMode === "generate-prompt") ||
                  (item.mode === "generate-prompt" &&
                    currentMode === "generate-props")
                return (
                  <button
                    key={item.id}
                    onClick={() => handleModeSelect(item.mode, item.defaultSubMode)}
                    title={item.title}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-all",
                      "hover:bg-white/10",
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
        <div className="border-t border-white/20 p-2">
          <button
            onClick={() =>
              dispatch({ type: "SET_SIDEBAR_COLLAPSED", payload: false })
            }
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            title="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col border-r border-white/20 bg-white/5 backdrop-blur-xl",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center gap-3 border-b border-white/20 px-4">
        <KinkyAvatar size={32} variant="icon" />
        <div className="flex-1 min-w-0">
          <h2 className="truncate text-sm font-semibold text-white">
            Creative Studio
          </h2>
          <p className="truncate text-xs text-white/50">
            AI-powered generation
          </p>
        </div>
        <button
          onClick={() =>
            dispatch({ type: "SET_SIDEBAR_COLLAPSED", payload: true })
          }
          className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
          title="Collapse sidebar"
        >
          <ChevronDown className="h-4 w-4 rotate-90" />
        </button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-6">
          {STUDIO_NAVIGATION.map((section) => (
            <NavSection
              key={section.title}
              section={section}
              currentMode={currentMode}
              currentSubMode={currentSubMode}
              onSelect={handleModeSelect}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer - Quick Settings */}
      <div className="border-t border-white/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="h-4 w-4 text-white/60" />
          <span className="text-xs font-medium text-white/60">
            Quick Settings
          </span>
        </div>

        <div className="space-y-3">
          {/* Aspect Ratio */}
          <div className="space-y-1">
            <Label className="text-xs text-white/60">Aspect Ratio</Label>
            <Select
              value={settings.aspectRatio}
              onValueChange={handleAspectRatioChange}
            >
              <SelectTrigger className="h-8 bg-white/5 border-white/20 text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/20">
                {ASPECT_RATIO_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-1">
            <Label className="text-xs text-white/60">Model</Label>
            <Select
              value={settings.model}
              onValueChange={handleModelChange}
            >
              <SelectTrigger className="h-8 bg-white/5 border-white/20 text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/20">
                <SelectItem value="dalle-3" className="text-white text-xs">
                  DALL·E 3
                </SelectItem>
                <SelectItem value="gemini-3-pro" className="text-white text-xs">
                  Gemini 3 Pro
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* KINK IT Mode Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-white/60">KINK IT Mode</Label>
            <Switch
              checked={settings.kinkItMode}
              onCheckedChange={handleKinkItModeChange}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudioSidebar
