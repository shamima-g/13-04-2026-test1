# Manual Verification Checklist
## Epic 2, Story 5: Team Member — Mark Task Complete

> This is the final story in Epic 2. In addition to Story 5 checks, this checklist covers a brief
> end-to-end pass across all Epic 2 stories (Stories 1–5) to confirm the full task management
> experience works together.
>
> **How to start:**
> Run `npm run dev` inside the `web/` folder, then open http://localhost:3000.
>
> **Demo credentials:**
> | Who | Email | Password |
> |-----|-------|----------|
> | Admin | admin@example.com | Admin123! |
> | Team Member | user@example.com | User123! |

---

## Section 1: "Mark Complete" button is visible only when it should be (AC-1, AC-2, AC-3)

- [ ] Sign in as a team member (`user@example.com`)
- [ ] Go to http://localhost:3000/tasks — you should see your assigned tasks
- [ ] Find a task that is currently **pending** and assigned to you
- [ ] Open that task's detail modal — you should see a **"Mark Complete"** button
- [ ] Now find (or open) a task that is already **complete** — the **"Mark Complete"** button should NOT be shown
- [ ] Sign out, then sign in as admin (`admin@example.com`)
- [ ] Go to http://localhost:3000/tasks/all and open any task's detail — the **"Mark Complete"** button should NOT appear for any task

---

## Section 2: Loading indicator while the request is processing (AC-4, AC-5)

- [ ] Sign in as a team member and open a pending task assigned to you
- [ ] Click **"Mark Complete"**
- [ ] While the request is being sent, a loading indicator should appear on the button (e.g., spinner, "Loading…" text, or the button becomes disabled)
- [ ] The task's status should still show **Pending** while the request is in flight — it should NOT flip to "Complete" before the server responds

---

## Section 3: Successful mark-complete updates the task (AC-6, AC-7, AC-8)

- [ ] Click **"Mark Complete"** on a pending task (ensure the API backend is running at http://localhost:3001)
- [ ] After the server confirms the change, the task's status should update to **Complete**
- [ ] The **"Mark Complete"** button should disappear from that task
- [ ] The page should NOT do a full reload — only the task status updates
- [ ] If you have the **"Pending"** filter selected, the task should disappear from the list after it is marked complete (it now belongs in the "Complete" view)
- [ ] Switch the filter to **"Complete"** — the task should now appear there

---

## Section 4: No way to undo a completed task (AC-9)

- [ ] Open any task that has status **Complete** (as team member or admin)
- [ ] Confirm there is no **"Revert to Pending"**, **"Undo"**, or similar button visible
- [ ] This applies to both team-member view and admin view

---

## Section 5: Error handling when the request fails (AC-10, AC-11, AC-12)

> This section requires either a live backend that can be taken offline, or browser dev tools to block the network request.

- [ ] With the backend offline or the `/v1/tasks/{id}/complete` request blocked, click **"Mark Complete"** on a pending task
- [ ] An error message should appear letting you know the update did not go through
- [ ] The task should still show **Pending** status — it should NOT switch to Complete
- [ ] The **"Mark Complete"** button should still be visible so you can try again

---

## Section 6: Full Epic 2 end-to-end pass (Stories 1–5 together)

> Since this is the last story in Epic 2, do a quick pass over the key flows from every story to confirm nothing was broken.

### Task list (Story 1)
- [ ] Sign in as team member — the task list at `/tasks` loads and shows your assigned tasks
- [ ] Filter by "Pending" and "Complete" — each filter shows the correct tasks
- [ ] Sign in as admin — the all-tasks list at `/tasks/all` loads and shows all tasks for all users

### Task detail modal (Story 2)
- [ ] Click any task row — a detail modal appears with the task's title, description, due date, and assigned user
- [ ] Clicking outside the modal (or pressing Escape) closes it

### Admin create task (Story 3)
- [ ] Sign in as admin — a **"Create Task"** button is visible on the all-tasks page
- [ ] Click it — a form opens with fields for Title, Description, Due Date, and Assigned User
- [ ] Fill in all required fields and submit — the new task appears in the list

### Admin edit and delete task (Story 4)
- [ ] Open a task detail modal as admin — an **"Edit"** button and a **"Delete"** button are visible
- [ ] Edit the task title and save — the updated title appears in both the modal and the task list
- [ ] Click **"Delete"**, then confirm — the task is removed from the list

### Mark complete (Story 5)
- [ ] Open a pending task assigned to the team member — **"Mark Complete"** is visible
- [ ] Click it — the task updates to Complete and the button disappears

---

## Completion

Mark all checkboxes above when verified. If any step does not behave as described, note what you observed so the issue can be investigated.
