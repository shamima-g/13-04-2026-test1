# Story: Authentication, Role Configuration, and Role-Based Routing

**Epic:** Authentication and Role-Based Routing | **Story:** 1 of 1 | **Wireframe:** N/A

**Role:** All Roles

**Requirements:** [R1](../specs/feature-requirements.md#functional-requirements), [R2](../specs/feature-requirements.md#functional-requirements), [BR9](../specs/feature-requirements.md#business-rules), [BR10](../specs/feature-requirements.md#business-rules), [NFR1](../specs/feature-requirements.md#non-functional-requirements)

## Story Metadata

| Field | Value |
|-------|-------|
| **Route** | `/`, `/tasks`, `/tasks/all` |
| **Target File** | `app/page.tsx`, `types/roles.ts`, `lib/auth/auth.config.ts`, `lib/auth/auth-server.ts`, `app/(protected)/tasks/page.tsx`, `app/(protected)/tasks/all/page.tsx` |
| **Page Action** | `modify_existing` |

## User Story

**As a** signed-in user **I want** to be automatically sent to the right page for my role when I sign in **So that** I can immediately see and work on what is relevant to me without manual navigation.

## Acceptance Criteria

### Sign-In and Role-Based Redirect

- [ ] AC-1: Given I am a team-member and I sign in, when sign-in succeeds, then I am sent to my personal task list at `/tasks`.
- [ ] AC-2: Given I am an admin and I sign in, when sign-in succeeds, then I am sent to the all-tasks view at `/tasks/all`.

### Home Page Redirect

- [ ] AC-3: Given I am signed in as a team-member and I visit `/`, when the page loads, then I am immediately redirected to `/tasks` without seeing a placeholder page.
- [ ] AC-4: Given I am signed in as an admin and I visit `/`, when the page loads, then I am immediately redirected to `/tasks/all` without seeing a placeholder page.
- [ ] AC-5: Given I am not signed in and I visit `/`, when the page loads, then I am redirected to the sign-in page.

### Unauthenticated Access (BR10)

- [ ] AC-6: Given I am not signed in and I try to visit `/tasks`, when the page loads, then I am redirected to the sign-in page.
- [ ] AC-7: Given I am not signed in and I try to visit `/tasks/all`, when the page loads, then I am redirected to the sign-in page.

### Admin-Only Route Protection (BR9)

- [ ] AC-8: Given I am signed in as a team-member and I navigate directly to `/tasks/all`, when the page loads, then I am silently redirected to `/tasks` with no error message shown.
- [ ] AC-9: Given I am signed in as an admin and I visit `/tasks/all`, when the page loads, then I am not redirected and I can see the all-tasks view.

### Role Values

- [ ] AC-10: Given the application is running, when a user's role is read from their session, then the role value is either `admin` or `team-member` — no other role values exist in the system.

### Accessibility (NFR1)

- [ ] AC-11: Given I am on the sign-in page, when I navigate using only the keyboard, then I can reach and activate all interactive controls (email field, password field, sign-in button) without using a mouse.

## API Endpoints (from OpenAPI spec)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/auth/login` | Authenticate user and obtain session |
| POST | `/v1/auth/logout` | End the current session |
| GET | `/v1/auth/me` | Get the current authenticated user's profile and role |

## Implementation Notes

- **Replace the 4-role enum** in `types/roles.ts`: remove `POWER_USER`, `STANDARD_USER`, and `READ_ONLY`. Keep only `ADMIN = 'admin'` and add `TEAM_MEMBER = 'team-member'`. Update `ROLE_HIERARCHY`, `roleDescriptions`, `DEFAULT_ROLE`, and all helper functions (`isValidRole`, `getAllRoles`, `getRoleLevel`) to reference only the two FRS roles.
- **Audit every usage** of the old enum values across `lib/auth/auth.config.ts`, `lib/auth/auth-helpers.ts`, `lib/auth/auth-server.ts`, `types/next-auth.d.ts`, and any test or mock files. Replace all references with the new two-role enum.
- **Update the demo users** in `auth.config.ts` to include only `admin@example.com` (role: `admin`) and `user@example.com` (role: `team-member`). Remove the `power@example.com` and `readonly@example.com` demo entries.
- **Post-sign-in redirect**: In `auth.config.ts` callbacks (or a Next.js `authorized` callback / middleware), after a successful sign-in detect the user's role and redirect: `admin` → `/tasks/all`, `team-member` → `/tasks`. NextAuth's `redirect` callback receives `url` and `baseUrl` — set the destination based on `token.role`.
- **Home page** (`app/page.tsx`): Convert to an async server component. Call `getSession()` (from `lib/auth/auth-server.ts`). If authenticated and role is `admin`, `redirect('/tasks/all')`; if `team-member`, `redirect('/tasks')`; if unauthenticated, `redirect('/auth/signin')`. Replace the existing template placeholder content entirely.
- **Task route shells**: Create minimal placeholder server components at `app/(protected)/tasks/page.tsx` (team-member landing) and `app/(protected)/tasks/all/page.tsx` (admin landing) to satisfy routing. These will be replaced in Epic 2. The `(protected)` layout group already calls `requireAuth()` so unauthenticated users hitting these routes are redirected to sign-in (BR10) without extra code.
- **Admin-only guard for `/tasks/all`**: Add a layout or page-level check in `app/(protected)/tasks/all/` that reads `session.user.role`. If role is `team-member`, call `redirect('/tasks')` silently (BR9 — no error page). Use `requireExactRole` from `auth-server.ts` as a model, but replace the forbidden redirect with a redirect to `/tasks` instead.
- **No new auth provider needed**: The template already uses NextAuth with a Credentials provider and JWT sessions. This story configures it for the FRS roles; it does not change the provider strategy.
- **FRS-Over-Template rule applies**: The template's 4-role enum, demo users, and hierarchy are template defaults. This story replaces them — do not extend or keep unused roles alongside the FRS roles.
