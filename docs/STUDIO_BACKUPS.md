# Railway backups

The existing content-studio-api volume remains mounted at `/data`. Browser content backups live under `/data/studio-backups`; existing OAuth, publishing data and media paths are not moved. Production backup routes refuse to run without `RAILWAY_VOLUME_MOUNT_PATH`.

The dashboard loads two scripts without changing its layout. With an active owner session, it checks for local metadata changes every 30 seconds and captures media at least every five minutes while the dashboard is visible. It uploads new content-addressed blobs in chunks of at most 8 MiB, verifies SHA-256, then commits a versioned manifest. It reads back server status before reporting `verified_on_railway`. Identical media are not uploaded again. Browser media and metadata are never deleted.

The first backup needs the owner's browser containing the restored media and an owner session. Code deployment alone does not upload those files. Open `cloud-backup.html` for explicit backup, status and recovery. If owner login is needed, sign in through the existing Google owner flow; returning to the dashboard starts automatic backup. Browser session tokens, OAuth credentials and unrelated application storage are excluded from uploaded manifests.

All `/api/backups/*` routes use the existing owner authorization and frontend origin allowlist. There are no public media URLs. A different device or a changed cloud revision pauses automatic writes until the owner explicitly backs up or restores. This is backup/recovery, not automatic multi-device merge.

Every committed version retains a manifest and, when available, a private copy of backend `state.json`. Media are deduplicated by SHA-256. The current pointer is atomically replaced only after all media exist. Existing versions remain available on disk. Incomplete transfers do not become committed backups. Uploads can resume at the server's recorded byte offset.

The existing Railway volume is 1 GiB. The backup service reserves 128 MiB and returns `backup_storage_full` rather than consuming the remaining space. It does not automatically increase storage or billing. A failed backup leaves local content intact and does not advance the latest pointer. Monitor the backup status page before relying on a backup.

These copies are on the existing Railway volume, not an independent offsite disaster-recovery copy or Railway platform volume snapshot. They survive ordinary application redeploys but do not protect against deletion/loss of that same volume. Keep the verified local `.bimabackup` as an additional independent copy.

Validation: `node --test backend/tests/studio-backups.test.mjs backend/tests/frontend-origins.test.mjs backend/tests/server.test.mjs qa/cloud-backup-core.test.cjs`.
