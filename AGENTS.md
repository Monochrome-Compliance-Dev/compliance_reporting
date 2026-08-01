# Frontend Repository Instructions

This repository contains the Monochrome Compliance frontend.

The frontend is responsible for presentation, user interaction and consuming stable, normalised API responses. Business rules belong in the backend unless they exist purely to support the user experience.

Before making changes, inspect the relevant components, API files, context providers, shared utilities, routes, theme usage and established implementation patterns.

## Authoritative Documentation

For platform architecture, capability boundaries and significant engineering decisions, consult the Platform Handbook.

Do not invent platform behaviour that conflicts with documented Platform Foundations, accepted ADRs or active initiative architecture.

Implementation details remain authoritative in this repository where they do not conflict with the Platform Handbook.

## Technology and Hosting

- React 18
- Material UI 7
- JavaScript
- react-router 7
- Create React App
- Node.js 20.19
- AWS Amplify

Do not assume CloudFront is configured.

## File and Import Conventions

- Use `.js` files only.
- Do not create `.jsx`, `.ts` or `.tsx` files.
- Do not import React unless it is required.
- Use `react-router`, not `react-router-dom`.
- Follow existing repository import and folder patterns.
- Avoid barrel exports where they obscure ownership or create circular dependencies.
- The repository configures `src` as the import base through `jsconfig.json`.
- Prefer established source-root imports such as `context`, `shared/...` and `slices/...` over long relative paths.
- Use relative imports only where that is already the clearer local repository pattern.

## Architecture Boundaries

- Keep page and component responsibilities focused.
- Context providers manage shared state and orchestration; they should not become API transformation or business-rule layers.
- Business rules should normally remain in the backend.
- Reusable behaviour belongs in existing shared components, hooks, utilities or API modules where appropriate.
- Do not create parallel abstractions when an established repository pattern already exists.
- Preserve protected-route and customer-isolation behaviour.

## API Design

- Normalise backend response structures in the frontend API file wherever possible.
- Components and contexts should consume stable frontend-facing structures.
- Do not spread response-shape handling across pages and components.
- Keep API calls out of purely presentational components.
- Preserve explicit error states rather than hiding invalid responses behind broad fallbacks.
- Do not add backwards-compatibility handling unless specifically requested.

## UI and Theme Standards

- Follow established Material UI patterns.
- Use the global theme wherever relevant:

      const theme = useTheme();

- Prefer theme tokens over hard-coded colours, spacing, radii and breakpoints.
- Preserve light and dark theme behaviour.
- Preserve responsive behaviour and accessibility.
- Extend existing components before introducing alternatives.
- Avoid page-local design systems or duplicate styling primitives.
- For the public website, use the approved landing page and uplifted service pages as visual benchmarks unless instructed otherwise.

## Alerts

Use the existing `AlertContext`.

Do not create new alert components, notification utilities or parallel alert mechanisms.

The frontend configures `src` as its import base through `jsconfig.json`. Use the established source-root import:

    import { useAlert } from "context";

    const { showAlert } = useAlert();

    showAlert("Message", "info");
    showAlert("Message", "success");
    showAlert("Message", "error");

## React Quality

- Do not suppress lint warnings.
- Never suppress React Hook dependency warnings.
- Resolve `useEffect` dependencies correctly.
- Avoid unnecessary state duplication.
- Prefer derived values over effects where appropriate.
- Avoid effects for work that belongs in event handlers or API modules.
- Preserve semantic HTML, keyboard access, visible focus treatment and heading order.
- Respect reduced-motion preferences where animation is introduced.

## Navigation

- Use declarative `react-router` links for internal application navigation.
- Use normal anchors for external destinations and document downloads.
- Do not add aliases, redirects or compatibility routes unless explicitly approved.
- Keep canonical URLs aligned with registered routes.

## Validation

For completed changes:

- Run focused ESLint on changed JavaScript files using the repository’s installed ESLint configuration where practical.
- Run `npm run build` for substantial, shared or multi-file changes; the Create React App build also performs compile-time lint checks.
- Run targeted tests where relevant.
- Run `git diff --check`.
- Run a production build for substantial, shared or multi-file changes.
- Verify affected routes and responsive behaviour when UI changes are made.
- Report pre-existing warnings separately from issues introduced by the task.

## Definition of Done

Work is complete only when:

- the requested behaviour is implemented;
- established architecture and repository patterns are preserved;
- relevant validation has passed;
- unrelated files remain untouched;
- documentation is updated where the change affects durable platform knowledge;
- remaining risks or unverified behaviour are clearly reported.

## Repository Commands

- Development server: `npm start`
- Production build: `npm run build`
- Tests: `npm test`
- Payment Times Explorer data build: `npm run build:regulator-payment-times`

## Platform Transition Boundary

The repository contains both legacy solution code and the new Platform architecture.

The `/platform` area represents the target platform architecture and is conceptually equivalent to a new major platform generation.

- New Platform Capability implementation belongs under `/platform`.
- Code outside `/platform` is predominantly legacy solution implementation.
- Do not use legacy folder structure or solution-specific patterns as the default architecture for new Platform work.
- Legacy code may be inspected and selectively reused when it provides suitable implementation, utilities or presentation behaviour.
- Reuse must preserve the approved Platform Capability boundaries rather than importing legacy solution architecture into `/platform`.
- Do not migrate or rewrite legacy code merely because it exists outside `/platform`.
- Do not place new solution-specific business rules inside shared Platform components.
- Frontend solutions should consume stable Platform Capability APIs and artefacts through their frontend API layer.
- Normalise backend Platform responses in the relevant frontend API file before exposing them to contexts or components.
- Where `/platform` implementation and legacy behaviour differ, treat the Platform Handbook and approved `/platform` architecture as the target state.
