# Requirements

## Overview
The system needs an automated scheduled task (Cron Job) to handle the expiration of temporary discount coupons applied to Mercado Pago subscriptions. Mercado Pago's Preapproval API does not natively support temporary discounts that automatically revert. Therefore, the backend must actively monitor active subscriptions with coupons, detect when the coupon duration has elapsed, and update the transaction amount in Mercado Pago back to the original plan price. The local database state must also be updated to reflect the expiration.

## Glossary
| Term | Definition |
|------|------------|
| Edge Function | A serverless function hosted on Supabase used to execute the backend logic. |
| Preapproval | The Mercado Pago entity representing a recurring subscription. |

## Assumptions
- The system has access to Mercado Pago API credentials with permission to update preapprovals.
- The `subscriptions` table contains the necessary data to determine the original plan price and the coupon duration.
- The scheduled job runs reliably once a day.

## Requirements

### REQ-1: Identify Expired Coupons

**User Story:** As a platform administrator, I want the system to identify active subscriptions with expired coupons, so that their prices can be reverted.

#### Acceptance Criteria
1.1 WHEN the daily scheduled job executes, THEN the system SHALL identify all active subscriptions where the coupon duration has elapsed.
1.2 IF an active subscription has no associated coupon, THEN the system SHALL ignore the subscription.

### REQ-2: Revert Transaction Amount in Mercado Pago

**User Story:** As a platform administrator, I want the system to update the transaction amount in Mercado Pago for expired coupons, so that the user is billed the original price.

#### Acceptance Criteria
2.1 WHEN an active subscription with an expired coupon is identified, THEN the system SHALL send a request to Mercado Pago to update the preapproval transaction amount to the original plan price.
2.2 IF the Mercado Pago update request fails, THEN the system SHALL log the error for manual review.

### REQ-3: Update Subscription State in Database

**User Story:** As a platform administrator, I want the system to remove the expired coupon from the subscription record, so that the UI reflects the original price.

#### Acceptance Criteria
3.1 WHEN the Mercado Pago update is successful, THEN the system SHALL remove the coupon association from the subscription record.
3.2 WHEN the Mercado Pago update is successful, THEN the system SHALL record the expiration event in the system logs.
