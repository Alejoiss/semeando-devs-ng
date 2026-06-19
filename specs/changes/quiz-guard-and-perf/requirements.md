# Requirements

## Overview

The Quiz component allows users to answer questions sequentially and receive a score at the end. Two issues have been observed in production:

1. **Duplicate submissions causing invalid scores**: When a user presses Enter twice quickly (or clicks "Confirmar resposta" and then immediately presses Enter), the asynchronous `confirmAnswer` method is invoked a second time before the first call has finished and set the `confirmed` flag to `true`. This results in the same answer being recorded more than once, producing scores that exceed the maximum (e.g. 11/10 on a 10-question quiz).

2. **Slow quiz flow perceived by users**: Each question transition awaits a network round-trip to fetch the next question's answer options. This delay is noticeable on slower connections. Fetching all answers upfront is not acceptable because it would expose the full answer set in the browser's developer tools, allowing advanced users to inspect the data before confirming.

The scope of this spec is: (a) adding in-flight guards to prevent concurrent async invocations of answer confirmation and quiz completion, and (b) prefetching the *next* question's answer options in the background during the post-confirmation feedback window, so the subsequent question transition is instant.

---

## Glossary

| Term | Definition |
|------|------------|
| Confirmation | The action of submitting a selected answer for server-side verification |
| In-flight guard | A boolean flag that prevents a second invocation of an async operation while the first is still executing |
| Background prefetch | Silently loading the next question's answer options during the feedback display period, after the current answer is confirmed |
| Answer cache | An in-memory map keyed by question ID that stores a single pre-loaded next-question answer set |

## Assumptions

- Answer options for a given quiz session do not change during an active attempt.
- Security constraint: only the answer options for the question currently being answered (and at most the immediately next question) may be resident in memory at any given time.
- The `getAnswersByQuestionId` RPC does not expose correctness data, but bulk-fetching all questions at once remains undesirable due to the full dataset being visible in developer tools.
- Performance improvements target client-side network round-trips; no server-side changes are required.

## Requirements

### REQ-1: In-flight Guard for Answer Confirmation

**User Story:** As a student, I want the quiz to ignore repeated confirmation attempts while one is already processing, so that I cannot accidentally submit the same answer more than once and corrupt my score.

#### Acceptance Criteria

1.1 WHEN the user triggers "Confirmar resposta" while a confirmation is already in progress, THEN the quiz component SHALL discard the duplicate request without performing any network call or state mutation.

1.2 WHILE an answer confirmation is in progress, the quiz component SHALL display the confirm button in a visually disabled state so that the user receives immediate feedback that the action is being processed.

1.3 WHILE an answer confirmation is in progress, the quiz component SHALL ignore keyboard shortcut activations (Enter key) that would normally trigger confirmation.

1.4 WHEN the answer confirmation completes (either successfully or with an error), THEN the quiz component SHALL release the in-flight guard so that future confirmations can proceed normally.

---

### REQ-2: Background Prefetch of Next Question's Answers

**User Story:** As a student, I want question navigation to feel instantaneous, so that I can focus on answering rather than waiting for content to load between questions.

#### Acceptance Criteria

2.1 WHEN the current answer is confirmed and there is a subsequent question remaining, THEN the quiz component SHALL begin fetching the next question's answer options in the background without blocking the UI.

2.2 WHEN the user navigates to the next question, THEN the quiz component SHALL display the pre-fetched answer options immediately if the background fetch has already completed.

2.3 IF the background prefetch has not yet completed when the user navigates, THEN the quiz component SHALL display a loading state and wait for the in-progress fetch to resolve before showing the answers.

2.4 IF the background prefetch fails, THEN the quiz component SHALL silently retry the fetch on navigation without surfacing an error to the user, falling back to an on-demand request.

---

### REQ-3: In-flight Guard for Quiz Completion

**User Story:** As a student, I want the "Ver resultado" and "Continuar" actions to execute only once, so that quiz completion is not recorded multiple times in the database.

#### Acceptance Criteria

3.1 WHEN the user triggers quiz completion (reaching the last question and advancing), THEN the quiz component SHALL invoke the completion service call exactly once per quiz attempt.

3.2 WHILE the quiz completion call is in progress, the quiz component SHALL prevent additional completion triggers, including those caused by keyboard shortcuts.

3.3 WHEN the quiz completion call is in progress, the quiz component SHALL display a loading indicator on the action button to communicate that processing is ongoing.
