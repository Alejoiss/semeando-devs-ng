# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare the achievement evaluator module and integrate it into the `complete-quiz` Edge Function.
2. **Feature Delivery** - Implement the evaluation rules for each specific achievement category.
3. **Acceptance Criteria Testing** - Verify requirement behavior through testing.
4. **Final Checkpoint** - Validate completeness and readiness.

**Estimated Effort**: Medium (2-4 sessions)

## Phase 1: Foundation

- [x] 1.1 Create `achievements.ts` helper module
  - Create the new file in the `complete-quiz` function directory to house achievement logic.
  - Set up the main `evaluateAchievements` function signature to accept the DB client, user ID, and quiz context.
  - _Implements: DES-1_

- [x] 1.2 Implement XP granting and database updates
  - Within `achievements.ts`, implement the logic to fetch the user's current achievements, insert new achievements into `user_achievements`, and update `xp`, `xp_log`, `xp_week`, and `xp_month`.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-1.1, REQ-2.1, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4_

- [x] 1.3 Integrate with `complete-quiz` Edge Function
  - Import and call `evaluateAchievements` from within `complete-quiz/index.ts` after marking lessons as completed. Add the returned XP to the overall awarded XP.
  - _Depends: 1.2_
  - _Implements: DES-1_

## Phase 2: Feature Delivery

- [x] 2.1 Implement Module Completion Rules
  - Add logic in `achievements.ts` to detect completion of HTML, CSS, and JS modules and award `APRENDIZ_DE_TAGS`, `ESTILISTA_DA_WEB`, and `MAGO_DAS_FUNCOES`.
  - _Depends: 1.2_
  - _Implements: DES-2, REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 2.2 Implement Streak and Daily Volume Rules
  - Add logic in `achievements.ts` to query `user_quizzes` for daily streaks (5 and 10 days) and daily volume (10 lessons in one day). Award `MARATONISTA_DO_CODIGO`, `IMPARAVEL`, and `MODO_FOGUETE`.
  - _Depends: 1.2_
  - _Implements: DES-2, REQ-5.1, REQ-5.2, REQ-6.1_

- [x] 2.3 Implement Perfection and Improvement Rules
  - Add logic in `achievements.ts` to detect consecutive perfect scores (5 and 10) and score improvements on retries. Award `SERIE_PERFEITA`, `COMBO_INSANO`, and `PERFECCIONISTA_DO_CODIGO`.
  - _Depends: 1.2_
  - _Implements: DES-2, REQ-7.1, REQ-7.2, REQ-8.1_

- [x] 2.4 Implement Milestone Rules
  - Add logic in `achievements.ts` to detect the first lesson overall, first CHALLENGE, and first REVISION. Award `PRIMEIRO_PASSO_NO_CODIGO`, `MEU_PRIMEIRO_DESAFIO`, and `MINHA_PRIMEIRA_REVISAO`.
  - _Depends: 1.2_
  - _Implements: DES-2, REQ-9.1, REQ-9.2, REQ-9.3_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: prevent duplicate achievements
  - Verify that if a user already has an achievement, it is not granted again.
  - Test type: integration
  - _Depends: 1.2_
  - _Implements: REQ-1.1_

- [x] 3.2 Test: grant achievements and award XP
  - Verify that a newly earned achievement is saved correctly in `user_achievements` and the appropriate XP is added to all tracked tables (`xp`, `xp_log`, `xp_week`, `xp_month`).
  - Test type: integration
  - _Depends: 1.2_
  - _Implements: REQ-2.1, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4_

- [x] 3.3 Test: module completion achievements
  - Verify that completing the last lesson of HTML, CSS, or JS modules correctly triggers the respective achievement.
  - Test type: integration
  - _Depends: 2.1_
  - _Implements: REQ-4.1, REQ-4.2, REQ-4.3_

- [x] 3.4 Test: streak and volume achievements
  - Verify that maintaining 5 or 10-day streaks or completing 10 lessons in one day triggers the appropriate achievements.
  - Test type: integration
  - _Depends: 2.2_
  - _Implements: REQ-5.1, REQ-5.2, REQ-6.1_

- [x] 3.5 Test: perfection and improvement achievements
  - Verify that achieving 5 or 10 consecutive perfect scores or improving a previous score triggers the appropriate achievements.
  - Test type: integration
  - _Depends: 2.3_
  - _Implements: REQ-7.1, REQ-7.2, REQ-8.1_

- [x] 3.6 Test: milestone achievements
  - Verify that completing the first lesson, first CHALLENGE, or first REVISION triggers the appropriate milestone achievements.
  - Test type: integration
  - _Depends: 2.4_
  - _Implements: REQ-9.1, REQ-9.2, REQ-9.3_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1, REQ-2, REQ-3: Core granting and XP logic works correctly.
  - REQ-4, REQ-5, REQ-6, REQ-7, REQ-8, REQ-9: All specific rules evaluate correctly.
  - _Implements: All requirements_
