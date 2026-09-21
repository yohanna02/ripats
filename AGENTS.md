<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

# RIPATS Project Guide

## Product

RIPATS means **Research Innovation, Patent and Tracking System**. It is the ATBU research-protection and controlled-disclosure product for the RAPID project (Research Discovery, AI-Driven Patent Intelligence, and Commercial Impact Measurement Dashboard).

The product is a secure research-lifecycle layer around university repositories. It protects provenance and sensitive research, controls disclosure, records access activity, and lets legitimate collaborators discover approved innovation summaries. It does not replace TERAS, NIRIS, institutional repositories, plagiarism checking, or formal patent/IP processes.

The core lifecycle is: **Protect -> Verify -> Control -> Track -> Connect**.

## Stack

- React 19 + TypeScript 6.
- Vite 8 frontend.
- React Router 7 for URL routing.
- Convex 1.46 backend and database.
- `@convex-dev/auth` 0.0.95 for password authentication, email verification, and password reset.
- Zustand for client UI/auth state.
- Tailwind CSS 4 and `@tailwindcss/vite` are installed. The current product styling is primarily in `src/ProductApp.css` and `src/index.css`; preserve the existing visual system when adding Tailwind utilities.
- Lucide React for icons.
- Nodemailer in Convex Node actions for SMTP email.
- Mammoth, XLSX, and JSZip for in-browser document preview support.

The configured development deployment is `dev:grand-marten-285` (`ripat`). Use the deployment selected by the local Convex CLI configuration; do not assume a production deployment.

## Frontend Architecture

The application entry point is `src/main.tsx`, which creates the Convex Auth provider, React Router browser router, toast provider, and `ProductApp`.

Use folder-based screens and keep product logic out of a monolithic `App.tsx`:

- `src/routes/AppRoutes.tsx`: route configuration.
- `src/features/layout/WorkspaceFrame.tsx`: signed-in app/admin shell, navigation, search, notification popover, and sign-out.
- `src/features/auth/`: auth screens, setup flows, and route guards.
- `src/features/public/`: landing page, public innovation archive, and public research profile.
- `src/features/research/`: research registry, record details, uploads, controlled access requests, access review queues, and document viewing.
- `src/features/dashboard/`: user and admin dashboard screens.
- `src/features/admin/`: administration, security, users, reports, and documentation screens.
- `src/features/account/`: profile/settings screen.
- `src/features/core/`: shared types, constants, access-device key, and request-context helpers.
- `src/components/ui/`: reusable product UI primitives and toast provider.
- `src/components/layout/`: compatibility wrappers for the app/admin shells and route guard.
- `src/pages/`: thin route-level adapters that import feature screens.
- `src/store/useAppStore.ts`: Zustand state for auth status, workspace search, mobile navigation, notification popover state, and toasts.

Do not move the whole product back into `src/App.tsx` or create a screen that mixes routing, backend logic, and every other screen.

## Route Map

Public routes:

- `/`: full RIPATS landing page.
- `/research`: public innovation archive.
- `/research/:researchId`: public innovation profile. Only approved public metadata is shown; protected packages require authorization.
- `/documentation`: public documentation.
- `/sign-in`, `/sign-up`: authentication.

User workspace routes under `/app`:

- `/app`: user dashboard.
- `/app/research`: current user's research registry.
- `/app/research/new`: register research.
- `/app/research/:id`: research details, versions, integrity checks, and authorized viewing.
- `/app/reviews`: requests for research owned by the signed-in user.
- `/app/access`: access requests submitted by the signed-in user.
- `/app/profile`: profile/settings.
- `/app/documentation`: workspace documentation.

Admin routes under `/admin`:

- `/admin`: institutional dashboard.
- `/admin/research`, `/admin/research/new`, `/admin/research/:id`: institutional research registry.
- `/admin/access`: institution-wide access review queue.
- `/admin/security`: security alerts and audit activity.
- `/admin/users`: user and role administration.
- `/admin/reports`: institutional reports and exports.
- `/admin/profile`, `/admin/documentation`: admin settings and documentation.

`Guard`/`RouteGuard` must protect authenticated routes and enforce role boundaries. Public research discovery must remain readable without authentication, but access-request submission must require an active, verified signed-in profile.

## Convex Backend

Before editing anything under `convex/`, read `convex/_generated/ai/guidelines.md`. It is mandatory project guidance and takes precedence over recalled Convex patterns. Do not edit files under `convex/_generated/` manually; regenerate them with Convex tooling.

Important backend files:

- `convex/schema.ts`: database schema and indexes.
- `convex/research.ts`: research, versions, public discovery, access requests, access decisions, notifications, audit events, and dashboard/report queries.
- `convex/account.ts`: profile creation, profile updates, administrator bootstrap, and user management.
- `convex/lib/access.ts`: server-side identity/profile checks and audit event helper.
- `convex/auth.ts`: Convex Auth provider configuration.
- `convex/auth.config.ts`: Convex Auth JWT provider configuration.
- `convex/mail.ts`: internal Node actions for verification/reset codes and access-request email notices.
- `convex/http.ts`: Convex Auth HTTP routes.
- `convex/convex.config.ts`: typed Convex environment variable declarations.
- `convex/seed.ts`: explicit administrator/institution seed helper.

All Convex functions need argument validators. Use server-side authorization on every protected query/mutation. Never accept a user/profile ID from the client as the source of authorization; derive identity with Convex Auth and `requireProfile`.

`requireProfile` requires:

1. An authenticated Convex Auth session.
2. An active `userProfiles` record.
3. A verified email address.

Use `requireDisclosureOfficer` for institution-wide IP/admin review and `requireAdministrator` for administrator/security operations. Research owners may decide requests for their own records; administrators and IP officers may decide institution-wide requests.

## Data Model and Security Invariants

The important application tables are `institutions`, `institutionMetrics`, `userProfiles`, `research`, `researchVersions`, `accessRequests`, `auditEvents`, `notifications`, and `securityAlerts`, plus the Convex Auth tables.

Research classifications are `public`, `restricted`, `confidential`, and `ip_sensitive`. Research statuses include `draft`, `submitted`, `verified`, `in_review`, `published`, and `rejected`.

Every registered file version has a SHA-256 fingerprint, version number, timestamp, submitter, and optional Convex storage ID. Do not bypass version registration or expose storage URLs without authorization.

Access requests include organization, purpose, duration, requested scopes (`view`, `download`, `summary`), requester profile, status, approval expiry, one-time access code, one-device session activation fields, and request context. Request context records a browser session marker, source path, referrer, user agent, platform, locale, timezone, and `web` channel. Convex mutations do not expose visitor IP addresses; do not invent an IP value.

The access flow is:

1. Signed-in, active, verified user opens an approved public innovation profile.
2. User requests one or more scopes and duration.
3. Server validates identity, ownership, record status, scopes, and request context.
4. Owner/admin receives in-app notification and an SMTP email notice where configured.
5. Authorized reviewer approves or declines.
6. Approval creates an access code and expiry.
7. Requester activates the grant on one device/session.
8. Server checks scope, expiry, requester, and device key for protected viewing/download.
9. Access and denials are written to the audit trail.

Do not make research files public merely because a public innovation profile exists. Public summaries and protected evidence are separate concerns.

## Notifications

Notifications are stored in the `notifications` table and queried through `api.research.myNotifications`. They may reference a research record and an access request, include `actionRoute` and `actionRequired`, and have an optional `readAt` timestamp.

The workspace notification bell must:

- Show an unread count and `New` state.
- Keep unread items unread when the popover opens.
- Mark an item read when the user follows it or explicitly marks it read.
- Close when the user clicks outside the popover.
- Navigate action-required items to the relevant review/request route.
- Expose working approve/decline controls for access-request notifications.

Use `markNotificationsRead` only for notifications owned by the current profile. Do not expose another user's notification records.

## Email and Environment

Email is sent by Convex Node actions in `convex/mail.ts`. Required Convex environment variables are:

- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`
- `AUTH_EMAIL_FROM`

Optional variables:

- `SMTP_PORT` (defaults to `465`)
- `SMTP_SECURE` (secure unless set to `false`)
- `ATBU_ADMIN_EMAIL`
- `ATBU_BOOTSTRAP_CODE`

`VITE_CONVEX_URL` is required by the frontend and must point to the selected Convex deployment. If it is missing, the app intentionally renders a configuration screen.

Email verification and password reset must continue to work through `convex/auth.ts`. Access-request email failures should be observable and must not silently claim successful delivery when SMTP is not configured.

## Styling and UI Conventions

The product uses a premium academic/institutional visual language: restrained green, brass, red, and paper tones; dense but readable workspace layouts; clear hierarchy; and Lucide icons. Preserve existing responsive CSS in `src/ProductApp.css` and `src/index.css`.

Use icons in action buttons, visible labels for unfamiliar actions, adequate font sizes, accessible labels, keyboard-focusable controls, and stable responsive dimensions. Avoid putting the whole application inside nested decorative cards or creating marketing-only screens where a usable workflow belongs.

## Verification Commands

Run these from the repository root after implementation:

```bash
npx tsc -b --pretty false
npm run lint
npm run build
npx convex dev
```

`npm run lint` may report existing unused-disable warnings in generated Convex files. Do not edit generated files solely to remove those warnings. Treat TypeScript errors, lint errors in authored files, frontend build failures, and Convex bundle failures as blocking.

When running `npx convex dev`, confirm the CLI is targeting the development deployment shown in its output. Do not deploy production or change environment variables without explicit authorization.

## Change Discipline

Prefer small, feature-scoped changes that follow existing Convex and feature-folder patterns. Preserve unrelated user changes in the working tree. Use `apply_patch` for manual edits. Do not use destructive Git commands or revert unrelated work. Update validators, schema, generated types, frontend calls, and route guards together when changing a backend contract.
