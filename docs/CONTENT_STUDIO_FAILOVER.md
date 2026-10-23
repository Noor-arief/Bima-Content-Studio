# Content Studio failover — provider-independent API endpoint (P0)
Status: **prepared on development branch only**. No Render backend, offsite backup, or live failover has been verified.

The owner dashboard now uses `backend-endpoints.js` for the backend URL in analytics, publishing and public-safe counters. It accepts **only exact HTTPS origins** explicitly approved in the source; no wildcard Railway, Render or arbitrary host is trusted. After an approved backend change, an owner browser session is cleared. This prevents inadvertently forwarding Railway bearer sessions to a different provider.

## Activate only after real recovery prerequisites

1. Provision and verify ownership of an actual standby hostname with HTTPS and a checked certificate, approved by the owner and security review. Currently `APPROVED_STANDBYS=[]`, deliberately; do not add a guessed or uncontrolled `onrender.com` hostname.
2. Verify Render build, recurring cost, volume, and private environment vars. Restore an **actual consistent encrypted** snapshot of `/data/state.json` and `/data/media` with matching key; validate checksums and account IDs. Production data are NOT contained in GitHub.
3. Audit and rotate potentially exposed credentials, following Railway's security notice. Carefully preserve encrypted OAuth state before changing `TOKEN_ENCRYPTION_KEY`; expect provider reauthorization when switching OAuth callback URLs.
4. Keep worker/video generation, uploads, scheduling, TikTok and paid jobs disabled on standby while Railway is primary. Require only one active writer, reconciled video IDs and manual owner activation. Never assume duplicate uploads are prevented merely by CI.
5. Add the verified exact standby HTTPS **origin only** to `APPROVED_STANDBYS`, trigger PR CI, approve and deploy the frontend update. Use the Publishing endpoint field to select the approved standby, then sign in as the owner on the new backend. Existing Railway sessions must not be forwarded.
6. Verify public `/health`, `/ready` and authenticated `/api/status`, expected YouTube channel lock, Analytics API, media status and one safe test draft. Test switch **back** after recovery and confirm no duplicate uploads.
7. Record offsite backup checksum, restore date, actual RPO/RTO, version/commit, failover logs and owner acceptance under BIMA issues #157 and #158.

**Important:** A green GitHub Pages deployment/CI or HTTP 200 /health is not proof that private YouTube data, jobs or tokens were recovered. Until a restore drill passes and backup is stored outside Railway, mark DR status **NOT READY**.
