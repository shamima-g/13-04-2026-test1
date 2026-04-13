# Feature: Team Task Management

## Summary

A task management application for small teams. Admins create, assign, edit, and delete tasks. Team members view their own assigned tasks and mark them complete. Role-based routing ensures each user lands on the right view after sign-in.

## Epics

1. **Epic 1: Authentication and Role-Based Routing** - Sign-in page, session handling, role detection, and post-sign-in routing. Team-members land on `/tasks`, admins land on `/tasks/all`. Team-members hitting admin routes are silently redirected. Unauthenticated users are redirected to sign-in. | Status: Pending | Dir: `epic-1-auth-and-routing/`
2. **Epic 2: Task Management** - Full task UI for both roles. Team-member view: personal task list with status filter, empty/loading/error states, and task detail modal with Mark Complete. Admin view: all tasks, status filter, Create Task, Edit Task, Delete Task with confirmation, and shared task detail modal. Success toast after task creation. | Status: Pending | Dir: `epic-2-task-management/`

## Requirements Coverage

| Epic | Requirements |
|------|-------------|
| Epic 1: Authentication and Role-Based Routing | [R1](../specs/feature-requirements.md#functional-requirements), [R2](../specs/feature-requirements.md#functional-requirements), [BR9](../specs/feature-requirements.md#business-rules), [BR10](../specs/feature-requirements.md#business-rules), [NFR1](../specs/feature-requirements.md#non-functional-requirements) |
| Epic 2: Task Management | [R3](../specs/feature-requirements.md#functional-requirements), [R4](../specs/feature-requirements.md#functional-requirements), [R5](../specs/feature-requirements.md#functional-requirements), [R6](../specs/feature-requirements.md#functional-requirements), [R7](../specs/feature-requirements.md#functional-requirements), [R8](../specs/feature-requirements.md#functional-requirements), [R9](../specs/feature-requirements.md#functional-requirements), [R10](../specs/feature-requirements.md#functional-requirements), [R11](../specs/feature-requirements.md#functional-requirements), [R12](../specs/feature-requirements.md#functional-requirements), [R13](../specs/feature-requirements.md#functional-requirements), [R14](../specs/feature-requirements.md#functional-requirements), [BR1](../specs/feature-requirements.md#business-rules), [BR2](../specs/feature-requirements.md#business-rules), [BR3](../specs/feature-requirements.md#business-rules), [BR4](../specs/feature-requirements.md#business-rules), [BR5](../specs/feature-requirements.md#business-rules), [BR6](../specs/feature-requirements.md#business-rules), [BR7](../specs/feature-requirements.md#business-rules), [BR8](../specs/feature-requirements.md#business-rules), [NFR1](../specs/feature-requirements.md#non-functional-requirements), [NFR2](../specs/feature-requirements.md#non-functional-requirements) |

## Epic Dependencies

- Epic 1: Authentication and Role-Based Routing (no dependencies — must be first)
- Epic 2: Task Management (depends on Epic 1 — requires auth session and role-based routing to be in place before task pages are built)
