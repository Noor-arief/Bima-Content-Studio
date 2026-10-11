# Orbit & Ocean — Content Production Baseline V2
Updated 11 October 2026. Applies to every 10-second science/nature/space Short generated using Gemini prompts in BIMA Content Studio.

## Creative identity
- Family-friendly, **premium stylized 3D cartoon animation**. Expressive rounded characters, rich aquatic or cosmic color, clear playful movement and scientifically accurate *concepts*.
- **Never** use photorealistic wildlife, exposed organs, blood, translucent animal bodies, dissection, medical cutaways, or horror imagery. For science explanations, use separate simple glowing icons, arrows, bubbles, external diagrams, or visual metaphors rather than inner organs. Subject stays alive, safe and healthy.
- Compose vertically (9:16) with the key learning moment inside the center 60% because Gemini may return landscape and BIMA may need center-crop. No fine detail near the side edges.
- One educational fact per video; every visible scene must support it, not simply look dramatic.

## Timing and spoken line (exactly 10 seconds)
- 0.0–1.5 s: clear hook, establish a single character/object.
- 1.5–6.5 s: visualize the reason/fact with a simple cartoon diagram or action.
- 6.5–10.0 s: **visual payoff and resolved ending**. Hold a clear composed final frame for at least 1.5 s; no abrupt jump or new fact at the last second.
- Narrator: **ONE short complete English sentence**, usually 10–14 words, never over 17, with a warm, clear, lightly energetic delivery. Start near 0.4 s, finish by **7.2 s**, and allow remaining time for musical/SFX closure. No late extra words, unfinished phrasing or clipped audio. Original low-volume instrumental music should gently resolve by 10 s.
- The voice line must explain the fact by itself, not require the viewer to read text. Avoid text/captions in Gemini render and add captions in a separate editor only if needed later.
- **A prompt alone cannot guarantee VO/audio quality from Gemini**. Before local approval, play all 10 seconds at normal speed and reject/regenerate any video with rushed or incomplete speech, incorrect scientific depiction, photoreal organ imagery, or unfinished endings.

## QA checklist
- [ ] Styled cartoon animation with no transparent realistic anatomy.
- [ ] Exactly one fact and one intelligible teaching moment.
- [ ] Full dialogue heard, uncut, by approximately 7.2 s.
- [ ] End resolves naturally by 10 s (visual hold and soft music fade).
- [ ] Composition survives the 9:16 portrait crop; visual essentials are centered.
- [ ] Scientific wording and imagery are fact-checked before publishing.
- [ ] Video is reviewed and approved by owner before BIMA submission.

## Safe migration
The default calendar contains 37 revised prompts. The browser stores drafts in localStorage; therefore **only untouched legacy prompt text on an unapproved/unuploaded entry is upgraded automatically**. Any custom-edited text, approved item, or item with a YouTube ID is preserved. Existing MP4s in IndexedDB are never modified or replaced by this prompt migration.

## Episode Storyboard V3 — 16/24/32 second workflow
- Stop assuming all science topics can be fully explained in 10 seconds. Choose runtime for **learning complexity**: 16 seconds (2 × ~8s) for one simple visual mechanism; 24 seconds (3 × ~8s) for hook + explanation + payoff; 32 seconds (4 × ~8s) for a more involved scientific explanation.
- Use Production Desk → **Episode Workflow**, where each selected draft has: unique learning objective, scene-by-scene storyboard, 8-second Gemini prompts and one master narration text.
- Octopus (12 Oct) pilot = **24 seconds**; scene 1 shows a friendly octopus with three icons outside its body, scene 2 shows two icons pumping toward gills, scene 3 illustrates third heart pumping oxygen-rich blood around the body and holds the final image.
- Generate scenes one at a time, preserving appearance by using previous last frame as a reference when the chosen Gemini/Flow capability supports it. Each scene prompt explicitly requests **no narration**; a continuous master voice-over spans the finished montage to prevent broken/uneven speech.
- Final audio: voice clear and moderate-paced, starts near 0.5s and **finishes ≥2.5s before the video ends**. Hold the final visual while music resolves; do not cut off the narrator.
- Assemble scenes in sequence and attach **one completed portrait MP4** for BIMA approval/publishing. **No automatic clip-stitching or master voice synthesis is implemented in BIMA yet.** Do not present separate generated clips as a final approved video.
- Clicking **Use workflow in draft** is explicit; it changes the draft prompt and format to Shorts 15–60 seconds, requiring normal Save/Review/Approval. Approved/uploaded video records are protected and unchanged.
- Existing 10-second creative prompt references remain available as source concepts, not automatic production instructions once a longer workflow is applied.
- Scientific specifics and voice text generated from standard fallback plans require editorial fact-check before publishing. A model prompt does not guarantee timing, audio, or factual accuracy.

