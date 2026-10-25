/* Prompt handoff only. This does not call Google Flow or spend credits. */
window.BimaShopeeFlowPrompt=(item,mode='Review')=>{
 const unbox=mode==='Unboxing';
 return `/${unbox?'Unboxing':'Review'} produk — creative brief, not a Flow command.
Create ONE finished vertical 9:16 affiliate product video, 8 seconds, with continuous realistic motion, clear Indonesian narration and quiet original instrumental background music. No slideshow or static photo hold. No captions or generated text.
PRODUCT: ${item.product}
LISTING: ${item.productUrl||'Use the exact verified listing.'}
FACTS TO CHECK AGAINST THE REFERENCE: ${item.facts||'Use only visible details from the supplied reference; do not invent specifications.'}
REFERENCE: Upload the exact product catalog photo as a visual reference. Show ONE consistent color variant throughout. Preserve its shape, lid, handle, proportions and visible branding; never invent a different product or brand. If geometry cannot be preserved, simplify the motion.
ACTION: ${unbox?'A clearly staged AI product reveal: hands lift the exact reference product from neutral tissue paper, then turn it gently for a detail view. Do not invent official packaging, accessories or included items.':'A styled product showcase: slow camera orbit around the exact product, then close-ups of visible lid and handle, ending on a clean hero shot. Do not invent hidden mechanisms or performance tests.'}
TIMING: 0–2s compelling moving close-up; 2–5s visible product details; 5–8s hero shot with purchase CTA.
SPEECH (natural Indonesian, no first-person ownership claim): "Lihat detail produk ini. Cek pilihan dan spesifikasinya lewat tag produk."
AUDIO: Spoken voice clearly above quiet original instrumental music, plus subtle natural handling sounds. Generate audio; do not return a silent video. No recognizable commercial song.
HONESTY: This is an AI product illustration, not proof of personal use, a real unboxing, authenticity, leak resistance or thermal performance. Make no unsupported claims. No prices, discounts, ratings or commission figures in the video. No fake affiliate links or cart overlays. The real product tag is added in Shopee.
REVIEW: Verify exact product identity, hands/geometry, voice, music and ending before publishing. Choose an audio-capable model and one output; check displayed credit cost before generation.`;
};
