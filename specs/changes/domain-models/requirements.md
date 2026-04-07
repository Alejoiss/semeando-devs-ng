# Requirements

## Overview

The Semeando Devs application requires a set of TypeScript domain models that serve as a shared contract between services, components, and other models. These models are derived from the application's entity-relationship diagram (ERD) and must accurately represent the data structures used throughout the front-end codebase.

Currently, the `src/models` directory exists but contains no model definitions, meaning services and components lack a typed, consistent reference layer. This creates a risk of duplicated ad-hoc interfaces, incorrect property naming, and type mismatches between layers.

The scope of this feature is limited to defining TypeScript model files (plain interfaces and supporting enums/types) under `src/models/<entity>/<entity>.ts`. No service logic, API calls, or UI components are included.

## Glossary

| Term | Definition |
|------|------------|
| Model | A TypeScript `interface` (or `type`) that describes the shape of a domain entity exchanged between front-end layers. |
| Foreign Key | A reference field that holds the `number` ID of a related entity (not the nested object itself). |
| Enum/Union Type | A TypeScript `type` literal union used to represent fields with a fixed set of string values. |
| ERD | Entity-Relationship Diagram exported from LucidChart that defines entities, fields, data types, and relationships. |
| XP | Experience points earned by a user through lessons, achievements, and purchases. |
| UserProgress | Any of the junction/tracking entities that record a user's interaction with a learning entity (e.g., `UserLesson`, `UserModule`). |

## Assumptions

- Foreign key fields in the ERD translate to `string` typed ID fields in TypeScript (e.g., `userId: string`).
- Fields typed `file` in the ERD represent uploaded file URLs stored as `string` on the front-end.
- Fields typed `pk` are always named `id` and typed `string`.
- Fields typed `decimal` in the ERD translate to `number` in TypeScript.
- Fields typed `text` in the ERD translate to `string` in TypeScript.
- `datetime` fields translate to `Date` in TypeScript.
- `date` fields also translate to `Date` in TypeScript.
- String fields with a fixed set of values (noted in parentheses in the ERD) are represented as TypeScript `enum` types, exported from the same model file.
- The `Quiz_SectionContent` and `Lesson_SectionContent` pivot entities represent many-to-many join tables and do not require dedicated model files.
- Each model lives in its own subfolder: `src/models/<entityName>/<entityName>.ts`, using `kebab-case` for the folder and filename (e.g., `src/models/user/user.ts`).
- Model interfaces are exported as named exports using `PascalCase`.

## Requirements

### REQ-1: User Model

**User Story:** As a developer, I want a `User` model interface, so that I can type user data consistently across services and components.

#### Acceptance Criteria

1.1 THE application SHALL export a `User` interface from `src/models/user/user.ts` containing the fields: `id`, `name`, `email`, `password`, `acceptedTerms`, `acceptedTermsAt`, `avatar`, and `planId`.
1.2 WHEN a `User` interface is defined, THEN the application SHALL type `id` as `string`, `name` as `string`, `email` as `string`, `password` as `string`, `acceptedTerms` as `boolean`, `acceptedTermsAt` as `Date`, `avatar` as `string`, and `planId` as `string`.

---

### REQ-2: Plan Model

**User Story:** As a developer, I want a `Plan` model interface, so that I can represent subscription plan data across the application.

#### Acceptance Criteria

2.1 THE application SHALL export a `Plan` interface from `src/models/plan/plan.ts` containing the fields: `id`, `name`, `price`, `validUntil`, `discount`, and `discountUntil`.
2.2 WHEN a `Plan` interface is defined, THEN the application SHALL type `id` as `string`, `price` and `discount` as `number`, `discountUntil` as `Date`, and `validUntil` as `Date`.

---

### REQ-3: Module Model

**User Story:** As a developer, I want a `Module` model interface, so that I can type learning module data when fetching and displaying modules.

#### Acceptance Criteria

3.1 THE application SHALL export a `Module` interface from `src/models/module/module.ts` containing the fields: `id`, `title`, `description`, `avatar`, and `icon`.
3.2 WHEN a `Module` interface is defined, THEN the application SHALL type `avatar` as `string` representing a file URL.

---

### REQ-4: SubModule Model

**User Story:** As a developer, I want a `SubModule` model interface, so that I can type sub-module data and its relationship to a parent module.

#### Acceptance Criteria

4.1 THE application SHALL export a `SubModule` interface from `src/models/sub-module/sub-module.ts` containing the fields: `id`, `title`, `description`, `avatar`, `icon`, and `moduleId`.
4.2 WHEN a `SubModule` interface is defined, THEN the application SHALL type `moduleId` as `string` representing a foreign key to `Module`.

---

### REQ-5: Lesson Model

**User Story:** As a developer, I want a `Lesson` model interface, so that I can type lesson data including its type and ordering within a sub-module.

#### Acceptance Criteria

5.1 THE application SHALL export a `Lesson` interface and a `LessonType` enum from `src/models/lesson/lesson.ts`.
5.2 WHEN a `Lesson` interface is defined, THEN the application SHALL include fields: `id` as `string`, `title` as `string`, `description` as `string`, `type` as `LessonType`, `order` as `number`, and `subModuleId` as `string`.
5.3 THE application SHALL define a `LessonType` enum with members `LESSON` and `CHALLENGE`.

---

### REQ-6: SectionContent Model

**User Story:** As a developer, I want a `SectionContent` model interface, so that I can type the varied content blocks (text, video, image) within a lesson.

#### Acceptance Criteria

6.1 THE application SHALL export a `SectionContent` interface and a `SectionContentType` enum from `src/models/section-content/section-content.ts`.
6.2 WHEN a `SectionContent` interface is defined, THEN the application SHALL include fields: `id` as `string`, `type` as `SectionContentType`, `content` as `string`, `file` as `string`, `fileDescription` as `string`, and `order` as `number`.
6.3 THE application SHALL define a `SectionContentType` enum with members `TEXT`, `MARKDOWN`, `VIDEO`, and `IMAGE`.

---

### REQ-7: ExtraMaterial Model

**User Story:** As a developer, I want an `ExtraMaterial` model interface, so that I can type supplementary resources linked to a lesson.

#### Acceptance Criteria

7.1 THE application SHALL export an `ExtraMaterial` interface and an `ExtraMaterialType` enum from `src/models/extra-material/extra-material.ts`.
7.2 WHEN an `ExtraMaterial` interface is defined, THEN the application SHALL include fields: `id` as `string`, `title` as `string`, `type` as `ExtraMaterialType`, `url` as `string`, `file` as `string`, and `lessonId` as `string`.
7.3 THE application SHALL define an `ExtraMaterialType` enum with members `URL` and `FILE`.

---

### REQ-8: Quiz Model

**User Story:** As a developer, I want a `Quiz` model interface, so that I can type quiz data associated with a lesson.

#### Acceptance Criteria

8.1 THE application SHALL export a `Quiz` interface from `src/models/quiz/quiz.ts` containing the fields: `id`, `xp`, `lessonId`, and `spentTime`.
8.2 WHEN a `Quiz` interface is defined, THEN the application SHALL type `id` as `string`, `lessonId` as `string`, `xp` as `number`, and `spentTime` as `number`.

---

### REQ-9: Question Model

**User Story:** As a developer, I want a `Question` model interface, so that I can type quiz question data including optional image attachments.

#### Acceptance Criteria

9.1 THE application SHALL export a `Question` interface from `src/models/question/question.ts` containing the fields: `id`, `question`, `questionMarkdown`, `image`, and `quizId`.
9.2 WHEN a `Question` interface is defined, THEN the application SHALL type `id` and `quizId` as `string`, `question` as `string`, and mark `questionMarkdown` as `string | undefined` and `image` as `string | undefined`.

---

### REQ-10: Answer Model

**User Story:** As a developer, I want an `Answer` model interface, so that I can type answer options for quiz questions.

#### Acceptance Criteria

10.1 THE application SHALL export an `Answer` interface from `src/models/answer/answer.ts` containing the fields: `id`, `text`, `isCorrect`, and `questionId`.
10.2 WHEN an `Answer` interface is defined, THEN the application SHALL type `id` and `questionId` as `string` and `isCorrect` as `boolean`.

---

### REQ-11: Xp Model

**User Story:** As a developer, I want an `Xp` model interface, so that I can type a user's total accumulated experience points.

#### Acceptance Criteria

11.1 THE application SHALL export an `Xp` interface from `src/models/xp/xp.ts` containing the fields: `id`, `userId`, and `total`.
11.2 WHEN an `Xp` interface is defined, THEN the application SHALL type `id` and `userId` as `string` and `total` as `number`.

---

### REQ-12: XpLog Model

**User Story:** As a developer, I want an `XpLog` model interface, so that I can type individual XP gain events with their source type.

#### Acceptance Criteria

12.1 THE application SHALL export an `XpLog` interface and an `XpLogType` enum from `src/models/xp-log/xp-log.ts`.
12.2 WHEN an `XpLog` interface is defined, THEN the application SHALL include fields: `id` as `string`, `userId` as `string`, `type` as `XpLogType`, and `total` as `number`.
12.3 THE application SHALL define an `XpLogType` enum with members `LESSON`, `ACHIEVEMENT`, and `PURCHASE_TIP`.

---

### REQ-13: XpWeek Model

**User Story:** As a developer, I want an `XpWeek` model interface, so that I can type weekly XP aggregation data for a user.

#### Acceptance Criteria

13.1 THE application SHALL export an `XpWeek` interface from `src/models/xp-week/xp-week.ts` containing the fields: `id`, `userId`, `year`, `week`, and `total`.
13.2 WHEN an `XpWeek` interface is defined, THEN the application SHALL type `id` and `userId` as `string` and `year`, `week`, `total` as `number`.

---

### REQ-14: XpMonth Model

**User Story:** As a developer, I want an `XpMonth` model interface, so that I can type monthly XP aggregation data for a user.

#### Acceptance Criteria

14.1 THE application SHALL export an `XpMonth` interface from `src/models/xp-month/xp-month.ts` containing the fields: `id`, `userId`, `year`, `month`, and `total`.
14.2 WHEN an `XpMonth` interface is defined, THEN the application SHALL type `id` and `userId` as `string` and `year`, `month`, `total` as `number`.

---

### REQ-15: UserModule Model

**User Story:** As a developer, I want a `UserModule` model interface, so that I can type a user's progress and completion state for a module.

#### Acceptance Criteria

15.1 THE application SHALL export a `UserModule` interface from `src/models/user-module/user-module.ts` containing the fields: `id`, `userId`, `moduleId`, `completed`, and `completedAt`.
15.2 WHEN a `UserModule` interface is defined, THEN the application SHALL type `id`, `userId`, and `moduleId` as `string`, `completed` as `boolean`, and `completedAt` as `Date`.

---

### REQ-16: UserSubModule Model

**User Story:** As a developer, I want a `UserSubModule` model interface, so that I can type a user's progress and completion state for a sub-module.

#### Acceptance Criteria

16.1 THE application SHALL export a `UserSubModule` interface from `src/models/user-sub-module/user-sub-module.ts` containing the fields: `id`, `userId`, `subModuleId`, `completed`, and `completedAt`.
16.2 WHEN a `UserSubModule` interface is defined, THEN the application SHALL type `id`, `userId`, and `subModuleId` as `string`, `completed` as `boolean`, and `completedAt` as `Date`.

---

### REQ-17: UserLesson Model

**User Story:** As a developer, I want a `UserLesson` model interface, so that I can type a user's completion state for an individual lesson.

#### Acceptance Criteria

17.1 THE application SHALL export a `UserLesson` interface from `src/models/user-lesson/user-lesson.ts` containing the fields: `id`, `userId`, `lessonId`, `completed`, and `completedAt`.
17.2 WHEN a `UserLesson` interface is defined, THEN the application SHALL type `id`, `userId`, and `lessonId` as `string`, `completed` as `boolean`, and `completedAt` as `Date`.

---

### REQ-18: UserQuiz Model

**User Story:** As a developer, I want a `UserQuiz` model interface, so that I can type a user's quiz attempt including its completion state and score.

#### Acceptance Criteria

18.1 THE application SHALL export a `UserQuiz` interface from `src/models/user-quiz/user-quiz.ts` containing the fields: `id`, `userId`, `quizId`, `startedAt`, `completed`, `completedAt`, and `score`.
18.2 WHEN a `UserQuiz` interface is defined, THEN the application SHALL type `id`, `userId`, and `quizId` as `string`, `startedAt` and `completedAt` as `Date`, `completed` as `boolean`, and `score` as `number`.

---

### REQ-19: UserQuestion Model

**User Story:** As a developer, I want a `UserQuestion` model interface, so that I can type a user's individual answer to a quiz question.

#### Acceptance Criteria

19.1 THE application SHALL export a `UserQuestion` interface from `src/models/user-question/user-question.ts` containing the fields: `id`, `userId`, `answerId`, `isCorrect`, and `answeredAt`.
19.2 WHEN a `UserQuestion` interface is defined, THEN the application SHALL type `id`, `userId`, and `answerId` as `string`, `isCorrect` as `boolean`, and `answeredAt` as `Date`.
