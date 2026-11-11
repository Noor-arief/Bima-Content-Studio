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

## Shorts Auto Convert (new, no YouTube publish)
- Open a calendar draft with a saved Gemini MP4 in the Shorts Production Desk.
- Sign in as the YouTube owner (secure Railway session), then press **Auto Convert 9:16**.
- Default **Blur background** preserves the full 16:9 frame, or choose **Crop to fill**.
- POST /api/convert-shorts?mode=blur|crop is owner-authenticated, MP4-only, max 30MB, max 65 seconds, serial (one at a time), and outputs H.264/AAC 1080x1920. Processing uses FFmpeg in temporary storage, with no persistent video upload or YouTube publish.
- The converted MP4 replaces the local draft asset in IndexedDB only after conversion succeeds; the original stays in IndexedDB as a restore backup. **Download MP4** can save a local copy. This invalidates previous editorial approval, requiring another review.
- This feature is separate from ENABLE_UPLOADS and ENABLE_PUBLIC_SCHEDULING, which remain false during private pilot.

## Security boundaries & known limitations
- Current authentication is limited to the configured single Google owner email + short-lived session token (stored only in tab sessionStorage); owner must authenticate through Google.
- OAuth refresh token encrypted using AES-256-GCM and key in Railway. Never expose client secret, refresh token or file bytes to Github Pages repo.
- A single Node process and single persistent Railway volume hold JSON job state. This is an early controlled rollout, NOT multi-worker/high-throughput production. More scalable database, reliable upload resume/reconciliation and alerting should be built before higher volume.
- Upload attempts with uncertain Google responses never retry automatically; owner must investigate the YouTube channel to prevent duplicated clips.
- Veo generation code is implemented but gated behind an owner-provided Gemini API key, explicit paid generation approval and Railway controls; manual MP4 remains supported.
- YouTube application audits and consent screen verification are external steps BIMA cannot bypass.
- New Railway service and volume may accrue usage charges.

## Automated tests
`cd backend && npm test`: probes healthy endpoint, denied private endpoints, inactive OAuth and CORS origin checks. GitHub Actions checks syntax and these security smoke tests on backend branch PRs.

## BIMA Auto Video Production — gated Veo API pilot

The YouTube Production Desk now includes an autonomous pipeline: selected calendar brief → storyboard adaptation for 8 seconds → native audio Veo 3.1 → backend video vault → automatic MP4/duration/portrait/audio-track technical checks → secure video preview → owner Approve or Request revision → YouTube approval/scheduling gate.

- API pricing: Fast 1080p $0.96 per 8-second successful clip, Lite 1080p $0.64. 2026 official docs: https://ai.google.dev/gemini-api/docs/veo and https://ai.google.dev/gemini-api/docs/pricing .
- In Google AI Studio https://aistudio.google.com/api-keys import BIMA Content Studio Cloud project if needed, enable Gemini API paid tier and create a modern authorization key for Gemini; the YouTube OAuth client is NOT the Gemini API key.
- In isolated Railway service Variables, set `GEMINI_API_KEY` privately. `VEO_PILOT_BUDGET_CENTS=500` is configured and `ENABLE_VEO_GENERATION=false` by default. After confirming Google paid tier and reviewing costs, owner may enable the flag. Never paste the key into the website, public repo, chat or issues.
- One video job at a time. Each paid request requires explicit owner confirmation and reserves the configured price against a cumulative *lifetime* $5 cap. Revisions never erase previous reservations. Failed/ambiguous responses do not automatically refund estimated budget or silently regenerate.
- Owner authenticated routes: `GET /api/veo/status`, `POST /api/veo/generate`, `GET /api/veo/:id/video`, `POST /api/veo/:id/reject`, `POST /api/veo/:id/accept`. A successful accept imports the finished MP4 to the standard Content Studio draft. YouTube publish remains subject to original explicit approval, future schedule, verified channel, compliance and Railway flags.
- Automatic QA covers MP4 parse, audio-track presence, portrait framing, and 8-second length. It CANNOT reliably certify narration quality, scientific accuracy, action continuity, rights or full ending: owner MUST watch and listen before accepting. An unsatisfactory render can be rejected; additional generation is a new paid action.
- Model operations and job ledger stored in Railway persistent volume. Poll every ~20 seconds. After uncertain network outcomes, review before retry to avoid duplicate charges. Local max budget is NOT a Google billing hard cap; independently set billing alerts/budgets.
- This feature is deployed with paid generation OFF until the owner provides a Gemini API key. No Veo credits have been spent by deployment.
