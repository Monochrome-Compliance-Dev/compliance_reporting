# Routing Guidelines

## Reports (PTRS)

All PTRS report steps follow this route pattern:

    /reports/ptrs/stepX/:reportId

This standard applies to:

- Dashboard navigation (e.g. "Continue" button)
- AppRouter configuration
- All `navigate()` calls between steps (e.g. Step1 → Step2)

Avoid `/report/` or other intermediate paths for clarity and consistency.

### Related Files

- src/app/AppRouter.js
- src/features/users/Dashboard.js
- src/features/reports/ptrs/Step1.js
- src/features/reports/ptrs/Step2.js
- src/features/reports/ptrs/Step3.js
- src/features/reports/ptrs/Step4.js
- src/features/reports/ptrs/Step5.js
