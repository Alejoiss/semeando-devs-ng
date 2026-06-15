# Requirements

## Overview
To prevent data loss and allow recovery from processing failures, all incoming webhooks from Mercado Pago must be stored in a new `webhooks_log_mp` table. The log will track the raw payload and its processing status (`pending`, `success`, `error`). In case of a processing error, an alert email must be sent to the administrator to allow manual intervention.

## Requirements

### REQ-1: Store Webhook Payload

**User Story:** As a system administrator, I want the system to store all incoming Mercado Pago webhook payloads, so that I have a reliable record of events in case of processing failures.

#### Acceptance Criteria
1.1 WHEN a Mercado Pago webhook is received, THEN the webhook service SHALL save the raw payload to the `webhooks_log_mp` table with a `pending` status.
1.2 WHEN the webhook processing completes successfully, THEN the webhook service SHALL update the log status to `success` in the `webhooks_log_mp` table.
1.3 IF the webhook processing fails, THEN the webhook service SHALL update the log status to `error` in the `webhooks_log_mp` table.

### REQ-2: Notify on Webhook Error

**User Story:** As a system administrator, I want to receive an email alert when a Mercado Pago webhook fails to process, so that I can manually intervene and resolve the issue.

#### Acceptance Criteria
2.1 IF the webhook processing fails, THEN the webhook service SHALL send an email alert to `joissonjdm@gmail.com` with the subject `ERRO WEBHOOK MERCADO PAGO`.
2.2 THE webhook service SHALL include the generated log ID from the `webhooks_log_mp` table in the error email body.
