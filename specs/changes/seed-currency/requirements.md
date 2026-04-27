# Requirements

## Overview

The Semeando Devs platform will introduce an in-app currency called **seed** (plural: **seeds**). Seeds are earned automatically whenever a user gains XP, in proportion to 10% of the XP awarded (rounded up to the nearest integer). For example, 100 XP yields 10 seeds and 75 XP yields 8 seeds.

Seeds will initially be used to purchase hints during a quiz lesson. When a user chooses to reveal a hint for a question, 50 seeds are deducted from their balance. If the user cannot afford the cost, the hint button is disabled. The scope of this feature covers database persistence, backend trigger logic, frontend balance display in the global header, seed earnings shown on the quiz completion screen, and the hint purchase flow inside the quiz.

## Glossary

| Term | Definition |
|------|------------|
| seed | The in-app currency unit of the Semeando Devs platform |
| seeds | Plural of seed |
| seed balance | The running total of seeds a user currently owns |
| hint | The explanation (`reason`) of the correct answer for a quiz question, revealed in exchange for 50 seeds |
| seed log | An immutable record of each seeds credit or debit event for a user |
| XP | Experience points awarded to users for completing lessons |

## Assumptions

- The seed balance is initialised to 0 and only changes when a new record is inserted into the seed log table.
- A seed log entry with a negative `amount` represents a spend; a positive `amount` represents an earning.
- Seed earnings are calculated client-side from the lesson XP value using `Math.ceil(xp * 0.1)` when the quiz is completed successfully.
- The hint that is revealed corresponds to the `reason` field of the correct answer for the current question.
- A user may only purchase a hint once per question per quiz attempt; purchasing again for the same question while the hint is already visible is not required in this phase.
- Seeds are not awarded for failed quiz attempts (score below 70%).

## Requirements

### REQ-1: Seed Balance Persistence

**User Story:** As a developer, I want seed balance data stored in a dedicated database table with an automatic update trigger, so that the user's seed balance is always consistent with their transaction history.

#### Acceptance Criteria

1.1 THE system SHALL store each user's cumulative seed balance in a `seed` table containing `id`, `user_id`, `total_seeds`, and `updated_at` fields.

1.2 THE system SHALL record every seed credit and debit as a row in a `seed_log` table containing `id`, `user_id`, `amount`, and `created_at` fields.

1.3 WHEN a new row is inserted into `seed_log`, THEN the system SHALL automatically update the corresponding `total_seeds` value in the `seed` table to reflect the new running total.

1.4 THE system SHALL enforce row-level security so that users can only read their own rows in the `seed` and `seed_log` tables.

### REQ-2: Seed Earning on Quiz Completion

**User Story:** As a student, I want to automatically receive seeds when I earn XP for completing a lesson, so that I accumulate seeds to spend on hints.

#### Acceptance Criteria

2.1 WHEN a user successfully passes a quiz (score ≥ 70%), THEN the system SHALL credit the user's seed log with an amount equal to `Math.ceil(lesson.xp * 0.1)`.

2.2 WHEN the quiz completion screen is displayed after a successful attempt, THEN the application SHALL show the number of seeds earned during that lesson alongside the XP reward.

2.3 IF a user fails a quiz attempt (score < 70%), THEN the application SHALL NOT credit any seeds for that attempt.

### REQ-3: Seed Balance Display in Header

**User Story:** As a student, I want to see my current seed balance in the application header at all times, so that I know how many seeds I have available to spend.

#### Acceptance Criteria

3.1 WHILE a user is authenticated, the application SHALL display the user's current seed balance in the internal header, adjacent to the XP counter.

3.2 THE application SHALL display a seed icon (`src/assets/seed/seed.png`) alongside the numeric seed balance in the header.

3.3 WHEN the user's seed balance changes, THEN the application SHALL update the displayed seed balance in the header without requiring a page reload.

### REQ-4: Hint Purchase in Quiz

**User Story:** As a student, I want to spend seeds to reveal the explanation for the correct answer of a quiz question, so that I can learn from the hint without abandoning the quiz.

#### Acceptance Criteria

4.1 WHILE a quiz question is active and not yet confirmed, the application SHALL display a "Pedir dica (50 seeds)" button adjacent to the "Confirmar resposta" button.

4.2 WHILE the user's seed balance is less than 50, the application SHALL display the hint button in a disabled state.

4.3 WHEN the user clicks the enabled hint button, THEN the application SHALL display a confirmation prompt asking whether the user wants to spend 50 seeds to reveal the hint.

4.4 WHEN the user confirms the hint purchase, THEN the application SHALL deduct 50 seeds from the user's seed log and display the `reason` text of the correct answer for the current question.

4.5 WHEN the hint is revealed, THEN the application SHALL update the displayed seed balance in the header to reflect the deduction immediately.

4.6 IF the user cancels the confirmation prompt, THEN the application SHALL NOT deduct any seeds and SHALL NOT reveal the hint.
