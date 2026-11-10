# Offline behavior

The PWA stores the public entry page, offline notice, icon and versioned static assets after the first visit. It never caches API responses. Skill-offer drafts are stored in IndexedDB on the current browser profile; they survive reloads but are not encrypted, backed up, synced or shared. Other users of that browser profile may see them. The UI can delete a draft from the local object store; device backups, browser recovery and secure erasure are not covered.

The existing outbox has no product synchronization behavior. There is no conflict resolution, cross-device recovery or retry workflow. Drafts are not published and do not create agreements or time balances.
