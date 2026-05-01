# Requirements

## Overview
Users who have forgotten their passwords need a secure and reliable way to regain access to their accounts. This feature implements a password recovery flow, allowing users to request a password reset link via their registered email address and define a new password.

## Assumptions
- The system uses Supabase Auth for identity management.
- Email delivery is configured and functional via Mailpit.
- The password reset email uses the platform's standardized email template design.

## Requirements

### REQ-1: Initiate Password Recovery

**User Story:** As an unauthenticated user, I want to access a password recovery option from the login screen, so that I can begin the process of regaining access to my account.

#### Acceptance Criteria
1.1 THE web application SHALL display a "Esqueci minha senha" option on the login screen.
1.2 WHEN the user selects the "Esqueci minha senha" option, THEN the web application SHALL navigate the user to the password recovery screen.

### REQ-2: Request Password Reset

**User Story:** As an unauthenticated user, I want to submit my email address, so that the system can send me a password reset link.

#### Acceptance Criteria
2.1 THE web application SHALL display an email input field and a submission action on the password recovery screen.
2.2 IF the user submits an invalid email format, THEN the web application SHALL display a validation error message.
2.3 WHEN the user submits a correctly formatted email address, THEN the web application SHALL display a confirmation message indicating that instructions were sent.
2.4 WHEN the user submits a correctly formatted email address, THEN the authentication service SHALL dispatch a password reset email if the account exists.

### REQ-3: Deliver Standardized Reset Email

**User Story:** As a user receiving a password reset email, I want the email to be clearly recognizable and contain a working reset link, so that I can proceed to reset my password.

#### Acceptance Criteria
3.1 THE authentication service SHALL format the password reset email using the platform's standardized email template structure.
3.2 THE authentication service SHALL include a unique password reset link within the email body.
3.3 WHEN the user opens the password reset link, THEN the web application SHALL navigate the user to the password reset page.

### REQ-4: Reset Password

**User Story:** As an unauthenticated user with a valid reset token, I want to define a new password, so that I can securely log into my account.

#### Acceptance Criteria
4.1 THE web application SHALL display new password and confirm password input fields on the password reset page.
4.2 IF the entered passwords do not match, THEN the web application SHALL display a validation error message.
4.3 WHEN the user submits a valid and matching new password, THEN the authentication service SHALL update the user's password.
4.4 WHEN the password update completes successfully, THEN the web application SHALL navigate the user to the login screen and display a success message.
