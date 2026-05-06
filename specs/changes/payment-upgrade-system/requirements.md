# Requirements

## Overview
This document defines the requirements for the payment and upgrade system of the Semeando Devs platform. The system allows users to upgrade to a "Pro" plan using a specific upgrade page that supports plans and discount coupons.

## Glossary
| Term | Definition |
|------|------------|
| Pro Plan | A premium subscription that unlocks all learning tracks and benefits. |
| Main Plan | The primary plan displayed to users on the upgrade page. |

## Assumptions
- The actual payment processing and third-party payment gateway integration are out of scope for this task.
- The "Assinar Agora" buttons will simply be placeholders for future integration.

### REQ-1: Subscription Plan Management

**User Story:** As an administrator, I want to define subscription plans in the database, so that users can choose between monthly and yearly options.

#### Acceptance Criteria
1.1 WHERE the application requires plan data, the application SHALL provide a plans table with name, monthly_price, yearly_price, and is_main fields.
1.2 IF multiple plans exist in the database, THEN the application SHALL ensure that exactly one plan is marked as main.

### REQ-2: Plan Seeding

**User Story:** As a developer, I want the system to have a default plan, so that the upgrade page is functional immediately after deployment.

#### Acceptance Criteria
2.1 WHEN the database is initialized, the application SHALL store a default plan with a monthly price of 29.90 and a yearly price of 299.00.

### REQ-3: Discount Coupon System

**User Story:** As a marketing manager, I want to offer discount coupons, so that I can attract more Pro subscribers.

#### Acceptance Criteria
3.1 WHERE discount codes are supported, the application SHALL provide a coupons table with code, discount_type, discount_value, usage_limit, and expiration_date.
3.2 THE application SHALL track the number of times each coupon has been used.

### REQ-4: Upgrade Page Display

**User Story:** As a user, I want to see the available Pro plan details, so that I can decide which subscription to purchase.

#### Acceptance Criteria
4.1 WHEN the upgrade page is loaded, the application SHALL display the name and prices of the main plan.

### REQ-5: Coupon Validation and Application

**User Story:** As a user, I want to apply a coupon code on the upgrade page, so that I can get a discount on my subscription.

#### Acceptance Criteria
5.1 WHEN a user submits a coupon code, the application SHALL validate the code's existence, expiration, and usage limit.
5.2 IF a coupon is valid, THEN the application SHALL calculate and display the discounted prices for both monthly and yearly options.
5.3 IF a coupon is invalid or expired, THEN the application SHALL show an error message to the user.

### REQ-6: Upgrade Navigation

**User Story:** As a user without a subscription, I want to see an upgrade option in the menu, so that I can easily access the upgrade page.

#### Acceptance Criteria
6.1 IF the authenticated user does not have an active Pro subscription, THEN the aside-menu SHALL display an upgrade button.
6.2 WHEN the user clicks the upgrade button, the application SHALL navigate the user to the upgrade page.
