/**
 * Epic 2, Story 2 — Task Detail Modal Tests
 *
 * Tests for the task detail modal overlay (both team-member and admin roles).
 * Covers AC-1 through AC-11.
 *
 * Story: generated-docs/stories/epic-2-task-management/story-2-task-detail-modal.md
 * Test design: generated-docs/test-design/epic-2-task-management/story-2-task-detail-modal-test-design.md
 *
 * BA Decisions applied:
 * 1. Data source: reuse task data from the list response (no separate API call needed)
 * 2. Status display: title case — "Pending" / "Complete"
 * 3. Due date format: "May 15, 2026" style (locale-formatted long date)
 * 4. No-description placeholder: "No description provided" in muted style (Option C)
 * 5. No edit / delete / mark-complete controls in this story
 * 6. Admin cannot mark tasks complete (BR7)
 *
 * FRS-Over-Template: The FRS and story ACs are the source of truth.
 * The modal is built as a Shadcn <Dialog /> client component added to TaskListClient.
 */

import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ── Use vi.hoisted to safely initialize mocks before module loading ──────────

const { mockListTasks, mockRedirect, mockUseRouter } = vi.hoisted(() => ({
  mockListTasks: vi.fn(),
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
}));

// ── Mock ToastContext (CreateTaskForm uses useToast for admin role) ────────────
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
      name: 'Sarah Chen',
      role: 'team-member',
      email: 'sarah@example.com',
    },
  })),
  getSession: vi.fn(async () => ({
    user: {
      id: 'user-1',
      name: 'Sarah Chen',
      role: 'team-member',
      email: 'sarah@example.com',
    },
  })),
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(async () => ({
    user: {
      id: 'user-1',
      name: 'Sarah Chen',
      role: 'team-member',
      email: 'sarah@example.com',
    },
  })),
}));

// ── Import components under test ─────────────────────────────────────────────
// TaskListClient hosts the modal; the modal itself is in TaskDetailModal.
// These imports will fail (red phase) until implementation is complete.
import TaskListClient from '@/components/tasks/TaskListClient';

// ── Test data fixtures ────────────────────────────────────────────────────────

const sarahUser = {
  id: 'user-1',
  displayName: 'Sarah Chen',
  email: 'sarah@example.com',
  role: 'team-member' as const,
};

const jordanUser = {
  id: 'user-2',
  displayName: 'Jordan Kim',
  email: 'jordan@example.com',
  role: 'team-member' as const,
};

const morganUser = {
  id: 'user-3',
  displayName: 'Morgan Lee',
  email: 'morgan@example.com',
  role: 'team-member' as const,
};

const taskWithDescription = {
  id: 'task-1',
  title: 'Update onboarding docs',
  description: 'Revise the first three sections',
  dueDate: '2026-05-15',
  assignedUserId: 'user-1',
  assignedUser: sarahUser,
  status: 'pending' as const,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

const taskWithoutDescription = {
  id: 'task-2',
  title: 'Fix printer',
  description: null,
  dueDate: '2026-04-20',
  assignedUserId: 'user-1',
  assignedUser: sarahUser,
  status: 'pending' as const,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

const completeTask = {
  id: 'task-3',
  title: 'Review Q1 report',
  description: null,
  dueDate: '2026-04-01',
  assignedUserId: 'user-1',
  assignedUser: sarahUser,
  status: 'complete' as const,
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

const adminTask = {
  id: 'task-4',
  title: 'Prepare budget forecast',
  description: null,
  dueDate: '2026-06-30',
  assignedUserId: 'user-2',
  assignedUser: jordanUser,
  status: 'pending' as const,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

const completeAdminTask = {
  id: 'task-5',
  title: 'Archive old records',
  description: null,
  dueDate: '2026-03-01',
  assignedUserId: 'user-3',
  assignedUser: morganUser,
  status: 'complete' as const,
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
};

// ── AC-1: Opening the modal by clicking a task row ────────────────────────────

describe('AC-1: Clicking a task row opens the modal overlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-1: clicking a task row opens a modal overlay', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      // The modal dialog should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('AC-1: modal is not visible before clicking a task row', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    // No dialog should be open yet
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ── AC-2: Modal shows task title ─────────────────────────────────────────────

describe('AC-2: Modal displays the task title', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-2: modal shows the task title after clicking the task row', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('Update onboarding docs');
    });
  });
});

// ── AC-3: Modal shows description when present ───────────────────────────────

describe('AC-3: Modal displays the task description when present', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-3: modal shows the description text when the task has a description', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      expect(
        screen.getByText('Revise the first three sections'),
      ).toBeInTheDocument();
    });
  });
});

// ── AC-4: Modal handles no-description case without error ─────────────────────

describe('AC-4: Modal renders without error when task has no description', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-4: modal opens without crashing when task has no description', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithoutDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Fix printer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Fix printer'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // No "undefined" text should appear
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });

  it('AC-4 (BA Decision 4): shows "No description provided" placeholder when task has no description', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithoutDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Fix printer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Fix printer'));

    await waitFor(() => {
      expect(screen.getByText('No description provided')).toBeInTheDocument();
    });
  });
});

// ── AC-5: Modal shows due date ───────────────────────────────────────────────

describe('AC-5: Modal displays the task due date', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-5: modal shows a formatted due date', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      // "2026-05-15" should appear as a human-readable date, e.g. "May 15, 2026"
      expect(dialog).toHaveTextContent(/May 15, 2026/i);
    });
  });
});

// ── AC-6: Modal shows assigned user display name ─────────────────────────────

describe('AC-6: Modal displays the assigned user display name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-6: modal shows the display name of the user the task is assigned to', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('Sarah Chen');
    });
  });

  it('AC-6: admin modal shows the correct assignee name for any task', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [adminTask],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Prepare budget forecast')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Prepare budget forecast'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('Jordan Kim');
    });
  });
});

// ── AC-7: Modal shows current task status ────────────────────────────────────

describe('AC-7: Modal displays the task status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-7: modal shows "Pending" for a pending task', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      // Status should be displayed as title case "Pending"
      expect(dialog).toHaveTextContent('Pending');
    });
  });

  it('AC-7: modal shows "Complete" for a complete task', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [completeTask],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Review Q1 report')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Review Q1 report'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('Complete');
    });
  });
});

// ── AC-8: Closing the modal ───────────────────────────────────────────────────

describe('AC-8: Modal can be closed by pressing Escape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-8: pressing Escape closes the modal', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('AC-8 (Example 5): clicking outside the modal overlay closes the modal', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click the Radix UI backdrop/overlay to simulate clicking outside the dialog.
    // The overlay element has pointer-events: auto and responds to user clicks.
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeNull();
    await user.click(overlay as HTMLElement);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

// ── AC-9: Task list remains visible and unchanged after modal closes ──────────

describe('AC-9: Task list is unchanged after the modal closes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-9: task list is still visible after closing the modal', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription, taskWithoutDescription],
      total: 2,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
      expect(screen.getByText('Fix printer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Task list should still show both tasks
    expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    expect(screen.getByText('Fix printer')).toBeInTheDocument();
  });

  it('AC-9: same API is not re-called after closing the modal', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    const callCountAfterLoad = mockListTasks.mock.calls.length;

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // No additional API calls should have been triggered just by opening/closing the modal
    expect(mockListTasks.mock.calls.length).toBe(callCountAfterLoad);
  });
});

// ── AC-10: Team-member sees no edit/delete/mark-complete controls ─────────────

describe('AC-10: Team-member sees no edit, delete, or mark-complete controls in the modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-10: no "Edit" button visible in modal for team-member', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /edit/i }),
    ).not.toBeInTheDocument();
  });

  it('AC-10: no "Delete" button visible in modal for team-member', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /delete/i }),
    ).not.toBeInTheDocument();
  });

  it('AC-10: no "Mark Complete" or "Mark as Complete" button visible in modal for team-member', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /mark.*(complete|done)/i }),
    ).not.toBeInTheDocument();
  });
});

// ── AC-11: Admin sees no mark-complete control (BR7) ─────────────────────────

describe('AC-11: Admin sees no mark-complete control in the modal (BR7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-11: no "Mark Complete" button visible in modal for admin viewing a complete task', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [completeAdminTask],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Archive old records')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Archive old records'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /mark.*(complete|done)/i }),
    ).not.toBeInTheDocument();
  });

  it('AC-11: admin modal for a complete task still shows all task details', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [completeAdminTask],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Archive old records')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Archive old records'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('Archive old records');
      expect(dialog).toHaveTextContent('Complete');
      expect(dialog).toHaveTextContent('Morgan Lee');
    });
  });

  it('AC-11: no "Mark Complete" button visible for admin viewing a pending task', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [adminTask],
      total: 1,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Prepare budget forecast')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Prepare budget forecast'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /mark.*(complete|done)/i }),
    ).not.toBeInTheDocument();
  });
});

// ── Edge: Opening a second task after closing the first ───────────────────────

describe('Edge: Clicking a different task after closing the first modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Edge: second modal opens and shows the newly clicked task details, not stale data', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskWithDescription, taskWithoutDescription],
      total: 2,
    });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
      expect(screen.getByText('Fix printer')).toBeInTheDocument();
    });

    // Open first task
    await user.click(screen.getByText('Update onboarding docs'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('Update onboarding docs');
    });

    // Close it
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Open second task
    await user.click(screen.getByText('Fix printer'));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent('Fix printer');
      // Stale data from the first task must not appear in the second modal
      expect(dialog).not.toHaveTextContent('Revise the first three sections');
    });
  });
});
