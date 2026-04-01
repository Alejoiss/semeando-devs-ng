<!-- SpecDriven:managed:start -->
# Style Guide

## Naming Conventions
- ALWAYS use `ng g c <path>/<componentName>` or `ng g s <path>/<serviceName>` to generate scaffolding.
- Route URLs must ALWAYS be in `pt-br` and use a friendly path (e.g., `registro`).
- Route titles must have the ` - Semeando Devs` suffix (e.g., `Registro - Semeando Devs`).

## Code Style
- **TypeScript:** Use strict type checking. Prefer inference. Avoid `any` (use `unknown` if uncertain).
- **Format:** Use 4 spaces for indentation as defined in `.editorconfig`.
- **Components:** Must be Standalone (`standalone: true`). Do NOT set it explicitly inside decorators if inferred by version.
- **State:** Use `signal()` for local component state, `computed()` for derived state. No `mutate`, use `update` or `set`.
- **Inputs/Outputs:** Use the new `input()` and `output()` functions instead of `@Input()`/`@Output()` decorators.
- **Templates:** Use native control flow (`@if`, `@for`, `@switch`) exclusively. Always provide a `track` clause in `@for` loops. Do NOT use `*ngIf`, `ngStyle`, or `ngClass` (use standard attribute bindings).
- **Host Bindings:** Put host bindings inside the `host` object of `@Component` rather than using decorators.

## UI and Styling Patterns
- Use Tailwind CSS classes in templates.
- Global overrides go in `src/styles.scss`.
- Follow the Luminescent Blueprint design system:
  - Deep midnight base `#060e20`.
  - Primary `#3fc2fb`, Secondary `#fe69ac`, Tertiary `#e8ffc0`.
  - No 1px solid borders. Use `surface_container` background shifts for depth.
- **Forms:** Prefer Reactive Forms. Provide proper masks (e.g., `ngx-mask`) and extract custom validators to `src/utils/validators.ts`.
<!-- SpecDriven:managed:end -->
