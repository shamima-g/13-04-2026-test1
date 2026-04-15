# Manual Verification Checklist — Story 3: Admin: Create Task

**Epic:** Task Management | **Story:** 3 of 5
**Route:** `/tasks/all` (create form opens as an overlay on this page)
**Role:** Admin

Use this checklist to verify the story in the browser. Test as an **admin** user unless otherwise noted.

---

## Before You Start

- [ ] Start the dev server (`npm run dev` from the `web/` folder)
- [ ] Make sure the backend API is running at `http://localhost:3001/api`
- [ ] Sign in as an **admin** user

---

## AC-1: Admin sees the "Create Task" button

- [ ] Go to `/tasks/all`
- [ ] You should see a **"Create Task"** button on the page (near the top, alongside the filter buttons)

---

## AC-2: Team-member does not see the "Create Task" button

- [ ] Sign out, then sign in as a **team-member** user
- [ ] Go to `/tasks` (your task list)
- [ ] You should **not** see a "Create Task" button anywhere on the page
- [ ] Sign back in as an admin before continuing

---

## AC-3: Clicking "Create Task" opens a form with all fields

- [ ] On `/tasks/all`, click the **"Create Task"** button
- [ ] A dialog (overlay) should open containing:
  - [ ] A **Title** field
  - [ ] A **Description** field (or text area)
  - [ ] A **Due Date** field
  - [ ] An **Assigned User** field

---

## AC-4: The assigned user field is a dropdown, not a free-text box

- [ ] With the Create Task form open, find the **Assigned User** field
- [ ] It should be a **dropdown or select control** — you should not be able to type a free-form name
- [ ] The dropdown should contain the names of existing users fetched from the system

---

## AC-5: Submitting without a title shows a validation message

- [ ] Open the Create Task form
- [ ] Leave the **Title** field empty and click **Create** (or Submit)
- [ ] You should see an inline message indicating that the title is required (e.g. "Title is required")
- [ ] The form should remain open — it should NOT close or submit

---

## AC-6: Title longer than 200 characters shows a validation message

- [ ] Open the Create Task form
- [ ] Paste more than 200 characters into the **Title** field and click **Create**
- [ ] You should see an inline message indicating the title is too long (e.g. "Title is too long — maximum 200 characters")
- [ ] The form should remain open

---

## AC-7: Submitting without a due date shows a validation message

- [ ] Open the Create Task form
- [ ] Fill in a title but leave the **Due Date** empty, then click **Create**
- [ ] You should see an inline message indicating the due date is required
- [ ] The form should remain open

---

## AC-8: Submitting without an assigned user shows a validation message

- [ ] Open the Create Task form
- [ ] Fill in a title and due date but leave the **Assigned User** dropdown unselected, then click **Create**
- [ ] You should see an inline message indicating an assigned user is required
- [ ] The form should remain open

---

## AC-9: No validation errors when all required fields are filled correctly

- [ ] Open the Create Task form
- [ ] Fill in a title (e.g. "Test Task"), a due date, and select an assigned user
- [ ] Leave description blank (it's optional)
- [ ] Click **Create**
- [ ] You should see no validation error messages — the form should proceed to submit

---

## AC-10 & AC-11: Successful submission — form closes and new task appears in the list

- [ ] Fill in a valid title, due date, and assigned user, then click **Create**
- [ ] The form dialog should close automatically
- [ ] You should be back on the all-tasks view
- [ ] The newly created task should appear in the task list

---

## AC-12: A success notification appears after creating a task

- [ ] After a successful task creation (as above), look for a **success notification** (toast)
- [ ] It should confirm the task was created (e.g. "Task created" or similar message)

---

## AC-13: API error keeps the form open with an error message

- [ ] (To simulate: temporarily stop the backend API or create a network error condition)
- [ ] Fill in valid form fields and click **Create**
- [ ] If the API call fails, an **error message** should appear inside the form (e.g. "Something went wrong. Please try again.")
- [ ] The form should stay open — it should NOT close

---

## AC-14: Retry after an API error works

- [ ] With the error message showing (from AC-13), fix any issue (or restart the API)
- [ ] Click **Create** again
- [ ] The form should re-attempt the API call and succeed
- [ ] On success: the form closes, the new task appears in the list, and a success toast appears

---

## AC-15: Cancelling the form leaves the task list unchanged

- [ ] Open the Create Task form
- [ ] Click the **Cancel** button (or press **Escape**, or click the X close icon)
- [ ] The form should close without creating a task
- [ ] The task list should be exactly as it was before you opened the form

---

## Edge cases

- [ ] **Description is optional:** Fill in title, due date, and assigned user, but leave description blank — the form should submit successfully
- [ ] **Users dropdown populates:** When the form opens, the Assigned User dropdown should load and show the available team members' names (not be empty)
- [ ] **Title at exactly 200 characters:** Entering exactly 200 characters in the Title field should be accepted (no validation error)
- [ ] **Title at 1 character (minimum):** A single-character title should be accepted

---

*Generated: 2026-04-15 | Epic 2, Story 3*
