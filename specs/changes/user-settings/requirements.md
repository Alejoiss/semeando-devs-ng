# Requirements

## Overview
The user needs a dedicated profile page to manage their personal information, including their display name, profile avatar, and account password. This feature is essential for personalization and account security. The profile page must be easily accessible from the application header and must maintain the project's high-end "Neon Terminal" aesthetic.

## Glossary
| Term | Definition |
|------|------------|
| Avatar | A visual representation (image) of the user displayed across the platform. |
| Neon Terminal | The project's design system characterized by high contrast, neon accents, and glassmorphism. |
| User Metadata | Custom attributes stored for a user, such as their display name and avatar URL. |

## Assumptions
- The user is already registered and logged in to access the profile page.
- Image storage for avatars is handled by Supabase Storage or a similar service.
- The `UserService` already contains base methods for updating user profiles.

## Requirements

### REQ-1: Profile Page Navigation

**User Story:** As an authenticated user, I want to access a profile page through my profile image, so that I can manage my account details easily.

#### Acceptance Criteria
1.1 WHILE the user is authenticated, WHEN the user clicks the profile image in the header, THEN the application SHALL navigate the user to the profile page.
1.2 WHILE the user is not authenticated, IF the user attempts to access the profile page URL directly, THEN the application SHALL redirect the user to the login page.
1.3 THE application SHALL display the profile page using the Neon Terminal design system.

### REQ-2: Name Update

**User Story:** As a user, I want to change my display name, so that I can keep my identity current.

#### Acceptance Criteria
2.1 WHEN the user submits a new name on the profile page, THEN the user service SHALL update the user's display name in the user metadata.
2.2 IF the user provides an empty name field, THEN the application SHALL display a validation error message.
2.3 WHEN the name is successfully updated, THEN the application SHALL display a success notification.

### REQ-3: Avatar Management

**User Story:** As a user, I want to upload a profile picture, so that I can personalize my profile visually.

#### Acceptance Criteria
3.1 WHEN the user selects a new image file for their avatar, THEN the user service SHALL upload the image to storage and update the avatar URL in the user metadata.
3.2 WHEN the avatar URL is updated, THEN the application SHALL immediately reflect the new image in the header and on the profile page.
3.3 IF the image upload fails, THEN the application SHALL display an error message to the user.

### REQ-4: Password Security

**User Story:** As a user, I want to update my password, so that I can maintain the security of my account.

#### Acceptance Criteria
4.1 WHEN the user provides a new valid password and confirms it, THEN the user service SHALL update the user's password.
4.2 IF the new password and confirmation password do not match, THEN the application SHALL display a mismatch error message.
4.3 IF the password update fails due to server-side rules, THEN the application SHALL display the mapped error message to the user.

### REQ-5: Profile Data Synchronization

**User Story:** As a user, I want my profile changes to be reflected everywhere, so that I see a consistent interface.

#### Acceptance Criteria
5.1 THE application SHALL synchronize the user's profile data across all components using Angular signals.
5.2 THE internal header SHALL display the user's current avatar retrieved from the user service.
