# Requirements

## Overview
This feature introduces the display mechanism for lesson content within the application. When a user enters a lesson, the system displays the lesson's title, description, and experience points (XP). Below this header, the system dynamically loads and displays a sequence of content sections (text, markdown, images, or videos) in their defined order, providing a rich, multimedia learning experience.

## Assumptions
- Only content of type `LESSON` is actively processed at this time, though the system architecture anticipates other types.
- The `section_contents` entity has fields for type, content data (URL or text), and order.
- The `ngx-markdown` component is available in the application for rendering markdown content.

## Requirements

### REQ-1: Lesson Header Display

**User Story:** As a learner, I want to see the title, description, and XP of the lesson, so that I know what I will learn and what the reward is.

#### Acceptance Criteria
1.1 WHEN the user accesses a lesson, THEN the application SHALL display the lesson title.
1.2 WHEN the user accesses a lesson, THEN the application SHALL display the lesson description.
1.3 WHEN the user accesses a lesson, THEN the application SHALL display the lesson XP value on the right side of the header.

### REQ-2: Content Section Fetching

**User Story:** As a learner, I want the lesson content to be loaded, so that I can read and interact with the study materials.

#### Acceptance Criteria
2.1 WHEN a lesson is loaded, THEN the application SHALL fetch all associated section contents using a dedicated service.
2.2 THE application SHALL order the fetched section contents ascending by their order field.

### REQ-3: Content Type Rendering

**User Story:** As a learner, I want the content to be displayed in its correct format (text, image, video, markdown), so that I can consume the multimedia lesson properly.

#### Acceptance Criteria
3.1 IF the section content type is TEXT, THEN the application SHALL display the content as standard text.
3.2 IF the section content type is MARKDOWN, THEN the application SHALL render the content using the markdown renderer.
3.3 IF the section content type is IMAGE, THEN the application SHALL display the image with 100% width of its container.
3.4 IF the section content type is VIDEO, THEN the application SHALL display the video with 100% width of its container.
3.5 WHERE the lesson type is not LESSON, the application SHALL ignore or handle the type conditionally for future implementation.
