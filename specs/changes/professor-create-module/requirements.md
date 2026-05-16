# Requirements

## Overview

Teachers on the Semeando Devs platform need a dedicated interface to create and manage learning modules. Currently no creation flow exists for the `CreateModule` page, leaving teachers unable to author content independently. This feature provides a structured form with live preview, enabling teachers to define a module's identity (title, description, slug, and visual representation) and, after saving, manage its sub-modules in the same screen.

The scope covers: the module creation form, automatic slug generation, avatar/icon selection, a live module card preview, and a sub-module list panel that becomes visible once the module is persisted. An edit route (`/professor/editar-modulo/:id`) will share the same component for future reuse, but the edit behavior itself is out of scope for this iteration.

## Glossary

| Term | Definition |
|------|------------|
| Module | A top-level learning unit with a title, description, slug, and visual identity (avatar image or Material icon). |
| Sub-module | A child unit belonging to a Module, with its own title, icon/avatar, and ordering. |
| Slug | A URL-friendly, lowercase, hyphen-separated string auto-generated from the module title. |
| Avatar | An image file uploaded by the teacher to visually represent the module or sub-module. |
| Icon | A named Material Symbols icon chosen by the teacher as an alternative to an avatar image. |
| Teacher | An authenticated user with the teacher role who authors content on the platform. |
| Module Card | The visual card component used in the student-facing modules list, reused as a live preview. |

## Assumptions

- The authenticated teacher's user ID is available from the existing user service and must be stored as `created_by` on the module record.
- The `modules` table in Supabase already contains the columns `id`, `title`, `description`, `slug`, `avatar`, `icon`, `in_revision`, and `created_by`.
- Sub-module ordering is persisted server-side; the client sends the new order after drag-to-reorder.
- The sidebar navigation link to `/professor/criar-modulo` already exists and is functional; it does not need to be created.
- The sub-module creation page (`/professor/criar-submodulo`) does not need to be built in this iteration; only the navigation button pointing to it is required.
- Material Symbols icons are already loaded globally in the application.
- Avatar image files are stored in a Supabase Storage bucket. To prevent filename collisions between different teachers and modules, each uploaded file must be stored under a unique path.

## Requirements

### REQ-1: Module Creation Form

**User Story:** As a teacher, I want to fill in a form with my module's details so that I can create a new learning module on the platform.

#### Acceptance Criteria

1.1 WHEN the teacher navigates to `/professor/criar-modulo`, THEN the application SHALL display a two-column layout with the creation form on the left and a module card preview on the right.

1.2 THE application SHALL require the `title` field to be non-empty before allowing form submission.

1.3 THE application SHALL require the `description` field to be non-empty before allowing form submission.

1.4 IF the teacher submits the form while `title` or `description` is empty, THEN the application SHALL display inline validation error messages next to each invalid field.

---

### REQ-2: Automatic Slug Generation

**User Story:** As a teacher, I want the module slug to be automatically generated from the title so that I do not have to manually create a URL-safe identifier.

#### Acceptance Criteria

2.1 WHEN the teacher types in the `title` field, THEN the application SHALL automatically compute and display the `slug` field as a lowercase, hyphen-separated version of the title.

2.2 THE application SHALL render the `slug` field as read-only so that the teacher cannot manually edit it.

2.3 THE application SHALL strip accents, special characters, and leading/trailing hyphens from the generated slug.

---

### REQ-3: Avatar or Icon Selection

**User Story:** As a teacher, I want to choose between uploading an avatar image or entering a Material icon name so that I can give my module a recognizable visual identity.

#### Acceptance Criteria

3.1 THE application SHALL display a toggle that lets the teacher choose between "Image" and "Icon" modes.

3.2 WHILE the teacher has selected "Image" mode, the application SHALL display a file upload input that accepts image files.

3.3 WHILE the teacher has selected "Icon" mode, the application SHALL display a text input for the teacher to type a Material Symbols icon name.

3.4 WHILE the teacher has selected "Icon" mode, the application SHALL display a link to `https://fonts.google.com/icons` so that the teacher can browse available icon names.

3.5 IF neither an avatar image nor an icon name is provided at submission time, THEN the application SHALL display an error indicating that a visual identity is required.

3.6 WHEN the teacher uploads an avatar image, THEN the application SHALL store the file under a path that combines a unique identifier (such as a UUID) with the original filename so that files from different teachers or modules never overwrite each other.

---

### REQ-4: Live Module Card Preview

**User Story:** As a teacher, I want to see a real-time preview of how my module card will look so that I can evaluate the visual result before saving.

#### Acceptance Criteria

4.1 WHILE the teacher is filling in the form, the application SHALL update the module card preview in real time to reflect the current values of `title`, `description`, and visual identity (icon or avatar).

4.2 WHEN the teacher has selected "Icon" mode and typed an icon name, THEN the application SHALL render the corresponding Material Symbols icon inside the preview card.

4.3 WHEN the teacher has selected "Image" mode and chosen a file, THEN the application SHALL display a local preview of the uploaded image inside the preview card.

---

### REQ-5: Module Persistence

**User Story:** As a teacher, I want to save my module so that it is stored in the system and I can begin adding sub-modules to it.

#### Acceptance Criteria

5.1 WHEN the teacher clicks the save button and the form is valid, THEN the application SHALL create a module record in the database associated with the authenticated teacher's user ID.

5.2 WHEN the module is successfully saved, THEN the application SHALL display the sub-module management panel below the form.

5.3 IF the save operation fails, THEN the application SHALL display an error message describing the failure without clearing the form data.

5.4 WHILE the save operation is in progress, the application SHALL disable the save button and show a loading indicator.

---

### REQ-6: Edit Module Route

**User Story:** As a teacher, I want an edit route to be available so that I can revisit and update an existing module in the future.

#### Acceptance Criteria

6.1 THE application SHALL register the route `/professor/editar-modulo/:id` using the same `CreateModule` component.

6.2 THE application SHALL title the edit route "Editar Módulo - Semeando Devs".

---

### REQ-7: Sub-module List Panel

**User Story:** As a teacher, I want to see and manage the sub-modules belonging to a saved module so that I can organize the module's content.

#### Acceptance Criteria

7.1 WHILE no module has been saved in the current session, the application SHALL hide the sub-module panel.

7.2 WHEN the module has been saved, THEN the application SHALL display a sub-module panel below the form with a button to add a new sub-module.

7.3 WHEN the teacher clicks the "Add Sub-module" button, THEN the application SHALL navigate to the sub-module creation page (route to be implemented separately).

7.4 THE application SHALL display each sub-module as a full-width row card containing the sub-module's avatar or icon, its title, a drag handle on the left for reordering, and edit and delete action buttons on the right.

7.5 WHEN the teacher drags a sub-module row to a new position, THEN the application SHALL update the displayed order of sub-modules and persist the new ordering to the server.

7.6 WHEN the teacher clicks the delete button on a sub-module, THEN the application SHALL remove that sub-module from the list after receiving a successful deletion response from the server.
