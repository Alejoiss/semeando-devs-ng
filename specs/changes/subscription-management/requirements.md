# Requirements

## Overview
This feature introduces a subscription management screen and coupon duration logic. Users will be able to view their active subscription, plan details, applied coupons, remaining discounted installments, and next payment date. The feature also includes the ability to cancel the active subscription. If no active subscription exists, the screen will inform the user that they are on a free account. The screen will be accessible via the aside menu.

## Requirements

### REQ-1: Navigation to Subscription Management

**User Story:** As a user, I want to click a link in the aside menu, so that I can access my subscription management screen.

#### Acceptance Criteria
1.1 WHEN the user clicks the "Gerenciar Assinatura" link in the aside menu, THEN the system SHALL display the subscription management screen.

### REQ-2: Free Account State

**User Story:** As a user without an active subscription, I want to see that I am on a free account, so that I understand my current plan status.

#### Acceptance Criteria
2.1 IF the user does not have an active subscription, THEN the system SHALL display a message indicating the use of a free account.

### REQ-3: View Active Subscription Details

**User Story:** As a subscribed user, I want to view my subscription details, so that I know what plan I am on and when my next payment is.

#### Acceptance Criteria
3.1 WHILE the user has an active subscription, the system SHALL display the subscription status, plan name, and next payment date.
3.2 WHERE the active subscription has an applied coupon, the system SHALL display the coupon details.
3.3 WHERE the active subscription has a time-limited coupon, the system SHALL display the number of remaining discounted installments.

### REQ-4: Cancel Subscription

**User Story:** As a subscribed user, I want to cancel my subscription, so that I will not be billed in the future.

#### Acceptance Criteria
4.1 WHEN the user requests to cancel their active subscription, THEN the system SHALL process the cancellation.
4.2 WHEN the subscription is successfully cancelled, THEN the system SHALL update the subscription status.
