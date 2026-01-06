# Comprehensive Implementation Plan: Sidebar Enhancement & Notion API Key Management

## Executive Summary

This document outlines a comprehensive plan for enhancing the KINK IT application's sidebar architecture and implementing user-provided Notion API key management. The implementation addresses three major areas: (1) differentiated admin and user sidebar configurations for optimized screen space, (2) context switcher functionality in the sidebar header, and (3) secure storage and management of user-provided Notion API keys to enable enhanced integration capabilities.

## Research Findings Summary

### Sidebar Architecture Patterns

Research into modern sidebar implementations reveals that role-based navigation differentiation is a standard practice across enterprise applications. Admin dashboards typically feature expanded navigation menus with system management capabilities, while regular user interfaces focus on core functionality. The differentiation can be achieved through conditional rendering based on user roles, with admin sections either integrated into the main sidebar or presented as collapsible sections.

The Shadcn sidebar component provides extensive customization capabilities through three variant types (sidebar, floating, inset) and three collapsible modes (offcanvas, icon, none). These options enable flexible implementations that can adapt to different screen sizes and user preferences while maintaining consistent navigation patterns.

### Context Switcher Patterns

Context switchers have become essential components in multi-tenant applications and applications supporting multiple workspaces or organizational contexts. These components typically appear in the sidebar header or top navigation bar, allowing users to switch between different contexts without requiring logout and re-authentication. Common implementation patterns include dropdown menus, popover components, and breadcrumb-style navigation that provides visual context about the current selection.

The implementation should support switching between different bonds, workspaces, or organizational contexts while maintaining state persistence and providing clear visual feedback about the active context. State management becomes critical in these implementations, as the application must track the current context and adjust navigation, permissions, and data access accordingly.

### Notion API Key Management

The research into secure API key storage reveals that Supabase provides multiple options for encrypting sensitive user data. The Supabase Vault extension represents the recommended approach for storing encrypted secrets, as it provides automatic key management, encryption at rest using AES-256, and integration with PostgreSQL functions and triggers. While pgcrypto remains available as an alternative, Vault offers superior key management capabilities and reduces the risk of key exposure.

User-provided API keys require careful handling throughout their lifecycle. Validation must occur before storage to ensure the keys are valid and functional. Encryption should happen immediately upon receipt, and decryption should only occur when the keys are needed for API calls. Row Level Security policies must restrict access to encrypted keys, ensuring that only the key owner can access their own credentials.

The integration architecture must support dual authentication patterns, where the application can use both OAuth tokens (obtained through the existing Notion OAuth flow) and user-provided API keys. This enables enhanced functionality, as API keys can provide access to private integrations and workspaces that may not be accessible through OAuth tokens alone.

## Implementation Architecture

### Phase 1: Sidebar Differentiation

#### 1.1 Database Schema Updates

No database changes required for sidebar differentiation, as the existing `profiles` table already contains the `system_role` field that distinguishes admin users from regular users.

#### 1.2 Component Architecture

The sidebar implementation will utilize a component composition pattern that separates navigation configuration from rendering logic. Two primary navigation configurations will be defined: one for admin users and one for regular users. The component will conditionally render the appropriate configuration based on the user's `system_role`.

**File Structure:**
```
components/dashboard/sidebar/
├── index.tsx (main sidebar component)
├── admin-navigation.tsx (admin navigation configuration)
├── user-navigation.tsx (user navigation configuration)
├── context-switcher.tsx (new context switcher component)
└── navigation-item.tsx (reusable navigation item component)
```

**Key Implementation Details:**

1. **Navigation Configuration Objects**: Separate configuration objects for admin and user navigation will define menu items, icons, URLs, and permission requirements. These configurations will be stored in separate files to maintain clear separation of concerns.

2. **Conditional Rendering Logic**: The main sidebar component will check the user's `system_role` and render the appropriate navigation configuration. Admin users will see both regular navigation items and admin-specific sections, while regular users will only see items appropriate to their role.

3. **Collapsible Admin Section**: For regular users who may occasionally need admin access (if role changes), or for admin users who want to minimize clutter, admin sections can be implemented as collapsible groups that can be expanded or collapsed as needed.

4. **Screen Space Optimization**: The implementation will leverage Shadcn's collapsible modes, allowing the sidebar to collapse to icon-only mode on smaller screens or when users prefer a more compact view. The `icon` collapsible mode provides an excellent balance between functionality and screen space conservation.

#### 1.3 Implementation Steps

1. **Extract Navigation Configurations**: Create separate configuration files for admin and user navigation, moving existing navigation data into these structured configurations.

2. **Create Navigation Helper Functions**: Develop utility functions that merge admin and user navigation configurations based on user role, ensuring proper ordering and grouping.

3. **Update Sidebar Component**: Modify the main sidebar component to use the new navigation configuration system, implementing conditional rendering based on user role.

4. **Implement Collapsible Sections**: Add collapsible functionality to admin sections, allowing users to expand or collapse these sections as needed.

5. **Add Role-Based Styling**: Implement visual differentiation for admin sections, using subtle color coding or icons to indicate administrative functions.

6. **Testing**: Create comprehensive tests for both admin and user sidebar rendering, ensuring that navigation items appear correctly based on user roles.

### Phase 2: Context Switcher Implementation

#### 2.1 Database Schema Updates

The context switcher will leverage existing bond and workspace data structures. No new tables are required, but we may need to add indexes to support efficient context queries.

**Potential Schema Enhancements:**
- Add `last_accessed_at` timestamp to `bond_members` table to track context usage
- Create index on `bond_members(user_id, is_active)` for faster context queries

#### 2.2 Component Architecture

The context switcher will be implemented as a header component within the sidebar, positioned prominently to provide easy access to context switching functionality.

**Key Features:**

1. **Current Context Display**: The switcher will display the current active context (bond name, workspace name, etc.) with appropriate visual indicators.

2. **Context List**: A dropdown or popover will display all available contexts for the current user, including bonds they belong to and any workspaces they have access to.

3. **Quick Switch**: Users can quickly switch between contexts without navigating away from their current page, with the application automatically updating navigation and data access.

4. **Context Persistence**: The selected context will be persisted in localStorage or a user preferences table, ensuring that the user's context choice persists across sessions.

5. **Visual Feedback**: Clear visual indicators will show which context is currently active, and the switcher will provide feedback during context transitions.

#### 2.3 Implementation Steps

1. **Create Context Switcher Component**: Build the base context switcher component using Shadcn's Popover or Dropdown components.

2. **Implement Context State Management**: Create a context provider or custom hook to manage the current context state across the application.

3. **Fetch Available Contexts**: Implement API endpoints or database queries to fetch all available contexts for the current user (bonds, workspaces, etc.).

4. **Add Context Switching Logic**: Implement the logic to switch between contexts, updating navigation, permissions, and data access accordingly.

5. **Persist Context Selection**: Add persistence logic to save the user's context choice and restore it on application load.

6. **Add Visual Indicators**: Implement visual feedback for context switching, including loading states and success indicators.

7. **Integration with Sidebar**: Integrate the context switcher into the sidebar header, ensuring proper positioning and styling.

### Phase 3: Notion API Key Management

#### 3.1 Database Schema

**New Table: `user_notion_api_keys`**

```sql
CREATE TABLE public.user_notion_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name text NOT NULL, -- User-friendly name for the key
  encrypted_key bytea NOT NULL, -- Encrypted API key using Supabase Vault
  key_hash text NOT NULL, -- Hash for validation (first 8 chars)
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_key_name UNIQUE (user_id, key_name)
);

-- Enable RLS
ALTER TABLE public.user_notion_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own API keys"
  ON public.user_notion_api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON public.user_notion_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.user_notion_api_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.user_notion_api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_notion_api_keys_user_id ON public.user_notion_api_keys(user_id);
CREATE INDEX idx_user_notion_api_keys_active ON public.user_notion_api_keys(user_id, is_active) WHERE is_active = true;
```

**Encryption Functions:**

```sql
-- Enable pgcrypto extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt API key (using application-level encryption key from Vault)
CREATE OR REPLACE FUNCTION public.encrypt_notion_api_key(
  p_api_key text,
  p_encryption_key text
) RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pgcrypto to encrypt the API key
  RETURN pgp_sym_encrypt(p_api_key, p_encryption_key);
END;
$$;

-- Function to decrypt API key
CREATE OR REPLACE FUNCTION public.decrypt_notion_api_key(
  p_encrypted_key bytea,
  p_encryption_key text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pgcrypto to decrypt the API key
  RETURN pgp_sym_decrypt(p_encrypted_key, p_encryption_key);
END;
$$;

-- Function to validate and store API key
CREATE OR REPLACE FUNCTION public.store_user_notion_api_key(
  p_user_id uuid,
  p_key_name text,
  p_api_key text,
  p_encryption_key text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key_id uuid;
  v_encrypted_key bytea;
  v_key_hash text;
BEGIN
  -- Validate API key format (Notion API keys start with 'secret_' or 'ntn_')
  IF p_api_key !~ '^(secret_|ntn_)' THEN
    RAISE EXCEPTION 'Invalid Notion API key format';
  END IF;

  -- Generate hash for validation (first 8 characters)
  v_key_hash := LEFT(p_api_key, 8);

  -- Encrypt the API key
  v_encrypted_key := public.encrypt_notion_api_key(p_api_key, p_encryption_key);

  -- Insert encrypted key
  INSERT INTO public.user_notion_api_keys (
    user_id,
    key_name,
    encrypted_key,
    key_hash
  ) VALUES (
    p_user_id,
    p_key_name,
    v_encrypted_key,
    v_key_hash
  )
  ON CONFLICT (user_id, key_name) 
  DO UPDATE SET
    encrypted_key = EXCLUDED.encrypted_key,
    key_hash = EXCLUDED.key_hash,
    updated_at = now()
  RETURNING id INTO v_key_id;

  RETURN v_key_id;
END;
$$;
```

**Alternative: Using Supabase Vault (Recommended)**

If using Supabase Vault instead of pgcrypto:

```sql
-- Store encryption key in Vault (one-time setup via Supabase Dashboard)
-- Then use vault.decrypted_secrets view to access the key

-- Function to store API key using Vault
CREATE OR REPLACE FUNCTION public.store_user_notion_api_key_vault(
  p_user_id uuid,
  p_key_name text,
  p_api_key text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key_id uuid;
  v_key_hash text;
  v_vault_secret_id uuid;
BEGIN
  -- Generate hash for validation
  v_key_hash := LEFT(p_api_key, 8);

  -- Store in Vault (requires Vault extension)
  INSERT INTO vault.secrets (name, secret)
  VALUES (
    'notion_api_key_' || p_user_id::text || '_' || p_key_name,
    p_api_key
  )
  RETURNING id INTO v_vault_secret_id;

  -- Store reference in user_notion_api_keys table
  INSERT INTO public.user_notion_api_keys (
    user_id,
    key_name,
    vault_secret_id,
    key_hash
  ) VALUES (
    p_user_id,
    p_key_name,
    v_vault_secret_id,
    v_key_hash
  )
  RETURNING id INTO v_key_id;

  RETURN v_key_id;
END;
$$;
```

#### 3.2 API Endpoints

**File: `app/api/notion/api-keys/route.ts`**

```typescript
// GET /api/notion/api-keys - List user's API keys
// POST /api/notion/api-keys - Add new API key
// PATCH /api/notion/api-keys/[id] - Update API key
// DELETE /api/notion/api-keys/[id] - Delete API key
// POST /api/notion/api-keys/[id]/test - Test API key
```

**Key Implementation Details:**

1. **Validation Endpoint**: Before storing an API key, the application will validate it by making a test request to the Notion API. This ensures that only valid, functional keys are stored.

2. **Encryption on Server**: API keys will be encrypted on the server side before storage, ensuring that plaintext keys never persist in the database.

3. **Decryption on Demand**: API keys will only be decrypted when needed for API calls, and decrypted values will never be sent to the client.

4. **Usage Tracking**: The system will track when API keys are last used, enabling users to identify unused keys and clean up their credentials.

#### 3.3 UI Components

**File: `app/account/settings/notion-api-keys/page.tsx`**

A dedicated settings page for managing Notion API keys, featuring:

1. **API Key List**: Display all user's API keys with names, creation dates, and last used dates.

2. **Add API Key Form**: Form to add new API keys with validation and testing before storage.

3. **Edit/Delete Actions**: Ability to rename or delete API keys.

4. **Test Functionality**: Button to test API keys to ensure they're still valid.

5. **Security Indicators**: Visual indicators showing encryption status and security best practices.

#### 3.4 Integration with Existing Notion OAuth

The implementation will support dual authentication:

1. **OAuth Token (Primary)**: Continue using the existing OAuth flow for standard Notion integration.

2. **API Key (Enhanced)**: Allow users to add their own API keys for private integrations and enhanced capabilities.

3. **Fallback Logic**: The application will attempt to use OAuth tokens first, falling back to user-provided API keys when OAuth tokens are insufficient or unavailable.

4. **Key Selection**: Users can select which API key to use for specific operations, or the system can automatically select the most appropriate key based on the operation type.

## Security Considerations

### Encryption

1. **At Rest**: All API keys will be encrypted using AES-256 encryption before storage in the database.

2. **In Transit**: All API key data will be transmitted over HTTPS/TLS connections.

3. **Key Management**: Encryption keys will be stored in Supabase Vault or as environment variables, never in the database alongside encrypted data.

### Access Control

1. **Row Level Security**: RLS policies ensure that users can only access their own API keys.

2. **Function Security**: Database functions that handle encryption/decryption will use `SECURITY DEFINER` to ensure proper access control while maintaining security.

3. **API Endpoint Security**: All API endpoints will verify user authentication and authorization before processing requests.

### Validation and Testing

1. **Format Validation**: API keys will be validated for correct format before storage.

2. **Functional Testing**: API keys will be tested against the Notion API before storage to ensure they're valid and functional.

3. **Error Handling**: Comprehensive error handling will prevent sensitive information from being exposed in error messages.

## Implementation Timeline

### Week 1: Sidebar Differentiation
- Days 1-2: Extract navigation configurations and create admin/user navigation files
- Days 3-4: Update sidebar component with conditional rendering
- Day 5: Testing and refinement

### Week 2: Context Switcher
- Days 1-2: Create context switcher component and state management
- Days 3-4: Implement context switching logic and persistence
- Day 5: Integration and testing

### Week 3: Notion API Key Management
- Days 1-2: Database schema and migration creation
- Days 3-4: API endpoints and encryption functions
- Day 5: UI components and integration

### Week 4: Integration and Testing
- Days 1-2: Integration of all components
- Days 3-4: Comprehensive testing
- Day 5: Documentation and deployment preparation

## Testing Strategy

### Unit Tests
- Navigation configuration merging logic
- Context switcher state management
- API key encryption/decryption functions
- Validation functions

### Integration Tests
- Sidebar rendering for different user roles
- Context switching functionality
- API key storage and retrieval
- Dual authentication flow

### Security Tests
- RLS policy verification
- Encryption verification
- Access control testing
- Input validation testing

## Documentation Requirements

1. **User Documentation**: Guide for users on how to add and manage Notion API keys
2. **Developer Documentation**: Technical documentation for the implementation
3. **Security Documentation**: Security considerations and best practices
4. **API Documentation**: API endpoint documentation

## Success Metrics

1. **Sidebar Performance**: Reduced navigation clutter for regular users, improved admin access
2. **Context Switching**: Seamless context switching without logout
3. **API Key Adoption**: Percentage of users who add their own API keys
4. **Security**: Zero security incidents related to API key storage
5. **User Satisfaction**: Positive feedback on navigation improvements

## Conclusion

This comprehensive implementation plan provides a roadmap for enhancing the KINK IT application's sidebar architecture and implementing secure Notion API key management. The phased approach ensures that each component can be developed, tested, and deployed independently while maintaining system stability and security throughout the implementation process.



