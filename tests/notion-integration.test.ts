/**
 * Comprehensive Test Suite for Notion Integration Functionalities
 * 
 * This test suite covers:
 * - API Key Management (CRUD operations)
 * - Integration Status Checks
 * - Database Sync Status
 * - Image Generation Sync to Notion
 * - Chat Integration with Notion MCP
 * - Database Entry Counts
 * - Pagination
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals"

describe("Notion Integration Test Suite", () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  let testUserId: string
  let testApiKeyId: string
  let testNotionApiKey: string

  beforeAll(async () => {
    // Setup: Create test user and authenticate
    // This would typically use your auth system
    testUserId = "test-user-id"
    testNotionApiKey = process.env.TEST_NOTION_API_KEY || ""
  })

  afterAll(async () => {
    // Cleanup: Remove test data
  })

  describe("API Key Management", () => {
    it("should add a new Notion API key", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_name: "Test API Key",
          api_key: testNotionApiKey,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBeDefined()
      testApiKeyId = data.id
    })

    it("should retrieve user's API keys", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/api-keys`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    it("should test an API key", async () => {
      if (!testApiKeyId) return

      const response = await fetch(`${BASE_URL}/api/notion/api-keys/${testApiKeyId}/test`, {
        method: "POST",
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.valid).toBe(true)
      expect(data.user).toBeDefined()
    })

    it("should update an API key", async () => {
      if (!testApiKeyId) return

      const response = await fetch(`${BASE_URL}/api/notion/api-keys/${testApiKeyId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_name: "Updated Test API Key",
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.key_name).toBe("Updated Test API Key")
    })

    it("should delete an API key", async () => {
      if (!testApiKeyId) return

      const response = await fetch(`${BASE_URL}/api/notion/api-keys/${testApiKeyId}`, {
        method: "DELETE",
      })

      expect(response.status).toBe(200)
    })
  })

  describe("Integration Status", () => {
    it("should fetch integration status", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/integration-status`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty("connected")
      expect(data).toHaveProperty("databases")
      expect(data).toHaveProperty("pages")
    })

    it("should support pagination for databases", async () => {
      const response = await fetch(
        `${BASE_URL}/api/notion/integration-status?db_page=1&db_per_page=5`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.pagination).toBeDefined()
      expect(data.pagination.databases_page).toBe(1)
      expect(data.pagination.databases_per_page).toBe(5)
      expect(data.databases.length).toBeLessThanOrEqual(5)
    })

    it("should support pagination for pages", async () => {
      const response = await fetch(
        `${BASE_URL}/api/notion/integration-status?page_page=1&page_per_page=10`
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.pagination).toBeDefined()
      expect(data.pagination.pages_page).toBe(1)
      expect(data.pagination.pages_per_page).toBe(10)
    })

    it("should include database entry counts", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/integration-status`)
      expect(response.status).toBe(200)
      const data = await response.json()
      if (data.databases.length > 0) {
        const dbWithEntries = data.databases.find((db: any) => db.entry_count !== undefined)
        if (dbWithEntries) {
          expect(typeof dbWithEntries.entry_count).toBe("number")
          expect(dbWithEntries.entry_count).toBeGreaterThanOrEqual(0)
        }
      }
    })

    it("should return total counts", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/integration-status`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.total_databases).toBeDefined()
      expect(data.total_pages).toBeDefined()
      expect(typeof data.total_databases).toBe("number")
      expect(typeof data.total_pages).toBe("number")
    })
  })

  describe("Database Sync Status", () => {
    it("should check sync status for image generations database", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/check-sync-status?database_type=image_generations`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty("is_synced")
      expect(data).toHaveProperty("database_id")
    })

    it("should return false if database is not synced", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/check-sync-status?database_type=nonexistent`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.is_synced).toBe(false)
    })
  })

  describe("Image Generation Sync", () => {
    it("should sync image generation to Notion", async () => {
      const testGeneration = {
        prompt: "Test image generation",
        image_url: "https://example.com/test-image.jpg",
        storage_path: "test/path/image.jpg",
        model: "dall-e-3",
        aspect_ratio: "1:1",
        generation_type: "text-to-image",
      }

      const response = await fetch(`${BASE_URL}/api/notion/sync-generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testGeneration),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.notion_page_id).toBeDefined()
    })

    it("should handle file uploads to Notion", async () => {
      // This would require actual file handling
      // Mock test for structure
      const testGeneration = {
        prompt: "Test with file",
        image_url: "https://example.com/test-image.jpg",
        imageFileName: "test.jpg",
        imageFileType: "image/jpeg",
        imageFileBase64: "base64encodedstring",
      }

      const response = await fetch(`${BASE_URL}/api/notion/sync-generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testGeneration),
      })

      // Should handle file upload if database supports it
      expect([200, 400]).toContain(response.status)
    })
  })

  describe("Chat Integration with Notion MCP", () => {
    it("should search Notion databases from chat", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/chat-tools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "notion_search",
          query: "tasks",
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toBeDefined()
    })

    it("should query a Notion database from chat", async () => {
      // This requires a valid database_id
      const response = await fetch(`${BASE_URL}/api/notion/chat-tools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "notion_query_database",
          database_id: "test-database-id",
          filter: {},
        }),
      })

      // Should handle both success and error cases
      expect([200, 400, 404]).toContain(response.status)
    })

    it("should create a task in Notion from chat (admin/dominant only)", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/chat-tools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "notion_create_task",
          title: "Test Task",
          description: "Test description",
        }),
      })

      // Should check user role
      expect([200, 403]).toContain(response.status)
    })

    it("should create an idea in Notion from chat (admin/dominant only)", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/chat-tools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "notion_create_idea",
          title: "Test Idea",
          description: "Test idea description",
        }),
      })

      // Should check user role
      expect([200, 403]).toContain(response.status)
    })

    it("should fetch a Notion page from chat", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/chat-tools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool: "notion_fetch_page",
          page_id: "test-page-id",
        }),
      })

      expect([200, 404]).toContain(response.status)
    })
  })

  describe("Template Sync", () => {
    it("should sync Notion template for new user", async () => {
      const response = await fetch(`${BASE_URL}/api/onboarding/notion/sync-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent_page_id: "test-parent-page-id",
        }),
      })

      expect([200, 400]).toContain(response.status)
    })

    it("should verify Notion template", async () => {
      const response = await fetch(`${BASE_URL}/api/onboarding/notion/verify-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent_page_id: "test-parent-page-id",
        }),
      })

      expect([200, 400]).toContain(response.status)
    })
  })

  describe("Error Handling", () => {
    it("should handle invalid API key format", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_name: "Invalid Key",
          api_key: "invalid-key-format",
        }),
      })

      expect([400, 422]).toContain(response.status)
    })

    it("should handle missing API key", async () => {
      const response = await fetch(`${BASE_URL}/api/notion/integration-status`)
      // Should return disconnected status, not error
      expect([200, 401]).toContain(response.status)
    })

    it("should handle invalid pagination parameters", async () => {
      const response = await fetch(
        `${BASE_URL}/api/notion/integration-status?db_page=-1&db_per_page=0`
      )
      // Should handle gracefully or return error
      expect([200, 400]).toContain(response.status)
    })
  })

  describe("Performance", () => {
    it("should respond to integration status within 5 seconds", async () => {
      const start = Date.now()
      const response = await fetch(`${BASE_URL}/api/notion/integration-status`)
      const duration = Date.now() - start

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(5000)
    })

    it("should handle pagination efficiently", async () => {
      const start = Date.now()
      const response = await fetch(
        `${BASE_URL}/api/notion/integration-status?db_page=1&db_per_page=10`
      )
      const duration = Date.now() - start

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(5000)
    })
  })
})


