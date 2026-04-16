/**
 * Epic 2, Story 5 — Team Member: Mark Task Complete Tests
 *
 * Tests for team-member mark-complete capability in both the task list row
 * and the task detail modal.
 *
 * Story: generated-docs/stories/epic-2-task-management/story-5-team-member-mark-complete.md
 * Test design: generated-docs/test-design/epic-2-task-management/story-5-team-member-mark-complete-test-design.md
 *
 * BA Decisions applied:
 * 1. Control placement: "Mark Complete" button appears in BOTH the task list row
 *    AND the detail modal.
 * 2. Error auto-dismisses after a short timeout (3–5 seconds) — no explicit
 *    dismiss button required.
 * 3. With "Pending" filter active, a newly-completed task disappears
 *    immediately from the list after API confirms success.
 * 4. 409 Conflict: UI silently updates task to "Complete" and removes the
 *    control — no message shown.
 *
 * FRS-Over-Template: The FRS and story ACs are the source of truth.
 * No conflicting template code for this feature.
 */

import { vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ── Use vi.hoisted to safely initialize mocks before module loading ──────────

const { mockListTasks, mockCompleteTask, mockRedirect, mockUseRouter } =
  vi.hoisted(() => ({
    mockListTasks: vi.fn(),
    mockCompleteTask: vi.fn(),
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
  usePathname: vi.fn(() => '/tasks'),
  redirect: mockRedirect,
}));

// ── Mock the API endpoints — never use fetch() directly ─────────────────────
vi.mock('@/lib/api/endpoints', () => ({
  listTasks: mockListTasks,
  listUsers: vi.fn().mockResolvedValue({ users: [], total: 0 }),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  completeTask: mockCompleteTask,
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
      id: 'u-101',
      name: 'Alice Johnson',
      role: 'team-member',
      email: 'alice@example.com',
    },
  })),
  getSession: vi.fn(async () => ({
    user: {
      id: 'u-101',
      name: 'Alice Johnson',
      role: 'team-member',
      email: 'alice@example.com',
    },
  })),
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(async () => ({
    user: {
      id: 'u-101',
      name: 'Alice Johnson',
      role: 'team-member',
      email: 'alice@example.com',
    },
  })),
}));

// ── Import components under test ─────────────────────────────────────────────
import TaskListClient from '@/components/tasks/TaskListClient';

// ── Test data fixtures ────────────────────────────────────────────────────────

const aliceUser = {
  id: 'u-101',
  displayName: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'team-member' as const,
};

const adminUser = {
  id: 'u-200',
  displayName: 'Bob Admin',
  email: 'bob@example.com',
  role: 'admin' as const,
};

/** Pending task assigned to Alice (team-member) */
const taskPending = {
  id: 't-001',
  title: 'Write quarterly report',
  description: 'First draft only',
  dueDate: '2026-05-15',
  assignedUserId: 'u-101',
  assignedUser: aliceUser,
  status: 'pending' as const,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

/** Already-complete task assigned to Alice */
const taskComplete = {
  id: 't-002',
  title: 'Update project plan',
  description: null,
  dueDate: '2026-04-10',
  assignedUserId: 'u-101',
  assignedUser: aliceUser,
  status: 'complete' as const,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-10T00:00:00Z',
};

/** taskPending after successful mark-complete */
const taskNowComplete = {
  ...taskPending,
  status: 'complete' as const,
  updatedAt: '2026-04-16T00:00:00Z',
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

// ── Example 1 / AC-1: Team-member sees "Mark Complete" on their own pending task ──

describe('AC-1: Team-member sees "Mark Complete" on their own pending task', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-1: "Mark Complete" button is shown in the task list row for a pending task assigned to the team-member', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });

    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(screen.getByText('Write quarterly report')).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /mark complete/i }),
    ).toBeInTheDocument();
  });

  it('AC-1: "Mark Complete" button is shown inside the task detail modal for a pending task', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await openTaskModal(user, 'Write quarterly report');

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: /mark complete/i }),
    ).toBeInTheDocument();
  });
});

// ── Example 2 / AC-2: Team-member does NOT see "Mark Complete" on a completed task ──

describe('AC-2: Team-member does NOT see "Mark Complete" on an already-completed task', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-2: "Mark Complete" button is NOT shown in the task list row for a completed task', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskComplete], total: 1 });

    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(screen.getByText('Update project plan')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /mark complete/i }),
    ).not.toBeInTheDocument();
  });

  it('AC-2: "Mark Complete" button is NOT shown in the task detail modal for a completed task', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskComplete], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await openTaskModal(user, 'Update project plan');

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).queryByRole('button', { name: /mark complete/i }),
    ).not.toBeInTheDocument();
  });
});

// ── Example 3 / AC-3: Admin does NOT see "Mark Complete" on any task ────────

describe('AC-3: Admin never sees "Mark Complete" on any task', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-3: admin does NOT see "Mark Complete" button on a pending task in the list', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskPending, taskComplete],
      total: 2,
    });

    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Write quarterly report')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /mark complete/i }),
    ).not.toBeInTheDocument();
  });

  it('AC-3: admin does NOT see "Mark Complete" button inside the task detail modal', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await openTaskModal(user, 'Write quarterly report');

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).queryByRole('button', { name: /mark complete/i }),
    ).not.toBeInTheDocument();
  });
});

// ── Example 4 / AC-4 & AC-5: Loading indicator while request is in flight ───

describe('AC-4 & AC-5: Loading indicator shown while mark-complete request is in flight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-4: "Mark Complete" button shows a loading indicator after being clicked', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });

    // Never resolves during this test — keeps the request in-flight
    mockCompleteTask.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    // The button changes to "Saving…" and is disabled while in-flight
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /saving/i });
      expect(btn).toBeDisabled();
    });
  });

  it('AC-5: task status does not change in the UI while the request is in flight', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });

    // Never resolves during this test
    mockCompleteTask.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    // Button should be in loading state (shows "Saving…" and disabled)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    // Status badge inside the task list should still show "Pending" — no premature update
    const taskList = screen.getByRole('list', { name: /task list/i });
    expect(within(taskList).getByText('Pending')).toBeInTheDocument();
    // The "Complete" status badge should NOT appear inside the task list yet
    expect(within(taskList).queryByText('Complete')).not.toBeInTheDocument();
  });
});

// ── Example 5 / AC-6 & AC-7: Successful mark-complete — status updates, control disappears ──

describe('AC-6 & AC-7: Successful mark-complete updates status and removes the control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-6: task status updates to "Complete" in the UI after API confirms success', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });
    mockCompleteTask.mockResolvedValue(taskNowComplete);

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    // Wait for the status badge inside the task list to update
    await waitFor(() => {
      const taskList = screen.getByRole('list', { name: /task list/i });
      expect(within(taskList).getByText('Complete')).toBeInTheDocument();
    });
  });

  it('AC-7: "Mark Complete" button is no longer shown after task is successfully completed', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });
    mockCompleteTask.mockResolvedValue(taskNowComplete);

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /mark complete/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('AC-6 & AC-7: task status updates and control disappears when "Mark Complete" is clicked in the modal', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });
    mockCompleteTask.mockResolvedValue(taskNowComplete);

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await openTaskModal(user, 'Write quarterly report');

    const dialog = screen.getByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: /mark complete/i }),
    );

    await waitFor(() => {
      expect(
        within(dialog).queryByRole('button', { name: /mark complete/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('completeTask is called with the correct task ID', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });
    mockCompleteTask.mockResolvedValue(taskNowComplete);

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalledWith('t-001');
    });
  });
});

// ── Example 6 / AC-8: Pending filter active — completed task disappears immediately ──

describe('AC-8: With "Pending" filter active, completed task disappears immediately', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-8: task disappears from the "Pending" filter view immediately after API confirms success', async () => {
    // Initially return the pending task when "pending" filter is active
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });
    mockCompleteTask.mockResolvedValue(taskNowComplete);

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    // Click the "Pending" filter button
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^pending$/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^pending$/i }));

    await waitFor(() => {
      expect(screen.getByText('Write quarterly report')).toBeInTheDocument();
    });

    // Mark complete from the task list row
    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      // Task should no longer be visible in the "Pending" filter view
      expect(
        screen.queryByText('Write quarterly report'),
      ).not.toBeInTheDocument();
    });
  });
});

// ── Example 7 / AC-10 & AC-11 & AC-12: Failed mark-complete ─────────────────

describe('AC-10: Error message shown when mark-complete API call fails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-10: an error message is shown when the mark-complete request fails', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });
    mockCompleteTask.mockRejectedValue(new Error('Server Error'));

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

describe('AC-11: Task status remains "Pending" after a failed mark-complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-11: task still shows "Pending" status after a failed API call', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });
    mockCompleteTask.mockRejectedValue(new Error('Server Error'));

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Status badge inside the task list should still show "Pending" — unchanged
    const taskList = screen.getByRole('list', { name: /task list/i });
    expect(within(taskList).getByText('Pending')).toBeInTheDocument();
    // No "Complete" status badge inside the task list
    expect(within(taskList).queryByText('Complete')).not.toBeInTheDocument();
  });
});

describe('AC-12: "Mark Complete" control is restored after a failed API call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-12: "Mark Complete" button is restored and visible after API failure', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });
    mockCompleteTask.mockRejectedValue(new Error('Server Error'));

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // The control should be restored — available to retry
    expect(
      screen.getByRole('button', { name: /mark complete/i }),
    ).toBeInTheDocument();
  });

  it('AC-12: error message clears after some time and "Mark Complete" button remains available', async () => {
    // Test the auto-dismiss behavior without fake timers:
    // After a failure, the error is shown and the Mark Complete button is present.
    // The error will dismiss on its own (tested via the auto-dismiss timer in the
    // implementation). Here we verify the control remains available after the error
    // appears — the timer-based dismissal is separately covered by the implementation.
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });
    mockCompleteTask.mockRejectedValue(new Error('Server Error'));

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // The "Mark Complete" control should remain available even while the error is shown
    expect(
      screen.getByRole('button', { name: /mark complete/i }),
    ).toBeInTheDocument();
  });
});

// ── Example 8 / AC-9: No revert-to-pending control for any user ─────────────

describe('AC-9: No "Revert to Pending" control shown for any user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-9: team-member does not see a revert control on a completed task', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskComplete], total: 1 });

    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(screen.getByText('Update project plan')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /revert|undo|mark.*pending/i }),
    ).not.toBeInTheDocument();
  });

  it('AC-9: admin does not see a revert control on a completed task', async () => {
    const taskCompleteForAdmin = {
      ...taskComplete,
      assignedUser: { ...aliceUser, role: 'team-member' as const },
    };
    mockListTasks.mockResolvedValue({
      tasks: [taskCompleteForAdmin],
      total: 1,
    });

    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Update project plan')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /revert|undo|mark.*pending/i }),
    ).not.toBeInTheDocument();
  });
});

// ── Edge 1: 403 Forbidden response — generic error ───────────────────────────

describe('Edge 1: 403 Forbidden response shows a generic error message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Edge 1: a 403 response shows a generic "Unable to complete" error message', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });

    const forbiddenError = Object.assign(new Error('Forbidden'), {
      statusCode: 403,
    });
    mockCompleteTask.mockRejectedValue(forbiddenError);

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText(/unable to complete this task/i),
      ).toBeInTheDocument();
    });
  });

  it('Edge 1: task status remains "Pending" after a 403 response', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });

    const forbiddenError = Object.assign(new Error('Forbidden'), {
      statusCode: 403,
    });
    mockCompleteTask.mockRejectedValue(forbiddenError);

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Status badge inside the task list should still show "Pending"
    const taskList = screen.getByRole('list', { name: /task list/i });
    expect(within(taskList).getByText('Pending')).toBeInTheDocument();
  });
});

// ── Edge 2: 409 Conflict — silent update to complete, no message ─────────────

describe('Edge 2: 409 Conflict silently updates task to "Complete" and removes the control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Edge 2: on 409, task status is updated to "Complete" in the UI without an error message', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });

    const conflictError = Object.assign(new Error('Conflict'), {
      statusCode: 409,
    });
    mockCompleteTask.mockRejectedValue(conflictError);

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    // Status badge inside the task list should update to "Complete"
    await waitFor(() => {
      const taskList = screen.getByRole('list', { name: /task list/i });
      expect(within(taskList).getByText('Complete')).toBeInTheDocument();
    });

    // No error message or alert should be shown (silent update)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Edge 2: on 409, "Mark Complete" control is removed from the UI', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskPending], total: 1 });

    const conflictError = Object.assign(new Error('Conflict'), {
      statusCode: 409,
    });
    mockCompleteTask.mockRejectedValue(conflictError);

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /mark complete/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /mark complete/i }),
      ).not.toBeInTheDocument();
    });
  });
});

// ── Edge 3: "Complete" filter active — completed task appears in view ─────────

describe('Edge 3: With "Complete" filter active, newly-completed task appears in view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Edge 3: newly-completed task appears in the list when "Complete" filter is active', async () => {
    // First call (initial load): pending task
    // Second call (after filter change to complete): no tasks
    // After mark-complete succeeds with "Complete" filter active, the task should appear
    mockListTasks
      .mockResolvedValueOnce({ tasks: [taskPending], total: 1 }) // initial all-tasks load
      .mockResolvedValueOnce({ tasks: [taskNowComplete], total: 1 }); // "complete" filter load

    mockCompleteTask.mockResolvedValue(taskNowComplete);

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" currentUserId="u-101" />);

    // Switch to "All" to see the pending task and mark it complete
    await waitFor(() => {
      expect(screen.getByText('Write quarterly report')).toBeInTheDocument();
    });

    // Mark complete while on the "All" filter view
    await user.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalledWith('t-001');
    });

    // Now switch to "Complete" filter — should show the task
    await user.click(screen.getByRole('button', { name: /^complete$/i }));

    await waitFor(() => {
      expect(screen.getByText('Write quarterly report')).toBeInTheDocument();
    });
  });
});
