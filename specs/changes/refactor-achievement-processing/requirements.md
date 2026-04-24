# Requirements

## Overview
The goal is to enhance the achievement system by adding persistent state tracking (progress, completion status, and last processed value) to the `user_achievements` table. This allows for efficient incremental updates and more accurate tracking of streaks and cumulative milestones. The system will also ensure that all achievements are initialized for users and that notifications are only triggered for achievements that are newly completed.

## Glossary
| Term | Definition |
|------|------------|
| Achievement | A milestone or reward earned by a user for specific actions or consistency. |
| Progress | A numeric value representing how close a user is to completing an achievement. |
| Completed | A boolean status indicating if the user has met all requirements for an achievement. |
| Last Value | A stored value (e.g., a date) used to determine if the next action contributes to a streak or progress. |
| Perfect Quiz | A quiz completion where the user achieved a score of 10/10. |

## Assumptions
- The `achievements` table contains a unique `identification` field for each achievement.
- The `user_quizzes` table is used to determine quiz perfection and daily activity.
- The `last_value` field for streaks will store the date of the last qualifying activity.

## Requirements

### REQ-1: Persistent Achievement State Tracking
**User Story:** As a user, I want the system to track my progress toward achievements over time, so that I can see how close I am to earning them.

#### Acceptance Criteria
1.1 THE system SHALL store progress, completion status, and the last relevant value for each user's achievements.
1.2 THE system SHALL initialize progress to 0 and completed status to false for new tracking records.

### REQ-2: Automatic Achievement Initialization
**User Story:** As a developer, I want all achievements to be initialized for each user, so that the system can reliably track progress.

#### Acceptance Criteria
2.1 WHEN a quiz is completed, THEN the achievement system SHALL ensure a tracking record exists in `user_achievements` for every record in the `achievements` table for that user.

### REQ-3: Incremental Streak Achievement Logic
**User Story:** As a user, I want to be rewarded for consistent daily activity, so that I am motivated to keep learning.

#### Acceptance Criteria
3.1 WHEN a quiz is completed, IF the `last_value` is the previous day, THEN the achievement system SHALL increment progress for the `IMPARAVEL` and `MARATONISTA_DO_CODIGO` achievements.
3.2 WHEN a quiz is completed, IF the `last_value` is NOT the previous day AND is NOT today, THEN the achievement system SHALL reset progress to 0 for the `IMPARAVEL` and `MARATONISTA_DO_CODIGO` achievements.
3.3 WHEN progress for `IMPARAVEL` reaches 10, THEN the achievement system SHALL mark it as completed.
3.4 WHEN progress for `MARATONISTA_DO_CODIGO` reaches 5, THEN the achievement system SHALL mark it as completed.
3.5 WHEN a quiz is completed, THEN the achievement system SHALL update `last_value` to the current date.

### REQ-4: Incremental Perfection Achievement Logic
**User Story:** As a user, I want to be rewarded for consistent high performance, so that I strive for perfection in every lesson.

#### Acceptance Criteria
4.1 WHEN a perfect quiz is completed, THEN the achievement system SHALL increment progress for the `COMBO_INSANO` and `SERIE_PERFEITA` achievements.
4.2 WHEN a quiz is completed AND it is NOT perfect, THEN the achievement system SHALL reset progress to 0 for the `COMBO_INSANO` and `SERIE_PERFEITA` achievements.
4.3 WHEN progress for `COMBO_INSANO` reaches 10, THEN the achievement system SHALL mark it as completed.
4.4 WHEN progress for `SERIE_PERFEITA` reaches 5, THEN the achievement system SHALL mark it as completed.

### REQ-5: Lesson Improvement Achievement Logic
**User Story:** As a user, I want to be rewarded for re-taking lessons, so that I am encouraged to master the content.

#### Acceptance Criteria
5.1 WHEN a quiz is completed, IF the user has previously completed the same lesson, THEN the achievement system SHALL mark the `PERFECCIONISTA_DO_CODIGO` achievement as completed.

### REQ-6: Unseen Achievement Notifications
**User Story:** As a user, I want to be notified only when I earn a new achievement, so that I don't see redundant or premature notifications.

#### Acceptance Criteria
6.1 WHEN checking for unseen achievements, THEN the achievement system SHALL only include achievements that are both completed AND not yet viewed.
