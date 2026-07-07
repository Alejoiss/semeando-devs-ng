# Implementation Tasks

## Overview

This implementation is organized into 5 phases:

1. **Foundation** — Create the `DailyLimitService` and its core signals
2. **Route Protection** — Implement the `dailyLimitGuard` and wire it into the router
3. **Feature Delivery** — Update components to remove legacy blocking and integrate daily limit state
4. **Acceptance Criteria Testing** — Verify all requirement behaviors
5. **Final Checkpoint** — Validate completeness and readiness

**Estimated Effort**: Medium (3-5 sessions)

---

## Phase 1: Foundation

- [x] 1.1 Create `DailyLimitService` with daily count query
  - Generate the service with `ng g s app/services/daily-limit/daily-limit`.
  - Implement `loadDailyCount(userId: string): Promise<void>` that queries `user_lessons` filtering by `user_id`, `completed = true`, and `completed_at` within the current calendar day in UTC-3.
  - Expose `dailyCompletedCount = signal<number>(0)`.
  - Define `DAILY_LIMIT = 5` as a constant.
  - _Implements: DES-1, REQ-2.1, REQ-4.1_

- [x] 1.2 Add computed signals to `DailyLimitService`
  - Add `isDailyLimitReached = computed(() => this.dailyCompletedCount() >= DAILY_LIMIT)`.
  - Add `dailyIndicators = computed(() => Array.from({ length: DAILY_LIMIT }, (_, i) => i < this.dailyCompletedCount()))`.
  - _Depends: 1.1_
  - _Implements: DES-1, REQ-5.1, REQ-5.2_

- [x] 1.3 Add `isLessonAccessible(lessonId: string): Promise<boolean>` to `DailyLimitService`
  - Returns `true` if: (a) the current user is Pró, OR (b) the lesson is already completed by the user (regardless of date), OR (c) the daily limit has not been reached.
  - Returns `false` only when the user is free, the limit is reached, and the lesson is not already completed.
  - _Depends: 1.1_
  - _Implements: DES-1, DES-2, REQ-2.2, REQ-2.3, REQ-3.4, REQ-6.1_

---

## Phase 2: Route Protection

- [x] 2.1 Create `dailyLimitGuard` functional guard
  - Generate the guard file at `src/app/components/guards/daily-limit.guard.ts`.
  - Inject `UserService` and `DailyLimitService`.
  - Extract `lessonId` from `route.paramMap`.
  - If `isPro` → return `true`.
  - Call `DailyLimitService.isLessonAccessible(lessonId)`.
  - If accessible → return `true`.
  - If blocked → redirect to the current lesson URL with query param `?bloqueado=1` and return `false`.
  - On any error, log and return `true` (fail-open).
  - _Depends: 1.3_
  - _Implements: DES-2, REQ-3.2, REQ-3.3_

- [x] 2.2 Register `dailyLimitGuard` on lesson, quiz, and challenge routes in `app.routes.ts`
  - Add `canActivate: [dailyLimitGuard]` to the three routes:
    - `s/:slug/ss/:slugSubmodule/lesson/:lessonId`
    - `s/:slug/ss/:slugSubmodule/lesson/:lessonId/quiz`
    - `s/:slug/ss/:slugSubmodule/lesson/:lessonId/challenge`
  - _Depends: 2.1_
  - _Implements: DES-2, REQ-3.2, REQ-3.3_

---

## Phase 3: Feature Delivery

- [x] 3.1 Remove submodule order blocking from `submodule.ts`
  - Delete the conditional `if ((sm.order ?? 0) > 1 && !isPro) { state = 'blocked'; }` from the `loadData` method.
  - Verify that the remaining sequential-progress logic (blocked when previous submodule is not completed) is preserved.
  - _Implements: DES-3, REQ-1.1_

- [x] 3.2 Integrate `DailyLimitService` into `SubmoduleDetail` computed state
  - Inject `DailyLimitService` and `UserService` in `submodule-detail.ts`.
  - Call `DailyLimitService.loadDailyCount(userId)` inside `loadData()` for free users.
  - In the `lessonsWithState` computed signal, after determining `not-started`/`in-progress`, mark the lesson as `'blocked'` when `isDailyLimitReached()` is `true` and the lesson is not already `completed`.
  - _Depends: 1.2_
  - _Implements: DES-4, REQ-1.2, REQ-3.1, REQ-3.4_

- [x] 3.3 Update `submodule-detail.html` to render daily-limit blocked state
  - For lessons in the `blocked` state due to daily limit (distinct from sequential blocking), render an upgrade CTA button instead of the start button.
  - Display the message: "Você atingiu o limite máximo de lições diárias no plano gratuito. Faça o upgrade para o plano Pró ou volte amanhã." within the blocked lesson card.
  - _Depends: 3.2_
  - _Implements: DES-4, REQ-3.1_

- [x] 3.4 Update `lesson.ts` to detect and expose the blocked query param
  - Add a signal `isDailyBlocked = signal<boolean>(false)`.
  - In `ngOnInit`, read `route.queryParamMap` and set `isDailyBlocked` to `true` when `bloqueado === '1'`.
  - When `isDailyBlocked()` is `true`, skip the content-loading logic and set `isLoading` to `false` immediately.
  - _Depends: 2.1_
  - _Implements: DES-4, REQ-3.1, REQ-3.2_

- [x] 3.5 Update `lesson.html` to render the daily-limit blocked screen
  - Add an `@if (isDailyBlocked())` block at the top of the template.
  - Render the blocking message "Você atingiu o limite máximo de lições diárias no plano gratuito. Faça o upgrade para o plano Pró ou volte amanhã." and an upgrade CTA button (`routerLink="/app/upgrade"`).
  - When `isDailyBlocked()` is `true`, do not render the lesson content.
  - _Depends: 3.4_
  - _Implements: DES-4, REQ-3.1, REQ-3.2_

- [x] 3.6 Update `AsideMenu` to inject `DailyLimitService` and load daily count
  - Inject `DailyLimitService` and `UserService` in `aside-menu.ts`.
  - Call `DailyLimitService.loadDailyCount(userId)` on component initialization for free users.
  - _Depends: 1.2_
  - _Implements: DES-5, REQ-5.1_

- [x] 3.7 Update `aside-menu.html` to render 5 daily progress indicators
  - Add an `@if (!userService.currentUser()?.isPro)` block in the sidebar.
  - Inside, render a row of 5 circular indicators using `@for (indicator of dailyLimitService.dailyIndicators(); track $index)`.
  - Apply green styling when `indicator === true` (concluído) and gray when `indicator === false` (não concluído), consistent with the design system (`tertiary` for green, `on-surface-variant` for gray).
  - _Depends: 3.6_
  - _Implements: DES-5, REQ-5.1, REQ-5.2, REQ-5.4_

- [x] 3.8 Ensure `DailyLimitService.loadDailyCount` is called after lesson completion
  - Identify where lesson completion is signaled to the frontend (e.g., after `evaluateChallenge` returns, after quiz submission).
  - Call `DailyLimitService.loadDailyCount(userId)` after any successful lesson completion event so `dailyIndicators` and `isDailyLimitReached` update reactively.
  - _Depends: 3.6_
  - _Implements: DES-5, REQ-5.3_

---

## Phase 4: Acceptance Criteria Testing

- [x] 4.1 Test: free user sees all submodules regardless of order
  - Verify that a free user loading the submodule list page does not have any submodule marked as `blocked` due to its order position.
  - Test type: unit
  - _Implements: REQ-1.1_

- [x] 4.2 Test: free user sees all lessons in a submodule
  - Verify that `SubmoduleDetail.lessonsWithState` does not block any lesson based on submodule order for a free user.
  - Test type: unit
  - _Implements: REQ-1.2_

- [x] 4.3 Test: daily count is computed correctly from `user_lessons`
  - Given `user_lessons` records with `completed = true` and `completed_at` within today in UTC-3, verify `dailyCompletedCount` equals the count of such records.
  - Verify records from previous days are excluded.
  - Test type: unit
  - _Implements: REQ-2.1, REQ-4.1_

- [x] 4.4 Test: free user below daily limit can access lessons
  - Given fewer than 5 lessons completed today, verify `isDailyLimitReached` is `false` and `isLessonAccessible` returns `true` for any lesson.
  - Test type: unit
  - _Implements: REQ-2.2_

- [x] 4.5 Test: Pro user is never subject to daily limit
  - Given a Pró user with 5 or more completions today, verify `isLessonAccessible` returns `true` and `isDailyLimitReached` does not affect routing.
  - Test type: unit
  - _Implements: REQ-2.3_

- [x] 4.6 Test: guard blocks free user at limit and shows blocking message
  - Given a free user with 5 completions today, simulate navigation to a non-completed lesson route.
  - Verify the guard redirects with `?bloqueado=1`.
  - Verify `lesson.html` renders the blocking message instead of lesson content.
  - Test type: integration
  - _Implements: REQ-3.1, REQ-3.2_

- [x] 4.7 Test: guard blocks quiz and challenge routes at daily limit
  - Given a free user at the limit, verify that navigating directly to `.../quiz` and `.../challenge` routes for a non-completed lesson is blocked.
  - Test type: integration
  - _Implements: REQ-3.3_

- [x] 4.8 Test: already-completed lessons remain accessible at daily limit
  - Given a free user at the limit, verify that a lesson with `completed = true` in `user_lessons` is accessible (guard returns `true`, `isDailyBlocked` is not set).
  - Test type: integration
  - _Implements: REQ-3.4, REQ-6.1_

- [x] 4.9 Test: daily counter resets on new day
  - Given completions with `completed_at` from yesterday, verify `dailyCompletedCount` is 0 when no completions exist for today.
  - Test type: unit
  - _Implements: REQ-4.1_

- [x] 4.10 Test: sidebar shows 5 indicators for free users in correct states
  - Given a free user with N completions today (test N = 0, 3, 5), verify the `AsideMenu` renders exactly N green indicators and (5 - N) gray indicators.
  - Verify no indicators are shown for a Pró user.
  - Test type: unit
  - _Implements: REQ-5.1, REQ-5.2, REQ-5.4_

- [x] 4.11 Test: sidebar indicators update after a lesson is completed
  - After a lesson completion event triggers `loadDailyCount`, verify `dailyIndicators` reflects the updated count reactively without a page reload.
  - Test type: integration
  - _Implements: REQ-5.3_

---

## Phase 5: Final Checkpoint

- [x] 5.1 Verify all acceptance criteria
  - REQ-1: Free user navigates all submodules and lessons without order-based blocking.
  - REQ-2: Daily count is computed from `user_lessons`; limit of 5 is enforced for free users; Pró users are unaffected.
  - REQ-3: Guard blocks access via UI and URL for lessons not yet completed when limit is reached; completed lessons remain accessible.
  - REQ-4: Daily counter resets at the start of each new calendar day (UTC-3).
  - REQ-5: Sidebar indicators render correctly and update reactively after completion.
  - REQ-6: Already-completed lessons are always accessible regardless of daily limit.
  - Run `npm test` and resolve any failing tests.
  - _Implements: All requirements_
