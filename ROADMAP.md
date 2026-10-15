# BIMA Content Studio — Affiliate Roadmap
Updated: 2026-10-15 · Planning document, not proof of deployment or integration.

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
