# Requirements

## Overview
This feature implements the core logic for granting achievements to users upon completing a quiz. The evaluation occurs within the Supabase Edge Function responsible for quiz completion (`complete-quiz` or a dedicated function). When a user meets the criteria for specific achievements, the system must grant the achievement, award the corresponding experience points (XP), and update all related XP tracking tables.

## Glossary
| Term | Definition |
|------|------------|
| Achievement | A reward granted to a user for reaching a specific milestone or fulfilling a condition within the application. |
| Edge Function | A serverless function hosted on Supabase, triggered by client requests. |
| XP | Experience points awarded to the user. |

## Assumptions
- The `complete-quiz` edge function (or similar) will have access to the user's ID, the completed quiz data, and the ability to query the database.
- Achievements have an associated XP value defined in the `achievements` table.
- A user can only earn each specific achievement once.

## Requirements

### REQ-1: Achievement Eligibility Check

**User Story:** As a system administrator, I want the system to check if a user already possesses an achievement, so that duplicate achievements are not awarded.

#### Acceptance Criteria
1.1 WHERE the user already possesses a specific achievement, the edge function SHALL skip the evaluation and granting process for that achievement.

### REQ-2: Granting Achievements

**User Story:** As a learner, I want to receive an achievement when I meet its criteria, so that my progress is recognized.

#### Acceptance Criteria
2.1 WHEN a user meets the criteria for a new achievement during quiz completion, THEN the edge function SHALL create a record in the `user_achievements` table linking the user, the achievement, the current date, and a `viewed` status of false.

### REQ-3: XP Awarding for Achievements

**User Story:** As a learner, I want to earn XP for my achievements, so that my total score increases.

#### Acceptance Criteria
3.1 WHEN a new achievement is granted, THEN the edge function SHALL add the achievement's XP value to the user's total XP in the `xp` table.
3.2 WHEN a new achievement is granted, THEN the edge function SHALL create a record in the `xp_log` table with the awarded XP value, the current date, and the reason set to `ACHIEVEMENT`.
3.3 WHEN a new achievement is granted, THEN the edge function SHALL add the awarded XP to the user's weekly total in the `xp_week` table for the current week.
3.4 WHEN a new achievement is granted, THEN the edge function SHALL add the awarded XP to the user's monthly total in the `xp_month` table for the current month.

### REQ-4: Module Completion Achievements (APRENDIZ_DE_TAGS, ESTILISTA_DA_WEB, MAGO_DAS_FUNCOES)

**User Story:** As a learner, I want to earn an achievement for completing a specific module, so that my mastery of a technology is recognized.

#### Acceptance Criteria
4.1 WHEN a user completes the last lesson of the HTML module, THEN the edge function SHALL grant the `APRENDIZ_DE_TAGS` achievement.
4.2 WHEN a user completes the last lesson of the CSS module, THEN the edge function SHALL grant the `ESTILISTA_DA_WEB` achievement.
4.3 WHEN a user completes the last lesson of the JavaScript module, THEN the edge function SHALL grant the `MAGO_DAS_FUNCOES` achievement.

### REQ-5: Streak Achievements (IMPARAVEL, MARATONISTA_DO_CODIGO)

**User Story:** As a learner, I want to be rewarded for consistent daily study, so that I stay motivated to learn every day.

#### Acceptance Criteria
5.1 WHEN a user completes lessons on 5 consecutive days, THEN the edge function SHALL grant the `MARATONISTA_DO_CODIGO` achievement.
5.2 WHEN a user completes lessons on 10 consecutive days, THEN the edge function SHALL grant the `IMPARAVEL` achievement.

### REQ-6: Daily Volume Achievement (MODO_FOGUETE)

**User Story:** As a learner, I want to be rewarded for completing many lessons in a single day, so that my intensive study sessions are recognized.

#### Acceptance Criteria
6.1 WHEN a user completes 10 lessons on the same calendar date, THEN the edge function SHALL grant the `MODO_FOGUETE` achievement.

### REQ-7: Perfection Achievements (COMBO_INSANO, SERIE_PERFEITA)

**User Story:** As a learner, I want to be rewarded for achieving perfect scores consecutively, so that my accuracy is recognized.

#### Acceptance Criteria
7.1 WHEN a user completes 5 consecutive lessons with a score of 10, THEN the edge function SHALL grant the `SERIE_PERFEITA` achievement.
7.2 WHEN a user completes 10 consecutive lessons with a score of 10, THEN the edge function SHALL grant the `COMBO_INSANO` achievement.

### REQ-8: Improvement Achievement (PERFECCIONISTA_DO_CODIGO)

**User Story:** As a learner, I want to be rewarded for improving a previous score, so that my effort to learn from mistakes is recognized.

#### Acceptance Criteria
8.1 WHEN a user completes a previously completed lesson with a higher score than before, THEN the edge function SHALL grant the `PERFECCIONISTA_DO_CODIGO` achievement.

### REQ-9: Milestone Achievements (PRIMEIRO_PASSO_NO_CODIGO, MEU_PRIMEIRO_DESAFIO, MINHA_PRIMEIRA_REVISAO)

**User Story:** As a learner, I want to be rewarded for experiencing new types of lessons, so that my engagement with the platform is recognized.

#### Acceptance Criteria
9.1 WHEN a user completes their very first lesson on the platform, THEN the edge function SHALL grant the `PRIMEIRO_PASSO_NO_CODIGO` achievement.
9.2 WHEN a user completes their first lesson of type `CHALLENGE`, THEN the edge function SHALL grant the `MEU_PRIMEIRO_DESAFIO` achievement.
9.3 WHEN a user completes their first lesson of type `REVISION`, THEN the edge function SHALL grant the `MINHA_PRIMEIRA_REVISAO` achievement.
