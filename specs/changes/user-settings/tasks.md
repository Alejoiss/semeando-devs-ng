# Implementation Tasks

## Overview
This implementation is organized into 4 phases to deliver the User Profile feature with full state synchronization and a modern Neon Terminal UI.

1. **Foundation** - Core service enhancements and routing.
2. **Feature Delivery** - Component implementation and UI/UX.
3. **Acceptance Criteria Testing** - Verification of all requirements.
4. **Final Checkpoint** - Quality assurance and traceability review.

**Estimated Effort**: Medium (3-4 sessions)

## Phase 1: Foundation

- [x] 1.1 Update `UserService` for Profile Synchronization
  - Add Angular signals to store user profile data.
  - Implement `getUserProfile()` to populate signals on load.
  - _Implements: DES-2, REQ-5.1_

- [x] 1.2 Implement Avatar Upload Logic in `UserService`
  - Add method to upload images to Supabase Storage.
  - Add method to update user metadata with the new avatar URL.
  - _Implements: DES-3, REQ-3.1_

- [x] 1.3 Configure Profile Route
  - Register `/app/perfil` in `app.routes.ts` with `authGuard`.
  - _Implements: DES-4, REQ-1.1, REQ-1.2_

- [x] 1.4 Link Profile in `InternalHeader`
  - Replace hardcoded avatar with signal-based image.
  - Add router link to `/app/perfil`.
  - _Implements: DES-4, REQ-1.1, REQ-5.2_

## Phase 2: Feature Delivery

- [x] 2.1 Scaffold Profile Component
  - Generate standalone `Profile` component in `src/app/pages/app/profile`.
  - Set up base layout with glassmorphism containers.
  - _Implements: DES-1, REQ-1.3_

- [x] 2.2 Implement Name Update Section
  - Create reactive form for name update with validation.
  - Connect to `UserService` to persist changes and update signals.
  - _Implements: DES-1, REQ-2.1, REQ-2.2, REQ-2.3_

- [x] 2.3 Implement Avatar Management UI
  - Create image selection and preview logic.
  - Trigger upload and update signals upon success.
  - _Implements: DES-1, DES-3, REQ-3.1, REQ-3.2, REQ-3.3_

- [x] 2.4 Implement Password Change Section
  - Create reactive form for password update with confirmation and current password verification.
  - Implement validation and error mapping.
  - _Implements: DES-1, REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 2.5 Polish Neon Terminal UI
  - Apply gradients, shadows, and animations per the design system.
  - Ensure accessibility (WCAG AA) and responsiveness.
  - _Implements: DES-1, REQ-1.3_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: Profile Navigation and Access Control
  - Verify navigation from header and redirection for unauthenticated users.
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2_

- [x] 3.2 Test: Name Update with Real-time Sync
  - Verify name change persistence and header/UI update.
  - Test type: integration
  - _Implements: REQ-2.1, REQ-5.1_

- [x] 3.3 Test: Avatar Upload and Global Update
  - Verify image upload to Supabase and immediate header avatar refresh.
  - Test type: integration
  - _Implements: REQ-3.1, REQ-3.2, REQ-5.2_

- [x] 3.4 Test: Secure Password Update
  - Verify validation rules, confirmation matching, and server-side error handling.
  - Test type: unit
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Navigation and Protection.
  - REQ-2: Name Updates.
  - REQ-3: Avatar Management.
  - REQ-4: Password Security.
  - REQ-5: Data Synchronization.
  - _Implements: All requirements_
