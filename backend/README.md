# BIMA Content Studio — secure YouTube upload backend (Phase 2)

## Deployed technical foundation
- Railway project: `bima-content-studio`, service: `content-studio-api`; separate from BIMA.Ginga, Quant, AVA, and Vireqo.
- Runtime: built-in Node 22 HTTP; no third-party dependencies.
- Persistent Railway volume: `/data` (1 GB); owner session hashes, encrypted Google refresh token, upload journal, private MP4 files. A single Railway replica only.
- Railway URL: https://content-studio-api-production-3fe2.up.railway.app
- Owner frontend: https://noor-arief.github.io/Bima-Content-Studio/
- Status checkpoint (11 Oct 2026): **Google OAuth authorized; Orbit & Ocean expected channel ID configured; uploads OFF; public scheduling OFF.** A locked channel ID is not the same as a confirmed ID match. The public `/health.channelVerified` boolean reports the match safely without disclosing the channel ID; owner `/api/status` gives detailed verification after Google login.

## Setup remaining — OWNER-ONLY, NEVER COMMIT SECRETS
1. On Google Cloud, open existing **BIMA Content Studio Backend / Web application** OAuth Client.
2. Add authorized redirect URL: `https://content-studio-api-production-3fe2.up.railway.app/auth/google/callback`. No JavaScript origin needed; browser client communicates with Railway, Google redirects to the backend.
3. On Google Auth Platform **Data Access**, retain `youtube.upload` and add `youtube.readonly` for exact channel identity verification. Set OAuth test user to the account controlling **Orbit & Ocean**.
4. In Railway service **Variables** (not frontend or GitHub), set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from Google OAuth client. They must remain on the server. Confirm `OWNER_EMAIL` is the actual Google identity owning Orbit & Ocean, not merely a vidIQ login (currently configured based on the connected account; update privately if different).
5. Current stable non-secret variables: `PUBLIC_BASE_URL=https://content-studio-api-production-3fe2.up.railway.app`; `DATA_DIR=/data`; `NODE_ENV=production`; `ENABLE_UPLOADS=false`; `ENABLE_PUBLIC_SCHEDULING=false`. `TOKEN_ENCRYPTION_KEY` is preconfigured, never rotate without first decrypting/migrating stored tokens.
6. Use dashboard's **Connect YouTube (Google OAuth)**. Login and consent as owner. Backend calls the YouTube channels endpoint. It returns the authorized channel ID/name in `/api/status`; owner checks it matches Orbit & Ocean.
7. Set `EXPECTED_YOUTUBE_CHANNEL_ID` on Railway Variables to confirmed value (UC... ID). Until it matches, upload and scheduling gates stay closed.
8. After the channel matches and a FINAL MP4 with future publication date is approved: carefully set `ENABLE_UPLOADS=true` to test a **Private upload only**, then use dashboard buttons **Save selected video to server → Approve server-side schedule → Upload Private / Schedule**. Verify in YouTube Studio and BIMA. No automatic duplicate retries.
9. **Before `ENABLE_PUBLIC_SCHEDULING=true`:** verify YouTube API project's audit/compliance requirements and OAuth production/verification. Projects that have not passed a required YouTube audit may be restricted to Private uploads. External Testing OAuth refresh tokens may expire after 7 days, making unattended long-term scheduling unreliable. Confirm a real successful future `publishAt` and a public result before claiming PASS.
10. Set `ENABLE_PUBLIC_SCHEDULING=true` only after owner-approved end-to-end test, compliance and audit. Google API `status.privacyStatus=private` + `status.publishAt` handles the transition if permitted. Backend polls every 15 minutes and stores confirmed state.

## Routes
- `GET /health` — public and non-sensitive; indicates OAuth and upload gating flags.
- `GET /ready` — intentionally returns 503 until Google authorization and confirmed channel ID are available.
- `GET /auth/google/start`, `GET /auth/google/callback` — Google OAuth code grant + PKCE, offline access, owner email enforcement; no secrets in URLs sent to GitHub.
- `GET /api/status` — owner session Bearer required; list server job states, channel identity and recent logs.
- `POST /api/content` — owner-only draft upsert; requires title/description, ISO future `publishAt`, flags for made-for-kids and realistic synthetic content.
- `POST /api/content/:id/media` — owner-only, raw MP4, max 150MB, signature checked, SHA-256 streamed, stored in private Railway volume.
- `POST /api/content/:id/approve` — server-side approval locked to exact MP4 hash and future schedule.
- `POST /api/content/:id/submit` — if `ENABLE_UPLOADS=true`, performs one resumable upload; marks ambiguous outcomes `needs_review` to prevent duplicates.
- `POST /api/content/:id/verify` — checks YouTube status and target channel before marking Published.

## Security boundaries & known limitations
- Current authentication is limited to the configured single Google owner email + short-lived session token (stored only in tab sessionStorage); owner must authenticate through Google.
- OAuth refresh token encrypted using AES-256-GCM and key in Railway. Never expose client secret, refresh token or file bytes to Github Pages repo.
- A single Node process and single persistent Railway volume hold JSON job state. This is an early controlled rollout, NOT multi-worker/high-throughput production. More scalable database, reliable upload resume/reconciliation and alerting should be built before higher volume.
- Upload attempts with uncertain Google responses never retry automatically; owner must investigate the YouTube channel to prevent duplicated clips.
- Backend does not create or generate Gemini video; user manually supplies final reviewed MP4.
- YouTube application audits and consent screen verification are external steps BIMA cannot bypass.
- New Railway service and volume may accrue usage charges.

## Automated tests
`cd backend && npm test`: probes healthy endpoint, denied private endpoints, inactive OAuth and CORS origin checks. GitHub Actions checks syntax and these security smoke tests on backend branch PRs.
