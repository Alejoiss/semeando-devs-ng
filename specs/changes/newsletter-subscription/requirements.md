# Requirements

## Overview
This feature allows users to opt-in to receive promotional emails and newsletters during registration and within their profile settings. The system will manage newsletter campaigns, allowing administrators to dispatch emails to users based on their opt-in preferences while maintaining a record of all processed newsletters for every user.

## Glossary
| Term | Definition |
|------|------------|
| Newsletter Opt-In | The user's preference to receive promotional and news emails. |

## Requirements

### REQ-1: Newsletter Opt-In on Registration

**User Story:** As a new user, I want to opt-in to newsletters during registration, so that I can receive promotional updates.

#### Acceptance Criteria
1.1 THE system SHALL display an optional newsletter opt-in checkbox on the registration page.
1.2 WHEN the user submits the registration form with the checkbox selected, THEN the system SHALL save the newsletter opt-in preference as active for the new user profile.

### REQ-2: Newsletter Opt-In on Profile Settings

**User Story:** As an authenticated user, I want to manage my newsletter preferences in my profile settings, so that I can control the emails I receive.

#### Acceptance Criteria
2.1 THE system SHALL display a notifications section with a newsletter opt-in checkbox on the profile configuration page.
2.2 WHEN the user updates their newsletter opt-in preference, THEN the system SHALL save the updated preference to the user profile.

### REQ-3: Newsletter Content Management

**User Story:** As an administrator, I want to create newsletter content, so that I can prepare emails to be sent to users.

#### Acceptance Criteria
3.1 THE system SHALL store newsletter content including a dynamic HTML body, an optional call-to-action URL, and a call-to-action label.

### REQ-4: Newsletter Dispatch Processing

**User Story:** As an administrator, I want to trigger a newsletter dispatch, so that users receive the updates they subscribed to.

#### Acceptance Criteria
4.1 WHEN a newsletter dispatch is triggered, THEN the system SHALL send the newsletter email to all users with an active newsletter opt-in preference.
4.2 WHEN a newsletter dispatch is triggered, THEN the system SHALL record the newsletter as processed for users with an active newsletter opt-in preference.
4.3 WHILE a user does not have an active newsletter opt-in preference, WHEN a newsletter dispatch is triggered, THEN the system SHALL record the newsletter as processed without sending an email to the user.
