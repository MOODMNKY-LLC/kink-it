/**
 * Notion Matching Service
 * 
 * Matches Notion pages to Supabase records using multiple strategies:
 * 1. Primary: Match by notion_page_id (exact, most reliable)
 * 2. Secondary: Match by title with fuzzy matching (handles variations)
 * 3. Tertiary: No match found (new record from Notion)
 */

import type { NotionPage } from "./retrieve-service"
import { extractTitleFromNotionPage } from "./retrieve-service"

export interface SupabaseRecord {
  id: string
  notion_page_id?: string | null
  title?: string
  name?: string
  [key: string]: any
}

export interface MatchResult {
  notionPage: NotionPage
  supabaseRecord: SupabaseRecord | null
  matchType: "notion_page_id" | "title" | "none"
  confidence: "high" | "medium" | "low"
  titleSimilarity?: number
}

export interface TitleMatch {
  record: SupabaseRecord
  similarity: number
  confidence: "high" | "medium" | "low"
}

/**
 * Matches a Notion page to Supabase records using multi-tier strategy
 */
export function matchNotionPageToSupabaseRecord(
  notionPage: NotionPage,
  supabaseRecords: SupabaseRecord[],
  databaseType: string
): MatchResult {
  // Primary: Match by notion_page_id (exact, most reliable)
  const pageIdMatch = supabaseRecords.find(
    (r) => r.notion_page_id === notionPage.id
  )
  if (pageIdMatch) {
    return {
      notionPage,
      supabaseRecord: pageIdMatch,
      matchType: "notion_page_id",
      confidence: "high",
    }
  }

  // Secondary: Match by title
  const title = extractTitleFromNotionPage(notionPage, databaseType)
  const titleMatch = findTitleMatch(title, supabaseRecords, databaseType)

  if (titleMatch) {
    return {
      notionPage,
      supabaseRecord: titleMatch.record,
      matchType: "title",
      confidence: titleMatch.confidence,
      titleSimilarity: titleMatch.similarity,
    }
  }

  // No match found
  return {
    notionPage,
    supabaseRecord: null,
    matchType: "none",
    confidence: "low",
  }
}

/**
 * Finds best title match using fuzzy matching
 */
function findTitleMatch(
  notionTitle: string,
  supabaseRecords: SupabaseRecord[],
  databaseType: string
): TitleMatch | null {
  if (!notionTitle || notionTitle.trim() === "") {
    return null
  }

  const normalizedNotionTitle = normalizeTitle(notionTitle)
  let bestMatch: TitleMatch | null = null
  let bestSimilarity = 0

  for (const record of supabaseRecords) {
    // Skip records that already have a notion_page_id (already matched)
    if (record.notion_page_id) {
      continue
    }

    const recordTitle = getRecordTitle(record, databaseType)
    if (!recordTitle) {
      continue
    }

    const normalizedRecordTitle = normalizeTitle(recordTitle)
    const similarity = calculateSimilarity(
      normalizedNotionTitle,
      normalizedRecordTitle
    )

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity
      bestMatch = {
        record,
        similarity,
        confidence:
          similarity >= 0.95
            ? "high"
            : similarity >= 0.8
              ? "medium"
              : "low",
      }
    }
  }

  // Only return matches with reasonable confidence (>= 0.7)
  if (bestMatch && bestSimilarity >= 0.7) {
    return bestMatch
  }

  return null
}

/**
 * Gets title from Supabase record based on database type
 */
function getRecordTitle(
  record: SupabaseRecord,
  databaseType: string
): string | null {
  // Different database types use different title fields
  if (record.title) {
    return record.title
  }
  if (record.name) {
    return record.name
  }
  // For contracts, might use title field
  if (databaseType === "contracts" && record.title) {
    return record.title
  }
  return null
}

/**
 * Normalizes title for comparison (lowercase, trim, remove special chars)
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Normalize whitespace
}

/**
 * Calculates similarity between two strings using Levenshtein distance
 * Returns a value between 0 and 1 (1 = identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) {
    return 1.0
  }

  // Exact match after normalization
  if (str1.toLowerCase() === str2.toLowerCase()) {
    return 0.95
  }

  // One string contains the other
  if (str1.includes(str2) || str2.includes(str1)) {
    return 0.85
  }

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(str1, str2)
  const maxLength = Math.max(str1.length, str2.length)

  if (maxLength === 0) {
    return 1.0
  }

  return 1 - distance / maxLength
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Detects duplicate matches (multiple Notion pages matching same Supabase record)
 */
export function detectDuplicateMatches(
  matches: MatchResult[]
): MatchResult[] {
  const recordMatches = new Map<string, MatchResult[]>()

  // Group matches by Supabase record ID
  for (const match of matches) {
    if (match.supabaseRecord) {
      const recordId = match.supabaseRecord.id
      if (!recordMatches.has(recordId)) {
        recordMatches.set(recordId, [])
      }
      recordMatches.get(recordId)!.push(match)
    }
  }

  // Find records with multiple matches
  const duplicates: MatchResult[] = []
  for (const [recordId, matchList] of recordMatches.entries()) {
    if (matchList.length > 1) {
      // Prefer notion_page_id matches, then highest confidence
      matchList.sort((a, b) => {
        if (a.matchType === "notion_page_id") return -1
        if (b.matchType === "notion_page_id") return 1
        if (a.confidence === "high" && b.confidence !== "high") return -1
        if (b.confidence === "high" && a.confidence !== "high") return 1
        return (b.titleSimilarity || 0) - (a.titleSimilarity || 0)
      })

      // Mark all but the best match as duplicates
      duplicates.push(...matchList.slice(1))
    }
  }

  return duplicates
}

/**
 * Matches all Notion pages to Supabase records
 */
export function matchAllPages(
  notionPages: NotionPage[],
  supabaseRecords: SupabaseRecord[],
  databaseType: string
): MatchResult[] {
  const matches = notionPages.map((page) =>
    matchNotionPageToSupabaseRecord(page, supabaseRecords, databaseType)
  )

  // Detect and flag duplicates
  const duplicates = detectDuplicateMatches(matches)
  for (const duplicate of duplicates) {
    duplicate.confidence = "low" // Mark duplicates as low confidence
  }

  return matches
}
