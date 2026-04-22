# Requirements

## Overview
This feature updates the redirection logic triggered when a user completes a quiz and clicks the "Continue" button. It handles different scenarios depending on whether the user passed or failed the quiz, and based on their overall progress within the current submodule and module. A loading state is also required while the quiz completion is being processed by the backend.

## Requirements

### REQ-1: Unsuccessful Quiz Redirection

**User Story:** As a User, I want to retry the current lesson when I fail a quiz, so that I can review the material and try again.

#### Acceptance Criteria
1.1 WHEN the user fails the quiz and clicks continue, THEN the application SHALL redirect the user to the current lesson view.

### REQ-2: Quiz Completion Processing State

**User Story:** As a User, I want to see a loading state while my successful quiz result is being processed, so that I know the system is working and I cannot submit the request multiple times.

#### Acceptance Criteria
2.1 WHEN the user passes the quiz and clicks continue, THEN the application SHALL display a loading indicator on the continue button.
2.2 WHILE the complete quiz API request is in progress, the application SHALL disable the continue button.

### REQ-3: Successful Quiz Redirections

**User Story:** As a User, I want to be redirected to the appropriate next step based on my progress, so that I can seamlessly continue my learning journey.

#### Acceptance Criteria
3.1 WHEN the API response indicates the submodule is not completed, THEN the application SHALL redirect the user to the current submodule details view.
3.2 WHEN the API response indicates the submodule is completed but the module is not completed, THEN the application SHALL redirect the user to the submodule selection view.
3.3 WHEN the API response indicates the module is completed, THEN the application SHALL redirect the user to the module completion view.
