# Requirements

## Overview
The application needs to present newly earned achievements to the user through a modal overlay. When a user completes a quiz or opens the app, the system checks for any achievements marked as not viewed. If found, a modal displaying the achievement details (image, name, requirements) and interaction buttons is presented. Closing the modal marks the achievement as viewed and triggers a check for any remaining unseen achievements, supporting consecutive unlocks.

## Assumptions
- The `user_achievements` table contains `userId` and `viewed` fields, along with achievement details (or a relation to them) like image, name, and requirements.

## Requirements

### REQ-1: Check for Unseen Achievements
**User Story:** As a user, I want the system to check for my newly earned achievements, so that I can be notified of my progress.

#### Acceptance Criteria
1.1 WHEN the user completes a quiz, THEN the application SHALL query for unseen achievements.
1.2 WHEN the user opens the application, THEN the application SHALL query for unseen achievements.

### REQ-2: Display Achievement Modal
**User Story:** As a user, I want to see my new achievements in a prominent modal, so that I can celebrate my success.

#### Acceptance Criteria
2.1 WHEN an unseen achievement is found, THEN the application SHALL display the achievement modal.
2.2 THE application SHALL display the achievement image occupying the full width and 80 percent of the modal height.
2.3 THE application SHALL display the achievement name, requirements, and action buttons in the remaining modal area.
2.4 IF no unseen achievements are found, THEN the application SHALL NOT display the achievement modal.
2.5 THE application SHALL animate the entry and exit of the achievement modal.

### REQ-3: Handle Modal Closure
**User Story:** As a user, I want to dismiss the achievement modal, so that I can return to my previous activity or view my next achievement.

#### Acceptance Criteria
3.1 WHEN the user clicks the close button, THEN the application SHALL update the achievement viewed status to true.
3.2 WHEN the achievement viewed status is updated, THEN the application SHALL check for additional unseen achievements.
3.3 WHEN the user clicks the view achievements button, THEN the application SHALL navigate to the achievements page.
3.4 WHEN the user clicks the view achievements button, THEN the application SHALL update the achievement viewed status to true.
