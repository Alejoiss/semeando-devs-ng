# Requirements

## Overview
The application needs to support "Submodules" within the existing Learning Modules system. This involves creating the necessary database entities (`submodules` and `user_submodules`) in Supabase to track available submodules and user progress on them. The frontend must integrate with these new tables to fetch and display submodules associated with an active module (identified via URL slug) and their current progress status (not started, in progress, completed).

## Requirements

### REQ-1: Submodules Storage
**User Story:** As a system administrator, I want to store submodules data, so that the learning tracks can be broken down into smaller, manageable units.

#### Acceptance Criteria
1.1 THE database SHALL store submodules linked to parent modules with order and visual properties.

### REQ-2: User Progress Tracking
**User Story:** As a user, I want the system to track my progress on submodules, so that I can resume studying where I left off.

#### Acceptance Criteria
2.1 THE database SHALL store individual user completion state and timestamps for each submodule.

### REQ-3: Retrieve Submodules
**User Story:** As a user, I want the application to load the submodules for the specific track I selected, so that I can view my curriculum.

#### Acceptance Criteria
3.1 WHEN navigating to a module's submodules page, THEN the application SHALL retrieve all submodules associated with that specific module slug.
3.2 WHEN retrieving submodules, THEN the application SHALL fetch the current user's progress for those submodules.

### REQ-4: Display Submodules
**User Story:** As a user, I want to see the list of submodules with their status, so that I can easily decide what to learn next.

#### Acceptance Criteria
4.1 WHEN displaying the submodules list, THEN the application SHALL show the title, description, and visual icon for each submodule.
4.2 WHEN displaying a submodule, THEN the application SHALL visually indicate if its progress status is not started, in progress, or completed.
