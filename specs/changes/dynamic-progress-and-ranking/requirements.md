# Requirements

## Overview
The application currently uses hardcoded values for module progress and weekly ranking displays. This document defines the requirements for dynamically calculating module progress based on submodule completion and fetching real-time weekly ranking data for display on the modules page.

## Glossary
| Term | Definition |
|------|------------|
| Module | A high-level learning track containing multiple submodules. |
| Submodule | A specific topic within a module containing lessons and quizzes. |
| User Module | A record of a user's progress within a specific module. |
| Weekly Ranking | A leaderboard showing users ranked by XP earned within the current week. |

## Assumptions
- The database contains the necessary relationships between modules, submodules, and user completion records.
- The `get_ranking_weekly` RPC function is already implemented and returns the correct data.
- Progress calculation is based solely on the completion of submodules within the module.

## Requirements

### REQ-1: Dynamic Module Progress Calculation

**User Story:** As a student, I want to see my actual progress in a module, so that I know exactly how much of the track I have completed.

#### Acceptance Criteria
1.1 THE application SHALL calculate the module progress percentage by dividing the number of completed submodules by the total number of submodules in that module.
1.2 WHILE a module is in 'in-progress' state, THE application SHALL display the calculated progress percentage in the module card.
1.3 WHILE a module is in 'completed' state, THE application SHALL display 100% progress.
1.4 WHILE a module is in 'not-started' state, THE application SHALL display 0% progress.

### REQ-2: Dynamic Weekly Ranking Display

**User Story:** As a competitive student, I want to see the real-time weekly ranking on my dashboard, so that I can see my position relative to the top performers without leaving the page.

#### Acceptance Criteria
2.1 THE application SHALL fetch the current weekly ranking data from the database upon loading the modules page.
2.2 THE application SHALL display the names and XP of the top 3 users in the weekly ranking section.
2.3 THE application SHALL display the current authenticated user's ranking position and weekly XP total in the ranking summary.
