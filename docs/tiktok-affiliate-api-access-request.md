# BIMA Content Studio — TikTok Shop Affiliate Creator API enablement request

**Date:** 2026-10-14
**Applicant / partner display name:** Vireqo
**Project:** BIMA Content Studio
**Target market:** Indonesia
**Creator account to authorize:** @noor_arief (existing TikTok Shop affiliate creator)
**Product:** https://noor-arief.github.io/Bima-Content-Studio/
**Backend:** https://content-studio-api-production-3fe2.up.railway.app/
**Existing integration:** Partner Center Public app is registered, TikTok Shop Open Toolkit authentication and app listing verified; TikTok Login Kit/Sandbox settings are separate and do not establish Creator Showcase authorization.
**Updated 2026-10-15 from owner support screenshot:** Public application **created** in Indonesia, category **App Developer / Customer Engagement / Creator Collaborations**, four Affiliate Creator API scopes selected (not approved). Application remains **Draft**, App Review submission is blocked by backend validation requiring missing form fields `feature_intro` and `test_instruction`. TikTok Shop app key existence and callback registration are **verified through authenticated app list**; approved Creator scopes and actual Creator Showcase data access are **not verified**. Prior 'app not created' status below is stale historical text; do not repeat it as current fact.

**Support ticket:** 2026101415120200008 — ask engineering to fix App Review field mapping and verify whether Creator Collaborations vs documented Affiliate category has the correct entitlement. Do not submit unsupported hidden API parameters.

**Testing while ticket pending:** official Affiliate (custom) app, if Partner Center eligibility allows; beta creator testing account only if App Store Manager provisions it; meanwhile isolated mocked Showcase contract test without spending or publishing.

## Request to Partner Center / Account Manager

**Subject:** Enable Affiliate Creator API for Indonesian creator automation — BIMA Content Studio / Vireqo

Hello TikTok Shop Partner Center team,

We are developing BIMA Content Studio, a web-based, owner-operated AI affiliate content workflow for the existing Indonesian TikTok Shop affiliate creator @noor_arief. We have an existing TikTok Shop Partner Center Public application named BIMA Content Studio for Indonesia, but its App Review is blocked on required fields missing from the review UI.

We request **Affiliate API program eligibility / activation** and confirmation of entitlement for our **existing Public application** and official review/test access, without creating a replacement app, as instructed by the official Affiliate Integration guide.

**Registration mismatch that blocks us:** The Indonesian Partner Center category selector shown to us does not expose the documented “App developer > Customer Engagement > Affiliate” category. The visible adjacent options include “Creator collaborations” and an “Affiliate Partner > Scalable Seller and Creator Matching” category. A custom-app form we reached only supported “Local seller,” not creator-side access. Please enable the appropriate Affiliate ISV category / eligibility for this Partner Center account, or provide the exact supported path for Indonesia. We do not want to misclassify an app.

**Required creator-side scopes / capabilities:**
- `creator.showcase.read` — list the authorized creator's real Showcase products.
- `creator.affiliate_collaboration.read` — discover / inspect eligible open collaboration products (subject to market and program availability).
- Creator authorization enrollment / allowlisting for our TikTok Shop app key when issued.
- Confirm the supported official mechanism, permissions, and policies for linking eligible affiliate products to shoppable videos in Indonesia. We will not represent ordinary Content Posting API uploads as product-linked posts.
- Any additional Creator API scopes will be requested separately only when clearly justified.

**Intended workflow:** Official product discovery → eligibility/commission verification → selection → AI-assisted video creation based on authentic seller product images and verified listing facts → owner approval → authorized shoppable publishing (if TikTok grants that capability) → authorized performance reporting.

**Data/security design:** Only the authorized account's creator data is accessed; creator access/refresh tokens are stored encrypted in the Railway backend, not in browser localStorage or GitHub Pages; least privilege scopes; CSRF state and redirect validation; separate TikTok Shop OAuth tokens from TikTok Login Kit and YouTube OAuth; manual owner approval for paid AI rendering and publication; no scraping, no simulated commission data.

Please confirm:
1. Is Affiliate Creator API onboarding offered for an Indonesia-based, currently private/owner-operated developer application? Are there company registration, multi-merchant, or public app prerequisites?
2. How do we enable or select the documented Affiliate ISV category in this Partner Center account when it is absent?
3. Can the Partner / App Store Manager activate the Affiliate API and allowlist our **14-character TikTok Shop app key** once created, for Creator Authorization?
4. What is the latest category-specific ARD / compliance evidence and application submission path?
5. Which scopes and publication endpoints can legally attach shoppable affiliate products to TikTok videos for the Indonesian creator account, and are they available to new partners?

We can provide screenshots of the available Indonesia category selector, account onboarding status, and our app architecture. Please provide the next actionable requirement rather than Seller Center documentation.

Thank you,
BIMA Content Studio — Vireqo
Contact: hello@vireqo.id

## Technical readiness / acceptance

- [ ] Partner Center account category can create Affiliate app for Indonesia.
- [x] Existing Public application registered and TikTok Shop app key present (verified by authenticated Open Toolkit app list, not published here).
- [ ] Required Affiliate API access approved and creator allowlist activated.
- [x] TikTok Shop redirect URL registered to Railway callback, confirmed by authenticated app list. Creator authorization/granted scopes remain unverified.
- [ ] Creator @noor_arief explicitly authorizes; creator token obtained and encrypted.
- [ ] Actual GET `/affiliate_creator/202405/showcases/products` returns products from authorized creator.
- [ ] Open collaboration discovery validated with real creator-eligible results and reliable commission values.
- [ ] Official shoppable posting/product attachment capability confirmed and tested, or explicitly marked blocked.
- [ ] No fabricated products, metrics, affiliation links, or automatic posting success statuses.

## Official documentation
- Affiliate Integration: https://partner.tiktokshop.com/docv2/page/affiliate-integration
- Creator Authorization: https://partner.tiktokshop.com/docv2/page/678e3a362dccb8030ea6f98c
- Get Showcase Products: https://partner.tiktokshop.com/docv2/page/get-showcase-products-202405
- App category selection: https://partner.tiktokshop.com/docv2/page/hulvi36o
- App review process: https://partner.tiktokshop.com/docv2/page/app-review-process

> No request or approval has been submitted by this file alone. Do not paste tokens, secrets, or personally identifying account numbers into support tickets or source control.
