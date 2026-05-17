# Implementation Tasks: Professor Lesson Content Authoring

## Overview
This document outlines the atomic tasks required to implement the lesson content authoring flow, ensuring traceability from requirements and design.

- **Phase 1: Service Layer Enhancement**: Prepare the data access layer.
- **Phase 2: UI & Logic Implementation**: Build the components and forms.
- **Phase 3: Final Checkpoint**: Verify the end-to-end flow.

## Phase 1: Service Layer Enhancement

- [x] 1.1 Update `LessonService` with `createLesson` and `getLessonCountBySubModuleId`.
  - _Implements: DES-1, REQ-002, REQ-003_

## Phase 2: UI & Logic Implementation

- [x] 2.1 Enhance `CreateLesson` parent component logic to disable extra tabs when `lessonId()` is null.
  - _Implements: DES-4, REQ-004_
- [x] 2.2 Scaffold `TabContent` component with `ReactiveFormsModule` and dependency injections.
  - _Implements: DES-2, REQ-001_
- [x] 2.3 Implement `saveLesson()` workflow in `TabContent` including payload construction and redirection.
  - _Implements: DES-2, DES-3, REQ-002, REQ-003_
- [x] 2.4 Build `TabContent` template following Neon Terminal design system and accessibility rules.
  - _Implements: DES-5, REQ-005, REQ-006_

## Phase 3: Final Checkpoint

- [x] 3.1 Verify lesson creation in Supabase and redirection to edit route.
  - _Implements: REQ-001, REQ-002, REQ-003, REQ-004_
