# Requirements

## Overview

When a student finishes the last quiz of a module and the backend returns `moduleCompleted: true`, the application redirects them to a dedicated congratulations screen at the route `/app/s/:slug/finished`. This screen celebrates the student's achievement by displaying the completed module's associated achievement, the XP reward, and the Seeds earned.

The screen replaces the generic post-quiz flow for module completions, giving learners a clear sense of closure and rewarding the completion milestone before they choose where to navigate next.

## Glossary

| Term | Definition |
|------|------------|
| Module | A top-level grouping of submodules and lessons in the platform. Identified by a URL-friendly `slug`. |
| Achievement | A badge record in the database that can be linked to a module via `moduleId`. Contains `name`, `icon`, and `xpAmount`. |
| Seeds | In-game currency equal to 10% of the achievement's `xpAmount`, earned upon module completion. |
| `finished` route | The Angular route `/app/s/:slug/finished` that renders the module completion screen. |

## Assumptions

- The `slug` route parameter on the `finished` route uniquely identifies the completed module.
- The `AchievementsService.getAchievements()` method returns all achievements including their `moduleId` field, allowing the screen to match the achievement to the module by `moduleId`.
- The module entity can be retrieved from the existing module service using the `slug`.
- The Seeds amount displayed is computed as `Math.ceil(achievement.xpAmount * 0.1)`.
- The `finished` route is a child of the authenticated `app` layout, so the top navigation is still visible.
- If no achievement is linked to the module (no matching `moduleId`), the achievement section is hidden and only the congratulations title is shown.

## Requirements

### REQ-1: Module Completion Route

**User Story:** As a student, I want to be navigated to a dedicated completion screen after finishing a module, so that I can see my reward and feel a sense of accomplishment.

#### Acceptance Criteria

1.1 WHEN `quizCompletionResult.moduleCompleted` is `true`, THEN the application SHALL navigate to the route `/app/s/:slug/finished`.
1.2 THE application SHALL register the `/app/s/:slug/finished` child route under the authenticated `app` layout with the title `Conclusão de Módulo - Semeando Devs`.

---

### REQ-2: Congratulations Screen Display

**User Story:** As a student, I want the completion screen to show a personalized congratulations message with the module name, so that I know which module I completed.

#### Acceptance Criteria

2.1 WHEN the `finished` route is loaded, THEN the module completion screen SHALL display the heading "Parabéns! Você concluiu o módulo [nome do módulo]".
2.2 WHILE the module data is being fetched, the module completion screen SHALL display a loading state instead of the heading.
2.3 IF the module cannot be found by the slug, THEN the module completion screen SHALL display a generic error message.

---

### REQ-3: Achievement Showcase

**User Story:** As a student, I want to see the achievement I unlocked by completing the module, so that I feel rewarded and motivated to continue.

#### Acceptance Criteria

3.1 WHEN the `finished` route is loaded, THEN the module completion screen SHALL fetch all achievements and display the achievement whose `moduleId` matches the completed module's `id`.
3.2 WHEN a matching achievement is found, THEN the module completion screen SHALL display the achievement's `name`, `icon` image, and `xpAmount`.
3.3 IF no achievement has a `moduleId` matching the completed module's `id`, THEN the module completion screen SHALL hide the achievement section entirely.

---

### REQ-4: Seeds Reward Display

**User Story:** As a student, I want to see how many Seeds I earned from completing the module, so that I understand the in-game currency benefit of my achievement.

#### Acceptance Criteria

4.1 WHEN a matching achievement is found, THEN the module completion screen SHALL calculate and display the Seeds earned as `Math.ceil(achievement.xpAmount * 0.1)`.
4.2 THE module completion screen SHALL display the Seeds amount alongside the Seeds icon to reinforce the currency identity.

---

### REQ-5: Post-Completion Navigation

**User Story:** As a student, I want clear navigation options after completing a module, so that I can decide where to go next without confusion.

#### Acceptance Criteria

5.1 THE module completion screen SHALL display a button labeled "Ir para a lista de módulos" that navigates to `/app`.
5.2 THE module completion screen SHALL display a button labeled "Ir para minhas conquistas" that navigates to `/app/conquistas`.
