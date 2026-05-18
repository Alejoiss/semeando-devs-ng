# Requirements

## Overview

The lesson authoring interface in Semeando Devs allows teachers to create and edit structured lessons consisting of multiple content blocks (markdown, images, videos). To ensure high pedagogical quality and alignment with the platform's standard, teachers need a tool to get constructive feedback on their lesson's markdown content before publishing.

This feature introduces an AI-powered evaluation tool. Teachers will be able to click a button labeled "Avaliar conteúdo com IA" in the lesson editor to trigger an automated evaluation of all markdown blocks. A Supabase Edge Function will handle the request by sending the lesson context (title and description) along with all markdown content to a designated LLM via OpenRouter. The feedback will then be rendered back to the teacher within a premium, dedicated feedback section in the UI.

The implementation must strictly respect the "Neon Terminal" design philosophy and comply with modern Angular standards.

## Glossary

| Term | Definition |
|------|------------|
| SectionContent | An ordered content block within a lesson (TEXT, MARKDOWN, IMAGE, VIDEO). |
| Edge Function | A serverless backend endpoint deployed in Supabase. |
| OpenRouter | A unified API gateway used to connect to LLM providers. |
| LLM | Large Language Model used to analyze text and generate structured feedback. |
| MD | Markdown syntax used for rich text content blocks. |

## Assumptions

- The Supabase Edge Function environment has a valid `OPENROUTER_API_KEY` configured.
- The LLM model is accessed through the existing OpenRouter endpoint.
- Only section contents of type `MARKDOWN` are compiled and evaluated.
- The teacher has at least one markdown section content block present before the evaluation can be performed.

## Requirements

### REQ-1: AI Evaluation Trigger and State

**User Story:** As a teacher, I want an evaluation trigger button that is only active when markdown content is available, so that I don't trigger evaluations on empty or unsupported lessons.

#### Acceptance Criteria

1.1 THE lesson editor SHALL display a button labeled "Avaliar conteúdo com IA" below the section contents list.

1.2 WHILE the lesson content list contains zero items of type `MARKDOWN`, the lesson editor SHALL disable the evaluation button.

1.3 WHILE an AI evaluation is in progress, the lesson editor SHALL disable the evaluation button and show a spinner loading indicator.

1.4 WHEN the teacher clicks the enabled evaluation button, THEN the lesson editor SHALL trigger the AI evaluation request.

### REQ-2: AI Evaluation API Function

**User Story:** As a developer, I want a Supabase Edge Function to evaluate lesson content using a specialized prompt, so that the LLM provides constructive quality feedback.

#### Acceptance Criteria

2.1 WHEN the Edge Function receives a valid evaluation request, THEN the Edge Function SHALL validate that the payload contains a non-empty lesson title, lesson description, and a list of markdown content strings.

2.2 WHEN the Edge Function calls the OpenRouter API, THEN the Edge Function SHALL query the LLM using the `"inclusionai/ring-2.6-1t:free"` model.

2.3 THE Edge Function SHALL inject a system prompt that instructs the LLM to behave as a programming teacher, validate spelling, grammar, markdown layout, clarity, and suggest improvements without failing the teacher.

2.4 IF the Edge Function evaluation call to OpenRouter fails, THEN the Edge Function SHALL return a 500 status code response with an error message.

### REQ-3: Feedback Display Section

**User Story:** As a teacher, I want to see the AI's constructive feedback clearly on the page, so that I can easily read the recommendations and refine my lesson.

#### Acceptance Criteria

3.1 WHEN the AI evaluation returns successfully, THEN the lesson editor SHALL hide the spinner loading indicator.

3.2 WHEN the AI evaluation returns successfully, THEN the lesson editor SHALL display the AI feedback rendered as rich markdown text inside a feedback section below the evaluation button.

3.3 IF the evaluation fails, THEN the lesson editor SHALL display an error message and hide the spinner loading indicator.
