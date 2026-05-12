# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Database & Schema Setup** - Prepare tables, fields, and models
2. **Frontend Features** - Update registration and profile screens
3. **Backend Logic** - Implement the Edge Function for dispatching emails
4. **Acceptance Criteria Testing** - Verify requirement behavior
5. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Medium (3-5 sessions)

## Phase 1: Database & Schema Setup

- [x] 1.1 Create migration for newsletter schema and profile updates
  - Create a migration to add `newsletter_active` to `profiles`, and create `newsletter` and `user_newsletter` tables.
  - _Implements: DES-1, DES-2_

- [x] 1.2 Add newsletter and user-newsletter TypeScript models
  - Define interfaces for the new database entities.
  - _Depends: 1.1_
  - _Implements: DES-2_

## Phase 2: Frontend Features

- [x] 2.1 Update Profile interface
  - Add `newsletter_active` to the profile interface model.
  - _Implements: DES-1_

- [x] 2.2 Update Registration page
  - Add optional checkbox for newsletter opt-in and ensure it's saved.
  - _Depends: 2.1_
  - _Implements: DES-1_

- [x] 2.3 Update Profile Settings page
  - Add notifications section and checkbox for newsletter opt-in.
  - _Implements: DES-1_

## Phase 3: Backend Logic

- [x] 3.1 Create dispatch-newsletter Edge Function
  - Scaffold Edge Function and write README with cURL example.
  - Implement logic to fetch users, send emails, and track sent history.
  - _Depends: 1.1_
  - _Implements: DES-3_

## Phase 4: Acceptance Criteria Testing

- [ ] 4.1 Test: newsletter opt-in on registration
  - Verify that the opt-in checkbox is displayed and saved upon form submission.
  - Test type: e2e
  - _Depends: 2.2_
  - _Implements: REQ-1.1, REQ-1.2_

- [ ] 4.2 Test: manage newsletter opt-in on profile settings
  - Verify that the notifications section is displayed and preferences are saved.
  - Test type: e2e
  - _Depends: 2.3_
  - _Implements: REQ-2.1, REQ-2.2_

- [ ] 4.3 Test: store newsletter content
  - Verify that newsletter content, CTA, and labels can be stored.
  - Test type: integration
  - _Depends: 1.1_
  - _Implements: REQ-3.1_

- [ ] 4.4 Test: newsletter dispatch processing
  - Verify that edge function sends emails only to opted-in users and logs processed history correctly.
  - Test type: integration
  - _Depends: 3.1_
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3_

## Phase 5: Final Checkpoint

- [ ] 5.1 Verify all acceptance criteria
  - REQ-1: Confirm registration opt-in functionality.
  - REQ-2: Confirm profile settings opt-in functionality.
  - REQ-3: Confirm newsletter content storage schema.
  - REQ-4: Confirm edge function logic and email dispatches.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
