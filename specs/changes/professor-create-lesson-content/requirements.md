# Requirements: Professor Lesson Content Authoring

Implement the initial lesson creation flow focusing on metadata and content within the `TabContent` component.

## REQ-001: Lesson Metadata Form
1.1 WHERE the professor is in the "Content" tab, the system SHALL display a form with Title and Description fields.
1.2 WHEN the professor enters a title, THEN it SHALL be validated for required input.
1.3 WHEN the professor enters a description, THEN it SHALL be validated for required input.

## REQ-002: Automated Field Population
2.1 WHEN a new lesson is saved, THEN the system SHALL set the `type` to 'LESSON'.
2.2 WHEN a new lesson is saved, THEN the system SHALL set the `xp` to 50.
2.3 WHEN a new lesson is saved, THEN the system SHALL calculate the `order` as the total count of lessons in the submodule plus one.
2.4 WHEN a new lesson is saved, THEN the system SHALL retrieve the `ownerId` from the current authenticated user session.

## REQ-003: Save and Redirect
3.1 WHEN the professor clicks "Salvar", THEN the system SHALL persist the lesson data to the database via `LessonService`.
3.2 IF the lesson is successfully saved, THEN the system SHALL redirect the professor to `/professor/editar-licao/:idLesson`.

## REQ-004: UI Tab Access Control
4.1 IF no `lessonId` is present in the current route, THEN the "Materiais Extra" and "Quiz" tabs SHALL be disabled.
4.2 IF a `lessonId` is present, THEN all tabs SHALL be enabled.

## REQ-005: Design Alignment
5.1 THE system SHALL adhere to the "Neon Terminal" design system using `Plus Jakarta Sans` for headers and `Inter` for body text.
5.2 THE system SHALL use `surface_container_low` for section backgrounds and avoid 1px solid borders.
5.3 THE system SHALL use primary gradient buttons for main actions.

## REQ-006: Accessibility
6.1 THE system SHALL ensure all form inputs have descriptive labels and proper ARIA roles.
6.2 THE system SHALL maintain color contrast ratios according to WCAG AA standards.
