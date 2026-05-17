# Requirements

## Overview
This document outlines the requirements for the professor lesson authoring interface to support quiz creation. Professors need to configure a 10-question quiz for each lesson. Each question consists of a markdown-based statement (enunciado) and four alternatives, each with its own text, justification, and correctness flag. The feature must ensure the correct data structure linking Lessons to Quizzes, Questions, SectionContents, and Answers.

## Requirements

### REQ-1: Quiz Initialization

**User Story:** As a professor, I want to manage a quiz for a lesson, so that I can evaluate students on the lesson content.

#### Acceptance Criteria
1.1 WHEN the professor accesses the quiz tab for a lesson, THEN the professor app SHALL ensure a Quiz record exists for that lesson.
1.2 IF a lesson does not have a linked Quiz record, THEN the professor app SHALL create a new Quiz for the lesson.

### REQ-2: Question Set Provisioning

**User Story:** As a professor, I want a structured layout with exactly 10 questions, so that I can configure a complete evaluation.

#### Acceptance Criteria
2.1 THE professor app SHALL display exactly 10 question authoring sections for the quiz.
2.2 WHERE a question does not exist for a given slot, the professor app SHALL display an empty question authoring form.

### REQ-3: Question Statement Editing

**User Story:** As a professor, I want to edit the question statement using Markdown, so that I can include formatted text and code blocks.

#### Acceptance Criteria
3.1 THE professor app SHALL provide a Markdown editor for the question statement.
3.2 WHEN saving a question, THEN the professor app SHALL store the question statement as a SectionContent of type MARKDOWN linked to the question.

### REQ-4: Alternatives Configuration

**User Story:** As a professor, I want to define four alternatives for each question along with their justifications, so that students have clear options and structured feedback.

#### Acceptance Criteria
4.1 THE professor app SHALL provide exactly four alternative rows per question.
4.2 THE professor app SHALL allow the professor to input the text content for each alternative.
4.3 THE professor app SHALL allow the professor to input a justification text for each alternative.
4.4 THE professor app SHALL allow the professor to mark exactly one alternative as correct using a radio control.

### REQ-5: Question Saving

**User Story:** As a professor, I want to save each question individually, so that I can incrementally build the quiz without losing data.

#### Acceptance Criteria
5.1 THE professor app SHALL provide a save action for each individual question section.
5.2 WHEN the professor triggers the save action for a question, THEN the professor app SHALL save the question record, its linked SectionContent, and its four Answers.
5.3 IF the question does not have exactly one correct alternative selected, THEN the professor app SHALL reject the save action.
5.4 IF any alternative text is empty, THEN the professor app SHALL reject the save action.
