# Implementation Tasks

## Overview

This implementation is organized into 6 phases:

1. **Database Foundation** - Extend relational schema and security rules
2. **Service & Model Support** - Add data structures and fetching logic
3. **Creator UI** - Professor interface for authoring and ordering presentation contents
4. **Student UI** - Immersive collapsible accordion for presentation delivery
5. **Acceptance Criteria Testing** - Multi-environment testing instructions
6. **Final Checkpoint** - Quality, spec completeness, and design compliance validation

**Estimated Effort**: Medium (3-5 sessions)

## Phase 1: Database Foundation

- [x] 1.1 Add database migration
  - Create standard SQL migration for `section_content` module relationship.
  - _Implements: DES-1_

- [x] 1.2 Apply migrations & security RLS policies
  - Apply the migration in the database and verify admin and teacher permission grants.
  - _Depends: 1.1_
  - _Implements: DES-1_

## Phase 2: Service & Model Support

- [x] 2.1 Update SectionContent model interface
  - Support nullable `module_id` inside TypeScript definitions.
  - _Implements: DES-2_

- [x] 2.2 Extend SectionContentService database logic
  - Support querying module sections and saving module presentations.
  - _Depends: 2.1_
  - _Implements: DES-2_

## Phase 3: Creator UI (Professor Interface)

- [x] 3.1 Setup CreateModule metadata and imports
  - Include DragDropModule and MarkdownModule in the module creator component.
  - _Implements: DES-3_

- [x] 3.2 Add state signals for presentation contents
  - Setup signals for holding current presentation contents and deleted section IDs.
  - _Depends: 3.1_
  - _Implements: DES-3_

- [x] 3.3 Add authoring and drag-and-drop actions
  - Implement adding, ordering, deleting, and visual uploading of images.
  - _Depends: 3.2_
  - _Implements: DES-3_

- [x] 3.4 Extend saving pipeline in CreateModule
  - Modify saveModule execution to upsert/delete the presentation content blocks.
  - _Depends: 3.3_
  - _Implements: DES-3_

- [x] 3.5 Create UI and Side-by-Side Visual Preview
  - Construct split-column drag-and-drop form and styled real-time preview panel in module html.
  - _Depends: 3.4_
  - _Implements: DES-3_

## Phase 4: Student UI (Collapsible Accordion)

- [x] 4.1 Load presentation contents in Submodule component
  - Call SectionContentService during loadData inside submodule.ts.
  - _Implements: DES-4_

- [x] 4.2 Build collapsible accordion template
  - Append the expandable visual presentation accordion between header description and submodules grid.
  - _Depends: 4.1_
  - _Implements: DES-4_

- [x] 4.3 Add support styling for rendering blocks
  - Append glassmorphic, visual glow, and iframe video container styling rules inside submodule.scss.
  - _Depends: 4.2_
  - _Implements: DES-4_

## Phase 5: Acceptance Criteria Testing

- [x] 5.1 Test: Verify database migration and RLS policies
  - Ensure authorized roles can manage module presentation contents while public users only read.
  - Test type: integration
  - _Depends: 1.2_
  - _Implements: REQ-1.1, REQ-1.2_

- [x] 5.2 Test: Verify creator authoring operations
  - Validate adding blocks, drag-and-drop ordering, deletion, and real-time preview updates in the creator screen.
  - Test type: e2e
  - _Depends: 3.5_
  - _Implements: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5, REQ-2.6_

- [x] 5.3 Test: Verify student accordion behavior
  - Validate that the accordion starts collapsed and expands to render all Markdown, Image, and Video blocks in order.
  - Test type: e2e
  - _Depends: 4.3_
  - _Implements: REQ-3.1, REQ-3.2, REQ-3.3_

## Phase 6: Final Checkpoint

- [x] 6.1 Verify overall requirements and spec completeness
  - Check full execution of the migration, service extensions, creator UI, student UI, and aesthetics.
  - Run all validation and lint checks to ensure strict standards compliance.
  - _Implements: All requirements_
