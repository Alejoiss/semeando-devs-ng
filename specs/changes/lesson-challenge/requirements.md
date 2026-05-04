# Requirements

## Overview
This feature introduces a new "Challenge" (CHALLENGE) lesson type, focusing on practical coding exercises. Students receive a programming problem, write code using an integrated editor, and submit it for AI-driven feedback. The objective is to encourage practical application of learned concepts, where completion is based on effort (submission) rather than strict pass/fail grading, and rewards (XP, seeds) are granted upon completion.

## Glossary
| Term | Definition |
|------|------------|
| Challenge Lesson | A lesson type where the student must write and submit code to solve a given problem. |
| AI Agent | An external Language Model (Ling-2.6-1T via OpenRouter) responsible for analyzing student code and generating textual feedback. |

## Assumptions
- The database schema supports adding properties for saving code snippets and AI feedback within the user's lesson progress or a related challenge table.
- OpenRouter API key is configured in the Supabase environment variables.

## Requirements

### REQ-1: Access Challenge Lesson
**User Story:** As a student, I want to access a challenge lesson, so that I can practice coding problems.

#### Acceptance Criteria
1.1 WHEN the student navigates to a lesson of type CHALLENGE, THEN the application SHALL load the challenge interface at `/:slug/ss/:slugSubmodule/lesson/:lessonId/challenge`.
1.2 THE application SHALL display the challenge problem description using the section-contents component.
1.3 THE application SHALL provide a code editor interface using `@ngstack/code-editor`.

### REQ-2: Persist Challenge State
**User Story:** As a student, I want my code and feedback to be saved, so that I can resume my work later or review previous feedback.

#### Acceptance Criteria
2.1 WHEN the student modifies code in the editor, THEN the application SHALL save the current code state.
2.2 WHEN the student returns to a previously visited challenge lesson, THEN the application SHALL restore the saved code, the submitted code, and the generated AI feedback.

### REQ-3: Submit Code for Correction
**User Story:** As a student, I want to submit my code for AI evaluation, so that I can receive feedback on my implementation.

#### Acceptance Criteria
3.1 WHEN the student submits their code, THEN the application SHALL send the challenge description and the student's code to the backend system via a Supabase Edge Function.
3.2 THE backend system SHALL request code analysis and textual feedback from the AI agent via OpenRouter.
3.3 WHEN the backend system returns the feedback, THEN the application SHALL display the feedback to the student.

### REQ-4: Complete Challenge Lesson
**User Story:** As a student, I want to receive credit for attempting the challenge, so that I can progress in my course and earn rewards.

#### Acceptance Criteria
4.1 WHEN the student submits their code, THEN the application SHALL mark the lesson as completed.
4.2 WHEN the lesson is marked as completed, THEN the backend system SHALL award the standard XP and seeds.
