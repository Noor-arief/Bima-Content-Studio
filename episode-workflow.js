/* BIMA Storyboard V1. Owner applies plan explicitly. Never edit uploaded/approved content. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
if(!$('fPrompt')||typeof getSelected!=='function'||typeof saveDraft!=='function')return;
const field=$('fPrompt').closest('.field');
if(!field)return;
// Keep fPrompt in the saved draft for compatibility with validation and publishing,
// but never show the legacy 10-second prompt alongside the active scene workflow.
const oldCopy=$('copy');
field.hidden=true;
field.style.display='none';
field.setAttribute('aria-hidden','true');
if(oldCopy){oldCopy.hidden=true;oldCopy.style.display='none';oldCopy.setAttribute('aria-hidden','true');}
const css=document.createElement('style');
css.textContent=[
'#episodeWorkflow{grid-column:1/-1;width:100%;min-width:0;border:1px solid rgba(139,123,255,.35);border-radius:14px;background:rgba(114,106,227,.07);padding:16px;margin:5px 0 18px}',
'#episodeWorkflow h3{font-size:17px;margin:0 0 5px;color:#f5f6ff}',
'#episodeWorkflow p{line-height:1.6}',
'#episodeWorkflow .ew-muted{color:#aab8dc;font-size:12px}',
'#episodeWorkflow .ew-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}',
'#episodeWorkflow .ew-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:13px 0}',
'#episodeWorkflow .ew-scene{background:rgba(13,21,50,.75);border:1px solid rgba(148,163,255,.22);border-radius:12px;padding:12px;min-width:0}',
'#episodeWorkflow .ew-scene p{font-size:12px;color:#b9c9ed}',
'#episodeWorkflow .ew-scene strong{color:#edf2ff;font-size:13px}',
'#episodeWorkflow .ew-scene small{color:#9cddc6;display:block;font-size:11px;margin-top:5px}',
'#episodeWorkflow .ew-btn{border:1px solid rgba(148,163,255,.33);background:#1d2a56;color:#eff2ff;border-radius:9px;padding:8px 12px;font:inherit;font-size:12px;cursor:pointer;min-height:36px}',
'#episodeWorkflow .ew-btn.primary{background:linear-gradient(115deg,#806afa,#5d80ff);font-weight:750}',
'#episodeWorkflow .ew-btn:disabled{opacity:.4;cursor:not-allowed}',
'#episodeWorkflow .ew-control{border:1px solid rgba(148,163,255,.33);background:#0c1737;border-radius:9px;color:#f3f5ff;padding:8px 10px;font:inherit}',
'#episodeWorkflow .ew-voice{display:block;width:100%;min-height:82px;resize:vertical;border:1px solid rgba(148,163,255,.35);border-radius:9px;background:#0b1531;color:#f3f5ff;font:13px/1.6 ui-sans-serif,system-ui;padding:10px}',
'#episodeWorkflow .ew-scene-input{width:100%;min-height:124px;resize:vertical;color:#c5d3f0;background:rgba(8,15,36,.7);border:1px solid rgba(148,163,255,.2);border-radius:8px;padding:8px;font:12px/1.55 ui-sans-serif,system-ui}',
'#episodeWorkflow .ew-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 6px}',
'#episodeWorkflow .ew-status{font-size:12px;color:#9fefcf;min-height:18px;margin:8px 0}',
'#episodeWorkflow .ew-copy-status{display:block;margin:8px 0 0;font-size:11px;color:#9feccf;line-height:1.5;min-height:16px}',
'#episodeWorkflow .ew-copy-fallback{display:block;width:100%;min-height:110px;resize:vertical;background:#0b1531;color:#e3edff;border:1px solid #8b7bff;border-radius:8px;padding:9px;font:11px/1.5 ui-monospace,monospace;margin-top:7px}',
'#episodeWorkflow .ew-copy-fallback[hidden]{display:none!important}',
'@media(max-width:780px){#episodeWorkflow{padding:12px}#episodeWorkflow .ew-grid{grid-template-columns:1fr}}'
].join('\n');
document.head.append(css);
const panel=document.createElement('section');panel.id='episodeWorkflow';
panel.setAttribute('aria-label','Per-video production workflow');
panel.innerHTML='<div class="ew-row"><div><h3>Episode Workflow</h3><p class="ew-muted">Teaching brief → storyboard → Gemini clips → full voice-over → final MP4 → BIMA Publish</p></div><span id="ewPhase" class="ew-muted"></span></div>'+
'<div class="ew-row"><label for="ewDuration" class="ew-muted">Video duration <select id="ewDuration" class="ew-control"><option value="16">16s · 2 clips</option><option value="24">24s · 3 clips</option><option value="32">32s · 4 clips</option></select></label><span class="ew-muted">Each Gemini scene targets 8 seconds</span></div>'+
'<label class="ew-muted" for="ewBrief">What viewers will learn (edit before generating)</label><textarea id="ewBrief" class="ew-voice" spellcheck="true"></textarea><div id="ewScenes" class="ew-grid"></div>'+
'<label class="ew-muted" for="ewVoice">Full English voice-over · record ONE continuous narration for the final video</label>'+
'<textarea id="ewVoice" class="ew-voice" spellcheck="true"></textarea>'+
'<div class="ew-actions"><button class="ew-btn" type="button" id="ewCopyVoice">Copy voice-over</button><button class="ew-btn" type="button" id="ewCopyFull">Copy full brief</button><button class="ew-btn primary" type="button" id="ewApply">Use workflow in draft</button></div>'+
'<p class="ew-muted">Generate clips in Gemini or Flow, combine into ONE final portrait MP4 and add the continuous voice-over; only then upload to BIMA. Automatic clip stitching is not enabled yet. Do not submit individual scenes to YouTube.</p>'+
'<p class="ew-muted" id="ewPromptExplanation">Satu workflow aktif: gunakan prompt <strong>Scene 1 / Scene 2 / Scene 3</strong> secara berurutan di Gemini. Tombol Copy full brief untuk arsip produksi BIMA, bukan prompt tambahan yang perlu di-generate.</p>'+
'<p id="ewMessage" class="ew-status" role="status" aria-live="polite"></p>';
document.getElementById('stepperHint').insertAdjacentElement('afterend',panel);
const planStep=document.createElement('button');planStep.type='button';planStep.className='step-pill';planStep.textContent='Storyboard';
planStep.addEventListener('click',()=>{panel.scrollIntoView({behavior:'smooth',block:'start'});$('ewBrief').focus({preventScroll:true});});
$('productionStepper').prepend(planStep);
const STYLE='Orbit & Ocean animated science short. Bright, charming premium stylized 3D cartoon with rounded characters, expressive eyes and clear playful movement. Never photorealistic; no exposed anatomy, blood, x-rays, surgery or visible internal organs. Any science explanation uses glowing icons, simple arrows or diagrams OUTSIDE the animal. Compose portrait 9:16 and center important objects within the middle 60% of frame. Keep the same character colors, size, lighting and background in every clip. No onscreen text, watermark, captions or dialogue.';
const CUSTOM={
'yt-octopus-001':{
 objective:'Explain why an octopus needs three hearts: two pump blood to the gills; the third pumps oxygen-rich blood through the body.',
 scenes:[
 'Cute orange cartoon octopus waves in a bright coral reef; three glowing heart-shaped ICONS float OUTSIDE its body. Establish a curious hook, no anatomical transparency.',
 'Same octopus in the same reef. Two glowing heart icons float beside the animal and simple arrows lead toward two external stylized oxygen/gill bubble illustrations. No visible organs.',
 'One third glowing heart icon appears, sending simple blue illustrated arrows toward the whole body. All three icons pulse together and the healthy octopus swims happily away. Hold a beautiful final composition for 1.5 seconds.'
 ],
 voice:'An octopus has three hearts. Why so many? Two pump blood to its gills to collect oxygen. The third sends oxygen-rich blood around its body. Three hearts, one amazing animal!'
},
'yt26-20261014':{
 objective:'Explain that butterflies taste plants with receptors on their feet and use that information when choosing where to lay eggs.',
 scenes:[
 'Friendly colorful butterfly lands softly in an animated flower meadow; camera focuses on its feet.',
 'Butterfly gently touches a leaf; tiny glowing taste sparkles appear beneath its feet to show external sensory receptors without a cutaway.',
 'Butterfly selects a leaf and flutters upward, landing on a finished peaceful composed frame with an elegant musical ending.'
 ],
 voice:'Butterflies do something surprising: they taste with their feet. Tiny receptors help them check plants before choosing a good place to lay eggs. Pretty clever, right?'
}
};
function extract(item){
 const s=String(item.prompt||'');
 const rx=[
 /0\.0–1\.5 sec — HOOK:\s*([\s\S]*?)\n1\.5–6\.5 sec — EXPLAIN:/,
 /1\.5–6\.5 sec — EXPLAIN:\s*([\s\S]*?)\n6\.5–10\.0 sec — PAYOFF AND CLOSURE:/,
 /6\.5–10\.0 sec — PAYOFF AND CLOSURE:\s*([\s\S]*?)\nVOICE-OVER:/
 ];
 const scenes=rx.map(r=>(s.match(r)?.[1]||'').replace(/Last 1\.5 seconds hold[\s\S]*$/,'').trim().replace(/[.\s]+$/,''));
 const voice=s.match(/VOICE-OVER: Speak EXACTLY this single short English line, nothing added: "([^"]+)"/)?.[1]||'';
 return {scenes,voice};
}
function createPlan(item){
 const saved=item.episodePlan;
 if(saved&&[16,24,32].includes(saved.duration)&&Array.isArray(saved.scenes)&&typeof saved.voice==='string')return JSON.parse(JSON.stringify(saved));
 const old=extract(item),curated=CUSTOM[item.id];
 return {
 duration:24,
 objective:curated?.objective||'Teach one verified fact: '+(item.caption||item.title).replace(/#\w+/g,'').trim(),
 scenes:curated?.scenes||[
  old.scenes[0]||'Open with one clear stylized educational cartoon hook.',
  old.scenes[1]||'Show the science using simple exterior icons, arrows and visual motion.',
  old.scenes[2]||'Reveal the payoff and conclude with a clear composed final image.'
 ],
 voice:curated?.voice||('Here is a curious science fact. '+old.voice+' Watch the visual explanation and remember this surprising idea.'),
 version:1
 };
}
function scenes(plan){
 const a=plan.scenes||[],n=plan.duration/8;
 const custom=plan.overrides?.[plan.duration]||{};
 const finish=arr=>arr.map((x,i)=>Object.prototype.hasOwnProperty.call(custom,i)?custom[i]:x);
 if(n===2)return finish([(a[0]||'Animated hook')+' Then introduce this visual explanation: '+(a[1]||''),(a[2]||'Animated ending')]);
 if(n===3)return finish(a);
 return finish([a[0]||'Animated hook',a[1]||'Animated explanation',(a[1]||'Illustrated explanation')+' Reinforce the teaching point using a simple diagram.',a[2]||'Animated resolved ending']);
}
function clip(item,plan,i,visual=scenes(plan)[i]){
 const n=plan.duration/8,scene=String(visual||'Continue the science story').trim();
 const end=i===n-1?'End by holding a fully resolved final frame for at least 1.5 seconds.':'Finish on a stable transition frame.';
 return 'SCENE '+(i+1)+' OF '+n+' | '+(i*8)+'–'+((i+1)*8)+'s | '+(i===0?'HOOK':i===n-1?'PAYOFF & ENDING':'EXPLANATION')+
 '\nACTION FOR THIS SCENE ONLY: '+scene+
 '\n'+end+
 '\nGenerate only this ~8-second portrait 9:16 clip. Do not repeat another scene or generate the entire video.'+
 '\nVIDEO: ORBIT & OCEAN | '+item.title+
 '\nSHARED VISUAL STYLE: '+STYLE+
 '\nCONTINUITY: Use the same character and exact palette as earlier scenes; provide the previous final frame as reference when possible.'+
 '\nAUDIO: ambient music and subtle sound effects ONLY. NO SPEECH, NO lip-sync, NO narrator. Voice-over is recorded ONCE for the entire finished video.';
}
function brief(item,plan){
 const parts=scenes(plan);
 return 'ORBIT & OCEAN PRODUCTION WORKFLOW\nVIDEO: '+item.title+
 '\nFACT / LEARNING GOAL: '+plan.objective+
 '\nFINAL: '+plan.duration+' seconds | '+parts.length+' Gemini clips x ~8s | Portrait 9:16\n'+
 'VOICE-OVER (one continuous recording on final assembled MP4):\n'+plan.voice+
 '\nTIMING: finish narration by '+(plan.duration-2.5)+'s; last 2.5s for music and resolved visual ending.\n'+
 parts.map((s,i)=>'\n--- SCENE '+(i+1)+' ---\n'+clip(item,plan,i)).join('\n')+
 '\nFINAL QC: visually consistent cartoon style, correct science, portrait 9:16, one uninterrupted narration, all sentences finished and a gentle visual/audio end. Do not upload single scenes to YouTube.';
}
let active='',plan=null,dirty=false;
document.addEventListener('bima:before-navigate',e=>{if(dirty)e.preventDefault()});
function show(text,isError=false){$('ewMessage').textContent=text;$('ewMessage').style.color=isError?'#ffb0ba':'#9feccf';}
function copyLegacy(value){
 // Fallback starts in a genuine button-click handler, never automatically.
 const textarea=document.createElement('textarea');
 textarea.value=value;textarea.setAttribute('readonly','');
 textarea.style.position='fixed';textarea.style.left='-9999px';textarea.style.top='0';textarea.style.opacity='0';
 document.body.appendChild(textarea);
 textarea.focus();textarea.select();
 let ok=false;
 try{ok=!!document.execCommand('copy');}catch(_){}
 textarea.remove();
 return ok;
}
async function copy(value,success,button=null,card=null){
 if(!value||!value.trim()){show('Gemini prompt is empty.',true);return false;}
 const status=card?.querySelector('.ew-copy-status');
 const notice=(msg,failed=false)=>{
   if(status){status.textContent=msg;status.style.color=failed?'#ffb0ba':'#9feccf';}
   show(msg,failed);
 };
 let ok=false;
 try{
   if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
     await navigator.clipboard.writeText(value);ok=true;
   }else{ok=copyLegacy(value);}
 }catch(_){ok=copyLegacy(value);}
 if(ok){
   if(button){
     panel.querySelectorAll('.ew-scene .ew-btn').forEach(b=>{b.textContent=b.dataset.copyLabel;});
     panel.querySelectorAll('.ew-copy-status').forEach(s=>{s.textContent='';});
     button.textContent='✓ Scene '+button.dataset.scene+' copied';
   }
   notice(success);
   const fallback=card?.querySelector('.ew-copy-fallback');
   if(fallback)fallback.hidden=true;
   return true;
 }
 if(card){
   // Browser clipboard permissions may be blocked. Expose the COMPLETE prompt,
   // not only the short scene storyboard, and preselect it for Ctrl+C.
   let preview=card.querySelector('.ew-copy-fallback');
   if(!preview){
     preview=document.createElement('textarea');preview.className='ew-copy-fallback';
     preview.readOnly=true;preview.setAttribute('aria-label','Full Gemini prompt — press Ctrl+C to copy');
     card.appendChild(preview);
   }
   preview.value=value;preview.hidden=false;
   preview.focus();preview.select();
   notice('Browser blocked automatic copy. Full prompt selected below — press Ctrl+C.',true);
 }else{
   notice('Browser blocked automatic copy. Select text in the voice-over field and press Ctrl+C.',true);
 }
 return false;
}
function populateScenes(item){
 const area=$('ewScenes');area.replaceChildren();if(!plan)return;
 scenes(plan).forEach((content,index)=>{
  const div=document.createElement('article');div.className='ew-scene';
  const title=document.createElement('strong');title.textContent='Scene '+(index+1)+' · '+index*8+'–'+(index+1)*8+'s';
  const sub=document.createElement('small');sub.textContent=index===0?'Hook':index===plan.duration/8-1?'Payoff and resolved ending':'Explain the fact';
  const p=document.createElement('textarea');p.className='ew-scene-input';p.setAttribute('aria-label','Scene '+(index+1)+' visual storyboard');p.value=content;const protect=locked(item);p.readOnly=protect;
  p.addEventListener('input',()=>{if(!plan||locked(item))return;plan.overrides||={};plan.overrides[plan.duration]||={};plan.overrides[plan.duration][index]=p.value;dirty=true;show('Scene '+(index+1)+' edited. Apply to save.');});
  const b=document.createElement('button');b.className='ew-btn';b.type='button';b.dataset.scene=String(index+1);b.dataset.copyLabel='Copy Scene '+(index+1)+' prompt';b.textContent=b.dataset.copyLabel;
  const status=document.createElement('small');status.className='ew-copy-status';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  b.addEventListener('click',()=>void copy(clip(item,plan,index,p.value),'Scene '+(index+1)+' is now in the clipboard. Paste it into Gemini.',b,div));
  div.append(title,sub,p,b,status);area.append(div);
 });
}
function locked(item){
 const remote=window.BIMA_REMOTE_CONTENT?.[item.id]||window.BIMA_PUBLIC_UPLOADS?.[item.id];
 return !!item.approved||!!item.youtubeId||['scheduled','published','private_uploaded','uploading','needs_review'].includes(remote?.status);
}
function render(){
 const item=getSelected();if(!item){panel.hidden=true;active='';plan=null;return;}
 panel.hidden=false;if(item.id===active&&dirty)return;
 active=item.id;plan=createPlan(item);dirty=false;
 $('ewDuration').value=String(plan.duration);$('ewVoice').value=plan.voice;
 $('ewBrief').value=plan.objective;
 const protect=locked(item);
 $('ewDuration').disabled=protect;$('ewVoice').readOnly=protect;$('ewBrief').readOnly=protect;$('ewApply').disabled=protect;
 const applied=item.episodePlan?.version===1;
 $('ewPhase').textContent=protect?'Approved/uploaded · protected':applied?'✓ '+plan.duration+'s workflow saved':'Preview '+plan.duration+'s · Save workflow first';
 populateScenes(item);
 show(protect?'Existing approved/uploaded video stays unchanged.':
  applied?'This saved workflow is the active Gemini production plan. Copy Scene prompts one at a time.':
   'This is a new '+plan.duration+'s plan; click Use workflow in draft to replace the old 10-second prompt before generating.');
}
$('ewDuration').addEventListener('change',()=>{
 if(!plan)return;plan.duration=Number($('ewDuration').value);dirty=true;
 populateScenes(getSelected());show('Changed to '+plan.duration+'s. Apply to save.');
});
$('ewVoice').addEventListener('input',()=>{if(plan){plan.voice=$('ewVoice').value;dirty=true;show('Narration edited. Apply to save.');}});
$('ewBrief').addEventListener('input',()=>{if(plan){plan.objective=$('ewBrief').value;dirty=true;show('Teaching objective edited. Apply to save.');}});
$('ewCopyVoice').addEventListener('click',()=>{if(plan)void copy(plan.voice,'Narration copied.');});
$('ewCopyFull').addEventListener('click',()=>{const item=getSelected();if(plan&&item)void copy(brief(item,plan),'Full storyboard brief copied.');});
$('ewApply').addEventListener('click',()=>{
 const item=getSelected();if(!item||!plan||locked(item)){show('Cannot edit approved or uploaded content.',true);return;}
 plan.voice=$('ewVoice').value.trim();plan.objective=$('ewBrief').value.trim();
 if(plan.objective.length<15){show('Teaching objective is too short. Explain the learning goal first.',true);return;}
 if(scenes(plan).some(s=>s.trim().length<20)){show('Complete every scene storyboard before applying.',true);return;}
 const words=(plan.voice.match(/\b[\w’'-]+\b/g)||[]).length;
 if(words<10||words>Math.floor(plan.duration*2.5)){show('Narration length '+words+' words does not fit '+plan.duration+' seconds. Adjust length/duration.',true);return;}
 $('fFormat').value='Shorts · 15–60s';
 $('fPrompt').value=brief(item,plan);
 item.episodePlan=JSON.parse(JSON.stringify(plan));
 // Explicit owner action reuses the existing Save Draft guard and requires another Mark Approved after editing.
 saveDraft();
 dirty=false;render();show('Workflow '+plan.duration+'s saved. Generate scenes, assemble the final MP4, review and approve before BIMA publishes.');
});
document.addEventListener('bima:episode-selected',render);
document.addEventListener('bima:render-status',()=>{if(getSelected()?.id!==active)render();});
render();
})();