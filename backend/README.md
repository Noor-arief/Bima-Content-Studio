# BIMA Content Studio — isolated backend foundation

**Status: infrastructure scaffold only. NOT a live YouTube integration.** This directory is intentionally isolated from the Pages `index.html`. Nothing in this version uploads, schedules, authorizes Google, saves videos, or publishes to YouTube.

## Intended Railway configuration

- **Railway project:** `bima-content-studio`, not any existing BIMA, AVA, Quant, or Vireqo service.
- **Service:** `content-studio-api`, repository `Noor-arief/Bima-Content-Studio`
- **Root directory:** `/backend`, Node >=20, `npm start`
- **Health path:** `/health`. A response with `status: scaffold` is NOT authorization or posting.
- **Readiness path:** `/ready` intentionally returns HTTP 503 until the real secure backend is implemented.
- **Public domain:** generate a Railway HTTPS service domain only after a backend service has been safely deployed and verified. The Google OAuth redirect URI will be that verified origin plus `/auth/google/callback` AFTER route implementation; do not guess it.
- **Cost:** provisioning/deployment can incur Railway usage. Do not deploy or attach always-on resources without owner approval.

## Required before enabling automation

1. Owner-only session/access control on all API actions. Real backend must not trust editable localStorage booleans like `approved` as authorization.
2. Google OAuth Authorization Code with PKCE, exact allowlisted redirect URI, cryptographically random one-time state, explicit YouTube channel ID verification; owner completes consent in Google.
3. Store client secret and refresh token only as Railway server-side environment secrets, or encrypt tokens at rest in server-side persistent storage. Never store them in the browser, GitHub, logs, or AI chat.
4. Persistent server-side database for approvals, statuses, schedules, upload journal, retries, content ID, and audit logs; private S3-compatible object bucket for actual approved MP4s. Browser IndexedDB is only a local preview and is not usable for scheduled posting.
5. Validate original MP4 type, length, width/height, declared owner, storage integrity, title/description, kids/synthetic-media flags and exact scheduling time. Confirm owner approval for a specific file hash and publish target.
6. Upload once to the **exact verified YouTube channel**, mark private, schedule public release through the official API, track API quota, idempotency key, upload status and failures. Never report `Connected`, `Scheduled` or `Published` without YouTube confirmation.
7. Testing-mode OAuth refresh tokens may expire in 7 days for YouTube scopes; plan Google consent screen production/verification and YouTube API project upload restrictions before relying on unattended weeks-long schedules.
8. Upload a dummy video privately and verify the owner/channel, before enabling auto-publication.

## GitHub Pages integration

The static page is at https://noor-arief.github.io/Bima-Content-Studio/ .
This branch deliberately does NOT alter the existing page, change branding, connect third-party accounts, add public upload endpoints, or deploy any backend.

## Local start

```bash
cd backend
npm start
curl -i http://localhost:3000/health
curl -i http://localhost:3000/ready
```

**Acceptance gate:** implement secure server state + OAuth + storage and automated tests, then obtain owner permission to deploy, connect tokens and test upload in Private mode.
