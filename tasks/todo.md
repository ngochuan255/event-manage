# Tasks

## Phase 1: Foundation
- [x] Task 1: Create `POST /api/admin/change-role` endpoint.
  **Description:** Create a server-side endpoint that handles role updates for users.
  **Acceptance criteria:**
  - [ ] Validates the caller is authenticated and has the `ADMIN` role.
  - [ ] Prevents changing the role if `userId` matches the caller's ID.
  - [ ] Updates the target user's `role` in the `profiles` table using the admin client.
  - [ ] Logs the action (`ROLE_CHANGED`) in the `audit_logs` table.
  **Verification:**
  - [ ] Manual check: Using a tool like Postman or the frontend to call this endpoint as an admin successfully updates the DB.
  - [ ] Manual check: Calling as a non-admin returns 403.
  **Dependencies:** None
  **Files likely touched:**
  - `app/api/admin/change-role/route.ts`
  **Estimated scope:** Small

## Checkpoint: Foundation
- [x] API successfully authenticates admin users.
- [x] API successfully updates the target user's role and logs the action.
- [x] API rejects requests from non-admin users.

## Phase 2: UI Implementation
- [x] Task 2: Update `UserAdminTable.tsx` to include role selection.
  **Description:** Replace the static role badge with an interactive dropdown menu for changing user roles.
  **Acceptance criteria:**
  - [ ] Displays a `<Select>` component for the role instead of just a badge.
  - [ ] Disables the `<Select>` component for the current admin (using `currentAdminId`).
  - [ ] Calls `/api/admin/change-role` when a new role is selected.
  - [ ] Displays success/error toast notifications.
  - [ ] Updates the local state to reflect the new role immediately on success.
  **Verification:**
  - [ ] Build succeeds: `npm run build`
  - [ ] Manual check: Select a new role for a user and verify the toast and UI update.
  **Dependencies:** Task 1
  **Files likely touched:**
  - `components/dashboard/UserAdminTable.tsx`
  **Estimated scope:** Small

## Checkpoint: Complete
- [x] Admin can change roles from the UI.
- [x] Toast notifications appear on success/error.
- [x] UI correctly reflects the changed role locally after success.
- [x] An admin cannot change their own role (dropdown disabled for their own row).
