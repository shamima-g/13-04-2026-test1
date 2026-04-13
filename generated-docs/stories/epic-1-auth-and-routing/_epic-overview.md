# Epic 1: Authentication and Role-Based Routing

## Description

Configures the two FRS roles (admin and team-member), replacing the template's 4-role enum everywhere it is used. Wires post-sign-in redirects so admins land on `/tasks/all` and team-members land on `/tasks`. Updates the home page (`/`) to redirect authenticated users to their role-appropriate landing page and unauthenticated users to sign-in. Protects `/tasks/all` so only admins can access it; team-members who navigate directly to that route are silently redirected to `/tasks` (BR9); unauthenticated users are redirected to sign-in (BR10).

## Stories

1. **Authentication, Role Configuration, and Role-Based Routing** - Configure FRS roles, wire post-sign-in redirects, update home page redirect logic, and protect the admin-only route. | File: `story-1-auth-role-config-and-routing.md` | Status: Pending
