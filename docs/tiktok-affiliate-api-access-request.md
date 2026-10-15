# Existing TikTok App Review ticket — prepared follow-up

Updated 2026-10-15. **Draft only; not sent.** Supersedes the obsolete app-creation request previously in this file.

Ticket: **2026101415120200008**, opened 2026-10-14; pending per owner.
App: BIMA Content Studio, Public, Indonesia.
Category: App Developer > Customer Engagement > Creator Collaborations.
Creator: @noor_arief.
Frontend: https://noor-arief.github.io/Bima-Content-Studio/
Backend: https://content-studio-api-production-3fe2.up.railway.app/

## Draft for the existing ticket

Hello TikTok Shop Partner Center Engineering,

Please continue ticket 2026101415120200008 for our existing BIMA Content Studio Public app in Indonesia. The application already exists under App Developer > Customer Engagement > Creator Collaborations. Four Affiliate Creator scopes have been selected, including creator.showcase.read and creator.affiliate_collaboration.read. App Key/Secret are available, the Railway redirect is configured, and authenticated Open Toolkit app list recognizes the app. Sandbox testing is complete and is not the blocker.

App Review remains Draft because submission validation requires `feature_intro` and `test_instruction`, while neither field is exposed in the review form.

Please resolve or confirm the following for this existing app:
1. Restore the required fields in the supported review UI, or provide an officially documented submission route. Please identify their visible labels and expected formats.
2. Confirm whether the Indonesia / Public / Creator Collaborations form schema matches the backend validator, including any conditional field or stage mapping.
3. If another review prerequisite is responsible, identify the exact unmet prerequisite and supported action. Please do not send generic Sandbox or app-creation instructions.
4. Your App Category Selection Guide lists Creator collaborations, while Affiliate Integration uses Affiliate. Confirm whether our existing category has the correct creator-side eligibility; we are not requesting a duplicate app.
5. Confirm which Affiliate API activation / creator authorization allowlisting is required for this existing app key, and whether approved pre-review Creator testing access can be provided for Indonesia while the form defect is resolved.

Our goal is to read the authorized creator's real Showcase using creator.showcase.read. Login Kit connection is not being presented as Shop authorization. The BIMA Shop callback is currently a rejecting placeholder; the production Creator OAuth/token and signed Showcase integration is not yet complete. We will not claim a passing live integration or bypass approval.

Please preserve the existing application and provide a concrete resolution for the missing review fields. We can provide the app identifier privately in this ticket and sanitized screenshots of the existing error. No App Secret, tokens, session cookies or authorization codes will be attached.

Thank you,
BIMA Content Studio — Vireqo

## Submission material preparation

These are proposed content, not a claim that TikTok accepts these fields via an API.

Feature introduction: BIMA Content Studio is an owner-operated affiliate content workspace for Indonesian creator @noor_arief. The planned Creator API integration reads only the consenting creator's Showcase to support product selection and owner-reviewed content planning. Live Showcase access is not active. Automatic shoppable publishing is a separate capability and is not claimed.

Testing instructions: The current build is available at the frontend URL above. Its TikTok connection panel distinguishes Login Kit/Sandbox from Shop access. The registered Shop callback currently rejects authorization with tiktok_shop_creator_authorization_not_configured. Complete Creator OAuth and live Showcase review steps will be supplied with the implemented testable build and approved access. Please first restore the missing review-form fields and identify any prerequisite review stage or approved development access needed. Do not treat the placeholder as a completed integration.

Full audit and official references: [tiktok-creator-showcase-audit-2026-10-15.md](tiktok-creator-showcase-audit-2026-10-15.md).
