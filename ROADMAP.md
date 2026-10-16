# BIMA Content Studio — Affiliate Roadmap
Updated: 2026-10-16 · Planning document, not proof of deployment or integration.

## Performance checkpoint — 16 October 2026 (latest performance work)

**User report:** BIMA Content Studio website feels very slow. This is a browser/frontend performance issue; do not confuse it with slow ChatGPT responses or TikTok API approval. No browser performance measurements yet, so root cause of all slowness is **not confirmed**.

**Completed and merged:**
- [x] **PR #61** (`6308105dc9dfc39d6263dbf0fbbd9dbc0d1e386c`): calendar rendering now groups items by date once instead of rescanning all YouTube items for each of 42 calendar cells; retains deduplication and calendar content. BIMA Calendar Performance QA PASS.
- [x] **PR #62** (`c1dfa18b6c903d978dab230f3ebfe174f1b3d89e`): `renderChannels()` reuses existing channel buttons/images/listeners during state renders rather than rebuilding every time. Calendar Performance QA PASS.
- [x] Both changes are already merged into `main`; do **not** redo, revert, or repeat their implementation without evidence.

**Next checkpoint — performance-only scope:**
- [ ] Collect **measured** browser navigation/initial-load timings, long tasks, network waterfall, memory and localStorage size, ideally desktop and mobile. Distinguish initial loading from click-to-render slowness.
- [ ] Profile expensive calls in `index.html` (`persist() → render()`, `renderCalendar`, `renderQueue`, `renderEditor`), image/thumbnail loading and startup cost of deferred scripts. Current main `index.html` is approximately 324 KiB and loads numerous scripts, but file size alone does not prove the bottleneck.
- [ ] Apply *only* proven bottleneck fixes; minimize and isolate changes. Never delete or modify scheduled/published content, storage keys, YouTube/Shopee/TikTok workflows, menus, Creator OAuth, or working styling.
- [ ] Run browser-based navigation, cross-channel, reload/persistence, desktop/mobile regression QA plus existing CI. Compare before/after measurements; don't claim website fully fast from static code tests alone.

**Separate ongoing TikTok issue:** the **16 October App Review rejection and test-authorization path in the section below** is newer than the 15 October submission status further down. Do not reset its status back to “under review.”

## Current action — 16 October 2026 (supersedes historical review status below)

Owner screenshot confirms Indonesia App Review was REJECTED: submitted screenshots/video did not demonstrate TikTok Shop product/order synchronization. The missing-form-fields issue is resolved and must not be reopened. PRs #57/#59 already implemented Creator authorization and signed Showcase reads; older statements that these are missing are historical.

The owner UI now provides Creator status, authorization in a separate tab (preserving the owner session), and explicit Showcase sync under TikTok Production 1 and Settings. It displays only successful API product names/IDs with read time, handles empty/error/disabled states, and does not claim GMV, automatic research or publishing. Existing video intake and publication remain separate, incomplete integrations.

Next external gate: ask TikTok through the existing support case for permitted Creator testing access on the existing Indonesia application, and confirm eligibility for the beta test account documented in the Creator Authorization Guide. Do not enable live access until TikTok grants production or explicit development/test authorization. Production approval is not the only possible authorization; an official test grant is sufficient for isolated review testing.

After permitted access: securely verify runtime configuration, owner consent, successful live Showcase read, then capture a genuine product synchronization walkthrough for resubmission. Do not send the previous design-only evidence again. Do not fabricate products or order data. No automatic resubmission, paid generation, or posting is performed by this fix.


## Creator Showcase next-stage progress — PR #59 merged (2026-10-15)

**CODE + CI PASS (9/9), not approved live access.** Implemented expiry-aware token refresh in the owner-protected Showcase route, encrypted storage of refreshed access/refresh tokens, bounded multi-page collection (up to 10 pages), Product ID deduplication, invalid-product/cursor-cycle checks, and unit regression tests. GitHub Actions on PR head `d5ba34a0f9cbf047e39bce9f5ce46af268f25ef5` returned 9/9 success. PR #59 merged to main at `bcfc5b2d8c2d156da2b5dd606085512ee017ed76`.

**Remain blocked/pending:** TikTok review approval; Creator authorization; runtime credentials and explicit feature enable; live authorized Showcase API read; UI wiring to Production 1; end-to-end production verification. GMV is not returned/verified by this module and must not be invented. Feature stays disabled by default; no changes to YouTube/Shopee/scheduled content.

## Implemented next stage — PR #57 merged (2026-10-15)

**CODE MERGED, QA PASS — NOT LIVE AUTHORIZED.** PR #57 introduced `backend/tiktok-shop-creator.mjs`, module unit tests, and owner-protected routes in `backend/server.mjs`:
- `POST /auth/tiktok-shop/creator/start` (owner authentication required; one-time state persisted)
- `GET /auth/tiktok-shop/callback` (state consumed once, creator token exchanged, encrypted at rest)
- `GET /auth/tiktok-shop/creator/status` (owner only, reports configured/granted scopes accurately)
- `GET /auth/tiktok-shop/creator/showcase` (owner only, signed official API; no fabricated GMV)

**Deployment safeguard:** disabled by default unless `TIKTOK_SHOP_CREATOR_ENABLED=true` and separate `TIKTOK_SHOP_APP_KEY`, `TIKTOK_SHOP_APP_SECRET`, existing encryption key, and PUBLIC_BASE_URL are available. DO NOT enable or enter new credentials before TikTok approves the app and grants the Creator API scopes. Do not confuse `TIKTOK_CLIENT_KEY` used for Login Kit with TikTok Shop app key.

**QA evidence:** GitHub Actions for commit `139fbce781e5cfe9dec49e4ea238ec2b0fe4a967` completed 9/9 PASS, including TikTok Shop Callback QA with the Creator module tests, OAuth backend, Content Studio backend, TikTok Google, UI, and other regression workflows. PR #57 squash merged as `b5ef9766acda1f2091a1a81fc8eed69ec2fc2d62`.

**NOT YET FINISHED:** live Creator OAuth, token refresh persistence orchestration, real Showcase pagination end-to-end, production secret configuration, frontend connection action, production deployment confirmation, and authentic creator product read. These remain gated by TikTok official review/approval; do not declare the service connected or production PASS. Next priority after approval: confirm entitlement and secrets securely, owner consent, validate real Showcase GET, then integrate verified product list into Production 1 without faking GMV.

## CURRENT REVIEW RESULT — 2026-10-15 (supersedes earlier blocked/draft descriptions)

**OWNER-VERIFIED: TikTok Shop App Review successfully submitted.** After filling all required form fields and uploading Product Screenshots, Product Walkthrough, and Product Design PDF, TikTok displayed the successful-submission notification. Reopening **Ulasan Aplikasi** showed **“Review app sedang diproses untuk 1 pasar — Indonesia (Lokal)”**. The review lists **Read Showcase Products**, **Read Creator Affiliate Collaborations**, **Affiliate Information**, and **Read Affiliate Share Link**. This is **IN REVIEW**, not APPROVED; the general application header may still say Draft while review is pending.

**CORRECTED ROOT CAUSE:** Previous assertion that missing `feature_intro` / `test_instruction` necessarily represented an unresolved TikTok backend bug was wrong. Owner completed the review form and submission succeeded; stop troubleshooting or escalating that obsolete blocker. The only external gate now is TikTok's review/approval and subsequent creator authorization.

**NEW VERIFIED BACKEND GAP:** `backend/server.mjs` currently registers GET `/auth/tiktok-shop/callback` but always responds HTTP 400 `tiktok_shop_creator_authorization_not_configured` (lines around 270–274 of source at this audit). The TikTok Login Kit callback is a separate feature and **is not** a TikTok Shop Creator OAuth token. The existing `backend/tiktok-showcase-contract.mjs` provides offline fixture normalization only, not a live signed TikTok Shop Showcase API adapter.

**NEXT ENGINEERING PRIORITIES (no repeated onboarding):**
1. Build a secure owner-initiated TikTok Shop creator consent initiation route and validate one-time state/expiry and redirect match; do not rely on TikTok Login Kit tokens.
2. Implement official creator code/token exchange, encrypted persistence, refresh/revocation, scope checks (including granted `creator.showcase.read`) and redacted logs, based on the **current documented TikTok Shop Affiliate Creator authorization specification**. Do not guess endpoint names, query parameters, signing rules or use private APIs.
3. Implement real Showcase Products read, pagination, API validation, Product ID normalization and reliable source labeling; do not infer GMV values missing from a response or mark mock data live.
4. Test offline with mock HTTPS responses and QA that authorization attempts show correct pending/blocked status; don't spend video-generation credits or publish. After official approval, perform explicit owner creator authorization and a single real Showcase read as live acceptance.
5. Keep TikTok existing UI, YouTube/Shopee workspaces, scheduled content and all deployed configurations unchanged unless required by a verified fix.

**Do not click Publish merely because review submission succeeded; do not re-submit the review unless TikTok requests changes.**

## Previous verification — 2026-10-15 (historical; superseded where contradictory)

**DO NOT REPEAT completed setup. The only integration target now is Creator Showcase API.** This section supersedes older "not authenticated" and generic "run toolkit" instructions below.

| Component | Status / evidence | Next action |
| --- | --- | --- |
| TikTok Shop Partner Center application | **EXISTS**: BIMA Content Studio, Public, Indonesia, Creator Collaborations; Draft. Existing app appeared in authenticated `app list`, total=1. | Keep the existing app; do not create another. |
| App key / redirect | Existing app key and Railway TikTok Shop callback shown in authorized app listing; do not copy credentials into tickets. | Do not repeat setup. |
| Open Toolkit | **LOCAL AUTH PASS**: Windows VS Code CLI v0.1.7 installed, OAuth callback completed, authenticated app listing returned `code:0`. | No more Toolkit login/installation diagnosis. |
| Sandbox / Login Kit | Previously reported connected in existing BIMA settings; separate from Creator Showcase. Toolkit `sandbox shop list` without region reported missing region, `--region-code ID` failed type validation, `--region-code 1` returned HTTP 200 / `data:{}`; **not proof of Indonesian creator sandbox, not a blocker to pursue further now**. | STOP repeating sandbox tests. |
| Creator scopes | Four scopes selected, including `creator.showcase.read` and `creator.affiliate_collaboration.read`. **Selected does not mean granted**. | Verify grant only after app review / authorization. |
| App Review | **BLOCKED / DRAFT**. Form omits `feature_intro` and `test_instruction`, though TikTok backend requires both. Existing support ticket pending. | Investigate *supported* review form flow/field mapping, category eligibility, engineering escalation; no undocumented bypass. |
| Creator Showcase live | **NOT CONNECTED**. No approved creator-scoped TikTok Shop token, no verified live GET Showcase results. | Build/test pending official authorization; then validate real response. |
| Showcase offline contract tests | **IMPLEMENTED**: `backend/tiktok-showcase-contract.mjs` and `qa/tiktok-showcase-contract.test.mjs` cover paginated fixtures, ID, verified GMV gating. | Integrate to actual creator adapter only when approved. |
| Shoppable publishing | **BLOCKED** pending its own API permission; Product ID preserved as intended publication linkage; never draw a fake yellow basket. | Separate from Showcase read. |

**Immediate Work handoff:** (1) audit existing TikTok Shop creator OAuth/Showcase code; (2) investigate App Review missing-field error using official documented paths and identify one supported fix or clear external engineering blocker; (3) implement remaining authorized Creator Showcase adapter, safe token lifecycle, pagination and mock regression tests (not fake live data); (4) keep YouTube, Shopee, Google Flow setup, TikTok menus and scheduled content unchanged; (5) never claim live Showcase until official endpoint succeeds. Do not ask owner to reinstall Toolkit, re-login, create an app, or recheck sandbox.

## TikTok Shop Open Toolkit — historical diagnostics (superseded by latest status above)

**Tool verified from public package documentation:** `@tts-open-toolkit/cli` (`tts_open_toolkit`). Its supported authenticated commands include listing Partner Center apps, sandbox shops/products and available DevAPI operations. This is a *diagnostic/test harness*, **not** an App Review bypass, guaranteed creator sandbox, or approved Showcase token. The installed environment has not authenticated to this account; no connected-app verification is claimed.

**Run in trusted local development environment (Node 18+, without exposing App Secret or bearer tokens):**

```sh
npm install -g @tts-open-toolkit/cli
tts_open_toolkit doctor
tts_open_toolkit auth login
tts_open_toolkit auth basic-info --json
tts_open_toolkit app list --json
tts_open_toolkit sandbox shop list --json
tts_open_toolkit devapi list --json
```

If a test shop ID is actually returned, `tts_open_toolkit sandbox product list --shop-id <shop-id> --json` can verify test-product access, **not creator Showcase eligibility**. Do not put printed OAuth tokens or secrets into GitHub Issues/commits. Inspect `app list` for existing BIMA Content Studio Public/Draft app and its capabilities; do not create another app or modify existing scope configuration.

**Decision gate:**
- If toolkit can list the existing app and sandbox: record only sanitized app status and sandbox capability in QA evidence, then run isolated contract testing using sandbox fixtures.
- If app is listed but creator scopes are unavailable: keep the App Review `feature_intro` / `test_instruction` support ticket open; Creator Showcase live testing remains blocked.
- If Open Toolkit authentication or API access fails: capture the sanitized error code + CLI doctor output; don't infer the missing permissions or silently substitute a TikTok Login Kit token.
- Use the official `Get Showcase Products` API Testing Tool only **after** creator authorization and access token with `granted_scopes` includes `creator.showcase.read`; failing that, offline Showcase fixture tests are the only validated no-approval test path.

**References:** https://www.npmjs.com/package/@tts-open-toolkit/cli ; https://partner.tiktokshop.com/docv2/page/get-showcase-products-202405 ; https://partner.tiktokshop.com/docv2/page/678e3a362dccb8030ea6f98c

## TikTok Showcase unblock + test track — 2026-10-15 (P0)

**Verified from owner Partner Center support screenshot, not inferred from old onboarding notes:** BIMA Content Studio **Public** application exists in Indonesia under `App Developer > Customer Engagement > Creator Collaborations`. Four Affiliate Creator scopes are selected, including `creator.showcase.read` and `creator.affiliate_collaboration.read`, but **scopes are not approved yet**. App Review remains **Draft** because backend requires `feature_intro` and `test_instruction` while the form does not expose either field. Support ticket **2026101415120200008** is pending engineering help. Do not claim a creator token, approved scopes, live Showcase or authorized GMV data.

**Root-cause candidates, not proven:** incorrect review-form mapping for the selected market/category; account entitlement gap because the documented Affiliate ISV category is `App developer > Customer Engagement > Affiliate`, rather than Creator Collaborations. Request category confirmation and form-field fix in same ticket. Do **not** forge private review API requests, alter hidden form fields, or bypass approval.

**Path A — permitted tests NOW (no creator token):**
- [x] Create isolated, deterministic mock Showcase contract + paginated fixture tests; never label fixtures as live or feed them into production job scheduling.
- [ ] Test BIMA candidate selection, GMV evidence validation, storyboard, review/revision and approved publication-intent **offline**, with `ENABLE_TIKTOK_GOOGLE=false`, budget zero, no video spending and no posting.
- [ ] QA owner UI against that fixture and verify data origin visibly reads TEST. This is not a production Showcase connection.

**Path B — official TikTok test access, parallel to support ticket:**
- [ ] Check whether Partner Center allows creating **Affiliate (custom)** app under correct eligible category; official Affiliate Integration documentation explicitly names this for testing. Do not create a Local Seller replacement.
- [ ] Ask App Store/Partner Manager whether a **beta creator test account** can be provisioned for Indonesia; official Creator Authorization documentation limits test accounts to beta members.
- [ ] Once TikTok activates scopes and app key, register the TikTok Shop creator callback separately from TikTok Login Kit, authorize creator with CSRF state, exchange shop creator token server-side, then use official API testing tool/GET `/affiliate_creator/202405/showcases/products`.
- [ ] Check pagination, source timestamps, actual GMV availability and publish eligibility; never treat order count as GMV, or fabricated test products as winning.
- [ ] Treat yellow basket/shoppable posting as a separate permission and integration from reading Showcase.

**Official references:** https://partner.tiktokshop.com/docv2/page/affiliate-integration ; https://partner.tiktokshop.com/docv2/page/678e3a362dccb8030ea6f98c ; https://partner.tiktokshop.com/docv2/page/get-showcase-products-202405

## Scope and preservation rules
- Three strictly separated workspaces: YouTube (Science & Nature), TikTok Shop Affiliate, Shopee Video Affiliate.
- Never modify published/scheduled YouTube content, existing MP4s, working features, or the latest fixes made outside this session without an explicit approved change plan.
- TikTok and Shopee have separate product selection, research, storyboards, calendars, reviews, posting status, storage and analytics. Cross-posting is opt-in only after verifying product eligibility and asset rights for both platforms.
- No fake connected/published statuses, unsupported sales estimates, or promises of guaranteed sales. All integrations require verified credentials and supported API permissions.
- First: snapshot/backup, isolate changes, test per channel, owner acceptance; only then release. Do not equate Git push with QA PASS.

## Current implementation audit (code inspection only; UI/runtime not yet QA PASS)
- Current implementation uses `affiliate-workspace.js` shared UI engine with independent `tiktok-affiliate.js` and `shopee-affiliate.js` configs and separate browser stores (`bima-tiktok-affiliate-v1`, `bima-shopee-affiliate-v1`).
- `channel-navigation.js` has channel-specific section labels; YouTube panels must remain exclusive.
- Both affiliates have summary/pipeline, production calendar, product economics, scored candidate review, AI-video brief, MP4 review, publishing checklist and manually-entered performance metrics.
- No verified TikTok Shop / Shopee Affiliate connection, auto-upload, automatic revenue sync or live product ingestion at audit date.
- Scoring uses user-entered data, not independent proof of a winning product. Fixed 24-second three-scene prompts are defaults, not universal evidence-backed optimization.
- Audit pending: navigation clicks, browser responsive layout, section visibility, data isolation, backup/restore, legacy draft compatibility, keyboard use, error handling and true end-to-end publishing QA.

## Phase 0 — Stabilization and QA (P0)
- [ ] Snapshot latest live branch and backup local draft data; record deployed commit.
- [ ] Verify YouTube ↔ TikTok ↔ Shopee navigation (Summary/Calendar/Desk/Publishing) at desktop/mobile breakpoints; check no YouTube cards are present elsewhere.
- [ ] Verify data persists independently between TikTok and Shopee and that changing one platform never mutates the other or YouTube.
- [ ] Review any obsolete shared affiliate form for duplication and only remove after confirming migration/backup.
- [ ] Document smoke-test evidence and owner acceptance; rollback plan. No live scheduled content changes.

## Phase 1 — Winning Product Research Engine (P1)
- [ ] Separate TikTok Shop research queue: current demand/units, creator competition, commission availability, storefront/Showcase eligibility, visual demo potential and source timestamps.
- [ ] Separate Shopee Video research queue: listing sales, ratings/reviews, seller eligibility, affiliate link, basic/XTRA commissions where actually available, inventory, returns and source timestamps.
- [ ] Research fields: product URL/ID, listing screenshot or verifiable source, observation date, cost, estimates vs confirmed values, affiliate eligibility and confidence.
- [ ] Score with explicit weights for demand, estimated net commission, competition, rating/returns, demo potential; mark incomplete data as UNKNOWN, never automatically 'winning'.
- [ ] Define product validation gates: seller/affiliate eligible, stock, claims verified, suitable image rights, non-misleading video, owner selection.
- [ ] Test pilot with 1 TikTok product and 1 independently chosen Shopee product; record baseline before production.
- [ ] Determine compliant, sustainable access to live research data; do not invent scraping or permissions.

## Phase 2 — AI Product Video Engine (P1)
- [ ] Provider-agnostic adapter: reference images → storyboard → image-to-video clips → voice-over → subtitles → editing/render → QA → MP4 asset.
- [ ] Test Kling AI first and Runway Gen-4 Turbo as comparator; Hailuo and Wan are fallback candidates after validating API, pricing and service geography.
- [ ] One or two real products with authorized product reference photos, portrait 9:16, approximately 15–25s initially; vary durations according to results.
- [ ] Strict QA: product shape, colors, branding, packaging, variant consistency, truthful demonstration, rights, audio timing, natural ending, subtitle sync and CTA according to platform.
- [ ] Run small-cost proof of concept before subscription/API integration; log seconds/credits, regeneration count, cost per approved clip and effective cost per final MP4.
- [ ] Human approval required before publishing. Never fabricate personal testimonials, before-after outcomes, discounts, or shoppable UI in frames.
- [ ] Per-platform storyboard/caption by default; optional asset reuse only if the exact product and permissions match.

## Phase 3 — Account connections & publication (P2; permissions first)
- [ ] TikTok: verify creator affiliate / Shop / Showcase privileges for the intended account, applicable official APIs and review/authorization paths.
- [ ] Shopee: verify Shopee Affiliate eligibility, Shopee Video product tagging, affiliate link and officially supported partner API capabilities before building uploader.
- [ ] Auth/credentials stored server-side in Railway; least privileges, refresh lifecycle, disconnect/reconnect and audit log; no secrets in GitHub Pages.
- [ ] Start with review + manual TikTok product tagging and Shopee product tagging. Track independent upload confirmations and URLs.
- [ ] Only implement automatic publishing if official authorization explicitly supports shoppable affiliate workflows; ordinary social posting APIs do not guarantee yellow basket or Shopee product tags.
- [ ] Deduplicate uploads per channel/asset and preserve server-side status; never treat manually entered Published as API verified.

## Phase 4 — Performance & optimization (P2)
- [ ] Track separately by channel: videos, views, product clicks, orders, verified conversions, refunds/returns, approved commission, production costs, net contribution.
- [ ] Manual data entry and CSV export initially; API sync only where officially supported.
- [ ] A/B test hooks, content lengths, angles, products and providers on enough observations; optimize for validated commission relative to cost, not views only.
- [ ] Periodic product revalidation: stock, seller listing, rates and eligibility change over time.

## Definition of done
- Isolated workspaces navigable on desktop and mobile; no regression to YouTube.
- Product records sourced and dated; incomplete/unknown evidence clearly identified.
- Product-accurate AI video produced, reviewed and exportable with costs accounted for.
- Independent TikTok/Shopee manual publication flow working; API connections labeled accurately.
- End-to-end regression tests, rollback and owner acceptance recorded; no 'PASS' claims without verification.

## Decisions pending
1. Is Shopee Affiliate activated and able to tag products in Shopee Video?
2. What TikTok creator/Showcase and developer permissions are actually available?
3. Approve PoC provider budget and permitted product image sources.
4. Determine backend schema and migration plan from browser-local data without data loss.
