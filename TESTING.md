# Test strategy

- Unit: domain validation, date/order boundaries, draft lifecycle transitions and serialization.
- Component: accessible labels, keyboard flow and loading/empty/error states.
- Integration: PostgreSQL migrations, repository behavior and sync conflicts.
- End-to-end: primary flow online, offline, refresh and reconnection.
- Release gate: typecheck, lint, unit tests and production build via npm run verify.

## Current automated coverage

`npm run verify` checks type safety, unit tests, lint and a production build. Unit tests cover local draft input, inclusive hour/date boundaries, draft withdrawal, chronological updates and JSON serialization. PostgreSQL, browser IndexedDB, keyboard/screen-reader behavior and offline refresh are not covered yet.

## Manual acceptance

Install the PWA, load once online, disconnect and confirm public shell and an already-open local draft list behave as documented. Test keyboard, screen-reader labels, zoom, narrow screens, locale, database recovery and privacy-safe logs. Never use real identity, personal, coercion, request or exchange data in this prototype.
