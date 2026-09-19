# RIPATS session handoff

## Current objective

Complete the full ATBU RIPATS product: premium public landing and archive, researcher and administrator workspaces, Convex data/authentication, server-side authorization, controlled access, audit evidence, and documentation.

## User constraints

- Do not run builds until the user says the feature set is ready.
- Continue from this note if the session context expires.
- Do not run the build, lint, dev server, deployment, or browser testing until the user explicitly says the feature set is ready.

## Implemented in the current workspace

- `src/ProductApp.tsx` is now a routed product with `/`, `/research`, `/research/:researchId`, `/documentation`, `/sign-in`, `/sign-up`, `/setup-account`, `/setup-administrator`, `/app/*` and `/admin/*` routes.
- `src/ProductApp.css` provides the responsive, premium academic public site and app-shell design with a 16px baseline and larger dashboard controls/text.
- `src/main.tsx` wraps the application in `ConvexAuthProvider` and `BrowserRouter`; it shows a configuration screen when `VITE_CONVEX_URL` is absent.
- Convex schema includes institutions, metrics, profiles, research, immutable versions, access requests, audit events and alerts alongside Convex Auth tables.
- Password authentication uses email verification via Resend. `ensureProfile` and all protected server operations require a verified email.
- Route guards cover unauthenticated users, missing profiles, suspended accounts and institution/admin-only routes.
- Research registration creates protected records; file upload registers storage metadata and SHA-256 fingerprinted versions.
- Public archive/profile queries expose only explicit `innovationSummary` values from published innovation profiles. Full internal abstracts never reach those public endpoints.
- Access requests derive requester identity from the authenticated profile. Approvals are time limited; every file URL checks server-side authority and writes an audit event.
- Admin screens contain access approvals, role management, security alerts and audit activity. Researcher screens contain personal research and submitted-access-request views.
- Documentation guide cards expand to real guidance text.

## Verified state

- `@convex-dev/auth@0.0.95` does not export `env` from `@convex-dev/auth/server`. `convex/auth.ts` now uses `process.env.RESEND_API_KEY` and `process.env.AUTH_EMAIL_FROM`, matching the installed package source and preserving Resend OTP verification and password reset providers.
- Auth verification in this version is represented by `users.emailVerificationTime`; protected RIPATS operations and profile setup check that field.
- `npx convex dev --once` successfully bundled and deployed the functions to the configured development deployment on 2026-09-19.
- `npm run build` passes (`tsc -b && vite build`). `npm run lint` has no errors; its four remaining warnings are generated Convex files' unused eslint-disable comments.
- React Router remains the installed routing solution. `src/routes/AppRoutes.tsx` now owns URL mapping. The root `src/ProductApp.tsx` is limited to authenticated redirect behavior, with page entries under `src/pages/` and route/layout wrappers under `src/components/layout/`.

## Important state

- Do not run `npm run build`, `npm run lint`, `npm run dev`, Convex deployment/codegen, or browser tests until the user says the feature set is ready. Source formatting was run successfully with Prettier only.
- No Convex deployment has been selected or changed. Before deploying, inspect the target and follow the project's Convex deploy guard.
- Required deployment configuration: `JWT_PRIVATE_KEY`, `JWKS`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `ATBU_ADMIN_EMAIL`, `ATBU_BOOTSTRAP_CODE`; frontend needs `VITE_CONVEX_URL`.
- Convex generated files were refreshed by the successful `convex dev --once` verification. Do not manually edit generated API files.
- The current public profile publishing flow needs an IP officer or administrator. A researcher can draft the innovation summary but cannot publish it.
- The `PublicInnovationPage` function and all route components should be included in the next build/typecheck review. This was not run at the user’s request.

## Files changed

- `src/ProductApp.tsx`, `src/ProductApp.css`, `src/main.tsx`, `src/index.css`
- `convex/schema.ts`, `convex/auth.ts`, `convex/auth.config.ts`, `convex/http.ts`, `convex/convex.config.ts`
- `convex/account.ts`, `convex/research.ts`, `convex/lib/access.ts`
- `package.json` and lockfile include `@convex-dev/auth` and `react-router-dom`.
