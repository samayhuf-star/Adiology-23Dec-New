# Overview

Adiology is a Google Ads campaign builder platform designed to automate and streamline the creation of comprehensive advertising campaigns. It generates keywords, ads, and targeting configurations, supporting campaign structure creation, keyword planning, ad generation, CSV validation, and export in Google Ads Editor format. The platform aims to simplify Google Ads campaign management, offering features like real-time expense tracking to enhance efficiency and unlock market potential for various business needs.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## January 6, 2026 - Documentation Image System
### Super Admin Documentation Images
- Added documentation_images table to store images in PostgreSQL
- Super admin (samayhuf@gmail.com) can upload up to 5 images per documentation article
- Images stored as base64 in database for cross-user visibility
- API endpoints: GET /api/docs/images/:articleKey, GET /api/docs/all-images, POST /api/docs/images, DELETE /api/docs/images/:imageId
- Gallery view in HelpSupport component with per-image delete buttons
- Images visible to all users, upload/delete restricted to super admin only

### API Cleanup
- Removed workspace management APIs (/api/workspaces/*) from server/index.ts
- Removed form template APIs (/api/templates/*) from server/index.ts  
- Removed VM management APIs (/api/vm-management/*) from server/index.ts
- Cleaned up workspace-related comments from App.tsx
- Removed unused handleWorkspaceError and handleFormError from errorHandler.ts

### Database Schema Fix
- Created DATABASE_FIX_COMPLETE.sql for Supabase schema synchronization
- Adds missing columns to campaign_history table (type, name, data, status)
- Adds missing columns to users table (stripe_customer_id, subscription_plan, etc.)
- Creates missing tables: subscriptions, payments, invoices, emails, audit_logs, etc.

## December 30, 2025 - Clerk Authentication Migration
### Authentication Provider Migration
- Migrated from Supabase Auth to Clerk authentication
- Updated main.tsx to wrap app in ClerkProvider
- Updated App.tsx to use Clerk hooks (useUser, useAuth, useClerk) for auth state management
- Created ClerkAuth.tsx component with styled SignIn/SignUp screens
- Updated server/index.ts verifyUserToken to validate Clerk JWT tokens using @clerk/backend
- Updated historyService.ts to use injected Clerk getToken function
- Updated src/utils/auth.ts to work with Clerk instead of Supabase
- Environment variables: CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, VITE_CLERK_PUBLISHABLE_KEY

### Token Flow
- Frontend: useAuth().getToken() retrieves JWT tokens
- Backend: @clerk/backend.verifyToken() validates tokens
- historyService uses setClerkGetToken() for dependency injection

## December 28, 2025 - Module Cleanup and Simplification
### Workspace System Removal
- Completely removed the workspace isolation system to simplify architecture
- Removed WorkspaceProvider, WorkspaceContext, and all workspace-related components
- Updated historyService.ts, api.ts, and PaymentPage.tsx to remove workspace dependencies
- Deleted workspace utility files: workspaces.ts, workspace-api.ts, workspace-cache.ts, workspacePersistence.ts
- Deleted workspace components: WorkspaceSwitcher.tsx, WorkspaceCreation.tsx, WorkspaceCards.tsx, WorkspacesPage.tsx
- Removed module-access-control.ts and related permission management
- Users now have direct access to all features without workspace selection

### Virtual Machines Module Removal
- Completely removed the Virtual Machines module from the platform
- Deleted src/modules/vm-management/ directory with all components, services, and hooks
- Removed VM-related scripts and test files
- Removed "Virtual Machines" from sidebar and navigation

### Forms Module Removal
- Completely removed the Forms module from the platform
- Deleted src/modules/forms/ directory with all components and pages
- Deleted src/api/forms.ts
- Removed "Forms" from sidebar and mobile navigation

### Campaign Preset Keyword Expansion
- Expanded electrician and plumber presets from ~20 to 130+ keywords each
- Created keywordExpander.ts utility for generating 100-150 keywords per industry
- Follows Google Ads best practices with distribution: 40% high-intent, 30% commercial/pricing, 15% problem-solution, 10% trust, 5% urgency
- Theme-based ad groups: High Intent, Emergency, Cost & Pricing, Trust & Quality, Problem Solutions, Residential/Commercial

### Negative Keywords Builder UI Redesign
- Complete redesign with modern gradient backgrounds and glass-morphism effects
- Mobile-responsive layout with collapsible input section for small screens
- Improved stats visualization with color-coded category badges
- Mobile card view for keyword results (instead of table on small screens)
- Streamlined header with compact filter controls
- Better visual hierarchy with gradient buttons and shadow effects
- Cleaner card layouts and improved typography

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript and Vite, utilizing Radix UI and Tailwind CSS.
- **UI/UX**: Component-based architecture, multi-step wizards for Campaign and Ads Builders, client-side routing, React hooks, and context-based notification system. Features include a SuperAdmin Console, Real-time Expense Tracking, and Call Forwarding. The design is mobile-responsive with collapsible sidebar navigation, responsive grids, compact navigation, and mobile-optimized data tables.
- **Call Forwarding**: Project-based call management system with SkySwitch API integration for tracking numbers, forwarding targets with percentage-based distribution, and syncing to SkySwitch.
- **Call Forwarding Billing**: Prepaid balance system with Stripe integration for auto-recharge, manual top-ups, payment method management, and transaction history.
- **Ads Search (Google Ads Transparency)**: Allows users to research competitor ads from Google Ads Transparency Center using a Playwright-based scraper and an asynchronous job queue system.
- **Campaign Builder**: A 7-step wizard that guides users through URL input with AI analysis, structure selection (SKAG, STAG, Intent-Based, Alpha-Beta), keyword generation (410-710 keywords), ad generation, geo-targeting, and CSV generation.
- **Saved Campaigns**: Displays campaign history with search and filter options, including Google Ads OAuth integration for direct, paused campaign pushes to Google Ads.
- **Data Export**: Generates a master 183-column Google Ads Editor CSV format, ensuring full compatibility for various campaign, ad group, keyword, and extension data.

## Backend
- **Primary API**: Hono (Node.js/TypeScript) for all API endpoints, with optional FastAPI (Python) for legacy ad generation.
- **URL Analyzer**: Cheerio-based HTML parser for website analysis, extracting key information and integrating with OpenAI for marketing insights.
- **Background Processing**: Celery with Redis for asynchronous tasks like keyword generation and AI-powered keyword suggestions.
- **Ads Transparency Scraper**: Playwright-based web scraper for competitor ad data, processed by an hourly cron job.
- **Edge Functions**: Supabase Edge Functions (Deno/TypeScript) for health checks, payment processing, and campaign history storage.
- **Fallback Systems**: Python-based ad generator, local storage, and a three-tier save system.
- **Business Logic**: Automatic business type detection, intent classification, service/product-specific ad templates, and Dynamic Keyword Insertion (DKI).
- **Ad Generation Guardrails**: Enforces Google Search Ads policies for RSA, DKI, Call-Only ads, uniqueness checks (Levenshtein distance), and ad strength calculation.

## Data Storage
- **Primary Database**: Replit PostgreSQL (Neon-backed) for user data, campaign history, subscriptions, and billing. Managed via Drizzle ORM.
- **Schema**: Defined in `shared/schema.ts` with Drizzle schema definitions. Use `npm run db:push` to sync schema changes.
- **Caching**: KV store for edge functions, localStorage for offline data, and Redis for Celery.
- **Data Models**: Supports campaign structure, user profiles, and billing records.
- **Website Analysis Storage**: localStorage-based analysis service for quick reuse of URL analysis results, with backend sync.

## Authentication & Authorization
- **Authentication Provider**: Clerk with email/password, social login, and managed user sessions.
- **Frontend Integration**: ClerkProvider wraps the app, useUser/useAuth/useClerk hooks for auth state.
- **Backend Verification**: @clerk/backend.verifyToken() validates JWT tokens on API endpoints.
- **Authorization**: Role-based access (users, paid users, super admins) with API key authentication, CORS, and Content Security Policy.

## Super Admin Panel
- **Access**: Restricted to specific users via /admin path or admin.adiology.io subdomain.
- **Authentication**: Server-side middleware protects API endpoints.
- **Dashboard**: Real-time statistics including users, subscriptions, revenue, and errors.
- **Management**: User management (block, edit roles), subscription & billing management (Stripe sync), database management (browse/edit records).
- **System Logs**: View error, activity, and API logs.
- **Email Management**: Sendune integration for transactional emails via AWS SES.
- **Security & Firewall**: IP blocking and rate limiting configuration.
- **Documentation Manager**: Create, edit, and publish help documentation with rich text, images, and video.
- **Template Management**: Manage campaign templates, versions, and status.
- **Website Management**: Track deployed websites and domains.
- **Real-time Expenses**: Integrates with various APIs (Stripe, OpenAI, Supabase, Vercel, GitHub) to track and calculate actual usage costs from production data.
- **AI Usage Tracking**: Monitors AI token consumption per user.
- **Database Admin**: Full CRUD interface for all database tables using React-Admin.

## AI Blog Generator
- **Location**: Blog > AI Generator in sidebar navigation.
- **Features**: Generates 2000+ word blog posts with 5+ content sections, case studies, tips, image prompts, optional code snippets and statistics. Configurable content type, tone, and target audience. Includes HTML export, markdown preview, and copy-to-clipboard.
- **Security**: HTML escaping, server-side authentication, and input validation.

# External Dependencies

## Third-Party Services
- **Clerk**: Authentication provider with email/password and social login support.
- **Supabase**: PostgreSQL database and Edge Functions (Note: Auth migrated to Clerk).
- **Stripe**: Payment processing for subscriptions, integrated via `stripe-replit-sync`.
- **Redis**: Message broker and result backend for Celery tasks.
- **OpenAI**: Natural language processing for the web template editor chatbot and AI Blog Generator (gpt-4o-mini).
- **SkySwitch**: Call forwarding and phone number management API (DID/TFNs, percentage-based distribution).
- **ResellerClub**: Email/webmail management API.
- **GitHub**: Version control and CI/CD.
- **Vercel**: Deployment platform.
- **Replit**: Development platform.

## APIs & Integrations
- **Backend API (FastAPI)**: Provides endpoints for keyword generation, ad generation, and CSV export.
- **Google Ads Editor CSV Format**: Adheres strictly to Google's schema for data export.
- **Real-time Expense Tracking**: Integrates with Stripe, OpenAI, Supabase, Vercel, SendGrid, GitHub, and Replit APIs.