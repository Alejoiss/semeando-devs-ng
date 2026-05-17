# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Extend persistence services and wire the parent component context.
2. **Feature Delivery** - Implement the reactive form logic, validation, and Neon Terminal styled template.
3. **Acceptance Criteria Testing** - Run unit and integration tests to verify all acceptance criteria.
4. **Final Checkpoint** - Validate all requirements and overall spec completeness.

**Estimated Effort**: Low-Medium (1-2 sessions)

## Phase 1: Foundation

- [x] 1.1 Extend ExtraMaterialService
  - Add `upsertExtraMaterials(lessonId, materials)` and `deleteExtraMaterials(ids)` methods in `src/app/services/extra-material.ts` utilizing the Supabase client.
  - _Implements: DES-2_

- [x] 1.2 Wire lessonId in CreateLesson Component Template
  - Update `create-lesson.html` to pass the `lessonId` input to the `<app-tab-extra-material>` tag.
  - _Implements: DES-1_

## Phase 2: Feature Delivery

- [x] 2.1 Implement TabExtraMaterial Component Form State
  - Update `tab-extra-material.ts` to declare `lessonId` as an input signal, define Reactive Forms structure with a `FormArray`, handle loading existing materials from `ExtraMaterialService`, track deleted item IDs, and handle the submit flow.
  - _Implements: DES-1_

- [x] 2.2 Implement TabExtraMaterial Component Template and Styling
  - Update `tab-extra-material.html` and `tab-extra-material.scss` with the list of inputs, add/remove buttons, validation states, and a Save button. Follow Neon Terminal style guide rules (no 1px solid borders, dynamic design with spacing-12, glassmorphism on hover).
  - _Implements: DES-1_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: load and display saved extra materials
  - Verify that when the lesson has existing extra materials, the interface displays them correctly. Verify that when there are none, the empty state illustration and message are shown.
  - Test type: unit
  - _Depends: 2.1, 2.2_
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3_

- [x] 3.2 Test: add and remove extra materials locally
  - Verify that clicking the add button creates new rows and removing locally deletes rows or schedules them for deletion if they existed in the database. Verify that input fields require a non-empty title and valid URL.
  - Test type: unit
  - _Depends: 2.1, 2.2_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3_

- [x] 3.3 Test: save extra materials to database
  - Verify that clicking save submits changes (upserts and deletes) to `ExtraMaterialService`, showing the success banner on success or error on failure.
  - Test type: unit
  - _Depends: 1.1, 2.1, 2.2_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - Run the test suite and manually verify integration in the browser between the main page and the tab-extra-material page, ensuring no design regressions and complete functionality.
  - _Implements: All requirements_
