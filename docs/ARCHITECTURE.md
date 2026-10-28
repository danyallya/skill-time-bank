# Architecture

- Web: Next.js App Router and server-only route handlers.
- UI: React, Tailwind CSS, React Icons, semantic HTML and explicit status.
- Offline: service worker caches only the public shell; Dexie v2 adds local `exchangeDrafts` and preserves the existing outbox.
- Database: PostgreSQL 18 in Compose; ordered SQL migrations under db/migrations.
- Domain belongs in src/domain; server access in src/server; view code in app.
- External providers use server-side adapters and environment-only secrets.
- Docker multi-stage build; isolated web/database services per project.

First product record: a local skill-offer draft in `src/domain/skill-offer.ts`, saved to IndexedDB. There is no API write, matching, accepted exchange or PostgreSQL mapping yet. Proposed hours are not an agreement or a balance. Define coercion prevention, moderation, identity and dispute paths before enabling interaction between people.
