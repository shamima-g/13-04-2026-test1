# Test Design: Admin: Create Task

## Story Summary

**Epic:** 2 — Task Management
**Story:** 3 of 5
**As an** admin
**I want to** create a new task with a title, description, due date, and assigned team member
**So that** I can assign work to the right person and track it through to completion.

## Review Purpose

This document presents concrete business examples for BA review before executable tests are written.

Its purpose is to:
- surface missing business decisions
- let the BA review behavior using examples and expected outcomes
- provide an approved source for downstream test generation

## Business Behaviors Identified

- A "Create Task" button is visible to admins on the all-tasks view; it is hidden from team-members
- Clicking "Create Task" opens a form overlay (dialog) with fields for title, description, due date, and assigned user
- The assigned user field is a dropdown populated from existing users — free-text entry is not permitted
- Title is required (1–200 characters); submitting without one, or with too-long a title, shows an inline error
- Due date is required; submitting without one shows an inline error
- Assigned user is required; submitting without selecting one shows an inline error
- Description is optional; leaving it blank is valid
- A successful submission closes the form, adds the task to the all-tasks list, and shows a success toast
- A failed API call keeps the form open and shows an error message inside the form; resubmitting retries
- Cancelling or closing the form without submitting leaves the task list unchanged

## Key Decisions Surfaced by AI

- **Form open state after API error:** The story says "the form does not close" on API error — but does the error appear at the top of the form, inline by a specific field, or as a dismissible banner inside the form? The wording used ("an error message is shown within the form") is open to interpretation.
- **Success toast copy:** The story says "success toast confirming the task was created" but does not specify the toast message text. The exact wording needs BA sign-off if it appears in acceptance criteria.
- **Cancellation trigger:** "Cancel or close" — should this apply to clicking a Cancel button, clicking an X icon, pressing Escape, or all three? The story does not specify which closing mechanisms are available.
- **New task position in list:** After successful creation, the story says the new task "appears in the list." Does it appear at the top, the bottom, or in sorted order? This affects user expectations and list refresh strategy.
- **Users dropdown loading state:** When the form opens and is waiting for the users list to load, what does the dropdown look like? The story does not specify a loading state.
- **Empty users list:** If `GET /v1/users` returns zero users (e.g., only the admin exists), can a task be created? The story requires selecting an existing user, which would be impossible.

---

## Test Scenarios / Review Examples

### 1. Admin sees "Create Task" button on the all-tasks page

| Setup | Value |
| --- | --- |
| Signed-in user | Admin |
| Current page | All-tasks view |

| Expected | Value |
| --- | --- |
| Visible element | "Create Task" button is present on the page |

---

### 2. Team-member does not see "Create Task" button

| Setup | Value |
| --- | --- |
| Signed-in user | Team-member |
| Current page | Task list view |

| Expected | Value |
| --- | --- |
| Visible element | No "Create Task" button is shown |

---

### 3. Admin opens the create task form

| Setup | Value |
| --- | --- |
| Signed-in user | Admin |
| Current page | All-tasks view |

| Input | Value |
| --- | --- |
| Action | Click "Create Task" button |

| Expected | Value |
| --- | --- |
| UI response | A form dialog opens |
| Form fields shown | Title, Description, Due Date, Assigned User |
| Assigned user field | Dropdown (select control), not a free-text input |
| Dropdown options | Populated from the users list (e.g., "Alice Chen", "Bob Gomez") |

---

### 4. Admin submits a valid task with all required fields

| Setup | Value |
| --- | --- |
| Signed-in user | Admin |
| Create task form | Open |
| Available users | Alice Chen (ID: u-101), Bob Gomez (ID: u-102) |

| Input | Value |
| --- | --- |
| Title | "Design new onboarding flow" |
| Description | "Focus on the first 3 screens" |
| Due Date | 2026-05-01 |
| Assigned User | Alice Chen (u-101) |
| Action | Click Submit |

| Expected | Value |
| --- | --- |
| Form | Closes |
| Task list | Updated — "Design new onboarding flow" appears in the list |
| Toast notification | Success message confirming the task was created |

---

### 5. Admin submits form without a title (required)

| Setup | Value |
| --- | --- |
| Signed-in user | Admin |
| Create task form | Open |

| Input | Value |
| --- | --- |
| Title | (left blank) |
| Due Date | 2026-05-01 |
| Assigned User | Alice Chen |
| Action | Click Submit |

| Expected | Value |
| --- | --- |
| Form | Stays open |
| Validation message | Inline error next to Title: title is required |
| API call | Not made |

---

### 6. Admin submits form with title exceeding 200 characters

| Setup | Value |
| --- | --- |
| Signed-in user | Admin |
| Create task form | Open |

| Input | Value |
| --- | --- |
| Title | 201-character string (e.g., "A" × 201) |
| Due Date | 2026-05-01 |
| Assigned User | Alice Chen |
| Action | Click Submit |

| Expected | Value |
| --- | --- |
| Form | Stays open |
| Validation message | Inline error next to Title: title is too long |
| API call | Not made |

---

### 7. Admin submits form without a due date (required)

| Setup | Value |
| --- | --- |
| Signed-in user | Admin |
| Create task form | Open |

| Input | Value |
| --- | --- |
| Title | "Design new onboarding flow" |
| Due Date | (not selected) |
| Assigned User | Alice Chen |
| Action | Click Submit |

| Expected | Value |
| --- | --- |
| Form | Stays open |
| Validation message | Inline error next to Due Date: due date is required |
| API call | Not made |

---

### 8. Admin submits form without selecting an assigned user (required)

| Setup | Value |
| --- | --- |
| Signed-in user | Admin |
| Create task form | Open |

| Input | Value |
| --- | --- |
| Title | "Design new onboarding flow" |
| Due Date | 2026-05-01 |
| Assigned User | (none selected) |
| Action | Click Submit |

| Expected | Value |
| --- | --- |
| Form | Stays open |
| Validation message | Inline error next to Assigned User: assigned user is required |
| API call | Not made |

---

### 9. Admin submits valid form but API returns an error

| Setup | Value |
| --- | --- |
| Signed-in user | Admin |
| Create task form | Open, all fields valid |
| API response | 500 Server Error |

| Input | Value |
| --- | --- |
| Action | Click Submit |

| Expected | Value |
| --- | --- |
| Form | Stays open |
| Error message | An error message appears inside the form |
| Task list | Unchanged |

> **BA decision required:** Where exactly does the API error appear inside the form?
>
> Options:
> - Option A: At the top of the form as a banner (e.g., "Something went wrong. Please try again.")
> - Option B: Next to the submit button as a footer error
> - Option C: No specific location specified — positioned wherever the component renders it

---

### 10. Admin retries after API error

| Setup | Value |
| --- | --- |
| Signed-in user | Admin |
| Create task form | Open, error message visible from failed submission |

| Input | Value |
| --- | --- |
| Action | Click Submit again (no field changes needed) |

| Expected | Value |
| --- | --- |
| Form | Retries the API call |
| If API now succeeds | Form closes, task appears in list, success toast shown |

---

### 11. Admin cancels form without submitting

| Setup | Value |
| --- | --- |
| Signed-in user | Admin |
| Create task form | Open, with or without partial data entered |

| Input | Value |
| --- | --- |
| Action | Cancel / close the form |

| Expected | Value |
| --- | --- |
| Form | Closes |
| Task list | Unchanged — no new task added |

> **BA decision required:** Which mechanisms close the form?
>
> Options:
> - Option A: Cancel button only
> - Option B: Cancel button + X (close icon)
> - Option C: Cancel button + X icon + pressing Escape key
>
> The story says "cancel or close" — please confirm all intended closing mechanisms.

---

## Edge and Alternate Examples

### Edge 1: Admin submits valid form with description left blank

| Input | Value |
| --- | --- |
| Title | "Fix login button" |
| Description | (left blank) |
| Due Date | 2026-05-15 |
| Assigned User | Bob Gomez (u-102) |
| Action | Click Submit |

| Expected | Value |
| --- | --- |
| API call | Made — description is omitted or sent as null |
| Validation | No error for missing description (it is optional per BR2) |
| Result | Task created successfully |

---

### Edge 2: Users list loads asynchronously when form opens

| Setup | Value |
| --- | --- |
| Signed-in user | Admin |
| API call in flight | `GET /v1/users` still loading |

| Expected | Value |
| --- | --- |
| Dropdown state | Either disabled or showing a loading indicator while users load |
| After load completes | Dropdown is populated and enabled |

> **BA decision required:** What should the assigned-user dropdown show while users are loading?
>
> Options:
> - Option A: Disabled with a loading spinner or skeleton
> - Option B: Shows "Loading..." as placeholder text
> - Option C: Not specified — implementation choice

---

### Edge 3: Title with exactly 200 characters is accepted

| Input | Value |
| --- | --- |
| Title | Exactly 200 characters (boundary value at maximum) |
| Due Date | 2026-05-01 |
| Assigned User | Alice Chen |

| Expected | Value |
| --- | --- |
| Validation | No error — 200 characters is valid per BR1 |
| API call | Made |

---

### Edge 4: Title with exactly 1 character is accepted

| Input | Value |
| --- | --- |
| Title | "A" (1 character — minimum valid) |
| Due Date | 2026-05-01 |
| Assigned User | Alice Chen |

| Expected | Value |
| --- | --- |
| Validation | No error |
| API call | Made |

---

## Out of Scope / Not For This Story

- Editing an existing task (covered in Story 4)
- Deleting a task (covered in Story 4)
- Marking a task complete (covered in Story 5)
- Team-member attempting to call the create-task API directly (API-level enforcement, not UI)
- Pagination behavior of the task list after a task is created
- What happens when the users list API (`GET /v1/users`) itself fails with an error (no scenario defined in story)
- Whitespace-only title validation (e.g., "   " — story does not specify trim behavior)
