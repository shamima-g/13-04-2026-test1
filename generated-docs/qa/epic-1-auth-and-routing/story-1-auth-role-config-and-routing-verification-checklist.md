# Manual Verification Checklist
## Epic 1, Story 1: Authentication, Role Configuration, and Role-Based Routing

> Use this checklist to verify the story works correctly in your browser.
> Start the app with `npm run dev` inside the `web/` folder, then open http://localhost:3000.
>
> **Demo credentials:**
> | Who | Email | Password |
> |-----|-------|----------|
> | Admin (manager) | admin@example.com | Admin123! |
> | Team Member | user@example.com | User123! |

---

## Section 1: Sign in as a team member and land on the right page (AC-1, AC-3)

- [ ] Go to http://localhost:3000/auth/signin
- [ ] Type `user@example.com` and `User123!` and click **Sign In**
- [ ] You should be taken directly to `/tasks` (the "My Tasks" page) — not to the home page
- [ ] The page shows "My Tasks" and welcomes you by name
- [ ] You are NOT taken to `/tasks/all`

---

## Section 2: Sign in as an admin and land on the right page (AC-2, AC-4)

- [ ] Sign out first (or open a private/incognito window)
- [ ] Go to http://localhost:3000/auth/signin
- [ ] Type `admin@example.com` and `Admin123!` and click **Sign In**
- [ ] You should be taken directly to `/tasks/all` (the "All Tasks" page) — not to the home page
- [ ] The page shows "All Tasks" and greets you by name
- [ ] You are NOT taken to `/tasks`

---

## Section 3: Home page redirects based on who is signed in (AC-3, AC-4, AC-5)

- [ ] While signed in as a team member, go to http://localhost:3000 (the home page)
- [ ] You should be immediately sent to `/tasks` — you should never see a placeholder or blank home page
- [ ] Sign out and sign back in as admin
- [ ] Go to http://localhost:3000 — you should be immediately sent to `/tasks/all`
- [ ] Sign out completely, then go to http://localhost:3000 — you should be sent to the sign-in page

---

## Section 4: Unauthenticated users cannot reach protected pages (AC-6, AC-7)

- [ ] Sign out so you are logged out
- [ ] Try to go directly to http://localhost:3000/tasks — you should be redirected to the sign-in page
- [ ] Try to go directly to http://localhost:3000/tasks/all — you should be redirected to the sign-in page
- [ ] In both cases, you should NOT see a task page or an error page — just the sign-in form

---

## Section 5: Team members cannot access the admin-only page (AC-8, AC-9)

- [ ] Sign in as team member (`user@example.com`)
- [ ] While signed in, try to go directly to http://localhost:3000/tasks/all
- [ ] You should be silently redirected to `/tasks` — no error message, no "forbidden" page
- [ ] The browser URL should show `/tasks` (not `/tasks/all` or anything with "forbidden")
- [ ] Sign out and sign in as admin (`admin@example.com`)
- [ ] Go to http://localhost:3000/tasks/all — you should see the "All Tasks" page normally, with no redirect

---

## Section 6: Sign-in page keyboard accessibility (AC-11)

- [ ] Go to http://localhost:3000/auth/signin
- [ ] Click anywhere outside the form, then press **Tab** to move focus into the page
- [ ] Pressing Tab should move focus to the **Email** field, then **Password** field, then the **Sign In** button — in that order
- [ ] You should be able to type in both fields using only the keyboard
- [ ] Press **Enter** after typing your password — the form should submit (same as clicking Sign In)
- [ ] None of these controls should be unreachable by keyboard

---

## Section 7: Error message on wrong credentials (Edge 1)

- [ ] Go to http://localhost:3000/auth/signin
- [ ] Type any email and a wrong password, then click **Sign In**
- [ ] An error message should appear on the page (e.g., "Invalid credentials")
- [ ] You should stay on the sign-in page — no redirect should happen
- [ ] The error message should be visible and readable

---

## Completion

Mark all checkboxes above when verified. If any check fails, note what you observed so the issue can be investigated.
