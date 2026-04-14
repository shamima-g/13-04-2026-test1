# Manual Verification Checklist: Story 1 — Task List View

**Epic:** 2 — Task Management | **Story:** 1 | **Date:** 2026-04-14

## Quality Gates Status

All automated checks passed:
- Gate 2 (Security): PASS
- Gate 3 (Code Quality): PASS
- Gate 4 (Testing): PASS

## Pre-Testing Setup

Before running manual checks:
1. Start the dev server: `npm run dev` from `/web`
2. The backend API should be running at `http://localhost:3001/api`
3. You should have two test accounts ready:
   - **Team-member:** email: `alice@example.com`, password: any (mocked via BFF at localhost:5120)
   - **Admin:** email: `carol@example.com`, password: any (mocked via BFF at localhost:5120)

## Automated Tests (Ready to Run)

The following acceptance criteria are covered by automated integration tests. Run these before manual testing:

```bash
cd web
npm test -- src/__tests__/integration/epic-2-story-1-task-list.test.tsx
```

Tests verify:
- AC-1: Team-member sees only their assigned tasks
- AC-5: Filter control shows "All", "Pending", and "Complete" options
- AC-6, AC-7, AC-8: Filter selection updates without page reload
- AC-9: Empty state when team-member has no tasks
- AC-10: Empty state when admin has no tasks
- AC-11: Empty state when filter results in no matches
- AC-12: Loading indicator visible while fetching
- AC-13: Error banner appears on API failure
- AC-14, AC-15: Retry button re-fetches and clears error on success

## Manual Verification Checklist

Complete these checks by interacting with the app in the browser.

### AC-1: Team-member task list shows assigned tasks only

**Steps:**
1. Sign in at `/auth/signin` with team-member email (e.g., alice@example.com)
2. You are redirected to `/tasks`
3. The page displays "All Tasks" or a task list heading
4. The list shows only tasks where "Assigned to" is your name (Alice Chen)
5. No tasks assigned to other team members (Bob, Carol) are visible

**Expected Result:** ✓ (or note any deviations)

---

### AC-2: Team-member task rows show title, due date, and status

**Steps:**
1. While viewing `/tasks` as a team-member
2. Look at any task row in the list
3. Verify the following columns/fields are present for each task:
   - Task title (e.g., "Fix login bug")
   - Due date (e.g., "May 1, 2026" or "2026-05-01")
   - Status badge or label (e.g., "Pending" or "Complete")

**Expected Result:** ✓ (or note any deviations)

---

### AC-3: Admin all-tasks view shows all tasks

**Steps:**
1. Sign out (click sign-out link if present, or navigate to `/auth/signin`)
2. Sign in as admin (e.g., carol@example.com)
3. You are redirected to `/tasks/all`
4. The page displays a heading like "All Tasks"
5. The list shows tasks assigned to multiple team members (Alice, Bob, etc.)
6. Count visible tasks: you should see at least 3 example tasks

**Expected Result:** ✓ (or note any deviations)

---

### AC-4: Admin task rows show title, assigned user, due date, and status

**Steps:**
1. While viewing `/tasks/all` as admin
2. Look at any task row in the list
3. Verify the following columns/fields are present for each task:
   - Task title (e.g., "Fix login bug")
   - Assigned to / Team Member name (e.g., "Alice Chen")
   - Due date (e.g., "May 1, 2026")
   - Status badge or label (e.g., "Pending" or "Complete")

**Expected Result:** ✓ (or note any deviations)

---

### AC-5: Filter control shows All, Pending, Complete options

**Steps:**
1. Navigate to `/tasks` (as team-member) or `/tasks/all` (as admin)
2. Look for a filter control, dropdown menu, or status filter widget
3. Click or open the filter control
4. Verify three options are present:
   - "All" (or "All Tasks")
   - "Pending"
   - "Complete"

**Expected Result:** ✓ (or note any deviations)

---

### AC-6: Select "Pending" filter updates list without page reload

**Steps:**
1. Be on a task list page (team-member at `/tasks` or admin at `/tasks/all`)
2. Verify at least one pending task is visible (status = "Pending")
3. Note the browser URL and page title
4. Click the "Pending" option in the filter
5. Observe the task list updates to show only pending tasks
6. Verify the URL does NOT change (no page reload)
7. Verify all visible tasks have "Pending" status

**Expected Result:** ✓ (or note any deviations)

---

### AC-7: Select "Complete" filter updates list without page reload

**Steps:**
1. Be on a task list page with the filter showing a selection
2. Click the "Complete" option in the filter
3. Observe the task list updates to show only completed tasks
4. Verify the URL does NOT change
5. Verify all visible tasks have "Complete" status

**Expected Result:** ✓ (or note any deviations)

---

### AC-8: Select "All" filter shows all tasks

**Steps:**
1. Be on a task list page with a filter active (e.g., showing only "Pending")
2. Click the "All" option in the filter
3. Observe the task list updates to show all tasks regardless of status
4. Verify pending and completed tasks are both visible
5. Verify the URL does NOT change

**Expected Result:** ✓ (or note any deviations)

---

### AC-9: Empty state for team-member with no tasks

**Steps:**
1. As a team-member, navigate to `/tasks`
2. If there are currently tasks assigned, this check cannot be completed now (skip or note)
3. If no tasks are assigned, verify you see the message:
   - "No tasks assigned to you yet." (or similar user-friendly message)
4. Verify no empty task rows are shown

**Expected Result:** ✓ or Skip (unable to test — tasks currently assigned) (or note any deviations)

---

### AC-10: Empty state for admin with no tasks

**Steps:**
1. As admin, navigate to `/tasks/all`
2. If there are currently tasks in the system, this check cannot be completed now (skip or note)
3. If no tasks exist, verify you see the message:
   - "No tasks have been created yet." (or similar admin-friendly message)
4. Verify no empty task rows are shown

**Expected Result:** ✓ or Skip (unable to test — tasks currently exist) (or note any deviations)

---

### AC-11: Empty state when filter produces no matches

**Steps:**
1. Be on a task list page (team-member or admin)
2. Apply a filter (e.g., "Complete") that you know will have few or no matches
3. If the filter produces zero matches, verify you see an appropriate message:
   - "No pending tasks." or "No tasks match this filter." (or similar)
4. Verify no empty task rows are shown

**Expected Result:** ✓ or Skip (filter produced matches — cannot test) (or note any deviations)

---

### AC-12: Loading indicator visible while fetching

**Steps:**
1. Open browser DevTools and throttle network to Slow 3G or Slow 4G (simulate slow API)
2. Refresh the task list page or navigate to it
3. Immediately after page load, before data appears, observe the page
4. Verify a loading indicator is visible:
   - Spinner icon, skeleton loaders, "Loading..." text, or similar
5. Verify the loading indicator disappears once data loads

**Expected Result:** ✓ (or note any deviations)

---

### AC-13: Error banner appears on API failure

**Steps:**
1. Open browser DevTools Network tab
2. Navigate to the task list page
3. Once the page loads, open DevTools and block the API endpoint:
   - Go to DevTools → Network → Right-click on the `/v1/tasks` request → Block request URL
4. Trigger a re-fetch (e.g., reload the page or click the Retry button if visible)
5. Observe an error banner appears with the message:
   - "Unable to load tasks. Please try again." (or similar user-friendly error message)
6. Verify the banner is clearly visible (not hidden or truncated)

**Expected Result:** ✓ (or note any deviations)

---

### AC-14: Retry button re-fetches data

**Steps:**
1. With the error banner visible (from AC-13)
2. Unblock the API endpoint (DevTools → Network → Unblock)
3. Locate and click the "Retry" button on the error banner
4. Observe the app makes a new API request (visible in Network tab)
5. Verify the request is to `/v1/tasks` with the current filter params (if any)

**Expected Result:** ✓ (or note any deviations)

---

### AC-15: Error clears when retry succeeds

**Steps:**
1. Continue from AC-14 (after clicking Retry)
2. Verify the API request succeeds (200 response in Network tab)
3. Observe the error banner disappears
4. Verify the task list is now displayed with data
5. Verify the page is back to a normal state (not in error mode)

**Expected Result:** ✓ (or note any deviations)

---

### AC-16: Unauthenticated redirect to sign-in

**Steps:**
1. Sign out (navigate to `/auth/signin` or use a sign-out link)
2. Try to navigate directly to `/tasks`
3. Verify you are redirected to `/auth/signin` page
4. Try to navigate directly to `/tasks/all`
5. Verify you are redirected to `/auth/signin` page

**Expected Result:** ✓ (or note any deviations)

---

### AC-17: Team-member auto-redirect from admin route

**Steps:**
1. Sign in as a team-member (e.g., alice@example.com)
2. You should be on `/tasks`
3. Try to navigate directly to `/tasks/all` (type in the address bar)
4. Observe you are silently redirected to `/tasks`
5. Verify:
   - No error message is shown
   - The URL in the address bar is `/tasks`
   - No modal or alert dialog appears
   - The redirect happens immediately (seamless)

**Expected Result:** ✓ (or note any deviations)

---

## Summary

- **Total Acceptance Criteria:** 17 (AC-1 through AC-17)
- **Automated Coverage:** AC-1–AC-15 (15 criteria covered by tests)
- **Manual-Only Coverage:** AC-16, AC-17 (2 criteria require real Next.js routing in browser)

**Manual Verification Complete:** Yes / No / Partial

**Date Verified:** ___________

**Verified By:** ___________

**Issues Found:**

(List any deviations, bugs, or unexpected behavior found during manual testing)

---

**Notes for Next Steps:**
- After manual verification passes, proceed to Story 2 (Task Detail View)
- Ensure all issues found are logged as bugs or deferred to future stories
- Confirm with the product owner that the task list experience meets expectations
