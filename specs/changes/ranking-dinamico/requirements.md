# Requirements

## Overview

The ranking screen currently displays static, hardcoded data. It needs to be replaced with a dynamic, data-driven ranking that fetches real user XP data from Supabase. Users can view the ranking in three modes: overall (all-time), monthly, and weekly. Each mode queries a different XP table. The top 3 users are displayed in a highlighted podium section, followed by a list of up to 50 ranked users. The current user's position is always shown in a fixed bar at the bottom, regardless of whether they appear in the top 50.

A new `updated_at` timestamp column must be added to all three XP tables (`xp`, `xp_month`, `xp_week`) to serve as a tiebreaker — users who reached a given XP total earlier are ranked higher. Additionally, existing RLS policies must be updated to allow authenticated users to read all rows (not just their own) so the ranking can be populated.

## Glossary

| Term | Definition |
|------|------------|
| Overall Ranking | The all-time ranking based on `total_xp` from the `xp` table. |
| Monthly Ranking | The ranking for the current calendar month based on `xp_amount` from the `xp_month` table. |
| Weekly Ranking | The ranking for the current ISO week based on `xp_amount` from the `xp_week` table. |
| Podium | The top 3 users displayed prominently at the top of the ranking. |
| Current User Position | The rank of the authenticated user, shown in a fixed bar at the bottom of the screen. |
| Tiebreaker | When two or more users share the same XP value, the user whose `updated_at` timestamp is earliest ranks higher (reached that XP first). |

## Assumptions

- User display information (name, avatar) is stored in `auth.users.raw_user_meta_data` and can be joined or fetched alongside XP data.
- The three XP tables (`xp`, `xp_month`, `xp_week`) already exist in Supabase with the columns documented in the models, but none currently has an `updated_at` column.
- The current RLS policies restrict SELECT to `auth.uid() = user_id`; these must be broadened for ranking reads while maintaining security for write operations.
- The ISO week number calculation follows the ISO 8601 standard (e.g., April 19–26 is week 17 of the year).
- Each ranking view mode (overall, monthly, weekly) uses a dedicated service for data fetching.
- The "Amigos" (friends) filter shown in the current static UI is out of scope for this change.
- User profile image upload does not exist yet; avatars in the ranking must use a placeholder (initials derived from the user's name) until the profile settings feature is implemented.

## Requirements

### REQ-1: Ranking View Modes

**User Story:** As a learner, I want to switch between overall, monthly, and weekly ranking views, so that I can see how I compare with other users across different time periods.

#### Acceptance Criteria

1.1 WHEN the user navigates to the ranking screen, THEN the application SHALL display the overall ranking as the default active view.

1.2 WHEN the user selects the "Semanal" tab, THEN the application SHALL display the weekly ranking for the current ISO week of the current year.

1.3 WHEN the user selects the "Mensal" tab, THEN the application SHALL display the monthly ranking for the current calendar month of the current year.

1.4 WHEN the user selects the "Geral" tab, THEN the application SHALL display the overall all-time ranking.

1.5 WHILE a ranking view is loading, THEN the application SHALL display a loading indicator to the user.

### REQ-2: Ranking Data Retrieval

**User Story:** As a learner, I want the ranking to display real user data ordered by XP, so that I can see an accurate leaderboard.

#### Acceptance Criteria

2.1 WHEN the overall ranking is requested, THEN the application SHALL retrieve the top 50 users from the `xp` table ordered by `total_xp` descending with `updated_at` ascending as the tiebreaker.

2.2 WHEN the monthly ranking is requested, THEN the application SHALL retrieve the top 50 users from the `xp_month` table filtered by the current year and current month, ordered by `xp_amount` descending with `updated_at` ascending as the tiebreaker.

2.3 WHEN the weekly ranking is requested, THEN the application SHALL retrieve the top 50 users from the `xp_week` table filtered by the current year and current ISO week number, ordered by `xp_amount` descending with `updated_at` ascending as the tiebreaker.

2.4 THE application SHALL display each ranked user's position number, display name, avatar, and XP value.

2.5 IF a ranked user has no avatar image, THEN the application SHALL display a placeholder with the user's initials derived from their display name.

### REQ-3: Current User Position

**User Story:** As a learner, I want to always see my own ranking position at the bottom of the screen, so that I know where I stand even if I am not in the top 50.

#### Acceptance Criteria

3.1 THE application SHALL display the current authenticated user's rank position, display name, avatar, and XP value in a fixed bar at the bottom of the ranking screen.

3.2 WHEN the overall ranking is displayed, THEN the application SHALL calculate the current user's position by counting the number of users with a higher `total_xp` than the current user, plus one.

3.3 WHEN the monthly ranking is displayed, THEN the application SHALL calculate the current user's position by counting the number of users with a higher `xp_amount` for the current month and year than the current user, plus one.

3.4 WHEN the weekly ranking is displayed, THEN the application SHALL calculate the current user's position by counting the number of users with a higher `xp_amount` for the current week and year than the current user, plus one.

3.5 IF the current user has no XP record for the active ranking view, THEN the application SHALL display position "—" and XP value "0".

### REQ-4: Podium Display

**User Story:** As a learner, I want the top 3 users to be visually highlighted in a podium layout, so that I can quickly identify the leading users.

#### Acceptance Criteria

4.1 THE application SHALL display the top 3 ranked users in a visually distinct podium section above the remaining ranking list.

4.2 IF fewer than 3 users have XP records for the active ranking view, THEN the application SHALL display only the available users in the podium section.

### REQ-5: Database Schema Update

**User Story:** As a system administrator, I want an `updated_at` timestamp on all XP tables, so that tiebreaker logic can determine which user reached an XP value first.

#### Acceptance Criteria

5.1 THE database SHALL include an `updated_at` column of type `timestamp without time zone` on the `xp` table.

5.2 THE database SHALL include an `updated_at` column of type `timestamp without time zone` on the `xp_month` table.

5.3 THE database SHALL include an `updated_at` column of type `timestamp without time zone` on the `xp_week` table.

5.4 WHEN a row in any of the three XP tables is inserted or updated, THEN the database SHALL set the `updated_at` column to the current timestamp automatically.

### REQ-6: RLS Policy Update for Ranking Reads

**User Story:** As a learner, I want to view the XP data of all users in the ranking, so that the leaderboard displays the full community.

#### Acceptance Criteria

6.1 THE database SHALL allow any authenticated user to read all rows from the `xp` table for ranking purposes.

6.2 THE database SHALL allow any authenticated user to read all rows from the `xp_month` table for ranking purposes.

6.3 THE database SHALL allow any authenticated user to read all rows from the `xp_week` table for ranking purposes.

6.4 THE database SHALL continue to restrict write operations on the XP tables to authorized processes only.
