# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** - Prepare core signals and state fields
2. **Feature Delivery** - Implement the guards and prefetching logic
3. **Acceptance Criteria Testing** - Verify requirement behavior
4. **Final Checkpoint** - Validate completeness and readiness

**Estimated Effort**: Small (1-2 sessions)

## Phase 1: Foundation

- [x] 1.1 Add state signals
  - Add `isConfirming` and `prefetchedAnswers` signals to `Quiz` component.
  - _Implements: DES-1, DES-2_

## Phase 2: Feature Delivery

- [x] 2.1 Implement Confirmation Guard
  - Check and set `isConfirming` in `confirmAnswer` and `handleKeyboardEvent`. Disable buttons visually in template.
  - _Depends: 1.1_
  - _Implements: DES-1_

- [x] 2.2 Implement Completion Guard
  - Enforce `isProcessingCompleteQuiz` checks across keyboard shortcuts and template actions for completion. Update UI loading indicators.
  - _Depends: 1.1_
  - _Implements: DES-3_

- [~] 2.3 Implement Background Answer Prefetcher
  - Start background fetch in `confirmAnswer` after success. Update `loadAnswersForCurrentQuestion` to consume cached answers or fallback to network.
  - _Depends: 1.1_
  - _Implements: DES-2_

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: Verify in-flight guard for answer confirmation
  - Verify duplicate confirmations are discarded, the confirm button is disabled, keyboard shortcuts are ignored while confirming, and the guard releases afterward.
  - Test type: integration
  - _Depends: 2.1_
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4_

- [x] 3.2 Test: Verify background prefetch of next question's answers
  - Verify background fetch starts post-confirmation, navigation uses cached answers instantly, wait state occurs if fetch isn't done, and silently retries on failure.
  - Test type: integration
  - _Depends: 2.3_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4_

- [x] 3.3 Test: Verify in-flight guard for quiz completion
  - Verify quiz completion triggers exactly once, keyboard shortcuts are ignored during completion, and loading indicators are displayed.
  - Test type: integration
  - _Depends: 2.2_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm duplicate submissions are blocked.
  - REQ-2: Confirm prefetching works silently and correctly.
  - REQ-3: Confirm completion is guarded.
  - _Implements: All requirements_
