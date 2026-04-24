# Requirements

## Overview
This feature introduces an achievements (Conquistas) system to motivate users. It involves creating and populating a global `achievements` table, tracking user-specific achievements by creating a `user_achievements` table and its corresponding TypeScript model, and updating the existing achievements UI to display earned and unearned achievements along with the user's total points and earned achievement count.

## Assumptions
- The TypeScript model for the `achievements` table already exists in the codebase.
- The user's total points can be retrieved or calculated based on existing data.
- The actual logic for awarding achievements (e.g., concluding modules, reaching daily streaks) will be implemented in a subsequent task.
- Images for the achievements are already present in the `assets` folder.

## Requirements

### REQ-1: Global Achievements Data Structure
**User Story:** As an administrator, I want the system to have a structured way to store and provide predefined achievements, so that all users have the same gamification goals available.

#### Acceptance Criteria
1.1 THE system SHALL provide a migration script to create the `achievements` table.
1.2 THE system SHALL provide a migration script to populate the `achievements` table with predefined records.

### REQ-2: Track User Achievements
**User Story:** As a user, I want the system to record the achievements I earn, so that my progress is permanently saved.

#### Acceptance Criteria
2.1 THE system SHALL provide a migration script to create the `user_achievements` table containing userId, achievementId, viewed, and createdAt fields.
2.2 THE system SHALL include a TypeScript model representing the user achievements data structure.

### REQ-3: Display Achievements Summary Header
**User Story:** As a user, I want to see a summary of my gamification progress, so that I know my total XP and how many achievements I have earned.

#### Acceptance Criteria
3.1 THE system SHALL display the user's total XP points in the achievements page header.
3.2 THE system SHALL display the user's total earned achievements count in the achievements page header.

### REQ-4: Display Achievements List
**User Story:** As a user, I want to view all available achievements, so that I understand what goals I have accomplished and which ones I can still pursue.

#### Acceptance Criteria
4.1 THE system SHALL display a list of all achievements on the achievements page.
4.2 WHILE an achievement is earned by the user, the system SHALL display the achievement icon in full color.
4.3 WHILE an achievement is not earned by the user, the system SHALL display the achievement icon in grayscale.
4.4 THE system SHALL display the requirement text and XP reward amount below each achievement icon.
