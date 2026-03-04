# AGENTS.md — Academic Ticket Management System

## Project Overview

**Sistema de Gestión de Observaciones Académicas** — A web application for managing and tracking academic enrollment observations (tickets) for the Escuela de Ingeniería Informática. Coordinators and administrators use this system to review, classify, and resolve student enrollment requests.

The application is a **single-page React app** (no router library) that communicates directly with **Supabase** as its backend (auth, database, RLS). There is no custom backend server.

---

## Tech Stack

| Layer         | Technology                          | Version   |
|---------------|-------------------------------------|-----------|
| UI Framework  | React                               | 19.2      |
| Language      | TypeScript                          | ~5.9      |
| Build Tool    | Vite                                | 7.2       |
| CSS Framework | TailwindCSS                         | 3.4       |
| Backend       | Supabase (Auth + PostgreSQL + RLS)  | —         |
| Icons         | Google Material Symbols (via CDN)   | —         |
| Font          | Inter (Google Fonts)                | —         |
| Exports       | SheetJS (xlsx)                       | 0.18      |

### Key Tailwind Plugins
- `@tailwindcss/forms` — form element styling resets
- `@tailwindcss/container-queries` — container query utilities

### Design Tokens (tailwind.config.js)
- **Primary color:** `#137fec`
- **Backgrounds:** `#f6f7f8` (light) / `#101922` (dark)
- **Surfaces:** `#ffffff` (light) / `#1a2632` (dark)
- **Dark mode:** class-based (`darkMode: "class"`)
- **Font:** Inter, sans-serif

---

## Architecture

### Navigation / Routing
The app does **NOT** use a router library. Navigation is handled via a `useState('overview')` state in `AppContent` (`src/App.tsx`). The `NavigationSidebar` component calls `onNavigate(pageName)` and the main content area switches views via a `switch` statement in `renderContent()`.

**Valid page keys:** `'overview'` | `'students'` | `'requests'` | `'users'` | `'upload-projections'`

### Authentication Flow
- `AuthProvider` wraps the entire app (`src/contexts/AuthContext.tsx`)
- `useAuth()` hook provides: `session`, `loading`, `profile`, `error`
- Login → Supabase `signInWithPassword()`
- Registration → Supabase `signUp()` → auto-creates `profiles` row via DB trigger (role: `sin_asignar`)
- New users see `PendingApprovalPage` until an admin assigns a role
- Password recovery handled via auth state change listener in `AppContent`

### Role-Based Access
| Role           | Dashboard | View Requests | Edit Requests | Manage Users | Upload Projections |
|----------------|:---------:|:-------------:|:-------------:|:------------:|:------------------:|
| `sin_asignar`  | ❌         | ❌             | ❌             | ❌            | ❌                  |
| `lector`       | ✅         | ✅             | ❌             | ❌            | ❌                  |
| `coordinador`  | ✅         | ✅             | ✅             | ❌            | ❌                  |
| `administrador`| ✅         | ✅             | ✅             | ✅            | ✅                  |

### State Management
- **No global state library** — all state is local to components or passed via props
- `AuthContext` is the only React context used
- `useOnboarding` custom hook manages onboarding tour state (localStorage-based)
- `useRealtimeLock` custom hook (`src/hooks/useRealtimeLock.ts`) manages real-time ticket locking via Supabase Realtime

---

## Project Structure

```
academic-ticket-management/
├── public/                        # Static assets (favicon, logo, vite.svg)
├── shortcodes/                    # Standalone HTML pages (Google Forms embeds, recommendations)
│   ├── enrollment-recommendations.html
│   ├── enrollment-responses.html
│   └── formulario_observaciones.html
├── src/
│   ├── App.tsx                    # Root component — auth gating + page routing
│   ├── main.tsx                   # Entry point (renders <App />)
│   ├── types.ts                   # Shared TypeScript interfaces & types
│   ├── index.css                  # Global styles + Tailwind directives
│   ├── App.css                    # App-level CSS
│   ├── assets/                    # Static imports (images)
│   ├── components/                # All React components (see below)
│   ├── constants/
│   │   └── departments.ts         # Department colors & names mappings
│   ├── contexts/
│   │   └── AuthContext.tsx         # Auth provider + useAuth hook
│   ├── data/
│   │   ├── mockData.ts            # Mock data for development
│   │   └── predefinedResponses.ts  # Canned responses for ticket resolution
│   ├── hooks/
│   │   └── useRealtimeLock.ts     # Real-time ticket locking hook
│   ├── lib/
│   │   └── supabase.ts           # Supabase client initialization
│   └── utils/
│       ├── dataUtils.ts           # Data grouping/transformation helpers
│       └── exportUtils.ts         # Excel export functionality
├── .env                           # Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
├── tailwind.config.js             # Tailwind configuration with custom tokens
├── vite.config.ts                 # Vite config (React plugin)
├── tsconfig.json                  # TypeScript project references
├── tsconfig.app.json              # App TypeScript config
├── tsconfig.node.json             # Node TypeScript config
├── postcss.config.js              # PostCSS (autoprefixer + tailwind)
├── eslint.config.js               # ESLint config
└── package.json                   # Dependencies & scripts
```

### Components Directory (`src/components/`)

| Component                       | Purpose                                                |
|---------------------------------|--------------------------------------------------------|
| `DashboardOverview.tsx`         | Main dashboard with statistics, charts, activity log    |
| `RequestsView.tsx`              | Full CRUD view for enrollment tickets/observations      |
| `StudentRecords.tsx`            | Student-centric view — groups tickets by student        |
| `StudentTable.tsx`              | Table subcomponent for student records                  |
| `StudentFilters.tsx`            | Filter controls for student records                     |
| `StudentRequestDetailModal.tsx` | Modal showing student's full enrollment record          |
| `UserManagement.tsx`            | Admin-only: manage users and assign roles               |
| `UploadProjections.tsx`         | Admin-only: bulk upload projection data (CSV/Excel)     |
| `NavigationSidebar.tsx`         | Left sidebar with page links + user menu                |
| `Header.tsx`                    | Page header component                                   |
| `LoginPage.tsx`                 | Email/password login form                               |
| `RegisterPage.tsx`              | User registration form                                  |
| `ForgotPasswordPage.tsx`        | Password reset request                                  |
| `UpdatePasswordPage.tsx`        | Set new password (recovery flow)                        |
| `PendingApprovalPage.tsx`       | Shown to users with `sin_asignar` role                  |
| `OnboardingTour.tsx`            | Interactive tour for new users                          |
| `EditProfileModal.tsx`          | Profile editing modal                                   |
| `DeleteConfirmationModal.tsx`   | Generic delete confirmation dialog                      |
| `OutcomeModal.tsx`              | Outcome/result feedback modal                           |
| `SuccessModal.tsx`              | Success feedback modal                                  |
| `LockedBanner.tsx`              | Banner shown when a ticket is locked by another user    |
| `SemesterInput.tsx`             | Specialized semester input component                    |

---

## Database Schema (Supabase / PostgreSQL)

### Tables

| Table           | Purpose                                        |
|-----------------|-------------------------------------------------|
| `profiles`      | User profiles synced from `auth.users` via trigger |
| `observaciones` | Enrollment tickets/requests (populated from Google Forms via Apps Script) |
| `audit_logs`    | Audit trail for all system actions              |
| `proyecciones`  | Academic projection data (updated per semester) |

### Key Types

```typescript
type UserRole = "sin_asignar" | "lector" | "coordinador" | "administrador";
type Department = "IN" | "MC" | "IS" | "LP" | "TE" | "GE" | "AT" | "PP";
type Status = "POR REVISAR" | "SOLUCIONADO" | "NO PROCEDE" | "EN REVISIÓN" | "REPETIDO" | "IGNORADO" | "REVISADO";
```

### Database Functions (RPC)
- `get_dashboard_stats()` — Returns aggregated statistics for the dashboard

### Database Triggers
- `on_auth_user_created` — Automatically creates a `profiles` row when a new user signs up via Supabase Auth

---

## Environment Variables

| Variable                  | Description                           |
|---------------------------|---------------------------------------|
| `VITE_SUPABASE_URL`      | Supabase project URL                  |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon API key     |

> **Note:** The `.env` file is NOT gitignored in the current configuration. Consider adding it.

---

## Development Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # TypeScript check + Vite production build
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
```

---

## Important Conventions

### Language
- **UI language:** Spanish (all user-facing text is in Spanish)
- **Code language:** English (variable names, function names, comments in English preferred)

### Component Patterns
- All components are **functional components** using hooks
- Components are exported as **named exports** (not default exports)
- Each component file is self-contained (no barrel exports / index.ts re-exports)
- Database queries are done **directly in components** using the Supabase client — there is no dedicated data/service layer
- Field mapping between `observaciones` table (Spanish columns) and TypeScript `Request` interface (English fields) happens inline in components

### Styling
- Uses **TailwindCSS 3.4** utility classes exclusively
- Dark mode via `dark:` variants (class-based toggle)
- Custom design tokens defined in `tailwind.config.js`
- Icon set: **Google Material Symbols** (`material-symbols-outlined` class)

### Data Flow
- `observaciones` → populated automatically from Google Forms via Google Apps Script
- `proyecciones` → uploaded manually each semester via the `UploadProjections` admin page
- `audit_logs` → written by the frontend when coordinators/admins modify tickets

### Shortcodes
The `shortcodes/` directory contains standalone HTML pages that are embedded or linked externally (not part of the React SPA build):
- `enrollment-recommendations.html` — Academic enrollment recommendation tool
- `enrollment-responses.html` — Enrollment response display page
- `formulario_observaciones.html` — Google Forms-based observation submission form

---

## Supabase Project

- **Project URL:** `https://zmvecicbbxbpuhbnexiz.supabase.co`
- **Project ID:** `zmvecicbbxbpuhbnexiz`
- Row Level Security (RLS) is enabled on database tables
- Auth uses email/password — no OAuth providers configured

---

## Common Tasks

### Adding a New Page/View
1. Create a new component in `src/components/`
2. Add a case to the `switch` in `AppContent.renderContent()` in `src/App.tsx`
3. Add a navigation item in `NavigationSidebar.tsx`
4. Guard access based on user role if needed

### Adding a New Database Table
1. Create the table in Supabase Dashboard or via migration
2. Add TypeScript types in `src/types.ts`
3. Enable RLS and create appropriate policies
4. Query using the Supabase client from `src/lib/supabase.ts`

### Modifying Ticket Fields
1. Update the `observaciones` table schema in Supabase
2. Update the `Request` interface in `src/types.ts`
3. Update the field mapping in `RequestsView.tsx` (where DB rows are mapped to `Request` objects)
4. Update any components that display/edit the field
