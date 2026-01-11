# KINK IT Design System

**Last Updated**: February 2, 2025  
**Status**: Active Implementation

## Overview

This document defines the design system extracted from the authentication pages and components. All components across the application should follow these patterns for consistency.

## Color Palette

### Primary Colors
- **Primary**: `oklch(0.70 0.20 220)` - Vibrant cyan-blue (sparkling bokeh effect)
- **Accent**: `oklch(0.70 0.20 30)` - Vibrant orange-red (glowing effect)
- **Background**: `oklch(0.12 0.02 240)` - Deep black/navy
- **Foreground**: `oklch(0.98 0.01 220)` - Near-white text
- **Card**: `oklch(0.15 0.03 240)` - Dark card background

### Semantic Colors
- **Warning**: `oklch(0.70 0.20 30)` - Orange-red
- **Success**: `oklch(0.7 0.18 155)` - Green
- **Destructive**: `oklch(0.68 0.22 15)` - Red
- **Muted**: `oklch(0.20 0.03 240)` - Dark muted
- **Muted Foreground**: `oklch(0.70 0.05 220)` - Light muted text

## Gradient Patterns

### Primary Gradient (Orange-White-Blue-Teal)
\`\`\`css
bg-gradient-to-r from-primary via-accent to-primary
\`\`\`
Used for:
- Title text (`bg-clip-text text-transparent`)
- Progress bars
- Dividers
- Badge backgrounds
- Button hover states

### Border Glow Gradient
\`\`\`css
bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-xl
\`\`\`
Used for:
- Card borders
- Glowing ring effects
- Avatar rings

### Background Gradients
\`\`\`css
from-primary/30 via-accent/20 to-transparent
from-accent/25 via-transparent to-transparent
from-primary/15 via-transparent to-transparent
\`\`\`
Used for:
- Background mesh effects
- Subtle depth layers

## Component Patterns

### Cards
\`\`\`tsx
<Card className="relative overflow-hidden border-primary/20 bg-card/90 backdrop-blur-xl">
  {/* Glowing border effect */}
  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50 blur-xl" />
  <div className="absolute inset-[1px] rounded-lg bg-card/95 backdrop-blur-xl" />
  
  {/* Content */}
  <div className="relative z-10 p-6">
    {/* Card content */}
  </div>
</Card>
\`\`\`

### Buttons

#### Primary Button
\`\`\`tsx
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02]">
\`\`\`

#### Secondary Button (OAuth-style)
\`\`\`tsx
<Button className="bg-primary/10 hover:bg-primary/20 border-2 border-primary/40 backdrop-blur-sm text-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02]">
\`\`\`

### Inputs
\`\`\`tsx
<Input className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 backdrop-blur-sm" />
\`\`\`

### Badges
\`\`\`tsx
{/* Gradient Badge */}
<Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold border-2 border-card shadow-lg">

{/* Outline Badge */}
<Badge variant="outline" className="border-primary/30 text-primary">
\`\`\`

### Titles
\`\`\`tsx
<h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
\`\`\`

### Dividers
\`\`\`tsx
<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-primary/20" />
  </div>
  <div className="relative flex justify-center">
    <div className="bg-card px-3">
      <div className="h-1 w-12 bg-gradient-to-r from-primary via-accent to-primary rounded-full" />
    </div>
  </div>
</div>
\`\`\`

### Progress Bars
\`\`\`tsx
<div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
  <div className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-1000 ease-out shadow-lg shadow-primary/50" />
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
</div>
\`\`\`

## Background Effects

### Gradient Mesh
\`\`\`tsx
<GradientMesh intensity="medium" />
\`\`\`

### Bokeh Effect
\`\`\`tsx
<BokehEffect count={20} />
\`\`\`

### Character Background
\`\`\`tsx
<CharacterBackground variant="hero" opacity={0.12} />
\`\`\`

## Typography

### Headings
- **H1**: `text-xl lg:text-4xl font-display leading-[1] bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent`
- **H2**: `text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent`
- **H3**: `text-lg font-semibold text-foreground`

### Body Text
- **Default**: `text-sm text-foreground`
- **Muted**: `text-sm text-muted-foreground`
- **Description**: `text-xs text-muted-foreground`

## Spacing

- **Card Padding**: `p-6`
- **Section Spacing**: `space-y-6` or `space-y-4`
- **Form Spacing**: `space-y-3` or `gap-1.5`
- **Button Height**: `h-9` (default), `h-14` (large OAuth buttons)

## Shadows

- **Card Shadow**: `shadow-2xl shadow-primary/20`
- **Button Shadow**: `shadow-lg shadow-primary/30`
- **Progress Shadow**: `shadow-lg shadow-primary/50`

## Animations

### Hover Scale
\`\`\`tsx
hover:scale-[1.02] transition-all duration-300
\`\`\`

### Pulse (for glowing effects)
\`\`\`tsx
animate-pulse
\`\`\`

### Shimmer (for progress bars)
\`\`\`tsx
animate-shimmer
\`\`\`

## Backdrop Blur

- **Cards**: `backdrop-blur-xl`
- **Inputs**: `backdrop-blur-sm`
- **Popovers**: `backdrop-blur-xl`

## Opacity Levels

- **Borders**: `/20` or `/40` (e.g., `border-primary/20`)
- **Backgrounds**: `/10`, `/20`, `/30`, `/50`, `/90`, `/95`
- **Text**: `/60`, `/70`, `/80` (e.g., `text-foreground/70`)

## Usage Guidelines

1. **Always use relative positioning** for cards with glowing borders
2. **Layer effects** using `z-10` for content, `z-0` for backgrounds
3. **Maintain contrast** - use `text-foreground` for primary text, `text-muted-foreground` for secondary
4. **Apply gradients** to titles, progress bars, and dividers
5. **Use backdrop blur** for depth and modern aesthetic
6. **Include background effects** on main pages (GradientMesh, BokehEffect, CharacterBackground)
7. **Consistent spacing** - follow established patterns
8. **Smooth transitions** - use `transition-all duration-300` for interactive elements

## Component Checklist

When creating or updating components, ensure:
- [ ] Uses design system colors
- [ ] Applies appropriate gradients
- [ ] Includes backdrop blur where needed
- [ ] Has proper shadows
- [ ] Uses consistent spacing
- [ ] Includes hover states with scale
- [ ] Follows typography patterns
- [ ] Maintains accessibility (contrast, focus states)
