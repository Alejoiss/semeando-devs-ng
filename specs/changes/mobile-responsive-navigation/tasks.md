# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** - Prepare the shared state management for navigation.
2. **Header Enhancement** - Add mobile-specific UI elements and persistent stats to the header.
3. **Sidebar Responsiveness** - Implement the overlay behavior and transitions for the sidebar.
4. **Acceptance Criteria Testing** - Verify that the navigation works correctly on all screen sizes.
5. **Final Checkpoint** - Validate completeness and readiness.

**Estimated Effort**: Medium (2-3 sessions)

## Phase 1: Foundation

- [x] 1.1 Create NavigationService
  - Implement a singleton service with a Signal `isSidebarOpen` and methods `toggleSidebar()` and `closeSidebar()`.
  - _Implements: DES-1_

## Phase 2: Header Enhancement

- [x] 2.1 Add hamburger toggle to InternalHeader
  - Update `InternalHeader` component to inject `NavigationService` and include a hamburger icon button visible only on mobile screens.
  - _Implements: DES-2, REQ-1.2_

- [x] 2.2 Refactor User Stats for mobile persistence
  - Update the XP and Seeds display in `InternalHeader` to be visible on all screen sizes, utilizing a compact layout (icons and values only) for mobile.
  - _Implements: DES-2, REQ-2.1, REQ-2.2_

## Phase 3: Sidebar Responsiveness

- [x] 3.1 Update AsideMenu for mobile overlay
  - Modify `AsideMenu` to react to `NavigationService.isSidebarOpen()` and apply Tailwind transition classes for sliding in/out on mobile.
  - _Implements: DES-2, REQ-1.1, REQ-1.3_

- [x] 3.2 Implement auto-close and backdrop behavior
  - Ensure the sidebar closes when a navigation item is clicked or when the user clicks outside the menu area on mobile.
  - _Implements: DES-2, REQ-1.4_

## Phase 4: Acceptance Criteria Testing

- [~] 4.1 Test: Sidebar toggle and overlay behavior on mobile
  - Verify the hamburger menu correctly opens the sidebar and that it can be closed by selecting an item or clicking outside.
  - Test type: integration
  - _Implements: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4_

- [ ] 4.2 Test: User stats persistent visibility
  - Verify that XP and Seeds totals are visible and correctly formatted on both mobile and desktop views.
  - Test type: integration
  - _Implements: REQ-2.1, REQ-2.2_

## Phase 4: Final Checkpoint

- [ ] 5.1 Verify all acceptance criteria
  - REQ-1: Confirm sidebar is toggleable and responsive on mobile devices.
  - REQ-2: Confirm user stats remain visible across all breakpoints.
  - _Implements: All requirements_
