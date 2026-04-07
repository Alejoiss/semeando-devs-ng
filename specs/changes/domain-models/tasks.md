# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Register Domain** — Create `User` and `Plan` models (DES-1)
2. **Class, Quiz & XP Domains** — Create all content, quiz, and XP models (DES-2, DES-3, DES-4)
3. **User Progress Domain** — Create all user-progress tracking models (DES-5)
4. **Acceptance Criteria Testing** — Verify every interface and enum shape
5. **Final Checkpoint** — Validate completeness and readiness

**Estimated Effort**: Small (1 session)

## Phase 1: Register Domain

- [x] 1.1 Create `Plan` model
  - Create `src/models/plan/plan.ts` exporting a `Plan` interface with fields `id`, `name`, `price`, `validUntil`, `discount`, `discountUntil`.
  - _Implements: DES-1, REQ-2.1, REQ-2.2_

- [x] 1.2 Create `User` model
  - Create `src/models/user/user.ts` exporting a `User` interface with fields `id`, `name`, `email`, `password`, `acceptedTerms`, `acceptedTermsAt`, `avatar`, `planId`.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-1.1, REQ-1.2_

## Phase 2: Class, Quiz & XP Domains

- [x] 2.1 Create `Module` model
  - Create `src/models/module/module.ts` exporting a `Module` interface with fields `id`, `title`, `description`, `avatar`, `icon`.
  - _Implements: DES-2, REQ-3.1, REQ-3.2_

- [x] 2.2 Create `SubModule` model
  - Create `src/models/sub-module/sub-module.ts` exporting a `SubModule` interface with fields `id`, `title`, `description`, `avatar`, `icon`, `moduleId`.
  - _Depends: 2.1_
  - _Implements: DES-2, REQ-4.1, REQ-4.2_

- [x] 2.3 Create `Lesson` model and `LessonType` enum
  - Create `src/models/lesson/lesson.ts` exporting a `LessonType` enum (`LESSON`, `CHALLENGE`) and a `Lesson` interface with fields `id`, `title`, `description`, `type`, `order`, `subModuleId`.
  - _Depends: 2.2_
  - _Implements: DES-2, REQ-5.1, REQ-5.2, REQ-5.3_

- [x] 2.4 Create `SectionContent` model and `SectionContentType` enum
  - Create `src/models/section-content/section-content.ts` exporting a `SectionContentType` enum (`TEXT`, `MARKDOWN`, `VIDEO`, `IMAGE`) and a `SectionContent` interface with fields `id`, `type`, `content`, `file`, `fileDescription`, `order`.
  - _Implements: DES-2, REQ-6.1, REQ-6.2, REQ-6.3_

- [x] 2.5 Create `ExtraMaterial` model and `ExtraMaterialType` enum
  - Create `src/models/extra-material/extra-material.ts` exporting an `ExtraMaterialType` enum (`URL`, `FILE`) and an `ExtraMaterial` interface with fields `id`, `title`, `type`, `url`, `file`, `lessonId`.
  - _Depends: 2.3_
  - _Implements: DES-2, REQ-7.1, REQ-7.2, REQ-7.3_

- [x] 2.6 Create `Quiz` model
  - Create `src/models/quiz/quiz.ts` exporting a `Quiz` interface with fields `id`, `xp`, `lessonId`, `spentTime`.
  - _Depends: 2.3_
  - _Implements: DES-3, REQ-8.1, REQ-8.2_

- [x] 2.7 Create `Question` model
  - Create `src/models/question/question.ts` exporting a `Question` interface with fields `id`, `question`, `questionMarkdown?`, `image?`, `quizId`.
  - _Depends: 2.6_
  - _Implements: DES-3, REQ-9.1, REQ-9.2_

- [x] 2.8 Create `Answer` model
  - Create `src/models/answer/answer.ts` exporting an `Answer` interface with fields `id`, `text`, `isCorrect`, `questionId`.
  - _Depends: 2.7_
  - _Implements: DES-3, REQ-10.1, REQ-10.2_

- [x] 2.9 Create `Xp` model
  - Create `src/models/xp/xp.ts` exporting an `Xp` interface with fields `id`, `userId`, `total`.
  - _Implements: DES-4, REQ-11.1, REQ-11.2_

- [x] 2.10 Create `XpLog` model and `XpLogType` enum
  - Create `src/models/xp-log/xp-log.ts` exporting an `XpLogType` enum (`LESSON`, `ACHIEVEMENT`, `PURCHASE_TIP`) and an `XpLog` interface with fields `id`, `userId`, `type`, `total`.
  - _Implements: DES-4, REQ-12.1, REQ-12.2, REQ-12.3_

- [x] 2.11 Create `XpWeek` model
  - Create `src/models/xp-week/xp-week.ts` exporting an `XpWeek` interface with fields `id`, `userId`, `year`, `week`, `total`.
  - _Implements: DES-4, REQ-13.1, REQ-13.2_

- [x] 2.12 Create `XpMonth` model
  - Create `src/models/xp-month/xp-month.ts` exporting an `XpMonth` interface with fields `id`, `userId`, `year`, `month`, `total`.
  - _Implements: DES-4, REQ-14.1, REQ-14.2_

## Phase 3: User Progress Domain

- [x] 3.1 Create `UserModule` model
  - Create `src/models/user-module/user-module.ts` exporting a `UserModule` interface with fields `id`, `userId`, `moduleId`, `completed`, `completedAt`.
  - _Implements: DES-5, REQ-15.1, REQ-15.2_

- [x] 3.2 Create `UserSubModule` model
  - Create `src/models/user-sub-module/user-sub-module.ts` exporting a `UserSubModule` interface with fields `id`, `userId`, `subModuleId`, `completed`, `completedAt`.
  - _Implements: DES-5, REQ-16.1, REQ-16.2_

- [x] 3.3 Create `UserLesson` model
  - Create `src/models/user-lesson/user-lesson.ts` exporting a `UserLesson` interface with fields `id`, `userId`, `lessonId`, `completed`, `completedAt`.
  - _Implements: DES-5, REQ-17.1, REQ-17.2_

- [x] 3.4 Create `UserQuiz` model
  - Create `src/models/user-quiz/user-quiz.ts` exporting a `UserQuiz` interface with fields `id`, `userId`, `quizId`, `startedAt`, `completed`, `completedAt`, `score`.
  - _Implements: DES-5, REQ-18.1, REQ-18.2_

- [x] 3.5 Create `UserQuestion` model
  - Create `src/models/user-question/user-question.ts` exporting a `UserQuestion` interface with fields `id`, `userId`, `answerId`, `isCorrect`, `answeredAt`.
  - _Implements: DES-5, REQ-19.1, REQ-19.2_

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: `User` interface shape
  - Verify `User` exports `id: string`, `planId: string`, `acceptedTerms: boolean`, `acceptedTermsAt: Date`, and all other string fields. Confirm TypeScript compiles without errors.
  - Test type: unit
  - _Implements: REQ-1.1, REQ-1.2_

- [x] 4.2 Test: `Plan` interface shape and date fields
  - Verify `Plan` exports `id: string`, `price: number`, `discount: number`, `validUntil: Date`, `discountUntil: Date`. Confirm TypeScript compiles.
  - Test type: unit
  - _Implements: REQ-2.1, REQ-2.2_

- [x] 4.3 Test: `Module` and `SubModule` interface shapes
  - Verify `Module` has all five fields as `string`. Verify `SubModule` adds `moduleId: string` as a FK.
  - Test type: unit
  - _Implements: REQ-3.1, REQ-3.2, REQ-4.1, REQ-4.2_

- [x] 4.4 Test: `Lesson` interface and `LessonType` enum
  - Verify `LessonType` has exactly two members `LESSON` and `CHALLENGE`. Verify `Lesson.type` is typed as `LessonType`. Confirm TypeScript compiles.
  - Test type: unit
  - _Implements: REQ-5.1, REQ-5.2, REQ-5.3_

- [x] 4.5 Test: `SectionContent` interface and `SectionContentType` enum
  - Verify `SectionContentType` has members `TEXT`, `MARKDOWN`, `VIDEO`, `IMAGE`. Verify all field types on `SectionContent`.
  - Test type: unit
  - _Implements: REQ-6.1, REQ-6.2, REQ-6.3_

- [x] 4.6 Test: `ExtraMaterial` interface and `ExtraMaterialType` enum
  - Verify `ExtraMaterialType` has members `URL` and `FILE`. Verify all field types including `lessonId: string`.
  - Test type: unit
  - _Implements: REQ-7.1, REQ-7.2, REQ-7.3_

- [x] 4.7 Test: `Quiz` interface shape
  - Verify `Quiz` exports `id: string`, `lessonId: string`, `xp: number`, `spentTime: number`.
  - Test type: unit
  - _Implements: REQ-8.1, REQ-8.2_

- [x] 4.8 Test: `Question` interface with optional fields
  - Verify `Question` has `id: string`, `quizId: string`, `question: string`, and optional `questionMarkdown?: string` and `image?: string`.
  - Test type: unit
  - _Implements: REQ-9.1, REQ-9.2_

- [x] 4.9 Test: `Answer` interface shape
  - Verify `Answer` exports `id: string`, `questionId: string`, `isCorrect: boolean`, `text: string`.
  - Test type: unit
  - _Implements: REQ-10.1, REQ-10.2_

- [x] 4.10 Test: `Xp` interface shape
  - Verify `Xp` exports `id: string`, `userId: string`, `total: number`.
  - Test type: unit
  - _Implements: REQ-11.1, REQ-11.2_

- [x] 4.11 Test: `XpLog` interface and `XpLogType` enum
  - Verify `XpLogType` has members `LESSON`, `ACHIEVEMENT`, `PURCHASE_TIP`. Verify `XpLog.type` is typed as `XpLogType`.
  - Test type: unit
  - _Implements: REQ-12.1, REQ-12.2, REQ-12.3_

- [x] 4.12 Test: `XpWeek` interface shape
  - Verify `XpWeek` exports `id: string`, `userId: string`, `year: number`, `week: number`, `total: number`.
  - Test type: unit
  - _Implements: REQ-13.1, REQ-13.2_

- [x] 4.13 Test: `XpMonth` interface shape
  - Verify `XpMonth` exports `id: string`, `userId: string`, `year: number`, `month: number`, `total: number`.
  - Test type: unit
  - _Implements: REQ-14.1, REQ-14.2_

- [x] 4.14 Test: `UserModule` interface shape
  - Verify `UserModule` exports `id: string`, `userId: string`, `moduleId: string`, `completed: boolean`, `completedAt: Date`.
  - Test type: unit
  - _Implements: REQ-15.1, REQ-15.2_

- [x] 4.15 Test: `UserSubModule` interface shape
  - Verify `UserSubModule` exports `id: string`, `userId: string`, `subModuleId: string`, `completed: boolean`, `completedAt: Date`.
  - Test type: unit
  - _Implements: REQ-16.1, REQ-16.2_

- [x] 4.16 Test: `UserLesson` interface shape
  - Verify `UserLesson` exports `id: string`, `userId: string`, `lessonId: string`, `completed: boolean`, `completedAt: Date`.
  - Test type: unit
  - _Implements: REQ-17.1, REQ-17.2_

- [x] 4.17 Test: `UserQuiz` interface shape and date fields
  - Verify `UserQuiz` exports `id: string`, `userId: string`, `quizId: string`, `startedAt: Date`, `completed: boolean`, `completedAt: Date`, `score: number`.
  - Test type: unit
  - _Implements: REQ-18.1, REQ-18.2_

- [x] 4.18 Test: `UserQuestion` interface shape
  - Verify `UserQuestion` exports `id: string`, `userId: string`, `answerId: string`, `isCorrect: boolean`, `answeredAt: Date`.
  - Test type: unit
  - _Implements: REQ-19.1, REQ-19.2_

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1 → REQ-19: Confirm all 19 model files exist under `src/models/`, each interface compiles cleanly, all enums have the correct members, all FK fields are `string`, all date fields are `Date`, and no file imports Angular or RxJS.
  - Run `ng build` (or `tsc --noEmit`) and confirm zero type errors.
  - _Implements: All requirements_
