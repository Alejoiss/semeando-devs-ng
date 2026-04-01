<!-- SpecDriven:managed:start -->
# Testing Strategy

## Overview

Because testing evidence in this repository currently focuses primarily on basic unit test scaffolding (Jasmine/Karma) without a clear comprehensive coverage strategy, we default to the **Testing Trophy** philosophy to guide future investments.

## Testing Trophy

1. **Integration Tests (Main Confidence Layer):**
   - We prefer integration tests that exercise multiple units working together (e.g., a Page component loaded with its associated Service and child components).
   - This provides the maximum confidence coefficient per hour of effort.

2. **End-to-End (E2E) Tests:**
   - E2E testing frameworks (e.g., Cypress/Playwright) should be used selectively for critical user journeys and cross-system flows.
   - Do not overuse E2E tests for minor rendering assertions due to flakiness and runtime costs.

3. **Unit Tests:**
   - Use unit tests strictly for isolated, high-risk logic.
   - Example targets: custom validators in `src/utils/validators.ts`, deep state transformations, purely functional utilities.
   - Do not write overly mocked unit tests for simple structural Angular components.

## Running Tests

Current tooling uses Karma and Jasmine.

- **Run all:** `npm test`

## Test Organization
- Test files must be named `*.spec.ts` and reside alongside the component or service they test.
- Use `TestBed` appropriately to configure integrations and mock out boundary networks.
<!-- SpecDriven:managed:end -->
