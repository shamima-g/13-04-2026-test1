/**
 * Epic 2, Story 4 — Admin: Edit and Delete Task Tests
 *
 * Tests for admin edit/delete capabilities in the task detail modal.
 * Covers AC-1 through AC-21, plus edge cases from the test design document.
 *
 * Story: generated-docs/stories/epic-2-task-management/story-4-admin-edit-delete-task.md
 * Test design: generated-docs/test-design/epic-2-task-management/story-4-admin-edit-delete-task-test-design.md
 *
 * BA Decisions applied:
 * 1. Scenario 10 (Edit failure — Option A): Modal stays in edit mode; admin's edited
 *    values are preserved in fields; inline error shown so they can retry.
 * 2. Scenario 12 (Delete failure — Option A): Error shown inline inside the task
 *    detail modal; modal stays open; task remains in list.
 *
 * FRS-Over-Template: The FRS and story ACs are the source of truth.
 * The TaskDetailModal built in Story 2 is extended here with edit/delete controls.
 * No conflicting template code for these features.
 */

import { vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ── Use vi.hoisted to safely initialize mocks before module loading ──────────

const {
  mockListTasks,
  mockUpdateTask,
  mockDeleteTask,
  mockRedirect,
  mockUseRouter,
} = vi.hoisted(() => ({
  mockListTasks: vi.fn(),
  mockUpdateTask: vi.fn(),
  mockDeleteTask: vi.fn(),
  mockRedirect: vi.fn(),
  mockUseRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// ── Mock next/navigation ────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
  usePathname: vi.fn(() => '/tasks/all'),
  redirect: mockRedirect,
}));

// ── Mock the API endpoints — never use fetch() directly ─────────────────────
vi.mock('@/lib/api/endpoints', () => ({
  listTasks: mockListTasks,
  listUsers: vi.fn().mockResolvedValue({ users: [], total: 0 }),
  createTask: vi.fn(),
  updateTask: mockUpdateTask,
  deleteTask: mockDeleteTask,
}));

// ── Mock ToastContext ─────────────────────────────────────────────────────────
vi.mock('@/contexts/ToastContext', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
    dismissToast: vi.fn(),
    clearAllToasts: vi.fn(),
    toasts: [],
  })),
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ── Mock auth for server component support ───────────────────────────────────
vi.mock('@/lib/auth/auth-server', () => ({
  requireAuth: vi.fn(async () => ({
    user: {
      id: 'user-1',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@example.com',
    },
  })),
  getSession: vi.fn(async () => ({
    user: {
      id: 'user-1',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@example.com',
    },
  })),
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(async () => ({
    user: {
      id: 'user-1',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@example.com',
    },
  })),
}));

// ── Import components under test ─────────────────────────────────────────────
import TaskListClient from '@/components/tasks/TaskListClient';

// ── Test data fixtures ────────────────────────────────────────────────────────

const aliceUser = {
  id: 'user-2',
  displayName: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'team-member' as const,
};

const task101 = {
  id: 'task-101',
  title: 'Write Q2 report',
  description: 'First draft only',
  dueDate: '2026-05-01',
  assignedUserId: 'user-2',
  assignedUser: aliceUser,
  status: 'pending' as const,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

const task101Updated = {
  ...task101,
  title: 'Write Q3 report',
  updatedAt: '2026-04-15T00:00:00Z',
};

const task101DescriptionUpdated = {
  ...task101,
  description: 'Final version with sign-off',
  updatedAt: '2026-04-15T00:00:00Z',
};

const task101DueDateUpdated = {
  ...task101,
  dueDate: '2026-06-15',
  updatedAt: '2026-04-15T00:00:00Z',
};

// ── Helper: open the task detail modal ───────────────────────────────────────

async function openTaskModal(
  user: ReturnType<typeof userEvent.setup>,
  taskTitle: string,
) {
  await waitFor(() => {
    expect(screen.getByText(taskTitle)).toBeInTheDocument();
  });
  await user.click(screen.getByText(taskTitle));
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
}

async function enterEditMode(user: ReturnType<typeof userEvent.setup>) {
  const editButton = screen.getByRole('button', { name: /edit/i });
  await user.click(editButton);
  await waitFor(() => {
    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
  });
}

// ── Scenario 1 / AC-1 & AC-2 & AC-15 & AC-16: Role-based visibility ──────────

describe('AC-1 & AC-15: Admin sees Edit and Delete controls in the modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-1: admin sees an Edit button in the task detail modal', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('AC-15: admin sees a Delete button in the task detail modal', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
});

describe('AC-2 & AC-16: Team-member does not see Edit or Delete controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-2: team-member sees no Edit button in the task detail modal', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await openTaskModal(user, 'Write Q2 report');

    expect(
      screen.queryByRole('button', { name: /edit/i }),
    ).not.toBeInTheDocument();
  });

  it('AC-16: team-member sees no Delete button in the task detail modal', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await openTaskModal(user, 'Write Q2 report');

    expect(
      screen.queryByRole('button', { name: /delete/i }),
    ).not.toBeInTheDocument();
  });
});

// ── Scenario 2 / AC-3 & AC-4: Admin enters edit mode ────────────────────────

describe('AC-3: Clicking Edit switches the modal to edit mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-3: edit mode shows editable title, description, and due date fields', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('textbox', { name: /title/i }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('textbox', { name: /description/i }),
    ).toBeInTheDocument();
    // Due date input (type=date or labeled input)
    expect(within(dialog).getByLabelText(/due date/i)).toBeInTheDocument();
  });

  it('AC-3: title field is pre-populated with the current task title', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    expect((titleInput as HTMLInputElement).value).toBe('Write Q2 report');
  });

  it('AC-3: description field is pre-populated with the current description', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const descInput = screen.getByRole('textbox', { name: /description/i });
    expect((descInput as HTMLInputElement).value).toBe('First draft only');
  });

  it('AC-3: due date field is pre-populated with the current due date', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const dueDateInput = screen.getByLabelText(/due date/i);
    expect((dueDateInput as HTMLInputElement).value).toBe('2026-05-01');
  });
});

describe('AC-4: Assigned user field is visible but read-only in edit mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-4: assigned user is visible in edit mode', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('AC-4 (Edge E): assigned user field is locked (disabled/read-only) in edit mode', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    // The assigned user field should not be an editable/interactive input
    // It should be displayed as text or a disabled element
    const dialog = screen.getByRole('dialog');
    // There should be no enabled combobox or text input labeled for assigned user
    const assignedUserInput = within(dialog).queryByRole('combobox', {
      name: /assigned/i,
    });
    const assignedUserTextbox = within(dialog).queryByRole('textbox', {
      name: /assigned/i,
    });
    // If the field exists, it must be disabled
    if (assignedUserInput) {
      expect(assignedUserInput).toBeDisabled();
    }
    if (assignedUserTextbox) {
      expect(assignedUserTextbox).toBeDisabled();
    }
    // The name "Alice Johnson" should still be visible
    expect(within(dialog).getByText('Alice Johnson')).toBeInTheDocument();
  });
});

// ── Scenario 3 / AC-5: Admin saves a valid title change ─────────────────────

describe('AC-5: Admin saves a valid title change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-5: saves title change via PATCH and modal returns to read-only view with updated title', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockUpdateTask.mockResolvedValue(task101Updated);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Write Q3 report');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      // Modal returns to read-only view showing updated title
      expect(
        screen.queryByRole('textbox', { name: /title/i }),
      ).not.toBeInTheDocument();
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Write Q3 report')).toBeInTheDocument();
    });

    expect(mockUpdateTask).toHaveBeenCalledWith(
      'task-101',
      expect.objectContaining({
        title: 'Write Q3 report',
      }),
    );
  });

  it('AC-5: no error message shown on successful save', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockUpdateTask.mockResolvedValue(task101Updated);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Write Q3 report');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole('textbox', { name: /title/i }),
      ).not.toBeInTheDocument();
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ── Scenario 4 / AC-6: Admin saves a valid description change ───────────────

describe('AC-6: Admin saves a valid description change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-6: saves description change via PATCH and modal returns to read-only showing new description', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockUpdateTask.mockResolvedValue(task101DescriptionUpdated);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const descInput = screen.getByRole('textbox', { name: /description/i });
    await user.clear(descInput);
    await user.type(descInput, 'Final version with sign-off');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole('textbox', { name: /description/i }),
      ).not.toBeInTheDocument();
      const dialog = screen.getByRole('dialog');
      expect(
        within(dialog).getByText('Final version with sign-off'),
      ).toBeInTheDocument();
    });

    expect(mockUpdateTask).toHaveBeenCalledWith(
      'task-101',
      expect.objectContaining({
        description: 'Final version with sign-off',
      }),
    );
  });
});

// ── Scenario 5 / AC-7: Admin saves a valid due date change ──────────────────

describe('AC-7: Admin saves a valid due date change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-7: saves due date change via PATCH and modal returns to read-only showing new due date', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockUpdateTask.mockResolvedValue(task101DueDateUpdated);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.clear(dueDateInput);
    await user.type(dueDateInput, '2026-06-15');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.queryByLabelText(/due date/i)).not.toBeInTheDocument();
      const dialog = screen.getByRole('dialog');
      // The due date should show in some readable format (at least the year/date visible)
      expect(
        within(dialog).getByText(/jun.*15.*2026|2026.*jun.*15|june 15, 2026/i),
      ).toBeInTheDocument();
    });

    expect(mockUpdateTask).toHaveBeenCalledWith(
      'task-101',
      expect.objectContaining({
        dueDate: '2026-06-15',
      }),
    );
  });
});

// ── AC-8: Task list updates after successful edit ────────────────────────────

describe('AC-8: Task list reflects updated values after a successful save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-8: task list row shows updated title after successful PATCH', async () => {
    mockListTasks
      .mockResolvedValueOnce({ tasks: [task101], total: 1 })
      .mockResolvedValueOnce({ tasks: [task101Updated], total: 1 });
    mockUpdateTask.mockResolvedValue(task101Updated);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Write Q3 report');

    await user.click(screen.getByRole('button', { name: /save/i }));

    // Wait for edit mode to exit — modal returns to read-only view
    await waitFor(() => {
      expect(
        screen.queryByRole('textbox', { name: /title/i }),
      ).not.toBeInTheDocument();
    });

    // After save, the task list should show the updated title.
    // Use getAllByText since it may appear both in the list row and the modal title.
    await waitFor(() => {
      const matches = screen.getAllByText('Write Q3 report');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    // The original title should no longer appear in the task list
    // (the modal title has updated too, so "Write Q2 report" should be gone)
    expect(screen.queryByText('Write Q2 report')).not.toBeInTheDocument();
  });
});

// ── Scenario 6 / AC-14: Admin cancels an edit ───────────────────────────────

describe('AC-14: Cancelling edit mode returns to read-only with original values', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-14: clicking Cancel in edit mode returns modal to read-only view', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    // Change title (but do not save)
    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Abandoned edit');

    // Click Cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      // Edit mode fields should be gone
      expect(
        screen.queryByRole('textbox', { name: /title/i }),
      ).not.toBeInTheDocument();
    });

    // Original title should be displayed
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Write Q2 report')).toBeInTheDocument();
  });

  it('AC-14: Cancel does not call the update API', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Abandoned edit');

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole('textbox', { name: /title/i }),
      ).not.toBeInTheDocument();
    });

    expect(mockUpdateTask).not.toHaveBeenCalled();
  });
});

// ── Scenario 7 / AC-17: Delete confirmation dialog appears ──────────────────

describe('AC-17: Clicking Delete opens a confirmation dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-17: clicking Delete shows confirmation dialog', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/delete this task\? this cannot be undone\./i),
      ).toBeInTheDocument();
    });
  });

  it('AC-17: confirmation dialog shows exact required message text', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Delete this task? This cannot be undone.'),
      ).toBeInTheDocument();
    });
  });
});

// ── Scenario 8 / AC-18 & AC-19: Admin confirms deletion — success ────────────

describe('AC-18 & AC-19: Admin confirms deletion and task is removed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-18: confirming deletion calls DELETE /v1/tasks/{taskId}', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockDeleteTask.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Delete this task? This cannot be undone.'),
      ).toBeInTheDocument();
    });

    // Click the confirm button in the dialog
    const confirmButton = screen.getByRole('button', {
      name: /confirm|delete/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteTask).toHaveBeenCalledWith('task-101');
    });
  });

  it('AC-19: modal closes after successful deletion', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockDeleteTask.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Delete this task? This cannot be undone.'),
      ).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', {
      name: /confirm|delete/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('AC-19: task is removed from the list after successful deletion', async () => {
    mockListTasks
      .mockResolvedValueOnce({ tasks: [task101], total: 1 })
      .mockResolvedValueOnce({ tasks: [], total: 0 });
    mockDeleteTask.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Write Q2 report')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Write Q2 report'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Delete this task? This cannot be undone.'),
      ).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', {
      name: /confirm|delete/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText('Write Q2 report')).not.toBeInTheDocument();
    });
  });
});

// ── Scenario 9 / AC-20: Admin cancels deletion ──────────────────────────────

describe('AC-20: Cancelling the delete confirmation leaves everything open', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-20: cancelling delete dialog closes the dialog but keeps the task modal open', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Delete this task? This cannot be undone.'),
      ).toBeInTheDocument();
    });

    // Click Cancel in the confirmation dialog
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      // Confirmation text should be gone
      expect(
        screen.queryByText('Delete this task? This cannot be undone.'),
      ).not.toBeInTheDocument();
    });

    // Task detail modal should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByText('Write Q2 report'),
    ).toBeInTheDocument();
  });

  it('AC-20: cancelling delete does not call the delete API', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Delete this task? This cannot be undone.'),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(
        screen.queryByText('Delete this task? This cannot be undone.'),
      ).not.toBeInTheDocument();
    });

    expect(mockDeleteTask).not.toHaveBeenCalled();
  });

  it('AC-20: task is still in the list after cancelling delete', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Delete this task? This cannot be undone.'),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Close the modal to check the task list
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Task should still be in the list
    expect(screen.getByText('Write Q2 report')).toBeInTheDocument();
  });
});

// ── Scenario 10 / AC-12: Edit API call fails (BA Decision: Option A) ─────────

describe('AC-12: Edit API failure — modal stays in edit mode with inline error and edited values preserved', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-12: on PATCH failure, an error message is shown inside the modal', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockUpdateTask.mockRejectedValue(new Error('Server Error'));

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Write Q3 report');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      // An error message should appear inside the dialog
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('alert')).toBeInTheDocument();
    });
  });

  it('AC-12: on PATCH failure, modal stays in edit mode (not read-only)', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockUpdateTask.mockRejectedValue(new Error('Server Error'));

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Write Q3 report');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('alert')).toBeInTheDocument();
    });

    // Edit mode fields should still be present (stayed in edit mode — Option A)
    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
  });

  it("AC-12: on PATCH failure, admin's edited values are preserved in the fields (Option A)", async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockUpdateTask.mockRejectedValue(new Error('Server Error'));

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Write Q3 report');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('alert')).toBeInTheDocument();
    });

    // Admin's edited text should still be in the input (so they can retry)
    const titleInputAfterFailure = screen.getByRole('textbox', {
      name: /title/i,
    });
    expect((titleInputAfterFailure as HTMLInputElement).value).toBe(
      'Write Q3 report',
    );
  });

  it('AC-12: task list still shows original title after failed PATCH', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockUpdateTask.mockRejectedValue(new Error('Server Error'));

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Write Q3 report');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('alert')).toBeInTheDocument();
    });

    // Task list row should still show the original title
    expect(screen.getByText('Write Q2 report')).toBeInTheDocument();
    expect(screen.queryByText('Write Q3 report')).not.toBeInTheDocument();
  });
});

// ── Scenario 11 / AC-13: Admin retries after edit failure ────────────────────

describe('AC-13: Admin can retry after a failed save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-13: clicking Save again after a failure retries the PATCH call', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockUpdateTask
      .mockRejectedValueOnce(new Error('Server Error'))
      .mockResolvedValueOnce(task101Updated);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Write Q3 report');

    // First save attempt — fails
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('alert')).toBeInTheDocument();
    });

    // Second save attempt — succeeds
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      // Modal should return to read-only view with updated title
      expect(
        screen.queryByRole('textbox', { name: /title/i }),
      ).not.toBeInTheDocument();
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Write Q3 report')).toBeInTheDocument();
    });

    expect(mockUpdateTask).toHaveBeenCalledTimes(2); // test-quality-ignore
  });

  it('AC-13: error message is cleared after a successful retry', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockUpdateTask
      .mockRejectedValueOnce(new Error('Server Error'))
      .mockResolvedValueOnce(task101Updated);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Write Q3 report');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('alert')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      // After success, no error alert should remain
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});

// ── Scenario 12 / AC-21: Delete API call fails (BA Decision: Option A) ───────

describe('AC-21: Delete API failure — error shown inline inside modal, task remains', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-21: on DELETE failure, an error message appears inside the task detail modal', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockDeleteTask.mockRejectedValue(new Error('Server Error'));

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Delete this task? This cannot be undone.'),
      ).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', {
      name: /confirm|delete/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      // Error message should appear inside the dialog (Option A — inline)
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('alert')).toBeInTheDocument();
    });
  });

  it('AC-21: modal stays open after DELETE failure', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockDeleteTask.mockRejectedValue(new Error('Server Error'));

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Delete this task? This cannot be undone.'),
      ).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', {
      name: /confirm|delete/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('alert')).toBeInTheDocument();
    });

    // Modal should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('AC-21: task is not removed from the list after a failed DELETE', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockDeleteTask.mockRejectedValue(new Error('Server Error'));

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Delete this task? This cannot be undone.'),
      ).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', {
      name: /confirm|delete/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('alert')).toBeInTheDocument();
    });

    // Close modal and verify task is still in list
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Write Q2 report')).toBeInTheDocument();
  });
});

// ── Edge A: Title exactly 200 characters — valid save ────────────────────────

describe('Edge A: Title at 200 characters saves without validation error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Edge A: PATCH fires for a 200-character title with no validation error', async () => {
    const longTitle = 'A'.repeat(200);
    const task200Chars = { ...task101Updated, title: longTitle };
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });
    mockUpdateTask.mockResolvedValue(task200Chars);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, longTitle);

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith(
        'task-101',
        expect.objectContaining({
          title: longTitle,
        }),
      );
    });

    // No validation error shown
    expect(
      screen.queryByText(/title is required|too long/i),
    ).not.toBeInTheDocument();
  });
});

// ── Edge B / AC-9: Title blank — validation error, no API call ────────────────

describe('AC-9 (Edge B): Blank title shows validation error and blocks the API call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-9: clearing the title and saving shows an inline validation message', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('AC-9: PATCH is not called when title is blank', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    expect(mockUpdateTask).not.toHaveBeenCalled();
  });
});

// ── Edge C / AC-10: Title 201 characters — validation error, no API call ─────

describe('AC-10 (Edge C): 201-character title shows validation error and blocks the API call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-10: entering 201-character title shows validation message', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'A'.repeat(201));

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/too long|max 200/i)).toBeInTheDocument();
    });
  });

  it('AC-10: PATCH is not called for a 201-character title', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'A'.repeat(201));

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/too long|max 200/i)).toBeInTheDocument();
    });

    expect(mockUpdateTask).not.toHaveBeenCalled();
  });
});

// ── Edge D / AC-11: Due date cleared — validation error, no API call ─────────

describe('AC-11 (Edge D): Cleared due date shows validation error and blocks the API call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-11: clearing due date and saving shows validation message', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.clear(dueDateInput);

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/due date is required/i)).toBeInTheDocument();
    });
  });

  it('AC-11: PATCH is not called when due date is cleared', async () => {
    mockListTasks.mockResolvedValue({ tasks: [task101], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write Q2 report');
    await enterEditMode(user);

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.clear(dueDateInput);

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/due date is required/i)).toBeInTheDocument();
    });

    expect(mockUpdateTask).not.toHaveBeenCalled();
  });
});
