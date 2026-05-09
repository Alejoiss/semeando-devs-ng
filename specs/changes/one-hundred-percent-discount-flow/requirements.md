# Requirements

## Overview
This feature introduces a streamlined subscription flow for users who possess a 100% discount coupon. Currently, all subscription attempts redirect to a payment gateway (Mercado Pago), which is unnecessary when the final price is zero. The new flow will allow users to bypass the payment gateway, directly activating their "Pro" status. Additionally, a mechanism to track the expiration of these coupon-based Pro memberships and a background process to revert them to regular status is required.

## Glossary
| Term | Definition |
|------|------------|
| Pro Status | A state where a user has access to premium platform features. |
| 100% Discount Coupon | A coupon that reduces the subscription price to zero for a specific duration in months. |
| pro_until | A timestamp indicating when a user's manually activated Pro status expires. |
| Payment Gateway | An external service (Mercado Pago) used to process financial transactions. |

## Assumptions
1. A 100% discount coupon is defined as a coupon with `discount_type = 'percentage'` and `discount_value = 100`.
2. The `duration_months` field in the coupon model defines how long the Pro status should last.
3. The automated expiration process will run at least once every 24 hours.
4. Directly activating Pro status via a coupon updates the user profile directly without requiring an external payment intent.

## Requirements

### REQ-1: Identification of 100% Discount Coupons

**User Story:** As a system, I want to identify coupons that provide a total discount, so that I can provide an alternative checkout experience.

#### Acceptance Criteria
1.1 WHEN a valid coupon is applied, THE application SHALL determine if it provides a 100% discount.
1.2 IF a coupon is determined to be a 100% discount coupon, THE application SHALL display a direct activation option instead of a payment gateway redirect.

### REQ-2: Direct Pro Activation

**User Story:** As a user with a 100% discount coupon, I want to activate my Pro membership without being redirected to a payment screen, so that I can start using premium features immediately and for free.

#### Acceptance Criteria
2.1 WHEN the user triggers direct activation with a 100% discount coupon, THE application SHALL update the user's `is_pro` status to true.
2.2 WHEN the user triggers direct activation with a 100% discount coupon, THE application SHALL set the `pro_until` field in the user's profile to a date calculated as the current date plus the coupon's duration in months.
2.3 IF the activation process fails, THE application SHALL display a descriptive error message to the user.

### REQ-3: Pro Status Persistence and Retrieval

**User Story:** As a system, I want to store and retrieve the expiration date of manually activated Pro memberships, so that I can accurately manage access to premium features.

#### Acceptance Criteria
3.1 THE database SHALL store a `pro_until` timestamp for each user profile.
3.2 THE application SHALL include the `pro_until` value when retrieving a user's profile details.

### REQ-4: Automated Pro Status Expiration

**User Story:** As a system, I want to automatically revoke Pro status when a coupon-based membership expires, so that users only have premium access for the duration they are entitled to.

#### Acceptance Criteria
4.1 THE database SHALL periodically execute a process to identify users whose `pro_until` timestamp has passed.
4.2 WHEN a user's `pro_until` timestamp is determined to be in the past, THE database SHALL update the user's `is_pro` status to false and clear the `pro_until` field.
