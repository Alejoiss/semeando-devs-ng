# Requirements

## Overview
The application introduces a gamification system where users earn Experience Points (XP) for their actions. To support this feature reliably, we need to create the underlying relational database structure in Supabase to track total XP, log individual XP transactions, and maintain weekly and monthly aggregates for leaderboards. The frontend also requires properly typed TypeScript domain models strictly matching this new database schema.

## Glossary
| Term | Definition |
|------|------------|
| XP | Experience points earned by the user to track progress. |
| XpLog | A historical log recording every transaction or event where XP was granted or deducted. |
| XpWeek | A record storing the accumulated XP for a given user within a specific calendar week. |
| XpMonth | A record storing the accumulated XP for a given user within a specific calendar month. |

## Assumptions
- The application already has an existing user table or authentication system that the XP tables can reference.
- The `src/models` directory is the standard location for TypeScript representation of Supabase tables.
- The user uses the Supabase MCP to apply migrations.

## Requirements

### REQ-1: Gamification Database Schema
**User Story:** As a developer, I want to capture gamification experience properly in the database, so that the application can track, log, and aggregate user progress.

#### Acceptance Criteria
1.1 THE database system SHALL establish a `xp` table.
1.2 THE database system SHALL establish a `xp_log` table.
1.3 THE database system SHALL establish a `xp_week` table.
1.4 THE database system SHALL establish a `xp_month` table.
1.5 WHEN establishing these tables, THEN the database system SHALL define a relationship between each table and the user entity.

### REQ-2: Database Migrations
**User Story:** As a developer, I want to use migrations to apply schema changes to the live database, so that database updates are version-controlled and immediately available.

#### Acceptance Criteria
2.1 THE deployment system SHALL generate Supabase migration files for the `xp`, `xp_log`, `xp_week`, and `xp_month` tables.
2.2 THE deployment system SHALL apply these migrations directly to the Supabase database.

### REQ-3: Domain Data Models
**User Story:** As a developer, I want typed representations of the XP tables in the frontend, so that I can interact safely with the data.

#### Acceptance Criteria
3.1 THE client application SHALL define a TypeScript model for XP in `src/models/xp/xp.ts`.
3.2 THE client application SHALL define a TypeScript model for XP transactions in `src/models/xp-log/xp-log.ts`.
3.3 THE client application SHALL define a TypeScript model for weekly aggregations in `src/models/xp-week/xp-week.ts`.
3.4 THE client application SHALL define a TypeScript model for monthly aggregations in `src/models/xp-month/xp-month.ts`.
