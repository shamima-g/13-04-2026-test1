/**
 * Epic 2, Story 3 — Admin: Create Task Tests
 *
 * Tests for the create task form overlay (admin role only).
 * Covers AC-1 through AC-15, plus edge cases from the test design document.
 *
 * Story: generated-docs/stories/epic-2-task-management/story-3-admin-create-task.md
 * Test design: generated-docs/test-design/epic-2-task-management/story-3-admin-create-task-test-design.md
 *
 * BA Decisions applied (implementation-choice defaults):
 * 1. API error placement: error message at the top of the form as a banner
 *    (Option A — "Something went wrong. Please try again.")
 * 2. Success toast copy: implementation choice — tests verify a toast appears,
 *    not the exact wording
 * 3. Cancellation trigger: Cancel button + X icon + Escape (Option C — all three)
 *
 * FRS-Over-Template: The FRS and story ACs are the source of truth.
 * Create task functionality is new in this story — no conflicting template code.
 */

import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ── Use vi.hoisted to safely initialize mocks before module loading ──────────

const {
  mockListTasks,
  mockCreateTask,
  mockListUsers,
  mockRedirect,
  mockUseRouter,
  mockShowToast,
} = vi.hoisted(() => ({
  mockListTasks: vi.fn(),
  mockCreateTask: vi.fn(),
  mockListUsers: vi.fn(),
  mockRedirect: vi.fn(),
  mockShowToast: vi.fn(),
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

// ── Mock ToastContext so components can call useToast without a provider ─────
vi.mock('@/contexts/ToastContext', () => ({
  useToast: vi.fn(() => ({
    showToast: mockShowToast,
    dismissToast: vi.fn(),
    clearAllToasts: vi.fn(),
    toasts: [],
  })),
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ── Mock Shadcn Select with a native <select> for jsdom compatibility ─────────
// Radix UI's Select uses portal-based popovers that don't open in jsdom.
// We replace it with a simple accessible native select that tests can interact
// with normally, preserving the same props and ARIA semantics.
// The Select root captures id/aria-label from SelectTrigger and options from
// SelectContent/SelectItem, then renders a single <select> element.

interface SelectContextType {
  value: string;
  onValueChange: (v: string) => void;
  disabled: boolean;
  triggerId?: string;
  triggerAriaLabel?: string;
  triggerAriaBusy?: boolean;
  triggerAriaInvalid?: boolean;
  setTriggerId?: (id?: string) => void;
  setTriggerAriaLabel?: (label?: string) => void;
  setTriggerAriaBusy?: (busy?: boolean) => void;
  setTriggerAriaInvalid?: (invalid?: boolean) => void;
  addOption?: (optionValue: string, label: string) => void;
}

vi.mock('@/components/ui/select', async () => {
  const React = await import('react');
  const SelectCtx = React.createContext<SelectContextType>({
    value: '',
    onValueChange: () => undefined,
    disabled: false,
  });

  function Select({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
  }) {
    const [triggerId, setTriggerId] = React.useState<string | undefined>();
    const [triggerAriaLabel, setTriggerAriaLabel] = React.useState<
      string | undefined
    >();
    const [triggerAriaBusy, setTriggerAriaBusy] = React.useState<
      boolean | undefined
    >();
    const [triggerAriaInvalid, setTriggerAriaInvalid] = React.useState<
      boolean | undefined
    >();
    const [options, setOptions] = React.useState<
      Array<{ value: string; label: string }>
    >([]);

    const ctx: SelectContextType = {
      value: value ?? '',
      onValueChange: onValueChange ?? (() => undefined),
      disabled: disabled ?? false,
      triggerId,
      triggerAriaLabel,
      triggerAriaBusy,
      triggerAriaInvalid,
      setTriggerId,
      setTriggerAriaLabel,
      setTriggerAriaBusy,
      setTriggerAriaInvalid,
      addOption: (optionValue: string, label: string) => {
        setOptions((prev) => {
          if (prev.some((o) => o.value === optionValue)) return prev;
          return [...prev, { value: optionValue, label }];
        });
      },
    };

    // We render children (for side-effect registration) but suppress their output,
    // then render a real <select> with collected options.
    return (
      <SelectCtx.Provider value={ctx}>
        <div style={{ display: 'none' }}>{children}</div>
        <select
          id={triggerId}
          role="combobox"
          aria-label={triggerAriaLabel}
          aria-busy={triggerAriaBusy}
          aria-invalid={triggerAriaInvalid}
          disabled={disabled}
          value={value ?? ''}
          onChange={(e) => onValueChange?.(e.target.value)}
          style={{ display: 'block', width: '100%' }}
        >
          <option value="" disabled>
            {disabled ? 'Loading users...' : 'Select a team member'}
          </option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              role="option"
              aria-selected={value === opt.value}
            >
              {opt.label}
            </option>
          ))}
        </select>
      </SelectCtx.Provider>
    );
  }

  function SelectTrigger({
    id,
    'aria-label': ariaLabel,
    'aria-busy': ariaBusy,
    'aria-invalid': ariaInvalid,
  }: {
    id?: string;
    'aria-label'?: string;
    'aria-busy'?: boolean;
    'aria-invalid'?: boolean;
    children?: React.ReactNode;
    className?: string;
  }) {
    const ctx = React.useContext(SelectCtx);
    React.useEffect(() => {
      ctx.setTriggerId?.(id);
      ctx.setTriggerAriaLabel?.(ariaLabel);
      ctx.setTriggerAriaBusy?.(ariaBusy);
      ctx.setTriggerAriaInvalid?.(ariaInvalid);
    }, [ctx, id, ariaLabel, ariaBusy, ariaInvalid]);
    return null;
  }

  function SelectValue(_props: { placeholder?: string }) {
    return null;
  }

  function SelectContent({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  }

  function SelectItem({
    value,
    children,
  }: {
    value: string;
    children?: React.ReactNode;
  }) {
    const ctx = React.useContext(SelectCtx);
    const label =
      typeof children === 'string' ? children : String(children ?? value);
    React.useEffect(() => {
      ctx.addOption?.(value, label);
    }, [ctx, value, label]);
    return null;
  }

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup: ({ children }: { children?: React.ReactNode }) => (
      <>{children}</>
    ),
    SelectLabel: ({ children }: { children?: React.ReactNode }) => (
      <>{children}</>
    ),
    SelectSeparator: () => null,
    SelectScrollUpButton: () => null,
    SelectScrollDownButton: () => null,
  };
});

// ── Mock the API endpoints — never use fetch() directly ─────────────────────
vi.mock('@/lib/api/endpoints', () => ({
  listTasks: mockListTasks,
  createTask: mockCreateTask,
  listUsers: mockListUsers,
}));

// ── Mock auth for server component support ───────────────────────────────────
vi.mock('@/lib/auth/auth-server', () => ({
  requireAuth: vi.fn(async () => ({
    user: {
      id: 'admin-1',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@example.com',
    },
  })),
  getSession: vi.fn(async () => ({
    user: {
      id: 'admin-1',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@example.com',
    },
  })),
}));

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(async () => ({
    user: {
      id: 'admin-1',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@example.com',
    },
  })),
}));

// ── Import components under test ─────────────────────────────────────────────
// TaskListClient hosts the Create Task button and form.
// These imports will fail (red phase) until implementation is complete.
import TaskListClient from '@/components/tasks/TaskListClient';

// ── Test data fixtures ────────────────────────────────────────────────────────

const aliceUser = {
  id: 'u-101',
  displayName: 'Alice Chen',
  email: 'alice@example.com',
  role: 'team-member' as const,
};

const bobUser = {
  id: 'u-102',
  displayName: 'Bob Gomez',
  email: 'bob@example.com',
  role: 'team-member' as const,
};

const adminUser = {
  id: 'admin-1',
  displayName: 'Admin User',
  email: 'admin@example.com',
  role: 'admin' as const,
};

const existingTask = {
  id: 'task-1',
  title: 'Approve budget',
  description: null,
  dueDate: '2026-04-18',
  assignedUserId: 'u-101',
  assignedUser: aliceUser,
  status: 'pending' as const,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

const newlyCreatedTask = {
  id: 'task-99',
  title: 'Design new onboarding flow',
  description: 'Focus on the first 3 screens',
  dueDate: '2026-05-01',
  assignedUserId: 'u-101',
  assignedUser: aliceUser,
  status: 'pending' as const,
  createdAt: '2026-04-15T00:00:00Z',
  updatedAt: '2026-04-15T00:00:00Z',
};

// ── AC-1: Admin sees "Create Task" button ─────────────────────────────────────

describe('AC-1: Admin sees "Create Task" button on the all-tasks page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
  });

  it('AC-1: admin sees a "Create Task" button on the all-tasks view', async () => {
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });
  });
});

// ── AC-2: Team-member does not see "Create Task" button ──────────────────────

describe('AC-2: Team-member does not see the "Create Task" button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
  });

  it('AC-2: no "Create Task" button is shown for team-member role', async () => {
    render(<TaskListClient role="team-member" />);

    await waitFor(() => {
      expect(screen.getByText('Approve budget')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /create task/i }),
    ).not.toBeInTheDocument();
  });
});

// ── AC-3: Clicking "Create Task" opens the form dialog ───────────────────────

describe('AC-3: Clicking "Create Task" opens the create task form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
  });

  it('AC-3: clicking "Create Task" opens a dialog overlay', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('AC-3: the form contains a Title field', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });
  });

  it('AC-3: the form contains a Description field', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });

  it('AC-3: the form contains a Due Date field', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    });
  });

  it('AC-3: the form contains an Assigned User field', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/assigned user/i)).toBeInTheDocument();
    });
  });

  it('AC-3: the dialog is not open before the button is clicked', async () => {
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Approve budget')).toBeInTheDocument();
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ── AC-4: Assigned user field is a dropdown, not free-text ───────────────────

describe('AC-4: Assigned user field is a dropdown populated from existing users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
  });

  it('AC-4: the assigned user field is a combobox/select, not a plain text input', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // The assigned user field should be a select/combobox control
    const assignedUserControl =
      screen.queryByRole('combobox', { name: /assigned user/i }) ||
      screen.queryByRole('listbox', { name: /assigned user/i });
    expect(assignedUserControl).toBeInTheDocument();
  });

  it('AC-4: the assigned user dropdown contains users fetched from GET /v1/users', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Users from the API should appear as options in the dropdown
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /alice chen/i }),
      ).toBeInTheDocument();
    });
  });

  it('AC-4: listUsers API is called when the form opens', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(mockListUsers).toHaveBeenCalled();
    });
  });
});

// ── AC-5: Title is required — submitting blank title shows validation error ───

describe('AC-5: Submitting without a title shows an inline validation error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
  });

  it('AC-5: submitting without a title shows an inline validation error', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Submit without filling in the title
    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/title is required|title.*required/i),
      ).toBeInTheDocument();
    });
  });

  it('AC-5: the API is NOT called when title is missing', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/title is required|title.*required/i),
      ).toBeInTheDocument();
    });

    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('AC-5: the form stays open when title validation fails', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/title is required|title.*required/i),
      ).toBeInTheDocument();
    });

    // Dialog should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// ── AC-6: Title too long — 201 characters triggers validation error ───────────

describe('AC-6: Title longer than 200 characters shows an inline validation error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
  });

  it('AC-6: submitting with a 201-character title shows a "title is too long" error', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Use userEvent.paste to set a long value without slow keystroke-by-keystroke simulation
    const titleInput = screen.getByLabelText(/title/i);
    await user.click(titleInput);
    await user.paste('A'.repeat(201));

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/title is too long|title.*too long|200 characters/i),
      ).toBeInTheDocument();
    });
  });

  it('AC-6: the API is NOT called when title exceeds 200 characters', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Use userEvent.paste to set a long value without slow keystroke-by-keystroke simulation
    const titleInput = screen.getByLabelText(/title/i);
    await user.click(titleInput);
    await user.paste('A'.repeat(201));

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/title is too long|title.*too long|200 characters/i),
      ).toBeInTheDocument();
    });

    expect(mockCreateTask).not.toHaveBeenCalled();
  });
});

// ── AC-7: Due date is required ────────────────────────────────────────────────

describe('AC-7: Submitting without a due date shows an inline validation error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
  });

  it('AC-7: submitting without a due date shows an inline validation error', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill in title only, leave due date blank
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/due date is required|due date.*required/i),
      ).toBeInTheDocument();
    });
  });

  it('AC-7: the API is NOT called when due date is missing', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/due date is required|due date.*required/i),
      ).toBeInTheDocument();
    });

    expect(mockCreateTask).not.toHaveBeenCalled();
  });
});

// ── AC-8: Assigned user is required ──────────────────────────────────────────

describe('AC-8: Submitting without an assigned user shows an inline validation error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
  });

  it('AC-8: submitting without selecting an assigned user shows an inline validation error', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill in title and due date, leave assigned user blank
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /assigned user is required|assigned user.*required|please select a user/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it('AC-8: the API is NOT called when assigned user is missing', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /assigned user is required|assigned user.*required|please select a user/i,
        ),
      ).toBeInTheDocument();
    });

    expect(mockCreateTask).not.toHaveBeenCalled();
  });
});

// ── AC-9: No validation errors when all required fields are filled ────────────

describe('AC-9: All required fields valid — no validation errors on submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
    mockCreateTask.mockResolvedValue(newlyCreatedTask);
    // After creation, the task list refreshes
    mockListTasks.mockResolvedValueOnce({ tasks: [existingTask], total: 1 });
    mockListTasks.mockResolvedValue({
      tasks: [existingTask, newlyCreatedTask],
      total: 2,
    });
  });

  it('AC-9: no validation error messages shown when all fields are valid', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    // Select Alice Chen from the dropdown
    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    // No validation error text should be visible
    await waitFor(() => {
      expect(
        screen.queryByText(/is required|too long/i),
      ).not.toBeInTheDocument();
    });
  });

  it('AC-9: the API is called when all fields are valid', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Design new onboarding flow',
          assignedUserId: 'u-101',
        }),
      );
    });
  });
});

// ── AC-10: Successful submission closes the form ──────────────────────────────

describe('AC-10: On success, the form closes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
    mockCreateTask.mockResolvedValue(newlyCreatedTask);
    mockListTasks.mockResolvedValue({
      tasks: [existingTask, newlyCreatedTask],
      total: 2,
    });
  });

  it('AC-10: the dialog closes after successful task creation', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

// ── AC-11: New task appears in the list after successful creation ─────────────

describe('AC-11: After successful creation, the new task appears in the all-tasks list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Initial load
    mockListTasks.mockResolvedValueOnce({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
    mockCreateTask.mockResolvedValue(newlyCreatedTask);
    // After creation, the task list is refreshed and shows the new task
    mockListTasks.mockResolvedValue({
      tasks: [existingTask, newlyCreatedTask],
      total: 2,
    });
  });

  it('AC-11: the new task title appears in the all-tasks list after form closes', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Approve budget')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText('Design new onboarding flow'),
      ).toBeInTheDocument();
    });
  });
});

// ── AC-12: Success toast notification ────────────────────────────────────────

describe('AC-12: A success toast notification appears after task creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValueOnce({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
    mockCreateTask.mockResolvedValue(newlyCreatedTask);
    mockListTasks.mockResolvedValue({
      tasks: [existingTask, newlyCreatedTask],
      total: 2,
    });
  });

  it('AC-12: a success toast is visible after task creation', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // The success toast function should have been called.
    // useToast is mocked — we verify showToast was called with a success variant.
    // The actual toast UI is rendered by ToastContainer (in the app layout),
    // which is not mounted in this test. Verifying showToast was called is
    // sufficient to confirm AC-12 behavior.
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      );
    });
  });
});

// ── AC-13: API error keeps form open and shows error message ─────────────────

describe('AC-13: When the API fails, the form stays open and shows an error message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
    mockCreateTask.mockRejectedValue(new Error('Server error'));
  });

  it('AC-13: the form stays open when the API returns an error', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      // The dialog must still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('AC-13: an error message appears inside the form when the API fails', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      // An error message must appear inside the form
      expect(dialog).toHaveTextContent(
        /something went wrong|failed|error|try again/i,
      );
    });
  });

  it('AC-13: the task list is unchanged when the API fails', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Approve budget')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // The new task should NOT appear in the background list
    expect(
      screen.queryByText('Design new onboarding flow'),
    ).not.toBeInTheDocument();
  });
});

// ── AC-14: Resubmitting retries the API call ──────────────────────────────────

describe('AC-14: Resubmitting after an API error retries the API call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValueOnce({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
    // First call fails, second call succeeds
    mockCreateTask.mockRejectedValueOnce(new Error('Server error'));
    mockCreateTask.mockResolvedValue(newlyCreatedTask);
    mockListTasks.mockResolvedValue({
      tasks: [existingTask, newlyCreatedTask],
      total: 2,
    });
  });

  it('AC-14: clicking submit again after an API error retries the API call', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    // Wait for first error
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent(
        /something went wrong|failed|error|try again/i,
      );
    });

    // Resubmit — the second call succeeds (per mock setup: first fails, second succeeds).
    // We verify the retry triggers another API call by checking the observable outcome:
    // the form closes and the task appears in the list.
    const retrySubmitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(retrySubmitButton);

    // After successful retry, the form closes.
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('AC-14: when retry succeeds, the form closes and task appears in list', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Design new onboarding flow');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent(
        /something went wrong|failed|error|try again/i,
      );
    });

    // Retry
    const retrySubmitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(retrySubmitButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText('Design new onboarding flow'),
      ).toBeInTheDocument();
    });
  });
});

// ── AC-15: Cancelling the form closes it without changing the task list ───────

describe('AC-15: Cancelling the form closes it and leaves the task list unchanged', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });
  });

  it('AC-15: pressing Escape closes the create task form', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('AC-15: clicking Cancel closes the form', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('AC-15: the task list is unchanged after cancelling the form', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Approve budget')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Enter some partial data
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Partial task title');

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Existing task still there, partial task not added
    expect(screen.getByText('Approve budget')).toBeInTheDocument();
    expect(screen.queryByText('Partial task title')).not.toBeInTheDocument();

    // createTask should never have been called
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('AC-15 (BA Decision 3): clicking the X close icon closes the form', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Shadcn Dialog renders a close button with aria-label "Close"
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

// ── Edge 1: Description is optional ──────────────────────────────────────────

describe('Edge 1: Submitting with no description is valid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValueOnce({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });

    const taskWithNoDescription = {
      ...newlyCreatedTask,
      title: 'Fix login button',
      description: null,
      assignedUserId: 'u-102',
      assignedUser: bobUser,
    };
    mockCreateTask.mockResolvedValue(taskWithNoDescription);
    mockListTasks.mockResolvedValue({
      tasks: [existingTask, taskWithNoDescription],
      total: 2,
    });
  });

  it('Edge 1: no validation error appears when description is left blank', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Fix login button');

    // Leave description blank
    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-15');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /bob gomez/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /bob gomez/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // No "required" error should have appeared for description
    expect(
      screen.queryByText(/description.*required/i),
    ).not.toBeInTheDocument();
  });

  it('Edge 1: the API is called even when description is blank', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Fix login button');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-15');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /bob gomez/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /bob gomez/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Fix login button' }),
      );
    });
  });
});

// ── Edge 2: Users list loads asynchronously ───────────────────────────────────

describe('Edge 2: Assigned-user dropdown loading state (BA Decision — implementation choice)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValue({ tasks: [existingTask], total: 1 });
  });

  it('Edge 2: the dropdown is in a disabled or loading state while users are still loading', async () => {
    // Simulate users loading slowly
    let resolveUsers!: (value: {
      users: (typeof aliceUser)[];
      total: number;
    }) => void;
    const pendingUsers = new Promise<{
      users: (typeof aliceUser)[];
      total: number;
    }>((resolve) => {
      resolveUsers = resolve;
    });
    mockListUsers.mockReturnValue(pendingUsers);

    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // While users are loading, the assigned user control should be disabled or show loading
    const assignedUserControl = screen.queryByRole('combobox', {
      name: /assigned user/i,
    });
    if (assignedUserControl) {
      expect(
        (assignedUserControl as HTMLElement).getAttribute('disabled') !==
          null ||
          (assignedUserControl as HTMLElement).getAttribute('aria-disabled') ===
            'true' ||
          (assignedUserControl as HTMLElement).getAttribute('aria-busy') ===
            'true',
      ).toBeTruthy();
    }

    // Resolve users — cleanup
    resolveUsers({ users: [aliceUser, bobUser], total: 2 });

    await waitFor(() => {
      const aliceName =
        screen.queryByText('Alice Chen') ||
        screen.queryByRole('option', { name: /alice chen/i });
      expect(aliceName).toBeInTheDocument();
    });
  });
});

// ── Edge 3: Title with exactly 200 characters is valid ───────────────────────

describe('Edge 3: Title at exactly the 200-character maximum is valid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValueOnce({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });

    const exactMaxTask = {
      ...newlyCreatedTask,
      title: 'A'.repeat(200),
    };
    mockCreateTask.mockResolvedValue(exactMaxTask);
    mockListTasks.mockResolvedValue({
      tasks: [existingTask, exactMaxTask],
      total: 2,
    });
  });

  it('Edge 3: a 200-character title is accepted with no validation error', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Use userEvent.paste to set a long value without slow keystroke-by-keystroke simulation
    const titleInput = screen.getByLabelText(/title/i);
    await user.click(titleInput);
    await user.paste('A'.repeat(200));

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    // No "too long" error
    await waitFor(() => {
      expect(
        screen.queryByText(/title is too long|title.*too long|200 characters/i),
      ).not.toBeInTheDocument();
    });

    // API called
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalled();
    });
  });
});

// ── Edge 4: Title with exactly 1 character is valid ──────────────────────────

describe('Edge 4: Title at exactly 1 character (minimum) is valid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTasks.mockResolvedValueOnce({ tasks: [existingTask], total: 1 });
    mockListUsers.mockResolvedValue({ users: [aliceUser, bobUser], total: 2 });

    const singleCharTask = {
      ...newlyCreatedTask,
      title: 'A',
    };
    mockCreateTask.mockResolvedValue(singleCharTask);
    mockListTasks.mockResolvedValue({
      tasks: [existingTask, singleCharTask],
      total: 2,
    });
  });

  it('Edge 4: a single-character title is accepted with no validation error', async () => {
    const user = userEvent.setup();
    render(<TaskListClient role="admin" />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create task/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'A');

    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.type(dueDateInput, '2026-05-01');

    const assignedUserControl = screen.getByRole('combobox', {
      name: /assigned user/i,
    });
    expect(
      await screen.findByRole('option', { name: /alice chen/i }),
    ).toBeInTheDocument();
    await user.selectOptions(
      assignedUserControl,
      screen.getByRole('option', { name: /alice chen/i }),
    );

    const submitButton = screen.getByRole('button', {
      name: /submit|create|save/i,
    });
    await user.click(submitButton);

    // No validation errors
    await waitFor(() => {
      expect(
        screen.queryByText(/title is required|title.*required/i),
      ).not.toBeInTheDocument();
    });

    // API called with the single-char title
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'A' }),
      );
    });
  });
});
