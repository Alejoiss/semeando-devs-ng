# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare the database structure for webhook logs
2. **Feature Delivery** - Implement the logging interceptor and email notification mechanism
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Small (1-2 sessions)

## Phase 1: Foundation

- [x] 1.1 Create webhooks_log_mp table
  - Create a migration to add the `webhooks_log_mp` table with `id`, `payload`, `status`, and timestamps. Generate TypeScript models if needed.
  - _Implements: DES-1_

## Phase 2: Feature Delivery

- [x] 2.1 Add webhook lifecycle logging
  - Modify the `mp-webhook` edge function to insert a log entry with `pending` status before handler execution, and update to `success` upon successful completion.
  - _Depends: 1.1_
  - _Implements: DES-1_

- [x] 2.2 Add error notification dispatch
  - Wrap the handler execution in a try-catch block. On error, update the log status to `error` and send an email alert to `joissonjdm@gmail.com` using the Resend API (or SMTP fallback) containing the log ID.
  - _Depends: 2.1_
  - _Implements: DES-2_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: log raw payload with pending status
  - Verify that when a webhook is received, the raw payload is saved to the `webhooks_log_mp` table with a `pending` status.
  - Test type: integration
  - _Depends: 2.1_
  - _Implements: REQ-1.1_

- [x] 3.2 Test: update log status to success
  - Verify that when webhook processing completes successfully, the log status is updated to `success`.
  - Test type: integration
  - _Depends: 2.1_
  - _Implements: REQ-1.2_

- [x] 3.3 Test: update log status to error and send email
  - Verify that when processing fails, the log status is updated to `error` and an email alert is sent to `joissonjdm@gmail.com` with the subject `ERRO WEBHOOK MERCADO PAGO` and the generated log ID in the body.
  - Test type: integration
  - _Depends: 2.2_
  - _Implements: REQ-1.3, REQ-2.1, REQ-2.2_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm webhook payload logging across the lifecycle (pending, success, error).
  - REQ-2: Confirm error alerts are sent with the correct details.
  - Run the relevant test suite and resolve any remaining traceability gaps.
  - _Implements: All requirements_
