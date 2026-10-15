# TikTok Google production

Implemented 2026-10-15. Scope: TikTok only. Existing YouTube workers, schedules,
provider flags and budgets are unchanged. The previous LTX pilot remains separate.

## Pipeline

Authenticated product intake → durable queue → 3 × 8-second Google Veo Fast
image-to-video clips with Indonesian narration and original instrumental audio →
per-scene audiovisual QA → captions timed from the actual narration → 24-second
portrait MP4 → final audiovisual QA → owner review. Approval does not publish.

The worker runs every 15 seconds independently of browser polling. Files and job
state are stored in the existing persistent data volume. Each paid operation is
checkpointed before submission. An uncertain submission is never blindly retried.
Existing operations resume after restart. Every revision is a separate job with
its own budget reservation, preserving the previous video. Two automated owner
revision rounds are supported; further revisions remain recorded for intervention.

## Activation requirements

- Existing `GEMINI_API_KEY` with access to the selected Google API model and billing.
- `ENABLE_TIKTOK_GOOGLE=true` (default: off).
- `TIKTOK_GOOGLE_BUDGET_CENTS` (default: zero). This is a cumulative application
  reservation limit, separate from YouTube. Never reset the ledger to bypass it.
- Verified product identity, a short verified fact, provenance/evidence, and a
  licensed product image. The old reference-only pilot screenshot is not promoted.

Google's published 720p Veo 3.1 Fast price checked on 2026-10-15 is $0.10/second:
three scenes cost an estimated $2.40. Each job reserves $3.00 including $0.60 for
bounded scene/final QA. The reserve is an estimate, not an external billing cap.
See https://ai.google.dev/gemini-api/docs/pricing and
https://ai.google.dev/gemini-api/docs/veo .

## HTTP contracts

All private routes require the existing owner bearer session.

- `GET /public/tiktok/google/status`: readiness/configuration only; no product/job data.
- `GET /api/tiktok/google/status`: jobs, blockers, estimate and review state.
- `POST /api/tiktok/google/products`: internal verified-product intake. Body contains
  `product: {id,name,fact,url,factsVerified,assetsLicensed,evidence}` and `imageData`
  (PNG/JPEG/WebP data URI, max 750KB decoded). Identical input is idempotent.
  Authenticated verification assertions are recorded evidence, not independent
  TikTok Shop verification. A future connector must supply provenance honestly.
- `GET /api/tiktok/google/jobs/:id/video`: private final preview.
- `POST /api/tiktok/google/jobs/:id/review`: `{decision,mediaHash,notes}`. Decision is
  `approve` or `request_revision`. Only the current QA-passed video hash is accepted.

## Remaining external integration gaps

TikTok Shop catalog/showcase access and publishing are still not connected.
The worker exposes verified intake; it does not claim to discover products or
validate affiliate eligibility through an unavailable API. No paid Google job was
run during implementation. API access, native audio quality, real product fidelity,
and the final owner's quality standard still require a live pilot.

## Validation

`node --test qa/tiktok-google.test.mjs` covers mocked provider lifecycle, budget
isolation, duplicate protection, restart recovery, rejected QA, revision history,
reference validation, subtitle checks, download origin validation, and real FFmpeg
assembly of synthetic clips. Synthetic media is only a technical test and is never
presented as a generated affiliate sample.

`npm test --prefix backend` covers the existing backend and private route access.

## Owner workflow (15 October 2026)

The default owner workspace now has three task views: **Perlu Review**, **BIMA Sedang Bekerja**, and **Jadwal & Hasil**. Connection setup is separate. Review shows only reviewable server jobs; work shows processing and failed/revision jobs; results shows approved jobs. Legacy local drafts are hidden by default on every owner view, so they cannot be mistaken for server production or live upload schedules.

The intended business flow is product discovery and evidence-based selection → video production and QA → owner review → scheduled shoppable upload. This is NOT yet an operational end-to-end pipeline. Current hard blockers:

- TikTok Shop Affiliate Creator authorization, catalog/showcase intake and product performance data are not integrated. Login Kit is not catalog authorization. Verified manual intake does not make the source connector connected, nor prove a product is winning.
- Google generation requires its independently approved API budget; Flow consumer credits are not wired to the server.
- No shoppable publishing connector or server publisher is implemented. Approved videos remain **approved, not scheduled/published**. Connecting an ordinary scheduler alone does not prove product-link attachment is supported.
- Metricool account lookup in this session reports no connected social networks. No posts were scheduled or sent.

Relevant official capabilities to validate against the app's granted region/scopes before implementation:
https://partner.tiktokshop.com/docv2/page/get-showcase-products
https://partner.tiktokshop.com/docv2/page/post-shoppable-video-202603
https://developers.tiktok.com/docs/en/content-sharing-guidelines

Do not present a mock scan, unsupported winning score, local calendar date, or plain-video upload as a successful affiliate workflow.
