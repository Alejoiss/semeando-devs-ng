# Requirements

## Overview
Currently, the learning progress of a submodule is hardcoded to 50% when it is in the 'in-progress' state. The system needs to dynamically calculate and display the actual progress based on the total number of lessons in the submodule and the number of lessons the user has completed. The display for 'completed' and 'not-started' states already functions correctly but is explicitly documented here for completeness.

## Requirements

### REQ-1: Calculate Dynamic Submodule Progress

**User Story:** As a user, I want to see my actual progress percentage when a submodule is in progress, so that I accurately know how much of the submodule I have completed.

#### Acceptance Criteria
1.1 WHILE a submodule is 'in-progress', the system SHALL display a progress percentage calculated from the number of completed lessons divided by the total number of lessons in the submodule.
1.2 WHILE a submodule is 'completed', the system SHALL display the progress percentage as 100%.
1.3 WHILE a submodule is 'not-started', the system SHALL display the progress percentage as 0%.
