# Requirements

## Overview
The platform needs a way to track and manage content owners who are responsible for specific lessons. This system will decouple instructional content from general system users, allowing for independent management of instructors and their associated lessons.

## Glossary
| Term | Definition |
|------|------------|
| Owner | A person or entity responsible for creating and managing specific lessons on the platform. |
| Lesson | A unit of instructional content within a submodule. |

## Assumptions
- Existing lessons can be bulk-migrated to a single default owner.
- Owners do not require a direct link to the `auth.users` table for this phase.

## Requirements

### REQ-1: Content Owner Data Model

**User Story:** As an administrator, I want to store detailed information about content owners, so that I can contact them and manage their attribution on the platform.

#### Acceptance Criteria
1.1 THE database SHALL provide a dedicated `owners` table containing `id` (UUID), `name`, `email`, `address`, `phone`, `whatsapp`, `further_information`, `created_at`, and `updated_at` fields.
1.2 WHERE the `owners` table is created, the database SHALL enable Row Level Security (RLS).

### REQ-2: Lesson to Owner Relationship

**User Story:** As an administrator, I want to link each lesson to a specific owner, so that I know who is responsible for each piece of content.

#### Acceptance Criteria
2.1 THE database SHALL include an `owner_id` column in the `lessons` table.
2.2 THE `lessons.owner_id` column SHALL reference the `owners.id` column as a foreign key constraint.
2.3 IF a lesson record is stored, THEN the database SHALL enforce a link to exactly one owner.

### REQ-3: Initial Data Provisioning

**User Story:** As a system developer, I want to initialize the system with a default owner and migrate existing data, so that the new relationship constraint is satisfied for current content.

#### Acceptance Criteria
3.1 THE database migration SHALL insert a default owner record for "Joisson José de Mello" with the provided contact details.
3.2 WHEN the database migration executes, THEN the database SHALL update all existing `lessons` records to reference the new default owner's ID.

### REQ-4: Migration Integrity

**User Story:** As a developer, I want all schema changes to be handled through migrations, so that the database state is predictable across environments.

#### Acceptance Criteria
4.1 THE platform SHALL generate a Supabase-compatible SQL migration file containing all DDL and DML operations.
4.2 THE migration SHALL include a rollback strategy or be idempotent to prevent data corruption during execution.

### REQ-5: Application Model Synchronization

**User Story:** As a developer, I want the TypeScript code to reflect the database changes, so that I can work with owner data in the frontend application.

#### Acceptance Criteria
5.1 THE application SHALL include an `Owner` model definition in `src/app/models/owner.ts`.
5.2 THE application SHALL update the `Lesson` model in `src/app/models/lesson.ts` to include the `owner_id` property.
