# BIMA Content Studio — Affiliate Roadmap
Updated: 2026-10-15 · Planning document, not proof of deployment or integration.

## TikTok Creator Showcase — authoritative handoff (2026-10-15)

Owner-confirmed completed work: Sandbox connected/tested; Open Toolkit installed, authenticated and `app list` recognizes the existing BIMA Content Studio app; Public app created in Indonesia under App Developer > Customer Engagement > Creator Collaborations; four Affiliate Creator scopes selected; App Key/Secret available in Partner Center; Railway redirect configured. These facts do NOT establish approved Creator API access.

**Do not repeat:** app creation, Toolkit installation/login, Sandbox testing, credential requests, or completed Partner Center checks. Do not use private review endpoints or hidden-field injection. Do not change YouTube, Shopee, scheduled content, or existing working integrations.

**Current external blocker:** App Review remains Draft; TikTok validation requires `feature_intro` and `test_instruction` absent from its form. Existing ticket **2026101415120200008**, opened 2026-10-14, is pending per owner. No new ticket or support message sent during this audit.

**Investigation:** Current official category guide explicitly lists Creator collaborations for affiliate tools. The older Affiliate Integration guide uses Affiliate terminology. This discrepancy is not proof the selected category is wrong. The strongest hypothesis is review-form/validator mismatch; exact cause, field mapping and account prerequisites require TikTok confirmation. No documented review-field repair command/API was found.

**Code audit found a separate gap:** Creator OAuth is NOT implemented beyond a rejecting callback placeholder. Neither creator token exchange/refresh/scope verification nor a signed live Showcase transport exists. The existing normalizer/paginator is explicitly offline-only and marks all records fixture. Approval alone will not make this code fetch real products.

| Classification | Current evidence |
| --- | --- |
| Implemented and working | Sandbox/Toolkit accepted as owner-verified; Railway deployment SUCCESS and `/health` 200 observed in this audit. |
| Implemented but blocked | Registered Shop callback exists but deliberately returns 400 `tiktok_shop_creator_authorization_not_configured`; not a complete OAuth flow. |
| Missing implementation | Owner-bound Creator OAuth state, exchange/refresh and encrypted separate token storage, granted-scope validation, signed Showcase client, live pagination/persistence and UI sync. |
| Requires TikTok approval | Review submission repair, applicable Affiliate activation/creator allowlisting, approved scopes and real creator consent. |

Next actions, in dependency order:
- [x] Audit repository and deployed callback without repeating Sandbox testing.
- [x] Record the missing implementation separately from external approval.
- [x] Prepare evidence and targeted follow-up for the existing ticket in `docs/tiktok-affiliate-api-access-request.md` (draft only).
- [ ] TikTok repairs the existing app's review form or supplies a documented supported submission route; confirms prerequisite/entitlement status and category mapping for Indonesia.
- [ ] Complete remaining Creator integration using documented APIs, with offline tests and no production authorization attempt until permitted.
- [ ] After permission is granted, authorize @noor_arief once, verify granted scopes and identity, then fetch and reconcile actual Showcase products. Never mark live access PASS from fixture tests, Login Kit, or deployment success.

Evidence and references: `docs/tiktok-creator-showcase-audit-2026-10-15.md`.

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
