# Requirements

## Overview
This feature introduces a visibility toggle for achievements in the Semeando Devs platform. By default, some achievements may be hidden or inactive for standard display purposes. An `is_visible` attribute will be added to the achievements database table. The application will then filter achievements to only fetch and display those that are marked as visible (active) to the user.

## Glossary
| Term | Definition |
|------|------------|
| Achievement | A reward granted to a user for reaching a specific milestone or fulfilling a condition within the application. |
| Active Achievement | An achievement that is marked as visible (`is_visible` is true) and should be displayed to the user. |
| Inactive Achievement | An achievement that is hidden (`is_visible` is false) and should not be displayed on the screen. |

## Assumptions
- Existing achievements in the database are visible by default.
- Inactive achievements are excluded from the user's achievements count and lists on the screen.

## Requirements

### REQ-1: Database Achievement Visibility Flag

**User Story:** As an administrator, I want each achievement to have a visibility flag in the database, so that I can control whether it is active on the platform.

#### Acceptance Criteria
1.1 THE achievements database table SHALL include an is_visible column of boolean type.
1.2 THE achievements database table SHALL default the is_visible column to true.

### REQ-2: Filter Achievements Retrieval

**User Story:** As a developer, I want the achievements service to retrieve only active achievements, so that hidden achievements are not loaded or shown to users.

#### Acceptance Criteria
2.1 WHEN retrieving the list of achievements, THEN the achievements service SHALL query only achievements where the is_visible flag is true.

### REQ-3: Hide Inactive Achievements in UI

**User Story:** As a student, I want to see only active achievements, so that I only focus on achievements that are currently available.

#### Acceptance Criteria
3.1 THE achievements page SHALL display only achievements where the is_visible attribute is true.
