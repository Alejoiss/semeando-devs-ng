<!-- SpecDriven:managed:start -->
# Contributing Guidelines

## Git Workflow
1. Create a feature branch from `main` or `develop`.
2. Implement your changes.
3. Push your branch and open a Pull Request (PR).
4. Ensure all CI/CD passes before merging.

## Pull Request Process
- Detail the purpose of your PR in the description.
- Reference any related issues or task artifacts.
- Keep PRs focused on a single logical change or feature.

## Repository Structure
The project follows a domain-driven file structure inside `src/app/`:
- `components/`: Shared UI components (e.g., headers, menus, breadcrumbs).
- `pages/`: Feature pages grouped by domain.
- `models/`: TypeScript classes/interfaces for domain models.
- `services/`: API communication and business logic (one service per domain).
- `guards/`: Route guards (e.g., `profile-permission`, `logged-user`).
- `interceptors/`: HTTP interceptors for global request/response handling.

## Documentation Workflow
- When adding new domain features, update relevant documentation.
- Any new architectural patterns or design choices must be reflected in `ARCHITECTURE.md` or `STYLEGUIDE.md`.
<!-- SpecDriven:managed:end -->
