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
