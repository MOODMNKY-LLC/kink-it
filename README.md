# KINK IT

<div align="center">

![KINK IT Banner](./public/images/kink-it-banner.png)

**A comprehensive D/s relationship management and creative studio application**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/mood-mnkys-projects/kink-it)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-green?style=for-the-badge&logo=supabase)](https://supabase.com/)

</div>

---

## 🎯 Mission & Purpose

**KINK IT** is a comprehensive, privacy-centric Progressive Web Application (PWA) designed specifically for Dominant/submissive (D/s) partnerships. The app combines relationship management tools, personal growth features, and creative expression capabilities to support structured, consensual power exchange dynamics.

**Core Value Proposition**: A tool that helps Dominants lead intentionally and submissives serve consistently, with built-in safety mechanisms, consent boundaries, and relationship growth tools—all while maintaining that software supports relationships, never replaces them.

### Key Principles

- ✅ **Consent-First Design** - Explicit safety mechanisms and boundary enforcement
- ✅ **Authority-Preserving** - App never acts instead of Dominant; human authority always maintained
- ✅ **Self-Declared States** - Submission states with automatic boundary enforcement
- ✅ **Privacy-Focused** - Full transparency to Dominant by default, secure data handling
- ✅ **Comprehensive Tools** - 12 integrated modules covering all aspects of D/s relationships

---

## ✨ Features

### Relationship Management

- **🤝 Bonds System** - Form dyads, polycules, or households with clear roles (dominant, submissive, switch) and permissions
- **📋 Rules & Protocols** - Create standing, situational, or temporary rules with detailed protocols
- **🚫 Boundaries & Exploration** - Record hard/soft limits and explore kink activities via rating system
- **📜 Contracts & Consent** - Formalize agreements with digital signatures, safewords, and consent tracking
- **💬 Communication Hub** - Messaging, daily traffic-light check-ins (green/yellow/red), and conversation prompts

### Task & Reward Management

- **✅ Tasks** - Assign routine, one-time, protocol-linked, or low-energy tasks with proof requirements and point values
- **🎁 Rewards** - Verbal praise, points, relational perks, permission-based rewards, and achievements
- **🏆 Achievements** - Presence-based recognition system (unlocked intentionally by Dominants, not automated)
- **📊 Analytics** - Supportive dashboards showing task completion, communication frequency, and growth trends

### Personal Growth Tools

- **📔 Journal** - Personal entries, shared reflections, gratitude logs, and scene records
- **📅 Calendar** - Schedule scenes, rituals, tasks, check-ins, deadlines, and milestones with recurrence
- **📚 Library & Resources** - Educational articles, safety guides, books, videos, and community forums

### Creative Studio ("Kinky's Playground")

- **🎨 AI-Powered Avatar Creation** - Generate custom characters with appearance attributes, style preferences, and kink profiles
- **🖼️ Scene Composition** - Compose scenes with characters, backgrounds, and AI-generated imagery
- **🎭 Character System** - Define kinksters with stats (dominance, submission, charisma, stamina, creativity, control)
- **📸 Image Management** - Centralized storage in Supabase with automatic tagging and face/body composite extraction

### Chat & Communication

- **💬 Partner Messaging** - Real-time chat with contact lists, unread counts, and conversation history
- **🚦 Check-Ins** - Daily traffic-light system for emotional state reporting
- **🤖 AI Chat** - Integrated AI assistant ("Kinky Kincade") for guidance and conversation

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.5.9](https://nextjs.org/) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with custom animations
- **State Management**: Zustand
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
- **Hosting**: [Vercel](https://vercel.com/)
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Integrations**: Notion (Calendar & Data Sync), OpenAI (AI features)
- **PWA**: Full Progressive Web App support with offline capabilities

---

## 📸 Screenshots

<div align="center">

![Kinky Kincade Avatar](./public/images/kinky/kinky-avatar.svg)

*Meet Kinky Kincade - Your AI companion for D/s relationship guidance*

</div>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm)
- Supabase account (or local Supabase instance)
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/MOODMNKY-LLC/kink-it.git
   cd kink-it
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up Supabase**
   
   For local development:
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g supabase
   
   # Start local Supabase instance
   supabase start
   
   # Reset database and apply migrations
   supabase db reset
   ```

   For production, create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Configure environment variables**
   
   Create `.env.local` in the root directory:
   ```env
   # Supabase (required)
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
   
   # OpenAI (for AI features - optional)
   OPENAI_API_KEY=your_openai_api_key
   
   # Notion (for calendar integration - optional)
   NOTION_API_KEY=your_notion_api_key
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

   The app will be available at `http://localhost:3000` (or `https://localhost:3000` if using HTTPS)

### Additional Setup Commands

```bash
# Generate PWA icons
pnpm generate:pwa-icons

# Generate splash screens
pnpm generate:splash-screens

# Verify seed data
pnpm verify:seed

# Reset database with seed data
pnpm seed:reset

# Serve Supabase Edge Functions locally
pnpm functions:serve
```

---

## 📚 Documentation

### User Guides

Comprehensive guides for each module are available in [`docs/user-guides/`](./docs/user-guides/):

- [Tasks Guide](./docs/user-guides/tasks-guide.md) - Task assignment and management
- [Rewards Guide](./docs/user-guides/rewards-guide.md) - Rewards and recognition system
- [Achievements Guide](./docs/user-guides/achievements-guide.md) - Achievement system
- [Bonds System Guide](./docs/user-guides/bonds-system-guide.md) - Creating and managing bonds
- [Rules & Protocols Guide](./docs/user-guides/rules-and-protocols-guide.md) - Rule creation and management
- [Boundaries Guide](./docs/user-guides/boundaries-guide.md) - Boundary exploration and limits
- [Contracts & Consent Guide](./docs/user-guides/contracts-and-consent-guide.md) - Formal agreements and consent tracking
- [Communication Guide](./docs/user-guides/communication-guide.md) - Messaging and check-ins
- [Journal Guide](./docs/user-guides/journal-guide.md) - Personal and shared journaling
- [Calendar Guide](./docs/user-guides/calendar-guide.md) - Event scheduling and management
- [Analytics Guide](./docs/user-guides/analytics-guide.md) - Relationship insights and trends
- [Library & Resources Guide](./docs/user-guides/library-and-resources-guide.md) - Educational content
- [Safety & Consent](./docs/user-guides/safety-and-consent.md) - Safety mechanisms and best practices

### Technical Documentation

- [Product Requirements Document](./PRD.md) - Complete product vision and requirements
- [Database Context](./docs/APP_DATABASE_CONTEXT.md) - Database schema and relationships
- [Implementation Guides](./docs/implementation/) - Technical implementation details

---

## 🏗️ Project Structure

```
kink-it/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   ├── bonds/            # Bond management
│   ├── tasks/            # Task management
│   ├── rewards/          # Rewards system
│   └── ...
├── hooks/                 # React hooks
├── lib/                   # Utility functions
├── supabase/              # Supabase migrations and configs
│   ├── migrations/       # Database migrations
│   └── seed.sql         # Seed data
├── docs/                  # Documentation
│   ├── user-guides/     # User-facing guides
│   └── implementation/  # Technical docs
├── public/                # Static assets
│   ├── images/          # Images and avatars
│   └── icons/           # PWA icons
└── types/                 # TypeScript type definitions
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow the code style** - TypeScript, ESLint configuration included
3. **Write clear commit messages** - Use conventional commits format
4. **Test your changes** - Ensure `pnpm build` succeeds
5. **Submit a pull request** - Include a clear description of changes

### Development Workflow

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Build to verify
pnpm build

# Commit with conventional commits format
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

---

## 🔒 Privacy & Security

- **Data Encryption**: All data encrypted in transit and at rest
- **Row-Level Security**: Supabase RLS policies ensure users only access their own data
- **Consent Mechanisms**: Built-in pause/play functionality and boundary enforcement
- **Privacy by Design**: Default transparency to Dominant, configurable privacy settings

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🙏 Acknowledgments

Built with care for the D/s community, emphasizing safety, consent, and intentional relationship management.

---

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub or contact the maintainers.

---

<div align="center">

**Made with ❤️ for the D/s community**

*KINK IT - Supporting intentional relationships through technology*

</div>
