# Manual Verification Checklist — Story 2: Task Detail Modal

**Route:** `/tasks` (team-member) and `/tasks/all` (admin)

To verify, open the app in your browser at http://localhost:3000 and sign in. Make sure the backend is running at http://localhost:3001.

---

## Opening the Modal

- [ ] **AC-1:** When you click on any task in the list, a pop-up (modal) appears on screen showing that task's details.
- [ ] **AC-2:** The task's title (e.g. "Update onboarding docs") is clearly visible at the top of the pop-up.
- [ ] **AC-3:** If the task has a description, you can read the full description text in the pop-up.
- [ ] **AC-4:** If the task has no description, the pop-up still opens without any errors. You see either a blank area or a placeholder message like "No description provided" — never the word "undefined".
- [ ] **AC-5:** The task's due date is shown in a readable format like "May 15, 2026" (not a raw date like "2026-05-15").
- [ ] **AC-6:** The name of the person the task is assigned to (e.g. "Sarah Chen") is visible in the pop-up.
- [ ] **AC-7:** The task's status appears as either "Pending" or "Complete" (with a capital letter), not lowercase.

## Closing the Modal

- [ ] **AC-8:** You can close the pop-up by pressing the Escape key on your keyboard, or by clicking outside the pop-up. After closing, you are back on the task list.
- [ ] **AC-9:** After closing the pop-up, the task list still shows all the same tasks as before — nothing has changed or disappeared.

## Read-Only View (No Action Buttons)

- [ ] **AC-10 (team-member):** Sign in as a team member. Open any task. The pop-up shows task details only — there are no "Edit", "Delete", or "Mark Complete" buttons visible.
- [ ] **AC-11 (admin):** Sign in as an admin. Open any task. The pop-up shows task details only — there is no "Mark Complete" button, even for pending tasks.

## Extra Check

- [ ] **Edge case:** Click on one task, close the pop-up, then click on a different task. The pop-up should show the second task's details — not the first task's information.
