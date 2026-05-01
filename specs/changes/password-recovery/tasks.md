# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Setup backend configuration and service methods
2. **Feature Delivery** - Create the UI components and routing
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (3-5 sessions)

## Phase 1: Foundation

- [x] 1.1 Configure Supabase email template
  - Add `recovery.html` template configuration to `supabase/config.toml` and create the HTML template following platform standards.
  - _Implements: DES-2_

- [x] 1.2 Extend UserService with password recovery methods
  - Add `sendPasswordResetEmail(email)` method using Supabase Auth.
  - _Implements: DES-2, DES-3_

## Phase 2: Feature Delivery

- [x] 2.1 Implement ForgotPassword component and Login link
  - Generate the `ForgotPassword` standalone component, register its route (`/recuperar-senha`), and add the navigation link to the `Login` component.
  - _Depends: 1.2_
  - _Implements: DES-1_

- [x] 2.2 Implement ResetPassword component
  - Generate the `ResetPassword` standalone component and register its route (`/redefinir-senha`). Add form validation for matching passwords and connect to `UserService` for updating credentials.
  - _Depends: 1.2_
  - _Implements: DES-3_

## Phase 3: Acceptance Criteria Testing

- [ ] 3.1 Test: navigate to forgot password screen
  - Verify the "Esqueci minha senha" link appears on the login screen and navigates to the recovery screen.
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2_

- [ ] 3.2 Test: submit password reset request
  - Verify the email field exists, validates format, shows confirmation message, and calls the auth service.
  - Test type: integration
  - _Depends: 2.1_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4_

- [ ] 3.3 Test: standard email delivery
  - Verify the system uses the standardized template and includes the reset link navigating to the reset page.
  - Test type: integration
  - _Depends: 1.1_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

- [ ] 3.4 Test: execute password reset
  - Verify the reset screen validates matching passwords, updates the password, and navigates to login on success.
  - Test type: integration
  - _Depends: 2.2_
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4_

## Phase 4: Final Checkpoint

- [ ] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm navigation from Login to Forgot Password.
  - REQ-2: Confirm reset request form behavior.
  - REQ-3: Confirm email delivery formatting and link.
  - REQ-4: Confirm password reset execution and redirect.
  - _Implements: All requirements_
