/**
 * Epic 2, Story 1 — Task List View Tests
 *
 * Tests for the task list page (both team-member and admin roles).
 * Covers all AC-1 through AC-15 (AC-16 and AC-17 are runtime-only, listed in
 * the Runtime Verification Checklist in the test handoff document).
 *
 * Story: generated-docs/stories/epic-2-task-management/story-1-task-list-view.md
 * Test design: generated-docs/test-design/epic-2-task-management/story-1-task-list-view-test-design.md
 * Test handoff: generated-docs/test-design/epic-2-task-management/story-1-task-list-view-test-handoff.md
 *
 * BA Decisions applied:
 * 1. Empty filter message: "No tasks match this filter." (generic, both roles)
 * 2. Default filter on page load: "All" is pre-selected
 * 3. Loading indicator: any visible loading indicator — test presence, not form
 * 4. Error banner on Retry success: auto-dismisses (Option A, AC-15 confirmed)
 * 5. Retry fails again: same banner remains, no different message (Option A)
 *
 * FRS-Over-Template: The FRS and story ACs are the source of truth.
 * The placeholder pages in (protected)/tasks/ are shells from Epic 1 —
 * this story replaces their content with the real task list UI.
 */

import { vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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
}));

// ── Mock auth for server component support ───────────────────────────────────
vi.mock('@/lib/auth/auth-server', () => ({
  requireAuth: vi.fn(async () => ({
    user: {
      id: 'user-1',
      name: 'Jordan Lee',
      role: 'team-member',
      email: 'jordan@example.com',
    },
  })),
  getSession: vi.fn(async () => ({
    user: {
      id: 'user-1',
      name: 'Jordan Lee',
      role: 'team-member',
      email: 'jordan@example.com',
    },
  })),
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(async () => ({
    user: {
      id: 'user-1',
      name: 'Jordan Lee',
      role: 'team-member',
      email: 'jordan@example.com',
    },
  })),
}));

// ── Import components under test ─────────────────────────────────────────────
// The task list is a client component built in Epic 2; import from its expected path.
// These imports will fail (red phase) until implementation is complete.
import TaskListClient from '@/components/tasks/TaskListClient';

// ── Test data fixtures ────────────────────────────────────────────────────────

const jordanUser = {
  id: 'user-1',
  displayName: 'Jordan Lee',
  email: 'jordan@example.com',
  role: 'team-member' as const,
};

const samUser = {
  id: 'user-2',
  displayName: 'Sam Chen',
  email: 'sam@example.com',
  role: 'team-member' as const,
};

const alexUser = {
  id: 'user-3',
  displayName: 'Alex Rivera',
  email: 'alex@example.com',
  role: 'admin' as const,
};

const taskA = {
  id: 'task-1',
  title: 'Write weekly report',
  description: null,
  dueDate: '2026-04-20',
  assignedUserId: 'user-1',
  assignedUser: jordanUser,
  status: 'pending' as const,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

const taskB = {
  id: 'task-2',
  title: 'Update documentation',
  description: null,
  dueDate: '2026-04-15',
  assignedUserId: 'user-1',
  assignedUser: jordanUser,
  status: 'complete' as const,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-10T00:00:00Z',
};

const taskC = {
  id: 'task-3',
  title: 'Approve budget',
  description: null,
  dueDate: '2026-04-18',
  assignedUserId: 'user-2',
  assignedUser: samUser,
  status: 'pending' as const,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

const taskD = {
  id: 'task-4',
  title: 'Update onboarding docs',
  description: null,
  dueDate: '2026-04-15',
  assignedUserId: 'user-1',
  assignedUser: jordanUser,
  status: 'complete' as const,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-12T00:00:00Z',
};

// ── Team-Member Task List ─────────────────────────────────────────────────────

describe('AC-1 / AC-2: Team-member task list — own tasks only', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-1: team-member sees only tasks assigned to them (not tasks assigned to others)', async () => {
    // API returns only Jordan's tasks (server-side scoping — taskC belongs to Sam)
    mockListTasks.mockResolvedValue({
      tasks: [taskA, taskB],
      total: 2,
    });

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
    });

    // "Approve budget" belongs to Sam Chen — must not appear
    expect(screen.queryByText('Approve budget')).not.toBeInTheDocument();
  });

  it('AC-2: each team-member task row shows task title', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskA], total: 1 });

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
    });
  });

  it('AC-2: each team-member task row shows due date', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskA], total: 1 });

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      // The due date "2026-04-20" should appear somewhere in the row
      expect(screen.getByText(/2026-04-20/)).toBeInTheDocument();
    });
  });

  it('AC-2: each team-member task row shows current status', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskA], total: 1 });

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      // Status "pending" or "Pending" should appear in the list
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });
  });
});

// ── Admin All-Tasks View ──────────────────────────────────────────────────────

describe('AC-3 / AC-4: Admin all-tasks view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-3: admin sees all tasks in the system', async () => {
    // API returns all tasks when called as admin
    mockListTasks.mockResolvedValue({
      tasks: [taskA, taskC, taskD],
      total: 3,
    });

    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
      expect(screen.getByText('Approve budget')).toBeInTheDocument();
      expect(screen.getByText('Update onboarding docs')).toBeInTheDocument();
    });
  });

  it('AC-4: admin task rows show the assigned user display name', async () => {
    mockListTasks.mockResolvedValue({
      tasks: [taskA, taskC, taskD],
      total: 3,
    });

    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      // Multiple tasks may be assigned to Jordan Lee — use getAllByText
      expect(screen.getAllByText('Jordan Lee').length).toBeGreaterThanOrEqual(
        1,
      );
      expect(screen.getByText('Sam Chen')).toBeInTheDocument();
    });
  });

  it('AC-4: admin task rows show task title', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskC], total: 1 });

    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Approve budget')).toBeInTheDocument();
    });
  });

  it('AC-4: admin task rows show due date', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskC], total: 1 });

    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText(/2026-04-18/)).toBeInTheDocument();
    });
  });

  it('AC-4: admin task rows show current status', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskC], total: 1 });

    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });
  });
});

// ── Status Filter ─────────────────────────────────────────────────────────────

describe('AC-5 through AC-8: Status filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-5: filter control shows "All", "Pending", and "Complete" options', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskA, taskB], total: 2 });

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^all$/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^pending$/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^complete$/i }),
      ).toBeInTheDocument();
    });
  });

  it('AC-5 (BA Decision 2): "All" is pre-selected as the default filter when the page loads', async () => {
    mockListTasks.mockResolvedValue({ tasks: [taskA, taskB], total: 2 });

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      // Initial API call should have no status filter (or status=undefined)
      expect(mockListTasks).toHaveBeenCalledWith(
        expect.not.objectContaining({ status: expect.anything() }),
      );
    });
  });

  it('AC-6: selecting "Pending" calls the API with status=pending', async () => {
    // Initial load returns both tasks
    mockListTasks.mockResolvedValueOnce({ tasks: [taskA, taskB], total: 2 });
    // After filter: only pending tasks
    mockListTasks.mockResolvedValue({ tasks: [taskA], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^pending$/i }));

    await waitFor(() => {
      expect(mockListTasks).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });
  });

  it('AC-6: selecting "Pending" shows only pending tasks (no page reload)', async () => {
    mockListTasks.mockResolvedValueOnce({ tasks: [taskA, taskB], total: 2 });
    mockListTasks.mockResolvedValue({ tasks: [taskA], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^pending$/i }));

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
      expect(
        screen.queryByText('Update documentation'),
      ).not.toBeInTheDocument();
    });
  });

  it('AC-7: selecting "Complete" shows only completed tasks (no page reload)', async () => {
    mockListTasks.mockResolvedValueOnce({ tasks: [taskA, taskB], total: 2 });
    mockListTasks.mockResolvedValue({ tasks: [taskB], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^complete$/i }));

    await waitFor(() => {
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
      expect(screen.queryByText('Write weekly report')).not.toBeInTheDocument();
    });
  });

  it('AC-7: selecting "Complete" calls the API with status=complete', async () => {
    mockListTasks.mockResolvedValueOnce({ tasks: [taskA, taskB], total: 2 });
    mockListTasks.mockResolvedValue({ tasks: [taskB], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^complete$/i }));

    await waitFor(() => {
      expect(mockListTasks).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'complete' }),
      );
    });
  });

  it('AC-8: selecting "All" after a filter restores all tasks', async () => {
    mockListTasks.mockResolvedValueOnce({ tasks: [taskA, taskB], total: 2 });
    // "Complete" filter
    mockListTasks.mockResolvedValueOnce({ tasks: [taskB], total: 1 });
    // Back to "All"
    mockListTasks.mockResolvedValue({ tasks: [taskA, taskB], total: 2 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^complete$/i }));

    await waitFor(() => {
      expect(screen.queryByText('Write weekly report')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^all$/i }));

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
      expect(screen.getByText('Update documentation')).toBeInTheDocument();
    });
  });
});

// ── Empty States ─────────────────────────────────────────────────────────────

describe('AC-9 / AC-10: Empty states — no tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-9: team-member with no assigned tasks sees "No tasks assigned to you yet."', async () => {
    mockListTasks.mockResolvedValue({ tasks: [], total: 0 });

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(
        screen.getByText('No tasks assigned to you yet.'),
      ).toBeInTheDocument();
    });
  });

  it('AC-9: team-member empty state shows no task rows', async () => {
    mockListTasks.mockResolvedValue({ tasks: [], total: 0 });

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(
        screen.getByText('No tasks assigned to you yet.'),
      ).toBeInTheDocument();
    });

    // No task titles should appear
    expect(screen.queryByText('Write weekly report')).not.toBeInTheDocument();
  });

  it('AC-10: admin with no tasks in system sees "No tasks have been created yet."', async () => {
    mockListTasks.mockResolvedValue({ tasks: [], total: 0 });

    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByText('No tasks have been created yet.'),
      ).toBeInTheDocument();
    });
  });

  it('AC-10: admin empty state shows no task rows', async () => {
    mockListTasks.mockResolvedValue({ tasks: [], total: 0 });

    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByText('No tasks have been created yet.'),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText('Approve budget')).not.toBeInTheDocument();
  });
});

// ── AC-11: Filter produces no results ────────────────────────────────────────

describe('AC-11: Filter empty state — no tasks match the filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-11: shows "No tasks match this filter." when "Complete" filter returns no results (team-member)', async () => {
    // Initial load: one pending task
    mockListTasks.mockResolvedValueOnce({ tasks: [taskA], total: 1 });
    // After "Complete" filter: empty
    mockListTasks.mockResolvedValue({ tasks: [], total: 0 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^complete$/i }));

    await waitFor(() => {
      expect(
        screen.getByText('No tasks match this filter.'),
      ).toBeInTheDocument();
    });
  });

  it('AC-11: shows "No tasks match this filter." when filter returns no results (admin)', async () => {
    // Initial load: all pending tasks
    mockListTasks.mockResolvedValueOnce({ tasks: [taskA, taskC], total: 2 });
    // After "Complete" filter: empty
    mockListTasks.mockResolvedValue({ tasks: [], total: 0 });

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^complete$/i }));

    await waitFor(() => {
      expect(
        screen.getByText('No tasks match this filter.'),
      ).toBeInTheDocument();
    });
  });

  it('AC-11: filter empty state does not show task rows', async () => {
    mockListTasks.mockResolvedValueOnce({ tasks: [taskA], total: 1 });
    mockListTasks.mockResolvedValue({ tasks: [], total: 0 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^complete$/i }));

    await waitFor(() => {
      expect(
        screen.getByText('No tasks match this filter.'),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText('Write weekly report')).not.toBeInTheDocument();
  });
});

// ── AC-12: Loading State ─────────────────────────────────────────────────────

describe('AC-12: Loading state while task data is being fetched', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-12: shows a visible loading indicator while data is in flight', async () => {
    // Use a manually-resolved promise to simulate the loading in-between state
    let resolvePromise!: (value: {
      tasks: (typeof taskA)[];
      total: number;
    }) => void;
    const pendingPromise = new Promise<{
      tasks: (typeof taskA)[];
      total: number;
    }>((resolve) => {
      resolvePromise = resolve;
    });
    mockListTasks.mockReturnValue(pendingPromise);

    render(<TaskListClient role="team-member" />);

    // Before the promise resolves, a loading indicator must be visible.
    // BA Decision 3: any visible loading indicator is acceptable (spinner, skeleton, etc.)
    // We check for one of the common ARIA patterns used for loading indicators.
    expect(
      screen.getByRole('status') ||
        screen.getByLabelText(/loading/i) ||
        screen.getByText(/loading/i) ||
        document.querySelector('[aria-busy="true"]') ||
        document.querySelector('[data-testid="loading"]') ||
        document.querySelector('[data-loading]'),
    ).toBeTruthy();

    // Resolve the promise so the component can settle
    resolvePromise({ tasks: [taskA], total: 1 });

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
    });
  });

  it('AC-12: task list is not shown while loading', async () => {
    let resolvePromise!: (value: {
      tasks: (typeof taskA)[];
      total: number;
    }) => void;
    const pendingPromise = new Promise<{
      tasks: (typeof taskA)[];
      total: number;
    }>((resolve) => {
      resolvePromise = resolve;
    });
    mockListTasks.mockReturnValue(pendingPromise);

    render(<TaskListClient role="team-member" />);

    // Task titles must not appear before data arrives
    expect(screen.queryByText('Write weekly report')).not.toBeInTheDocument();

    resolvePromise({ tasks: [taskA], total: 1 });

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
    });
  });
});

// ── AC-13 / AC-14 / AC-15: Error Banner and Retry ───────────────────────────

describe('AC-13 / AC-14 / AC-15: Error banner and Retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC-13: shows error banner "Unable to load tasks. Please try again." when API fails', async () => {
    mockListTasks.mockRejectedValue(new Error('Server error'));

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(
        screen.getByText('Unable to load tasks. Please try again.'),
      ).toBeInTheDocument();
    });
  });

  it('AC-13: task list is NOT shown when API fails', async () => {
    mockListTasks.mockRejectedValue(new Error('Server error'));

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(
        screen.getByText('Unable to load tasks. Please try again.'),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText('Write weekly report')).not.toBeInTheDocument();
  });

  it('AC-14: "Retry" button is visible alongside the error banner', async () => {
    mockListTasks.mockRejectedValue(new Error('Server error'));

    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /retry/i }),
      ).toBeInTheDocument();
    });
  });

  it('AC-14: clicking "Retry" re-requests the task list from the API', async () => {
    mockListTasks.mockRejectedValue(new Error('Server error'));

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /retry/i }),
      ).toBeInTheDocument();
    });

    const callCountBeforeRetry = mockListTasks.mock.calls.length;
    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(mockListTasks.mock.calls.length).toBeGreaterThan(
        callCountBeforeRetry,
      );
    });
  });

  it('AC-15: when Retry succeeds, the error banner disappears', async () => {
    // First call fails, second call succeeds
    mockListTasks.mockRejectedValueOnce(new Error('Server error'));
    mockListTasks.mockResolvedValue({ tasks: [taskA], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(
        screen.getByText('Unable to load tasks. Please try again.'),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(
        screen.queryByText('Unable to load tasks. Please try again.'),
      ).not.toBeInTheDocument();
    });
  });

  it('AC-15: when Retry succeeds, the task list is displayed', async () => {
    mockListTasks.mockRejectedValueOnce(new Error('Server error'));
    mockListTasks.mockResolvedValue({ tasks: [taskA], total: 1 });

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /retry/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText('Write weekly report')).toBeInTheDocument();
    });
  });

  it('Edge: when Retry fails again, the error banner remains visible (BA Decision 5: same banner, no different message)', async () => {
    // Both calls fail
    mockListTasks.mockRejectedValue(new Error('Server error'));

    const user = userEvent.setup();
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(
        screen.getByText('Unable to load tasks. Please try again.'),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      // Banner remains with the same message — no new/different message (Option A)
      expect(
        screen.getByText('Unable to load tasks. Please try again.'),
      ).toBeInTheDocument();
    });
  });
});

// ── Runtime Verification Checklist (not automated) ───────────────────────────
//
// AC-16 and AC-17 require Next.js routing stack (middleware/layout-level redirects)
// and cannot be exercised in jsdom. They are documented here for QA reference:
//
// AC-16: Visiting /tasks or /tasks/all without being signed in must redirect to
//         the sign-in page. Verify manually in the browser.
//
// AC-17: Signing in as a team-member and navigating to /tasks/all must silently
//         redirect to /tasks with no error or "access denied" message shown.
//         Verify manually in the browser.
