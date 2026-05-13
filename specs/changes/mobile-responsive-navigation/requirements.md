# Requirements

## Overview
The application currently lacks proper responsiveness for the main navigation and sidebar on mobile devices. This change aims to implement a mobile-first navigation strategy where the sidebar is hidden on small screens and accessible via a hamburger menu in the top header. Additionally, the user's XP and Seeds stats must remain visible in the header across all screen sizes, with a compact layout for mobile.

## Glossary
| Term | Definition |
|------|------------|
| aside-menu | The sidebar navigation component. |
| internal-header | The top navigation bar component. |
| XP | Experience points earned by the user. |
| Seeds | Virtual currency/points earned by the user. |

## Assumptions
- Tailwind CSS's default breakpoints (specifically `md` for 768px) will be used to define "small screens".
- The sidebar will behave as an overlay when opened on small screens.
- The user is already logged in when viewing these components.

## Requirements

### REQ-1: Mobile Sidebar Toggle

**User Story:** As a mobile user, I want to access the sidebar menu via a hamburger icon in the header, so that I can navigate the application on smaller screens.

#### Acceptance Criteria
1.1 WHILE the screen width is below the `md` breakpoint, THE application SHALL hide the `aside-menu` by default.
1.2 WHILE the screen width is below the `md` breakpoint, THE `internal-header` SHALL display a hamburger menu icon.
1.3 WHEN the hamburger menu icon is clicked, THEN the application SHALL display the `aside-menu` as an overlay.
1.4 WHEN an item inside the `aside-menu` is selected OR the user clicks outside the menu, THEN the application SHALL hide the `aside-menu`.

### REQ-2: Persistent User Stats in Header

**User Story:** As a user, I want to see my XP and Seeds total in the top header regardless of my device, so that I can track my progress.

#### Acceptance Criteria
2.1 THE `internal-header` SHALL display the total XP and total Seeds on all screen sizes.
2.2 WHERE the screen width is below the `md` breakpoint, THE `internal-header` SHALL display a compact layout for XP and Seeds (icons and numeric values only).
