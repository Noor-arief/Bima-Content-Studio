# Orbit & Ocean — Automatic Thumbnail Covers V1

Effective date: **19 October 2026**. Only YouTube calendar items on or after this date are eligible; earlier videos and published assets remain untouched.

## What happens automatically
- All **33 existing scheduled YouTube entries from 19 October through 31 December 2026** have an instant, deterministic title/topic-specific cover preview in the Calendar grid, the selected day list and Production Desk.
- A matching 1080 × 1920 vertical SVG is generated in the browser on demand. The same source is exported with **Download PNG** into a 1080 × 1920 image file. No external API, video editing or Google OAuth is required to preview covers.
- Template: Orbit & Ocean logo text, short educational hook, science category, stylized topic motif, cosmic/underwater colors, publication date and tagline.
- Covers are generated from the actual item title. Renaming a draft changes the cover. Pre-approved/published video state, existing approved MP4, and BIMA’s YouTube publishing flow are never touched by the generator.
- The cover is a **designed graphic template** (SVG/vector/emoji), not an AI-generated photorealistic illustration or a still extracted from the completed video.

## How to use
1. Open Calendar → a date on/after **19 Oct 2026**. Its card includes a thumbnail preview.
2. Open the draft's Production Desk; the **Thumbnail · Auto Generated** panel shows a larger preview.
3. Click **Download PNG** to export the 9:16 cover. **Refresh cover** recomputes it from the item's present topic/title.
4. Final approval and YouTube upload continue through the existing BIMA workflow.

## Publishing distinction
- Generated covers are **not automatically uploaded** or attached to existing YouTube videos by this implementation. Uploading a custom Shorts thumbnail may require appropriate account verification, permissions and YouTube API behavior.
- YouTube's current desktop Help documents custom Shorts thumbnails with a recommended 9:16 ratio for verified channels in Studio. Do not assume BIMA's video upload also sets the thumbnail until a separate upload/test is implemented.
- The thumbnail should be reviewed for scientific accuracy; generated graphic icons may be stylistic rather than anatomically precise.
- A generated cover is not a guarantee of YouTube distribution, views or monetization.

## Safety and reliability
- No assets, OAuth tokens, secrets or API keys are transferred to third-party illustration services.
- Existing calendar records, IndexedDB videos, published URLs and BIMA approval flags are not mutated.
- If an SVG to PNG render fails because of browser font/canvas support, the preview remains and a visible error is shown.
