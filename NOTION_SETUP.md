# Notion Integration Setup for KINK IT

This guide will help you set up the Notion integration for the App Ideas feature.

## Prerequisites

1. A Notion account with access to your KINK IT workspace
2. The KINK IT parent page in Notion (already created)
3. The App Ideas database (already created under KINK IT)

## Quick Setup (You Already Have the Key!)

Your Notion API key is already available in your credentials database:

**API Key**: `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`

### Add to v0 Environment Variables

1. Open the **in-chat sidebar** (left side of v0)
2. Click on **"Vars"** section
3. Click **"Add Variable"**
4. Add the following:
   - **Name**: `NOTION_API_KEY`
   - **Value**: `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`
5. Click **"Save"**

That's it! The integration is ready to use.

## Getting Your Notion API Key

### Step 1: Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Fill in the details:
   - **Name**: KINK IT App Ideas Sync
   - **Logo**: (optional)
   - **Associated workspace**: Select your workspace
4. Click **"Submit"**
5. Copy the **Internal Integration Token** (starts with `secret_`)

### Step 2: Share the Database with Your Integration

1. Open your KINK IT page in Notion
2. Click the **"..."** menu in the top right
3. Scroll down and click **"Connections"** or **"Add connections"**
4. Find and select **"KINK IT App Ideas Sync"** (or whatever you named it)
5. Click **"Confirm"**

This gives your integration access to the App Ideas database.

## Database Information

The App Ideas database is already set up under your KINK IT parent page with:

**Database ID**: `cc491ef5f0a64eac8e05a6ea10dfb735`
**Parent Page**: KINK IT (2decd2a6-5422-8132-9d96-d98bb4404316)

**Properties**:
- **Title** (title) - The idea title
- **Description** (rich_text) - Detailed description
- **Category** (select) - Feature, Improvement, Bug Fix, UI/UX, Integration
- **Priority** (select) - Critical, High, Medium, Low
- **Status** (select) - New, In Review, Approved, In Progress, Completed, Deferred
- **Tags** (multi_select) - Custom tags
- **Requested By** (people) - Who requested it
- **Created** (created_time) - Auto-generated timestamp

## Testing the Integration

1. Go to the **Ideas** page in your app
2. Click **"Add New Idea"**
3. Fill in the form:
   - Title: "Test Notion Sync"
   - Description: "Testing the integration"
   - Category: Feature
   - Priority: Low
4. After creating, click **"Sync to Notion"** button
5. Check your Notion App Ideas database - the entry should appear!

## Troubleshooting

### "Notion API key not configured"
- Make sure you added `NOTION_API_KEY` to the Vars section
- Verify the key starts with `secret_`
- Redeploy or refresh the app after adding the variable

### "object_not_found" error
- Ensure you shared the KINK IT page with your integration
- The integration needs access to the parent page to see the database

### "validation_error" on properties
- The database schema might have changed
- Check that property names match exactly (case-sensitive)

## Security Notes

- Never commit your Notion API key to version control
- Keep your integration token secret
- The database ID is not sensitive and can be in the code
- Consider using Row Level Security if storing sensitive data

## Support

For more help:
- [Notion API Documentation](https://developers.notion.com)
- [v0 Integration Docs](https://v0.dev/docs)
- Contact support at vercel.com/help
