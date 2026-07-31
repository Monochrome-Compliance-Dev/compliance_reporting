# Frontend Repository Instructions

This repository contains the Monochrome Compliance frontend.

Before making changes, inspect the relevant components, API files, shared utilities, theme usage and established implementation patterns.

## Purpose

The frontend is responsible for presenting information clearly and consistently while consuming stable, normalised API responses. Business rules should remain in the backend unless they exist purely to improve the user experience.

## Technology

- React
- Material UI (MUI)
- JavaScript
- AWS Amplify
- react-router

Do not assume CloudFront is configured.

## File Conventions

- Use `.js` files only.
- Do not create `.jsx`, `.ts` or `.tsx` files.
- Do not import React unless it is actually required.
- Use `react-router`, not `react-router-dom`.
- Follow the repository's existing import patterns.

## UI Standards

- Follow existing Material UI patterns.
- Use the global theme wherever appropriate instead of hard-coded values.
- Preserve responsive behaviour.
- Preserve accessibility.
- Extend existing components before creating new alternatives.
- Keep styling consistent across the application.
- For the public website, treat the landing page as the visual benchmark unless instructed otherwise.

## Alerts

Use the existing `AlertContext`.

Do not create new alert components or notification systems.

Follow the established repository pattern:

    import { useAlert } from "../../context";

    const { showAlert } = useAlert();

    showAlert("Message", "info");
    showAlert("Message", "success");
    showAlert("Message", "error");

Adjust only the relative import path if required by the file location.

## API Design

- Normalise backend response structures in the frontend API layer wherever possible.
- Components should consume stable frontend models.
- Avoid spreading response transformation throughout pages and components.
- Preserve existing API abstractions unless there is a clear improvement.

## React Quality

- Do not suppress lint warnings.
- Never suppress React Hook dependency warnings.
- Resolve `useEffect` dependencies correctly.
- Avoid unnecessary state duplication.
- Prefer derived values over unnecessary effects where appropriate.
- Preserve existing behaviour unless the task explicitly changes it.

## Implementation Principles

- Understand the existing implementation before changing it.
- Follow established repository patterns.
- Prefer improving existing components over replacing them.
- Avoid introducing parallel implementations.
- Avoid speculative abstractions.
- Do not introduce backwards compatibility or fallback behaviour unless specifically requested.
- Keep changes focused on the requested outcome.
- Avoid unrelated refactoring.

## Workflow

For substantial work:

1. Inspect the relevant implementation.
2. Explain the current behaviour.
3. Propose a concise implementation plan.
4. Wait for approval unless instructed to implement immediately.
5. Implement focused changes.
6. Run relevant tests and linting.
7. Summarise the completed work, verification performed and any remaining risks.
