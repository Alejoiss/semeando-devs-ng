# Requirements

## Overview
This feature introduces "Extra Materials" attached to a lesson. A lesson can have an unlimited number of extra materials, which serve as supplementary resources for students. These resources can be external URLs or downloadable files. The system must support storing this metadata, handling file uploads for the FILE type, and presenting the extra materials as interactive tags on the lesson page.

## Assumptions
- A lesson is already modeled in the system and has an identifier.
- The Supabase storage bucket for files is already configured, or the FILE type implies storing a reference to a managed file/object.

## Requirements

### REQ-1: Display Extra Materials

**User Story:** As a student, I want to see the extra materials associated with a lesson, so that I can access supplementary study resources.

#### Acceptance Criteria
1.1 WHEN a user navigates to a lesson, THEN the application SHALL retrieve all extra materials linked to that lesson.
1.2 THE application SHALL display each extra material as a visual tag in the Resources Card section.

### REQ-2: File-based Extra Material Access

**User Story:** As a student, I want to click on a file-type extra material, so that I can download it.

#### Acceptance Criteria
2.1 WHEN a user clicks an extra material tag of type FILE, THEN the application SHALL trigger a download of the associated file.

### REQ-3: URL-based Extra Material Access

**User Story:** As a student, I want to click on a URL-type extra material, so that I can view it in a new browser tab.

#### Acceptance Criteria
3.1 WHEN a user clicks an extra material tag of type URL, THEN the application SHALL open the provided URL in a new browser tab.
