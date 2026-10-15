# TikTok Creator Showcase audit — 2026-10-15

## Scope and evidence

Inspected main commit `b5b186f26b756a41004fbd5137d786f329a2c88e`. Main subsequently advanced to `a2f2795749abf87b632fee07d2968cacb2f1ffec` (#53, ROADMAP-only change); its owner-verified status and handoff are preserved in this PR. No AGENTS.md found in checkout. No runtime code changed, Sandbox tests repeated, credentials requested, app created, support message sent or live content modified.

Owner handoff is the evidence for app configuration and pending ticket; this audit did not independently reopen Partner Center or recheck ticket status.

Railway project `64b1a69f-7343-4f4f-a938-3cb362eeb459`, production environment `afe79e5c-3f14-4616-b503-67ee461f6628`, service `001ecaab-6a80-4bb0-8a27-13fc9bd1a534`: latest observed deployment `f0a1f0d0-82bc-4e87-9631-fc8ebc57aac2`, created `2026-10-15T13:04:03.088Z`, SUCCESS, source main, volume /data, no staged changes. Exact deployed commit was not returned by the inventory; do not equate it automatically to audited main.

Read-only HTTP observations:
- GET /health: 200, service bima-content-studio-api, status online.
- GET /auth/tiktok-shop/callback without credentials or authorization code: 400, tiktok_shop_creator_authorization_not_configured.

## Implementation classification

| Area | Classification | Evidence / limitation |
| --- | --- | --- |
| Login Kit/Sandbox and Toolkit | Implemented and working, owner-verified | Not rerun; does not grant Creator Showcase scope. |
| Railway backend | Implemented and working | Deployment SUCCESS and live health response. |
| Registered TikTok Shop callback | Implemented but blocked placeholder | server.mjs immediately returns 400; no code exchange. Redirect configuration alone cannot complete authorization. |
| Creator OAuth start/state/exchange/refresh | Missing implementation | Existing start/exchange routes use Login Kit client_key and open.tiktokapis.com, not TikTok Shop creator authorization. |
| Creator token storage and granted scopes | Missing implementation | Existing encrypted account storage belongs to Login Kit. No separate Creator account lifecycle found. |
| Live Showcase client/signing/sync | Missing implementation | tiktok-showcase-contract.mjs only accepts an injected fetchPage and labels normalized records fixture; it is not imported into server.mjs. |
| Frontend connection | Login Kit implemented; Creator integration missing | tiktok-connection.js explicitly labels Sandbox/Login Kit. No live Showcase connect/sync control. Static source review only, no browser end-to-end PASS claim. |
| Review and Creator entitlement | Requires TikTok approval | Draft/missing fields per owner; approval/allowlisting not established. |

## Review blocker diagnosis

1. Wrong category: **not established**. Official App Category Selection Guide explicitly includes Customer Engagement > Creator collaborations for affiliate tools. The Affiliate Integration guide uses a different label, Affiliate. Keep the existing app; request TikTok's mapping confirmation, not app recreation.
2. Frontend/backend validation mismatch: **leading hypothesis**, based on required fields absent from form. There is no public incident confirmation or internal diagnostic evidence proving the exact defect.
3. Field mapping error: **possible**, not proven. No public schema mapping feature_intro/test_instruction to visible labels or supported review submission endpoint was located. Do not infer writable hidden fields from the error.
4. Missing review prerequisites: **unresolved**. Public-app review can require app/design evidence and market-specific steps. Official review guidance directs missing submission paths/templates to support. There is no evidence identifying a specific unmet prerequisite for this account.

Exact-field searches did not locate a usable public TikTok fix. Direct documentation opens sometimes returned only the JavaScript shell; indexed official documentation supplied the content cited below. Open Toolkit public package evidence establishes app listing/diagnostics, not a supported review repair/submission operation. No command was invented or rerun.

## Supported resolution and acceptance

Continue existing ticket 2026101415120200008 with the draft in tiktok-affiliate-api-access-request.md. Ask TikTok to restore visible editable required fields on the existing Draft app, or give an official supported submission route; identify any actual missing prerequisite and confirm Creator activation for Indonesia. If pre-review development access is available, request it for the existing app through the partner manager; this is conditional on TikTok approval, not an established workaround.

Resolution evidence must be: both fields can be supplied through supported UI/workflow; submission transitions out of Draft; required access is granted; complete Creator integration obtains a distinct creator token after owner consent; granted scopes contain creator.showcase.read; actual API data matches @noor_arief's Showcase. A successful empty Showcase response proves a permitted read, but not retrieval of products when the account has products.

No real Showcase read has passed. No backend edit can fix TikTok's remote review-form validator. Backend integration remains separate necessary work; do not claim approval will automatically complete it.

## Official references

- Category guide: https://partner.tiktokshop.com/docv2/page/hulvi36o
- App review: https://partner.tiktokshop.com/docv2/page/app-review-process
- Affiliate activation: https://partner.tiktokshop.com/docv2/page/affiliate-integration
- Creator authorization: https://partner.tiktokshop.com/docv2/page/678e3a362dccb8030ea6f98c
- Showcase API: https://partner.tiktokshop.com/docv2/page/get-showcase-products-202405
- Toolkit package: https://www.npmjs.com/package/@tts-open-toolkit/cli
