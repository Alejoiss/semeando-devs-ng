# Requirements

## Overview
This document details the requirements for adjustments to the quiz JSON import process in the Semeando Devs teacher application. Specifically, the import process will clear existing quiz questions from the lesson before persisting the imported set, and the loading animations will be styled correctly as circular spinner icons.

## Glossary
| Term | Definition |
|------|------------|
| Quiz | A collection of up to 10 questions associated with a lesson. |
| Loader | A UI loading indicator showing that a background operation is in progress. |

## Assumptions
- The database schema cascades deletions from the questions table to dependent tables (answers, section_content).

## Requirements

### REQ-1: Clear Existing Questions Before JSON Import

**User Story:** As a teacher, I want existing quiz questions for a lesson to be deleted when I import new ones, so that the new import completely replaces the old quiz.

#### Acceptance Criteria
1.1 WHEN the teacher triggers the JSON import, THEN the application SHALL delete all existing questions associated with the current quiz from the database before persisting the new questions.

### REQ-2: Circular Loading Spinner Icons

**User Story:** As a teacher, I want to see circular loading animations instead of squares, so that the loading interface looks modern and correct.

#### Acceptance Criteria
2.1 WHILE the application is loading the quiz from the database, the application SHALL display a circular rotating spinner.
2.2 WHILE the application is executing the JSON import, the application SHALL display a circular rotating spinner next to the import status text.
