# KINK IT - Comprehensive Notion Template Guide

**Version**: 1.0  
**Date**: 2026-01-05  
**Purpose**: Complete Notion template structure for KINK IT app functionality  
**Status**: Ready for Implementation

---

## Overview

This guide provides a comprehensive Notion template structure that mirrors all databases and functionality in the KINK IT app. Each database corresponds to a module in the application and can be used for personal organization, backup, or as a reference for app development.

---

## Template Structure

### 1. Tasks Database

**Purpose**: Track all tasks assigned within the D/s dynamic

**Properties**:
- **Title** (Title) - Task name
- **Description** (Text) - Detailed task description
- **Status** (Select) - Options: Pending, In Progress, Completed, Approved, Cancelled
- **Priority** (Select) - Options: Low, Medium, High, Urgent
- **Due Date** (Date) - When task is due
- **Point Value** (Number) - Points awarded on completion
- **Proof Required** (Checkbox) - Whether proof is needed
- **Proof Type** (Select) - Options: Photo, Video, Text
- **Assigned By** (Person) - Dominant who assigned the task
- **Assigned To** (Person) - Submissive who must complete
- **Completed At** (Date) - When task was completed
- **Approved At** (Date) - When task was approved
- **Linked Rule** (Relation → Rules) - Associated rule (if any)
- **Template** (Relation → Task Templates) - Template used (if any)
- **Created At** (Created Time) - Auto-generated
- **Updated At** (Last Edited Time) - Auto-generated

**Views**:
- **All Tasks** (Table) - Default view
- **My Tasks** (Table, Filter: Assigned To = Me) - For submissives
- **Assigned Tasks** (Table, Filter: Assigned By = Me) - For dominants
- **Pending Approval** (Table, Filter: Status = Completed) - For dominants
- **By Priority** (Table, Group by Priority) - Organized by priority
- **By Due Date** (Calendar) - Calendar view

---

### 2. Rules & Protocols Database

**Purpose**: Manage standing rules, situational protocols, and expectations

**Properties**:
- **Title** (Title) - Rule/protocol name
- **Description** (Text) - Detailed rule description
- **Rule Type** (Select) - Options: Standing, Situational, Temporary, Optional
- **Context** (Text) - When/where this rule applies
- **Consequence** (Text) - What happens if rule is violated
- **Active** (Checkbox) - Whether rule is currently active
- **Linked Task** (Relation → Tasks) - Task associated with this rule
- **Created By** (Person) - Who created the rule
- **Created At** (Created Time) - Auto-generated
- **Updated At** (Last Edited Time) - Auto-generated
- **Deactivated At** (Date) - When rule was deactivated

**Views**:
- **All Rules** (Table) - Default view
- **Active Rules** (Table, Filter: Active = Yes) - Currently active rules
- **By Type** (Table, Group by Rule Type) - Organized by type
- **Standing Rules** (Table, Filter: Rule Type = Standing) - Always-active rules
- **Situational Rules** (Table, Filter: Rule Type = Situational) - Context-specific rules

---

### 3. Contracts & Consent Database

**Purpose**: Version-controlled relationship contracts with signatures

**Properties**:
- **Title** (Title) - Contract name (e.g., "Covenant v1.0")
- **Content** (Text) - Full contract text
- **Version Number** (Number) - Version of contract
- **Status** (Select) - Options: Draft, Active, Expired, Superseded
- **Created By** (Person) - Who created the contract
- **Created At** (Created Time) - Auto-generated
- **Signed At** (Date) - When contract was signed
- **Expires At** (Date) - When contract expires (if applicable)
- **Superseded By** (Relation → Contracts) - Newer version (if any)
- **Signatures** (Relation → Contract Signatures) - All signatures

**Views**:
- **All Contracts** (Table) - Default view
- **Active Contract** (Table, Filter: Status = Active) - Current contract
- **By Version** (Table, Sort by Version Number) - Version history
- **Expired Contracts** (Table, Filter: Status = Expired) - Past contracts

---

### 4. Contract Signatures Database

**Purpose**: Track who signed which contract and when

**Properties**:
- **Contract** (Relation → Contracts) - Which contract
- **Signed By** (Person) - Who signed
- **Signed At** (Date) - When signed
- **Signature Method** (Select) - Options: Digital, Physical, Verbal
- **Notes** (Text) - Additional notes

**Views**:
- **All Signatures** (Table) - Default view
- **By Contract** (Table, Group by Contract) - Organized by contract

---

### 5. Rewards Database

**Purpose**: Track rewards assigned and redeemed

**Properties**:
- **Title** (Title) - Reward name
- **Description** (Text) - Reward description
- **Reward Type** (Select) - Options: Verbal, Points, Relational, Achievement
- **Point Value** (Number) - Points required (if applicable)
- **Love Language** (Select) - Options: Words of Affirmation, Quality Time, Physical Touch, Acts of Service, Gifts
- **Assigned By** (Person) - Dominant who assigned
- **Assigned To** (Person) - Submissive who earned
- **Status** (Select) - Options: Available, Redeemed, Expired
- **Linked Task** (Relation → Tasks) - Task that earned this reward (if any)
- **Redeemed At** (Date) - When reward was redeemed
- **Created At** (Created Time) - Auto-generated

**Views**:
- **All Rewards** (Table) - Default view
- **Available Rewards** (Table, Filter: Status = Available) - Can be redeemed
- **Redeemed Rewards** (Table, Filter: Status = Redeemed) - Already redeemed
- **By Type** (Table, Group by Reward Type) - Organized by type
- **My Rewards** (Table, Filter: Assigned To = Me) - For submissives

---

### 6. Points Ledger Database

**Purpose**: Track all point transactions

**Properties**:
- **User** (Person) - Who earned/spent points
- **Points** (Number) - Point amount (positive or negative)
- **Reason** (Text) - Why points were awarded/spent
- **Source Type** (Select) - Options: Task, Reward, Manual
- **Source** (Relation → Tasks/Rewards) - What earned/spent points
- **Created At** (Created Time) - Auto-generated

**Views**:
- **All Transactions** (Table) - Default view
- **My Points** (Table, Filter: User = Me) - Personal point history
- **By Source Type** (Table, Group by Source Type) - Organized by source
- **Recent Activity** (Table, Sort by Created At descending) - Latest transactions

---

### 7. Boundaries & Kink Exploration Database

**Purpose**: Track kink activities, boundaries, and compatibility

**Properties**:
- **Activity Name** (Title) - Name of kink/activity
- **Category** (Select) - Options: Bondage, Discipline, Dominance, Submission, Sadism, Masochism, Role Play, Fetish, Other
- **My Rating** (Select) - Options: Yes, Maybe, No, Hard No
- **Partner Rating** (Select) - Options: Yes, Maybe, No, Hard No (visible if partner shares)
- **My Experience Level** (Select) - Options: None, Beginner, Intermediate, Advanced, Expert
- **Partner Experience Level** (Select) - Options: None, Beginner, Intermediate, Advanced, Expert
- **Is Hard Limit** (Checkbox) - Never to be suggested
- **Is Soft Limit** (Checkbox) - Discuss before exploring
- **Notes** (Text) - Personal notes about this activity
- **Last Discussed** (Date) - When last discussed with partner
- **Mutual Visibility** (Checkbox) - Whether partner can see my rating

**Views**:
- **All Activities** (Table) - Default view
- **Compatible Activities** (Table, Filter: My Rating = Yes AND Partner Rating = Yes) - Mutual interests
- **Curious Together** (Table, Filter: My Rating = Maybe AND Partner Rating = Maybe) - Explore together
- **Hard Limits** (Table, Filter: Is Hard Limit = Yes) - Never suggest
- **By Category** (Table, Group by Category) - Organized by category
- **My Yes List** (Table, Filter: My Rating = Yes) - Activities I'm interested in

---

### 8. Journal Entries Database

**Purpose**: Personal and shared journal entries

**Properties**:
- **Title** (Title) - Entry title
- **Content** (Text) - Journal entry content
- **Entry Type** (Select) - Options: Personal, Shared, Gratitude, Reflection
- **Tags** (Multi-select) - Custom tags for categorization
- **Date** (Date) - Entry date
- **Author** (Person) - Who wrote the entry
- **Visible To Partner** (Checkbox) - Whether partner can see this entry
- **Created At** (Created Time) - Auto-generated

**Views**:
- **All Entries** (Table) - Default view
- **My Entries** (Table, Filter: Author = Me) - Personal entries
- **Shared Entries** (Table, Filter: Visible To Partner = Yes) - Shared with partner
- **Gratitude Log** (Table, Filter: Entry Type = Gratitude) - Gratitude entries
- **By Date** (Calendar) - Calendar view
- **By Tags** (Table, Group by Tags) - Organized by tags

---

### 9. Scene Logs Database

**Purpose**: Document scenes with structured metadata

**Properties**:
- **Title** (Title) - Scene name/description
- **Date** (Date) - When scene occurred
- **Time** (Date) - Start time
- **Duration** (Number) - Duration in minutes
- **Participants** (Multi-select) - Who was involved
- **Activities** (Multi-select) - What activities occurred
- **Consent Details** (Text) - Consent discussion notes
- **Aftercare Provided** (Text) - Aftercare details
- **Emotional State Before** (Select) - Options: Excited, Nervous, Calm, Anxious, Other
- **Emotional State After** (Select) - Options: Satisfied, Exhausted, Grateful, Needy, Other
- **What Went Well** (Text) - Positive aspects
- **Improvements** (Text) - What could be better
- **Photos** (Files) - Scene photos (with consent)
- **Created At** (Created Time) - Auto-generated

**Views**:
- **All Scenes** (Table) - Default view
- **By Date** (Calendar) - Calendar view
- **Recent Scenes** (Table, Sort by Date descending) - Latest scenes
- **By Activity** (Table, Group by Activities) - Organized by activity type

---

### 10. Calendar Events Database

**Purpose**: Schedule scenes, tasks, and important dates

**Properties**:
- **Title** (Title) - Event name
- **Event Type** (Select) - Options: Scene, Task Deadline, Important Date, Ritual, Check-in
- **Date** (Date) - Event date
- **Time** (Date) - Event time
- **Duration** (Number) - Duration in minutes (if applicable)
- **Description** (Text) - Event details
- **Linked Task** (Relation → Tasks) - Associated task (if any)
- **Linked Scene** (Relation → Scene Logs) - Associated scene (if any)
- **Reminder** (Date) - When to send reminder
- **Created By** (Person) - Who created the event
- **Created At** (Created Time) - Auto-generated

**Views**:
- **All Events** (Calendar) - Default calendar view
- **Upcoming Events** (Table, Filter: Date >= Today) - Future events
- **By Type** (Table, Group by Event Type) - Organized by type
- **Scenes Calendar** (Calendar, Filter: Event Type = Scene) - Scene schedule

---

### 11. Resources Database

**Purpose**: Educational content and bookmarked resources

**Properties**:
- **Title** (Title) - Resource name
- **URL** (URL) - Resource link
- **Resource Type** (Select) - Options: Article, Video, Guide, Forum, Book, Podcast, Other
- **Category** (Select) - Options: Safety, Consent, Techniques, Communication, Community, Other
- **Description** (Text) - Resource description
- **Tags** (Multi-select) - Custom tags
- **Rating** (Number) - 1-5 star rating
- **Notes** (Text) - Personal notes
- **Bookmarked By** (Person) - Who bookmarked
- **Shared With Partner** (Checkbox) - Whether shared
- **Created At** (Created Time) - Auto-generated

**Views**:
- **All Resources** (Table) - Default view
- **My Bookmarks** (Table, Filter: Bookmarked By = Me) - Personal bookmarks
- **By Type** (Table, Group by Resource Type) - Organized by type
- **By Category** (Table, Group by Category) - Organized by category
- **Highly Rated** (Table, Filter: Rating >= 4) - Best resources

---

### 12. Communication & Check-ins Database

**Purpose**: Track daily check-ins and important communications

**Properties**:
- **Date** (Date) - Check-in date
- **Check-in Status** (Select) - Options: Green, Yellow, Red
- **Notes** (Text) - Check-in notes
- **Submitted By** (Person) - Who submitted
- **Response** (Text) - Partner's response (if any)
- **Communication Type** (Select) - Options: Daily Check-in, Message, Scene Debrief, Important Discussion
- **Created At** (Created Time) - Auto-generated

**Views**:
- **All Communications** (Table) - Default view
- **Daily Check-ins** (Table, Filter: Communication Type = Daily Check-in) - Check-in history
- **By Status** (Table, Group by Check-in Status) - Organized by status
- **Recent Communications** (Table, Sort by Date descending) - Latest communications

---

### 13. Analytics & Reports Database

**Purpose**: Store generated reports and analytics

**Properties**:
- **Report Title** (Title) - Report name
- **Report Type** (Select) - Options: Weekly Summary, Monthly Report, Custom, Task Analytics, Points Analytics, Mood Analytics
- **Date Range Start** (Date) - Report start date
- **Date Range End** (Date) - Report end date
- **Content** (Text) - Report content/summary
- **Generated By** (Person) - Who generated
- **Generated At** (Created Time) - Auto-generated
- **Attachments** (Files) - PDF/CSV exports

**Views**:
- **All Reports** (Table) - Default view
- **Recent Reports** (Table, Sort by Generated At descending) - Latest reports
- **By Type** (Table, Group by Report Type) - Organized by type

---

## Database Relationships

### Key Relationships:
1. **Tasks** ↔ **Rules** (Many-to-One) - Tasks can be linked to rules
2. **Tasks** ↔ **Rewards** (One-to-Many) - Tasks can earn rewards
3. **Tasks** ↔ **Points Ledger** (One-to-Many) - Tasks generate point transactions
4. **Contracts** ↔ **Contract Signatures** (One-to-Many) - Contracts have multiple signatures
5. **Calendar Events** ↔ **Tasks** (Many-to-One) - Events can link to tasks
6. **Calendar Events** ↔ **Scene Logs** (One-to-One) - Events can link to scenes
7. **Scene Logs** ↔ **Journal Entries** (One-to-One) - Scenes can have journal entries

---

## Template Setup Instructions

### Step 1: Create Workspace
1. Create a new Notion workspace or use existing
2. Name it "KINK IT - [Your Relationship Name]"

### Step 2: Create Databases
1. Create each database listed above using Notion's database feature
2. Add all properties as specified
3. Set up relations between databases

### Step 3: Configure Views
1. Create all views listed for each database
2. Set up filters, sorts, and groups as specified

### Step 4: Set Up Templates
1. Create page templates for common entries (e.g., "New Task", "Scene Log", "Journal Entry")
2. Pre-fill common properties

### Step 5: Set Permissions
1. Share workspace with partner
2. Set appropriate permissions (view/edit as needed)
3. Consider private pages for personal journal entries

---

## Usage Tips

### For Dominants:
- Use Tasks database to assign and track tasks
- Use Rules database to manage protocols
- Use Contracts database for relationship agreements
- Use Analytics database to track progress

### For Submissives:
- Use Tasks database to view assigned tasks
- Use Journal database for personal reflection
- Use Boundaries database to track interests
- Use Rewards database to see available rewards

### For Both:
- Use Calendar Events for scheduling
- Use Communication database for check-ins
- Use Resources database for learning
- Use Scene Logs for documentation

---

## Integration with KINK IT App

This Notion template mirrors the app's database structure. Data can be:
- **Exported** from app to Notion (manual or via API)
- **Imported** from Notion to app (manual or via API)
- **Synced** between app and Notion (future feature)

---

## Customization

Feel free to customize:
- Add custom properties to databases
- Create additional views
- Add templates for common workflows
- Create dashboards combining multiple databases
- Add formulas for calculations

---

**Last Updated**: 2026-01-05  
**Status**: Complete Template Guide  
**Next Steps**: Create databases in Notion using this guide




