# Notion Integration Test Suite Documentation

## Overview

This document describes the comprehensive test suite for all Notion integration functionalities in the KINK IT application.

## Test Categories

### 1. API Key Management

Tests for CRUD operations on Notion API keys:

- **Add API Key**: Validates API key format, encrypts and stores securely
- **List API Keys**: Retrieves all user's API keys
- **Test API Key**: Validates API key against Notion API
- **Update API Key**: Updates key name or status
- **Delete API Key**: Removes API key from database

### 2. Integration Status

Tests for comprehensive integration status checks:

- **Fetch Status**: Gets connection status, databases, and pages
- **Pagination**: Tests pagination for databases and pages
- **Entry Counts**: Verifies database entry counts are included
- **Total Counts**: Checks total database and page counts

### 3. Database Sync Status

Tests for checking if databases are synced:

- **Check Sync Status**: Verifies if a database type is synced
- **Unsynced Database**: Returns false for unsynced databases

### 4. Image Generation Sync

Tests for syncing image generations to Notion:

- **Sync Generation**: Creates Notion page with image generation data
- **File Upload**: Handles file uploads to Notion (if supported)

### 5. Chat Integration with Notion MCP

Tests for chat-based Notion interactions:

- **Search**: Searches Notion databases from chat
- **Query Database**: Queries a specific database
- **Create Task**: Creates task (admin/dominant only)
- **Create Idea**: Creates idea (admin/dominant only)
- **Fetch Page**: Retrieves a Notion page

### 6. Template Sync

Tests for Notion template synchronization:

- **Sync Template**: Syncs template for new users
- **Verify Template**: Verifies template structure

### 7. Error Handling

Tests for error scenarios:

- **Invalid API Key**: Handles invalid key formats
- **Missing API Key**: Handles missing keys gracefully
- **Invalid Pagination**: Handles invalid pagination parameters

### 8. Performance

Tests for performance requirements:

- **Response Time**: Ensures responses within 5 seconds
- **Pagination Efficiency**: Verifies pagination doesn't slow down responses

## Running Tests

### Prerequisites

1. Set up test environment variables:
   \`\`\`bash
   TEST_NOTION_API_KEY=your_test_notion_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   \`\`\`

2. Ensure test database is set up with test user

### Run All Tests

\`\`\`bash
npm test -- tests/notion-integration.test.ts
\`\`\`

### Run Specific Test Category

\`\`\`bash
npm test -- tests/notion-integration.test.ts -t "API Key Management"
\`\`\`

## Test Data Requirements

- Valid Notion API key for testing
- Test user account with authentication
- Test Notion workspace with sample databases
- Sample image generation data

## Expected Behaviors

### API Key Management
- Keys are encrypted before storage
- Only active keys are returned by default
- Invalid keys are rejected with clear error messages

### Integration Status
- Returns paginated results
- Includes entry counts for accessible databases
- Shows sync status for each database
- Handles large numbers of databases/pages efficiently

### Chat Integration
- Role-based access control enforced
- Database queries return structured data
- Error messages are user-friendly

## Maintenance

Update tests when:
- New Notion integration features are added
- API endpoints change
- Error handling logic changes
- Performance requirements change
