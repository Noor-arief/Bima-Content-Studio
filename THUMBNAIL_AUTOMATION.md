# Orbit & Ocean — Video-Matched Thumbnails V2

Effective for YouTube calendar content on or after **19 October 2026**. Earlier drafts, scheduled uploads and video approval/publishing code remain untouched.

## Two distinct states

1. **CONCEPT preview** — Before an MP4 exists, BIMA displays a topic-based graphic placeholder. It is explicitly labeled **CONCEPT** in the calendar and Production Desk. It is not the final thumbnail and final PNG download is disabled.
2. **VIDEO-MATCHED frame** — Once an MP4 is attached to that draft in Production Desk, BIMA automatically examines up to five time positions in the actual MP4, chooses a reasonably bright/clear frame using a simple visual score, crops it to 1080 × 1920, and overlays the short topic title and consistent Orbit & Ocean branding. The video itself is not modified. After the owner approves the video, the cover is labeled Final.

All final imagery comes from the **attached video frame**, not an independently generated character or illustration. This ensures the actual visual source matches, although the branded text/gradient are additional graphic elements.

The owner may click **Try another video frame** to cycle through alternative positions if the automatic frame is not representative. **Download Final PNG** exports a 1080 × 1920 PNG from the MP4-derived cover. If the selected clip changes or is removed, BIMA invalidates the old cover and regenerates from the newly attached MP4.

## Storage and privacy

- Video bytes remain in BIMA's existing browser IndexedDB video store; thumbnail PNG blobs are saved separately in IndexedDB database `bima-video-matched-thumbnail-v1` and read on later visits in that browser.
- The thumbnail generator does not call Gemini, any remote image service or YouTube API. It does not access OAuth tokens.
- If browser storage is blocked, a generated cover may work for the current tab but might need regeneration after reload.
- If the MP4 no longer exists locally or cannot be decoded, BIMA keeps the concept labeled as such and displays a visible error. It does not falsely represent a concept as a final cover.

## Limitations

- Automatic frame scoring is approximate, not AI visual understanding. Owner should still inspect faces, scientifically correct appearance, visual legibility and title before publishing.
- A video-matched PNG is **not automatically attached to YouTube** by this feature. Custom thumbnail upload and supported Shorts behavior require a separate integration/verification.
- Only one final MP4 is needed. The cover is generated locally; it is not another video production or upload step.


## V3: BIMA → Railway → YouTube thumbnail API (October 2026)

**One-click pipeline:** For a new approved Shorts draft dated on/after 19 Oct 2026, BIMA extracts a cover from the actual attached MP4, uploads the exact PNG to the owner's authenticated Railway backend (PNG format, 1080×1920, max 12 MiB), stores it bound to that MP4's SHA-256, then uploads/schedules the video through the original YouTube endpoint. Once YouTube returns a Video ID, and when `ENABLE_THUMBNAIL_UPLOADS=true`, Railway attempts one `thumbnails.set` API request with that video ID. The OAuth scopes already include `youtube.upload`. Existing video approvals, YouTube Video IDs, and previous dates are unaffected.

**Status vocabulary:**
- `stored_on_railway`: PNG stored securely; YouTube has **not** accepted it yet.
- `applying`: thumbnail upload in progress.
- `api_accepted`: YouTube thumbnail API returned success. Check YouTube Studio for actual display/eligibility.
- `failed`: YouTube rejected the thumbnail (for example, channel eligibility/permissions). **Video upload success remains valid**, with no automatic video retry.
- Video statuses `scheduled`, `private_uploaded` and `published` are tracked separately from thumbnail status.

**YouTube limitation:** The 2026 YouTube Studio desktop supports custom Shorts thumbnails for eligible/verified channels (rollout may vary). The general YouTube Data API provides `thumbnails.set`, but its per-channel Shorts entitlement must be tested. An API 403 is **not** evidence the video failed to upload. Use the saved PNG and desktop YouTube Studio as a fallback only if the API refuses the thumbnail.

**Security:** The endpoint requires an authenticated owner session, validates PNG file signature and 1080×1920 dimensions, limits request size and rejects uploads after YouTube video submission starts. No owner tokens, file paths or OAuth secrets are returned publicly. Thumbnail payloads never change the MP4 hash. Replacing MP4 invalidates stale thumbnails. The feature is not enabled for drafts before 19 October.

**Release test:** Unit/simulation checks for API accept, forbidden, already-applied and wrong-MP4 cases are possible without touching a live YouTube video. A full end-to-end YouTube test will only happen on a future eligible draft with a real MP4 and verified owner OAuth. Do not claim an actual thumbnail is live until it can be checked in YouTube Studio.
