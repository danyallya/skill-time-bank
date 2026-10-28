# Skill Time Bank

A local exchange where people trade time and skills instead of money.

Offer help, request a skill and settle an exchange in agreed hours.

> Status: private local draft prototype. Offers are not shared; hours are proposals, not agreements or balances. There is no account, matching, moderation, identity or dispute workflow yet.

## Start locally

- Node.js 24 LTS and Docker Desktop with Compose.
- Copy .env.example to .env and set a development password.
- Install with `npm ci`.
- Start with docker compose up --build.
- App: http://localhost:3109 · PostgreSQL: localhost:5549

For lower-bandwidth installs, use [Offline Dev Vault](https://github.com/danyallya/offline-dev-vault); see docs/DEPENDENCIES.md.

## Foundation

Next.js App Router, TypeScript, React, Tailwind CSS, React Icons, PostgreSQL, Docker Compose, PWA manifest, conservative offline shell, Dexie local offer drafts, health endpoint, unit tests and CI. English interface.

The service worker caches only the public shell and versioned static files. Local offer drafts are stored in browser IndexedDB without encryption, backup or sync. Do not enter personal or sensitive data.

Read AGENTS.md, TASK.md and docs/PROGRESS.md before work.
