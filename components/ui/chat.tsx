"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Chat - Root container component
 * Establishes chat layout structure with container queries and flex column layout
 */
const Chat = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col h-full w-full",
        className
      )}
      {...props}
    />
  )
)
Chat.displayName = "Chat"

/**
 * ChatHeader - Sticky header component
 * Three sections (Start, Main, End) for displaying chat participant info, status, search, and action buttons
 */
const ChatHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "sticky top-0 z-10 flex items-center border-b bg-background",
        "px-3 sm:px-4 py-2 sm:py-3",
        "safe-area-top",
        className
      )}
      {...props}
    />
  )
)
ChatHeader.displayName = "ChatHeader"

const ChatHeaderStart = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 flex-shrink-0", className)}
      {...props}
    />
  )
)
ChatHeaderStart.displayName = "ChatHeaderStart"

const ChatHeaderMain = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col items-center flex-1 min-w-0", className)}
      {...props}
    />
  )
)
ChatHeaderMain.displayName = "ChatHeaderMain"

const ChatHeaderEnd = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 flex-shrink-0", className)}
      {...props}
    />
  )
)
ChatHeaderEnd.displayName = "ChatHeaderEnd"

/**
 * ChatMessages - Scrollable flex container
 * Displays chat messages from top to bottom, with newest messages at the bottom
 * Uses justify-end to push messages to bottom, with natural scrolling behavior
 */
const ChatMessages = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col flex-1 overflow-y-auto min-h-0",
        "justify-end",
        "scroll-smooth",
        "scrollbar-hide",
        className
      )}
      {...props}
    />
  )
)
ChatMessages.displayName = "ChatMessages"

/**
 * ChatEvent - Flexible message row component
 * Supports any message or event in the chat
 */
const ChatEvent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex gap-2 sm:gap-3",
        "px-3 sm:px-4 py-2.5 sm:py-2",
        className
      )}
      {...props}
    />
  )
)
ChatEvent.displayName = "ChatEvent"

const ChatEventAddon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex-shrink-0", className)}
      {...props}
    />
  )
)
ChatEventAddon.displayName = "ChatEventAddon"

const ChatEventBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1 flex-1 min-w-0", className)}
      {...props}
    />
  )
)
ChatEventBody.displayName = "ChatEventBody"

const ChatEventContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-sm sm:text-base text-foreground",
        "leading-relaxed break-words",
        "max-w-[85%] sm:max-w-[75%] md:max-w-[65%]",
        className
      )}
      {...props}
    />
  )
)
ChatEventContent.displayName = "ChatEventContent"

const ChatEventTitle = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("text-sm font-semibold text-foreground", className)}
      {...props}
    />
  )
)
ChatEventTitle.displayName = "ChatEventTitle"

const ChatEventDescription = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
)
ChatEventDescription.displayName = "ChatEventDescription"

/**
 * ChatToolbar - Sticky bottom input area
 * Three-column grid layout (AddonStart, Textarea, AddonEnd) for message composition
 */
const ChatToolbar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "sticky bottom-0 z-10 border-t bg-background",
        "px-3 sm:px-4 py-2 sm:py-3",
        "safe-area-bottom",
        className
      )}
      {...props}
    />
  )
)
ChatToolbar.displayName = "ChatToolbar"

const ChatToolbarAddonStart = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 flex-shrink-0", className)}
      {...props}
    />
  )
)
ChatToolbarAddonStart.displayName = "ChatToolbarAddonStart"

const ChatToolbarTextarea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex-1 min-w-0", className)}
      {...props}
    />
  )
)
ChatToolbarTextarea.displayName = "ChatToolbarTextarea"

const ChatToolbarAddonEnd = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 flex-shrink-0", className)}
      {...props}
    />
  )
)
ChatToolbarAddonEnd.displayName = "ChatToolbarAddonEnd"

export {
  Chat,
  ChatHeader,
  ChatHeaderStart,
  ChatHeaderMain,
  ChatHeaderEnd,
  ChatMessages,
  ChatEvent,
  ChatEventAddon,
  ChatEventBody,
  ChatEventContent,
  ChatEventTitle,
  ChatEventDescription,
  ChatToolbar,
  ChatToolbarAddonStart,
  ChatToolbarTextarea,
  ChatToolbarAddonEnd,
}
