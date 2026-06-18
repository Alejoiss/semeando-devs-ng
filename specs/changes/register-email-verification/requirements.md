# Requirements

## Overview
Show a confirmation message to users after a successful registration, notifying them that a verification email has been sent and prompting them to proceed to the login page.

## Glossary
| Term | Definition |
|------|------------|
| Registration Success Modal | A modal dialog displayed immediately upon successful registration to inform the user about the verification email. |

## Assumptions
- The registration flow triggers a verification email automatically via the backend (Supabase).
- The user is redirected to the login page only after acknowledging the modal.

## Requirements

### REQ-1: Registration Success Notification

**User Story:** As a new user, I want to see a confirmation message after registering, so that I know a verification email has been sent and what step to take next.

#### Acceptance Criteria
1.1 WHEN a user successfully submits the registration form, THEN the application SHALL display a Registration Success Modal.
1.2 THE application SHALL display a message inside the Registration Success Modal informing the user that a verification email has been sent.
1.3 WHEN the user clicks the confirmation button in the Registration Success Modal, THEN the application SHALL redirect the user to the login page.
