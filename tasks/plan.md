# Implementation Plan: User Role Management in Admin Panel

## Overview
We need to add the ability for Administrators to change user roles (to ADMIN, ORGANIZER, or ATTENDEE) directly from the `/admin/users` page. Only the ADMIN role will be authorized to perform this action.

## Architecture Decisions
- **API Endpoint (`POST /api/admin/change-role`)**: We will create a new endpoint specifically for changing roles, similar to the existing `toggle-lock` endpoint. It will enforce the `ADMIN` role check and use the Supabase admin client to bypass Row Level Security (RLS) for the update.
- **Audit Logging**: Role changes will be logged in the `audit_logs` table (action: `ROLE_CHANGED`) to maintain a history of administrative actions.
- **UI Update (`UserAdminTable.tsx`)**: We will replace the static role `Badge` with a `Select` component for users. If the logged-in user is an admin, they can select a new role from the dropdown. We should also prevent an admin from easily removing their own admin privileges to avoid accidental lockouts.

## Task List

### Phase 1: API Foundation
- [ ] Task 1: Create the `/api/admin/change-role` endpoint.

### Checkpoint: Foundation
- [ ] API successfully authenticates admin users.
- [ ] API successfully updates the target user's role and logs the action.
- [ ] API rejects requests from non-admin users.

### Phase 2: UI Implementation
- [ ] Task 2: Update `UserAdminTable.tsx` to include a dropdown/select for role management.

### Checkpoint: Complete
- [ ] Admin can change roles from the UI.
- [ ] Toast notifications appear on success/error.
- [ ] UI correctly reflects the changed role locally after success.
- [ ] An admin cannot change their own role (dropdown disabled for their own row).

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Admin accidentally removes their own access | High | Disable the role select input for the currently logged-in admin's row in the table. |
| Unauthorized role escalation | High | Strict RLS bypass only allowed in the server-side route after confirming the caller's `ADMIN` role via `supabase.auth.getUser()` and `profiles` check. |

## Open Questions
- Is there a need to send an email notification to the user when their role is changed? (Assuming no for now, but easily added later).
