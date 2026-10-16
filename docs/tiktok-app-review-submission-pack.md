# Current review recovery — 16 October 2026

Status: REJECTED in Indonesia, per owner screenshot. Review form submission works. Reviewer requires authentic TikTok Shop product synchronization evidence. Earlier missing-field guidance and intended UI screenshots below are historical and must not be resubmitted unchanged.

## Current reviewer walkthrough (requires permitted Creator access)
1. Open BIMA, choose TikTok, then Settings. Sign in using the existing authorized owner flow; do not share production passwords. A separate safe reviewer access arrangement must be agreed before inviting reviewers.
2. In Products Showcase TikTok, inspect server readiness. If disabled, stop and arrange official test access/configuration. Login Kit is a different integration.
3. Click Hubungkan Creator. Complete TikTok consent in the new tab using a creator account TikTok permits for this app. Return to BIMA and click Perbarui status.
4. Click Sinkronkan Showcase. Capture actual product names, exact IDs, source and read time. Match them against the authorized account's Showcase. A zero-product response proves only a successful empty read.
5. Record this continuous flow and use actual screenshots. Redact credentials/tokens. The product read does not prove GMV, winning-product discovery, video generation or shoppable publishing.
6. Submit corrected review material only after successful permitted testing. No resubmission has been made by this fix.

## Prepared follow-up for existing support case 2026101415120200008 (NOT SENT)
Our Indonesia application BIMA Content Studio was submitted successfully, but its review was rejected because the evidence did not show TikTok Shop product/order synchronization. The app is a Creator Affiliate workflow using Read Showcase Products, not seller order management. We have implemented Creator authorization and signed Showcase reads. Please confirm the supported pre-review test access for our existing application and whether an eligible beta Creator testing account can be provided for Indonesia. If beta access is unavailable, please specify the permitted alternative for demonstrating authentic Showcase product synchronization before approval. Please also confirm that Creator Showcase product evidence satisfies this application's review scope. We will provide a genuine API synchronization walkthrough after permitted access is available.

Reference: https://partner.tiktokshop.com/docv2/page/creator-authorization-guide

---

# TikTok Shop App Review — BIMA Content Studio (submission pack)

**HISTORICAL MATERIAL BELOW — superseded by the 16 October update.** Existing Partner Center Public application; App Review still blocked by TikTok validation requesting hidden `feature_intro` and `test_instruction`. This pack describes the product and what to capture; it does **not** substitute for real screenshot, walkthrough, authorized reviewer account, or TikTok approval.

## Existing application / submission identity
- App display name: **BIMA Content Studio**
- Applicant: **Vireqo**, Indonesia
- Official product URL: https://noor-arief.github.io/Bima-Content-Studio/
- Redirect: https://content-studio-api-production-3fe2.up.railway.app/auth/tiktok-shop/callback
- Owner TikTok account for eventual explicit authorization: `@noor_arief`
- Category currently selected: App Developer → Customer Engagement → Creator Collaborations. Ask TikTok whether this provides Affiliate Creator entitlements; do not switch categories without verified guidance.
- Selected-but-not-approved scopes include `creator.showcase.read` and `creator.affiliate_collaboration.read`.

## Product URL field
`https://noor-arief.github.io/Bima-Content-Studio/`

## Application feature introduction (`feature_intro`) — ready to paste when visible
BIMA Content Studio is a creator-operated content workflow developed by Vireqo for TikTok Shop affiliate video production in Indonesia. It is designed to obtain product information from an explicitly authorized affiliate creator's Showcase, build product-specific content briefs and storyboards, prepare short AI-assisted videos, and send completed videos to the owner for review. The owner can approve or request revisions before adding the video to the creator's calendar. Creator Showcase API access and shoppable product attachment are permission-gated. Until TikTok approves the app and the creator authorizes access, the system does not claim to read live Showcase products or publish shoppable TikTok videos automatically. TikTok, YouTube, and Shopee workspaces remain separate.

## Test instructions (`test_instruction`) — ready to paste when visible
1. Open the Product URL above. Navigate to the TikTok workspace only; do not test YouTube or Shopee.
2. Open Production 1 to view the product sourcing, verified-GMV evidence gate, and storyboard workflow. Where Creator Showcase authorization is unavailable, the interface must communicate the blocked/awaiting-approval state instead of claiming live data.
3. Open Production 2 for the video production stage and review its completion requirements. Do not trigger paid generation during compliance review without permission.
4. Open Owner Section to examine video review, approval, and revision routing. Approved items are intended to enter Calendar & Live; unsupported shoppable posting must remain blocked.
5. Open Calendar & Live to view the scheduled publication flow; check that publication and yellow-basket linking are not represented as successful without the required official permissions.
6. In Settings inspect TikTok Shop connection state. A Login Kit or Sandbox connection must not be interpreted as approved `creator.showcase.read`.
7. For live Creator Showcase API evaluation, TikTok must grant the requested creator scope and provide a supported reviewer/test-creator authorization route. No production creator credentials or tokens are embedded in this document.

**Important:** The numbered steps are the *intended walkthrough* from the current design and need direct browser verification before being represented as fully functional. Provide an actual reviewer login or a documented test environment only after it exists and is safe to share via TikTok's secure form.

## Upload mapping for App Review
| TikTok field | Evidence required | Status |
| --- | --- | --- |
| Product screenshots | Three **real** screenshots of TikTok Production 1, Owner Section, Calendar & Live, captured from current deployment | **NOT ATTACHED** — capture and inspect for private data first |
| Product video recording | Genuine MP4 walkthrough of the actual UI/navigation (not a fabricated live API demonstration) | **NOT ATTACHED** |
| Published product design | Product Design PDF accurately explaining TikTok creator sourcing → production → owner approval → calendar; clearly label API as pending approval | **NOT ATTACHED** |
| Product URL | URL above | **READY** |
| `feature_intro` | Text above | **READY, FORM FIELD MISSING** |
| `test_instruction` | Text above | **READY, FORM FIELD MISSING** |
| Reviewer login/test creator | Only through official approval and secure reviewer fields, if required | **BLOCKED / NOT CONFIRMED** |

## Blocking support ticket (existing; do not open duplicate)
**Ticket:** 2026101415120200008

**Update to existing ticket (pasteable):**
Our existing Public application BIMA Content Studio is visible in the authenticated TikTok Shop Open Toolkit app list and has a registered redirect URL. In App Review, submitting the form returns validation errors for required fields `feature_intro` and `test_instruction`, but neither field is rendered in the review form. Please identify the supported UI steps to expose and submit these fields, confirm whether our Indonesia app category “Creator Collaborations” is eligible for the requested Affiliate Creator scopes, and advise how reviewers can test a creator-authorized Showcase integration while entitlement is pending. We will not use undocumented or private endpoints. Please keep this case linked to the existing application.

## Do not misrepresent
- Real screenshots and recordings must originate from current deployed UI.
- Do not click Publish or Submit Review before form validation and evidence checks pass.
- Do not claim Creator Showcase live access, verified sales GMV, auto yellow basket, or creator token before official grants and tests.
- Do not place app secrets, OAuth tokens or reviewer passwords in GitHub.
