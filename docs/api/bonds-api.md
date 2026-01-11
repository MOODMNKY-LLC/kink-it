# Bonds API Reference

**Base URL**: `/api/bonds`  
**Authentication**: Required (Supabase Auth)

---

## Overview

The Bonds API allows you to create, search, and manage relationship bonds. Bonds connect members of D/s dynamics and support various relationship structures.

---

## Endpoints

### Create Bond

Create a new bond.

**Endpoint**: `POST /api/bonds/create`

**Request Body**:
\`\`\`json
{
  "name": "Our Dynamic",
  "description": "Optional description",
  "bond_type": "dyad" | "polycule" | "household" | "dynamic"
}
\`\`\`

**Response** (200 OK):
\`\`\`json
{
  "success": true,
  "bond": {
    "id": "uuid",
    "name": "Our Dynamic",
    "description": "Optional description",
    "bond_type": "dyad",
    "invite_code": "ABC12345"
  }
}
\`\`\`

**Error Responses**:
- `400`: Bad Request (missing name)
- `401`: Unauthorized
- `500`: Internal Server Error

---

### Search Bond

Search for a bond by invite code.

**Endpoint**: `GET /api/bonds/search?code=INVITECODE`

**Query Parameters**:
- `code` (required): The invite code to search for

**Response** (200 OK):
\`\`\`json
{
  "success": true,
  "bond": {
    "id": "uuid",
    "name": "Our Dynamic",
    "description": "Optional description",
    "bond_type": "dyad"
  }
}
\`\`\`

**Error Responses**:
- `400`: Bad Request (missing code)
- `401`: Unauthorized
- `404`: Bond not found or not accepting members
- `500`: Internal Server Error

---

### Join Bond

Join an existing bond.

**Endpoint**: `POST /api/bonds/join`

**Request Body**:
\`\`\`json
{
  "bond_id": "uuid"
}
\`\`\`

**Response** (200 OK):
\`\`\`json
{
  "success": true,
  "bond": {
    "id": "uuid",
    "name": "Our Dynamic",
    "bond_type": "dyad"
  }
}
\`\`\`

**Error Responses**:
- `400`: Bad Request (missing bond_id or already a member)
- `401`: Unauthorized
- `404`: Bond not found or not accepting members
- `500`: Internal Server Error

---

## Bond Types

### `dyad`
Two-person relationship (traditional D/s pair)

### `polycule`
Multi-person polyamorous network

### `household`
Traditional leather family/household structure

### `dynamic`
Flexible power exchange dynamic

---

## Authentication

All endpoints require authentication via Supabase Auth. Include the session cookie in requests.

---

## Rate Limiting

- Create: 5 requests per hour per user
- Search: 20 requests per minute per user
- Join: 10 requests per hour per user

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Already a member |
| 500 | Internal Server Error |

---

## Examples

### Create a Dyad Bond

\`\`\`bash
curl -X POST https://kinkit.app/api/bonds/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "name": "Our Dynamic",
    "description": "Our D/s relationship",
    "bond_type": "dyad"
  }'
\`\`\`

### Search for Bond

\`\`\`bash
curl -X GET "https://kinkit.app/api/bonds/search?code=ABC12345" \
  -H "Cookie: sb-access-token=..."
\`\`\`

### Join Bond

\`\`\`bash
curl -X POST https://kinkit.app/api/bonds/join \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "bond_id": "uuid-here"
  }'
\`\`\`

---

## Related Documentation

- [Bonds System Guide](../user-guides/bonds-system-guide.md)
- [Authentication Guide](./authentication.md)
