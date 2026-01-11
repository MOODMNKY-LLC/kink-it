"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Sparkles, MessageSquare, BookOpen, Calendar, Users, ListTodo, Heart, ScrollText, Settings, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/profile"
import type { Kinkster } from "@/types/kinkster"

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void
  profile?: Profile | null
  kinkster?: Kinkster | null
  className?: string
}

interface Prompt {
  id: string
  text: string
  category: string
  icon?: React.ReactNode
  role?: "dominant" | "submissive" | "switch" | "all"
}

const PROMPTS_BY_CATEGORY: Record<string, Prompt[]> = {
  "Bonds": [
    {
      id: "bonds-1",
      text: "Show me all my active bonds",
      category: "Bonds",
      icon: <Users className="h-4 w-4" />,
      role: "all",
    },
    {
      id: "bonds-2",
      text: "Create a new bond with my partner",
      category: "Bonds",
      icon: <Heart className="h-4 w-4" />,
      role: "all",
    },
    {
      id: "bonds-3",
      text: "What are the rules in my primary bond?",
      category: "Bonds",
      icon: <ScrollText className="h-4 w-4" />,
      role: "all",
    },
  ],
  "Tasks": [
    {
      id: "tasks-1",
      text: "Show me my pending tasks",
      category: "Tasks",
      icon: <ListTodo className="h-4 w-4" />,
      role: "all",
    },
    {
      id: "tasks-2",
      text: "Create a daily task for me",
      category: "Tasks",
      icon: <ListTodo className="h-4 w-4" />,
      role: "dominant",
    },
    {
      id: "tasks-3",
      text: "What tasks are due this week?",
      category: "Tasks",
      icon: <Calendar className="h-4 w-4" />,
      role: "all",
    },
  ],
  "Kinksters": [
    {
      id: "kinksters-1",
      text: "Show me all my Kinkster characters",
      category: "Kinksters",
      icon: <Users className="h-4 w-4" />,
      role: "all",
    },
    {
      id: "kinksters-2",
      text: "Create a new Kinkster character",
      category: "Kinksters",
      icon: <Sparkles className="h-4 w-4" />,
      role: "all",
    },
  ],
  "Journal": [
    {
      id: "journal-1",
      text: "Show me my recent journal entries",
      category: "Journal",
      icon: <BookOpen className="h-4 w-4" />,
      role: "all",
    },
    {
      id: "journal-2",
      text: "Create a new journal entry about today",
      category: "Journal",
      icon: <BookOpen className="h-4 w-4" />,
      role: "all",
    },
  ],
  "Rules": [
    {
      id: "rules-1",
      text: "Show me all my rules",
      category: "Rules",
      icon: <ScrollText className="h-4 w-4" />,
      role: "all",
    },
    {
      id: "rules-2",
      text: "Create a new rule for my bond",
      category: "Rules",
      icon: <Settings className="h-4 w-4" />,
      role: "dominant",
    },
  ],
  "Calendar": [
    {
      id: "calendar-1",
      text: "Show me my upcoming events",
      category: "Calendar",
      icon: <Calendar className="h-4 w-4" />,
      role: "all",
    },
    {
      id: "calendar-2",
      text: "Create a new calendar event",
      category: "Calendar",
      icon: <Calendar className="h-4 w-4" />,
      role: "all",
    },
  ],
  "General": [
    {
      id: "general-1",
      text: "Help me understand how to use KINK IT",
      category: "General",
      icon: <MessageSquare className="h-4 w-4" />,
      role: "all",
    },
    {
      id: "general-2",
      text: "What can you help me with?",
      category: "General",
      icon: <Zap className="h-4 w-4" />,
      role: "all",
    },
  ],
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Bonds: <Users className="h-4 w-4" />,
  Tasks: <ListTodo className="h-4 w-4" />,
  Kinksters: <Sparkles className="h-4 w-4" />,
  Journal: <BookOpen className="h-4 w-4" />,
  Rules: <ScrollText className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  General: <MessageSquare className="h-4 w-4" />,
  Specialty: <Zap className="h-4 w-4" />,
}

// Generate kinkster-specific prompts based on specialty
function getKinksterSpecificPrompts(kinkster: Kinkster | null | undefined): Prompt[] {
  if (!kinkster || !kinkster.specialty) return []

  const prompts: Prompt[] = []
  const specialty = kinkster.specialty.toLowerCase()
  const role = kinkster.role || "switch"
  const topKinks = kinkster.top_kinks || []

  // Master Seraphina - Protocol & Etiquette Training
  if (specialty.includes("protocol") || specialty.includes("etiquette")) {
    prompts.push(
      {
        id: "seraphina-1",
        text: "Teach me about high protocol dynamics",
        category: "Specialty",
        icon: <ScrollText className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "seraphina-2",
        text: "What are the fundamentals of etiquette in BDSM?",
        category: "Specialty",
        icon: <BookOpen className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "seraphina-3",
        text: "Help me understand collar training protocols",
        category: "Specialty",
        icon: <Heart className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "seraphina-4",
        text: "How do I establish proper protocols in my dynamic?",
        category: "Specialty",
        icon: <Settings className="h-4 w-4" />,
        role: "dominant",
      }
    )
  }

  // Luna the Brat - Brat Taming & Funishment
  if (specialty.includes("brat") || specialty.includes("funishment")) {
    prompts.push(
      {
        id: "luna-1",
        text: "What makes a good brat taming scene?",
        category: "Specialty",
        icon: <Zap className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "luna-2",
        text: "Teach me about funishment vs punishment",
        category: "Specialty",
        icon: <Sparkles className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "luna-3",
        text: "How do I handle a bratty submissive?",
        category: "Specialty",
        icon: <Heart className="h-4 w-4" />,
        role: "dominant",
      },
      {
        id: "luna-4",
        text: "What are creative funishment ideas?",
        category: "Specialty",
        icon: <Zap className="h-4 w-4" />,
        role: "all",
      }
    )
  }

  // Daddy Marcus - Caregiving & Aftercare
  if (specialty.includes("caregiving") || specialty.includes("aftercare")) {
    prompts.push(
      {
        id: "marcus-1",
        text: "What does proper aftercare look like?",
        category: "Specialty",
        icon: <Heart className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "marcus-2",
        text: "How do I provide emotional support after a scene?",
        category: "Specialty",
        icon: <Users className="h-4 w-4" />,
        role: "dominant",
      },
      {
        id: "marcus-3",
        text: "Teach me about caregiver dynamics",
        category: "Specialty",
        icon: <BookOpen className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "marcus-4",
        text: "What are signs someone needs aftercare?",
        category: "Specialty",
        icon: <Heart className="h-4 w-4" />,
        role: "all",
      }
    )
  }

  // Fenrir - Primal Play & Wrestling
  if (specialty.includes("primal") || specialty.includes("wrestling")) {
    prompts.push(
      {
        id: "fenrir-1",
        text: "What is primal play and how do I start?",
        category: "Specialty",
        icon: <Zap className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "fenrir-2",
        text: "Teach me about safe wrestling in BDSM",
        category: "Specialty",
        icon: <Users className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "fenrir-3",
        text: "How do I tap into my primal instincts?",
        category: "Specialty",
        icon: <Sparkles className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "fenrir-4",
        text: "What are the safety considerations for primal play?",
        category: "Specialty",
        icon: <Settings className="h-4 w-4" />,
        role: "all",
      }
    )
  }

  // Ari the Devoted - Service Submission & Worship
  if (specialty.includes("service") || specialty.includes("worship")) {
    prompts.push(
      {
        id: "ari-1",
        text: "What does service submission mean to you?",
        category: "Specialty",
        icon: <Heart className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "ari-2",
        text: "Teach me about worship dynamics",
        category: "Specialty",
        icon: <Sparkles className="h-4 w-4" />,
        role: "all",
      },
      {
        id: "ari-3",
        text: "How do I show devotion to my Dominant?",
        category: "Specialty",
        icon: <Users className="h-4 w-4" />,
        role: "submissive",
      },
      {
        id: "ari-4",
        text: "What are meaningful acts of service?",
        category: "Specialty",
        icon: <ListTodo className="h-4 w-4" />,
        role: "all",
      }
    )
  }

  // Kinky Kincade - General Guidance & Education
  if (specialty.includes("general") || specialty.includes("education") || !kinkster.specialty) {
    // Use default prompts from PROMPTS_BY_CATEGORY
    return []
  }

  return prompts
}

export function PromptSuggestions({ onSelectPrompt, profile, kinkster, className }: PromptSuggestionsProps) {
  // Get kinkster-specific prompts
  const kinksterPrompts = getKinksterSpecificPrompts(kinkster)
  
  // Merge kinkster prompts with general prompts
  const allPromptsByCategory = { ...PROMPTS_BY_CATEGORY }
  if (kinksterPrompts.length > 0) {
    allPromptsByCategory["Specialty"] = kinksterPrompts
  }

  // Set default category to "Specialty" if kinkster has prompts, otherwise "General"
  const defaultCategory = kinksterPrompts.length > 0 ? "Specialty" : "General"
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Filter prompts based on user role
  const filteredPrompts = allPromptsByCategory[activeCategory]?.filter((prompt) => {
    if (!prompt.role || prompt.role === "all") return true
    if (!profile?.role) return false
    return prompt.role === profile.role || profile.role === "switch"
  }) || []

  // Check scroll position
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScrollPosition()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScrollPosition)
      return () => container.removeEventListener("scroll", checkScrollPosition)
    }
  }, [activeCategory])

  // Optional: Gentle auto-scroll hint (disabled by default, can be enabled)
  // Uncomment to enable subtle auto-scroll animation
  /*
  useEffect(() => {
    if (!scrollContainerRef.current || filteredPrompts.length <= 2) return

    const container = scrollContainerRef.current
    const maxScroll = container.scrollWidth - container.clientWidth
    
    // Only auto-scroll if content is wider than container
    if (maxScroll > 0) {
      // Gentle scroll hint - scrolls slowly then resets
      let scrollPosition = 0
      const scrollSpeed = 0.3
      let direction = 1
      
      const autoScroll = () => {
        if (scrollPosition >= maxScroll) {
          direction = -1
        } else if (scrollPosition <= 0) {
          direction = 1
        }
        scrollPosition += scrollSpeed * direction
        container.scrollLeft = scrollPosition
      }

      const interval = setInterval(autoScroll, 100)
      return () => clearInterval(interval)
    }
  }, [activeCategory, filteredPrompts.length])
  */

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const scrollAmount = 300 // pixels to scroll
    const newScrollLeft = direction === "left" 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    })
  }

  const categories = Object.keys(allPromptsByCategory)

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {kinkster?.specialty ? `Try asking about ${kinkster.specialty}...` : "Try asking..."}
        </h3>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide h-auto p-1 bg-muted/50">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap"
            >
              <span className="flex items-center gap-1.5">
                {CATEGORY_ICONS[category]}
                <span className="hidden sm:inline">{category}</span>
                <span className="sm:hidden">{category.substring(0, 4)}</span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent
            key={category}
            value={category}
            className="mt-4 space-y-2"
          >
            <div className="relative group">
              {/* Scroll buttons - desktop only */}
              {canScrollLeft && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-md hover:bg-background hidden md:flex"
                  onClick={() => scroll("left")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}

              {/* Horizontal scrolling container */}
              <div
                ref={scrollContainerRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 px-1"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {filteredPrompts.map((prompt) => (
                  <Card
                    key={prompt.id}
                    className="flex-shrink-0 w-[280px] sm:w-[300px] cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border-2 hover:border-primary/50"
                    onClick={() => onSelectPrompt(prompt.text)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {prompt.icon && (
                          <div className="flex-shrink-0 mt-0.5 text-primary">
                            {prompt.icon}
                          </div>
                        )}
                        <p className="text-sm font-medium leading-relaxed text-foreground flex-1">
                          {prompt.text}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Scroll indicator - show if scrollable */}
              {canScrollRight && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-md hover:bg-background hidden md:flex"
                  onClick={() => scroll("right")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}

              {/* Scroll hint for mobile */}
              {filteredPrompts.length > 2 && (
                <div className="md:hidden flex justify-center mt-2">
                  <Badge variant="outline" className="text-xs">
                    Swipe to see more →
                  </Badge>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
