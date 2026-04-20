# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare core structures and entry points
2. **Feature Delivery** - Implement the main design elements
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Low (1 session)

## Phase 1: Foundation

- [x] 1.1 Add progressPercentage to SubmoduleWithState
  - Update `SubmoduleWithState` interface in `submodule.ts` to include an optional or required `progressPercentage` number field.
  - _Implements: DES-1_

## Phase 2: Feature Delivery

- [x] 2.1 Calculate progress dynamically for in-progress submodules
  - Inside `loadData` of `submodule.ts`, correctly calculate `(completed_lessons / total_lessons) * 100` when the submodule state is 'in-progress'. Ensure 'completed' sets 100 and 'not-started' sets 0.
  - _Depends: 1.1_
  - _Implements: DES-1_

- [x] 2.2 Bind calculated percentage to UI template
  - Modify `submodule.html` to consume the `progressPercentage` from the state instead of statically defining it via ternary operators in the template.
  - _Depends: 2.1_
  - _Implements: DES-1_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: dynamic progress calculation for in-progress submodules
  - Verify that when a submodule has 'in-progress' status, its progress percentage is accurately generated from total and completed lessons.
  - Test type: integration
  - _Depends: 2.1, 2.2_
  - _Implements: REQ-1.1_

- [x] 3.2 Test: static completion calculation for completed submodules
  - Verify that 'completed' submodules maintain a fixed progress percentage of 100%.
  - Test type: unit
  - _Depends: 2.1, 2.2_
  - _Implements: REQ-1.2_

- [x] 3.3 Test: static default calculation for not-started submodules
  - Verify that 'not-started' submodules cleanly start with a progress percentage of 0%.
  - Test type: unit
  - _Depends: 2.1, 2.2_
  - _Implements: REQ-1.3_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1.1: Confirm dynamic progress correctly resolves.
  - REQ-1.2: Confirm completed state defaults to 100%.
  - REQ-1.3: Confirm unstarted defaults to 0%.
  - Run component tests and confirm visual display on submodule dashboard.
  - _Implements: All requirements_
