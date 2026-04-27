# Implementation Tasks

## Overview

This implementation is organized into 4 phases:

1. **Foundation** — Extend `ModuleService` and register the new route
2. **Feature Delivery** — Create the `ModuleFinished` component with all states and logic
3. **Acceptance Criteria Testing** — Verify all requirement behaviors
4. **Final Checkpoint** — Validate completeness and readiness

**Estimated Effort**: Small (1-2 sessions)

---

## Phase 1: Foundation

- [x] 1.1 Add `getModuleBySlug` to `ModuleService`
  - Add a new async method `getModuleBySlug(slug: string): Promise<Module | null>` to the existing `ModuleService` that queries the `modules` table with `.eq('slug', slug).single()` and returns the mapped `Module` or `null` on error.
  - _Implements: DES-2_

- [x] 1.2 Register `s/:slug/finished` child route
  - Add the `s/:slug/finished` entry to the `app` children array in `app.routes.ts`, pointing to the `ModuleFinished` component with `loadComponent` (lazy), and title `Conclusão de Módulo - Semeando Devs`.
  - _Implements: DES-1, REQ-1.2_

---

## Phase 2: Feature Delivery

- [x] 2.1 Generate `ModuleFinished` component scaffold
  - Run `ng g c pages/app/module-finished/module-finished` to produce the four files (`.ts`, `.html`, `.scss`, `.spec.ts`) with `OnPush` change detection and standalone wiring.
  - _Implements: DES-4_

- [x] 2.2 Implement component state and data loading logic
  - In `module-finished.ts`: inject `ActivatedRoute`, `Router`, `ModuleService`, and `AchievementsService`. Define signals `module`, `moduleAchievement`, `isLoading`, `error`. In `ngOnInit`, read the `slug` param, run `Promise.all([getModuleBySlug, getAchievements])`, filter achievements by `moduleId === module.id`, and set all signals.
  - _Implements: DES-2, DES-3, REQ-2.1, REQ-3.1_

- [x] 2.3 Add `earnedSeeds` computed signal
  - Define `protected readonly earnedSeeds = computed(() => Math.ceil((this.moduleAchievement()?.xpAmount ?? 0) * 0.1))` in the component class.
  - _Depends: 2.2_
  - _Implements: DES-3, REQ-4.1_

- [x] 2.4 Build the completion screen template
  - In `module-finished.html`: use `@if (isLoading())` for the skeleton, `@else if (!module())` for the error state, and `@else` for the success state. The success state shows the congratulations heading with module title, a conditional `@if (moduleAchievement())` block with achievement icon, name, and XP badge, the Seeds reward row with the seed icon, and the two navigation `[routerLink]` buttons.
  - _Depends: 2.2, 2.3_
  - _Implements: DES-4, REQ-2.1, REQ-2.2, REQ-2.3, REQ-3.2, REQ-3.3, REQ-4.2, REQ-5.1, REQ-5.2_

---

## Phase 3: Acceptance Criteria Testing

- [x] 3.1 Test: navigate to finished route when module is completed
  - Verify that when `quizCompletionResult.moduleCompleted` is `true`, the quiz component calls `Router.navigate` with `/app/s/:slug/finished`.
  - Test type: unit
  - _Implements: REQ-1.1_

- [x] 3.2 Test: display congratulations heading with module name
  - Verify that when the `module` signal is set, the template renders the heading containing "Parabéns! Você concluiu o módulo" and the module's title.
  - Test type: unit
  - _Depends: 2.4_
  - _Implements: REQ-2.1_

- [x] 3.3 Test: display loading state while fetching and error state on failure
  - Verify that while `isLoading()` is `true` the heading is absent, and that when `module()` is `null` after loading the error message is shown.
  - Test type: unit
  - _Depends: 2.4_
  - _Implements: REQ-2.2, REQ-2.3_

- [x] 3.4 Test: show achievement details when moduleId matches
  - Verify that when an achievement with matching `moduleId` is present, the achievement card renders with the correct name, icon src, and XP amount.
  - Test type: unit
  - _Depends: 2.4_
  - _Implements: REQ-3.1, REQ-3.2_

- [x] 3.5 Test: hide achievement section when no moduleId match
  - Verify that when no achievement has a matching `moduleId`, the achievement section is absent from the DOM.
  - Test type: unit
  - _Depends: 2.4_
  - _Implements: REQ-3.3_

- [x] 3.6 Test: display correct Seeds amount and icon
  - Verify that `earnedSeeds()` equals `Math.ceil(xpAmount * 0.1)` and that the seed icon and the computed value appear in the template when an achievement is matched.
  - Test type: unit
  - _Depends: 2.3, 2.4_
  - _Implements: REQ-4.1, REQ-4.2_

- [x] 3.7 Test: navigation buttons route to correct paths
  - Verify that "Ir para a lista de módulos" links to `/app` and "Ir para minhas conquistas" links to `/app/conquistas`.
  - Test type: unit
  - _Depends: 2.4_
  - _Implements: REQ-5.1, REQ-5.2_

---

## Phase 4: Final Checkpoint

- [x] 4.1 Verify all acceptance criteria
  - REQ-1: Confirm navigation to `/app/s/:slug/finished` is triggered on `moduleCompleted` and the route is registered with the correct title.
  - REQ-2: Confirm loading, success, and error states render correctly.
  - REQ-3: Confirm achievement card appears with correct data or is hidden.
  - REQ-4: Confirm Seeds amount is calculated and displayed with the seed icon.
  - REQ-5: Confirm both navigation buttons link to the correct paths.
  - Run `npm test` and resolve any failures before marking complete.
  - _Implements: All requirements_
