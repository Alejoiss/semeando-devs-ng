# Requirements

## Overview
To prevent unnecessary usage of AI credits, the system must enforce rate limits on two key actions: "Avaliar conteúdo com IA" (Evaluate content with AI) and "Enviar código" (Submit code). The rate limits depend on the user's subscription tier (Free vs. Pro) and the context of the action (per lesson vs. per day). Additionally, the system must display the user's available AI credits in the sidebar menu and present clear rate limit information on the upgrade screen for free users.

## Glossary
| Term | Definition |
|------|------------|
| Evaluate Content Action | The action triggered by the "Avaliar conteúdo com IA" button. |
| Submit Code Action | The action triggered by the "Enviar código" button. |
| Free User | A user whose `is_pro` status is false. |
| Pro User | A user whose `is_pro` status is true. |

## Assumptions
- The system can track usage of AI actions per user, per day, and per lesson.
- The `is_pro` field is readily available in the user's profile context.
- Daily limits reset at midnight in a defined timezone (assumed UTC for the backend).

## Requirements

### REQ-1: Enforce Rate Limit for Evaluate Content Action
**User Story:** As a user, I want to evaluate lesson content with AI, so that I can receive feedback within my allowed usage limits.

#### Acceptance Criteria
1.1 WHEN the user triggers the Evaluate Content Action, THEN the system SHALL verify if the user has evaluated content less than 3 times for the current lesson.
1.2 IF the user has already evaluated content 3 times for the current lesson, THEN the system SHALL prevent the Evaluate Content Action.

### REQ-2: Enforce Rate Limit for Submit Code Action
**User Story:** As a user, I want to submit code for AI evaluation, so that I can validate my solution within my daily limits.

#### Acceptance Criteria
2.1 WHILE the user is a Free User, WHEN the user triggers the Submit Code Action, THEN the system SHALL verify if the user has submitted code less than 5 times today.
2.2 WHILE the user is a Pro User, WHEN the user triggers the Submit Code Action, THEN the system SHALL verify if the user has submitted code less than 30 times today.
2.3 IF the user exceeds their daily Submit Code Action limit, THEN the system SHALL prevent the Submit Code Action.

### REQ-3: Display AI Credits in Aside Menu
**User Story:** As a user, I want to see my available AI credits in the sidebar, so that I can manage my usage.

#### Acceptance Criteria
3.1 THE system SHALL display the total available AI credits for the user in the sidebar menu.
3.2 THE system SHALL position the AI credits display below the "Atualizar para Pro" item in the sidebar menu.
3.3 WHEN the user consumes an AI credit, THEN the system SHALL update the displayed AI credits in the sidebar menu to reflect the new balance.

### REQ-4: Display Rate Limit Information on Upgrade Screen
**User Story:** As a Free User, I want to see the AI rate limit information on the upgrade screen, so that I understand the benefits of upgrading to Pro.

#### Acceptance Criteria
4.1 WHILE the user is a Free User, the system SHALL display the AI rate limit information on the upgrade screen.
4.2 WHILE the user is a Pro User, the system SHALL hide the AI rate limit information on the upgrade screen.
