# Requirements: Dynamic Lesson Quizzes

The goal is to replace the static quiz implementation with a dynamic one powered by Supabase. Each lesson will have one associated quiz, which consists of multiple questions. Each question can have rich content (text, images, markdown) and multiple answer options. User progress and performance will be tracked.

## REQ-001: Database Schema (Supabase)

1.1 **SHALL** provide a `quizzes` table to store metadata for each quiz.
1.2 **SHALL** provide a `questions` table linked to a specific quiz.
1.3 **SHALL** provide an `answers` table linked to a specific question, including an `is_correct` flag and a `reason` field.
1.4 **SHALL** modify the `section_content` table to allow linking content to either a lesson OR a question.
1.5 **SHALL** provide `user_quizzes` and `user_questions` tables to persist user attempts and results.

## REQ-002: Angular Services

2.1 **WHEN** the `QuizService` is called with a lesson primary key, **THEN** it SHALL return the associated quiz and its questions.
2.2 **WHEN** the `AnswerService` is called with a question primary key, **THEN** it SHALL return correctly formatted answer options.
2.3 **WHEN** a user begins a quiz, **THEN** the `UserQuizService` SHALL initialize a new attempt record.
2.4 **WHEN** a user finishes a quiz, **THEN** the `UserQuizService` SHALL calculate and store the final results.

## REQ-003: Quiz UI Logic

3.1 **WHEN** a user enters a lesson's quiz route, **THEN** the system SHALL load the quiz content dynamically from Supabase.
3.2 **WHILE** the user is viewing a quiz page, **THEN** the system SHALL track the elapsed time without displaying it.
3.3 **WHEN** a user selects an answer option, **THEN** the system SHALL highlight it as the active selection.
3.4 **WHEN** a user clicks the "Verify Answer" button, **THEN** the system SHALL display the correctness feedback and the explanation (`reason`).
3.5 **IF** a question has multiple contents, **THEN** the system SHALL render them in the specified `order`.

## REQ-004: Summary View

4.1 **WHEN** the quiz is completed, **THEN** the system SHALL display a summary screen.
4.2 **SHALL** show the total number of questions, total correct answers, total incorrect answers, percentage of success, and total time spent.
4.3 **SHALL** use the existing visual design (circles, progress bars) populated with dynamic data.
