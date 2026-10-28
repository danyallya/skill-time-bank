# Active task

**ID:** TIME-CREDIT-001  
**Title:** Create a skill offer and exchange with agreed time credits.

## Context

The technical shell exists; the product workflow does not. Build the first safe, end-to-end domain slice for Skill Time Bank.

## Acceptance criteria

- Type the exchanges domain record, validation rules and lifecycle.
- Add a create/review flow that works without a server round-trip.
- Persist a draft with Dexie and show saved, unsaved and sync state truthfully.
- Test valid/invalid input, date/order boundaries and serialization.
- Document retention, deletion and limitations of the offline slice.
- Respect this guardrail: Prevent coercion and unsafe requests; define moderation, identity and dispute paths.

## Status

In progress. The safe first slice stores only a private skill-offer draft and proposed hours on this device. It does not publish offers, match people, accept requests, establish an agreement or create time balances. Moderation, identity and dispute paths are not designed, so real exchanges remain gated. The validation, empty, error and deletion states from TIME-CREDIT-002 may be completed alongside this slice.

Next: TIME-CREDIT-003 PostgreSQL migrations and repository tests, still without personal or exchange data. Define moderation, identity, coercion prevention and disputes before adding any interaction between people.
