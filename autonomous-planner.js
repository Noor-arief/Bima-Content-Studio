/* Orbit & Ocean: standalone alternating release planner. Nothing auto-publishes. */
(()=>{"use strict";
 const root=document.getElementById("autonomousPlanner");
 if(!root)return;
 const by=id=>document.getElementById(id);
 const list=by("autonomousDays"),selected=by("autonomousDate"),summary=by("autonomousSummary");
 const story=by("autonomousStory"),details=by("autonomousDetails"),copy=by("autonomousCopy"),dateJump=by("autonomousJump");
 let entries=[],current=null;
 const make=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e;};
 const formatDate=d=>new Date(d+"T12:00:00Z").toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"});
 const brief=e=>[ "ORBIT & OCEAN — EDITORIAL BRIEF (NOT FACT-CHECKED)",
 "Schedule: unscheduled research idea", "Format: "+e.type+", "+e.targetSeconds+"s, "+e.aspect,
 "Title: "+e.title, "Subject: "+e.category, "Mechanism: "+e.mechanism,
 "Reference candidate (NOT yet verified): "+e.referenceCandidate,
 "Before generation: verify exact book title, edition and page; verify facts and rights; create unique script and voice track; confirm accurate diagrams/anatomy.",
 "STORYBOARD:",...e.storyboard.map(a=>a.join(" | ")),
 "VOICEOVER RULE: "+e.voiceover,
 "THUMBNAIL: "+e.thumbnailBrief,
 "QUALITY GATES: fact-check, anatomy accuracy if present, unbroken story, synchronized VO with complete final syllable, thumbnail rights and visual appeal, owner approval.",
 "PRODUCTION STATE: RESEARCH REQUIRED. Do NOT upload automatically." ].join("\n");
 function select(e){
  current=e;selected.value=e.id;story.replaceChildren();details.replaceChildren();
  const header=make("div","",e.type+" · Ide riset, belum dijadwalkan");
  header.style.cssText="font-weight:700;color:#93dcff;margin:4px 0 9px";
  details.append(header,make("h3","",e.title),make("p","",e.mechanism+" · "+e.targetSeconds+"s · "+e.aspect));
  const ref=make("p","","Buku untuk riset (BELUM diverifikasi): "+e.referenceCandidate+". Harus ditambah judul/edisi/halaman asli sebelum produksi.");
  ref.style.cssText="font-size:13px;color:#f6cd90";
  details.append(ref);
  details.append(make("p","","Thumbnail: "+e.thumbnailBrief));
  const head=make("h3","","Storyboard (wajib ada akhir cerita)");
  story.append(head);
  for(const [time,phase,text] of e.storyboard){
    const box=make("div","");
    box.style.cssText="display:flex;gap:12px;align-items:flex-start;padding:10px 12px;background:rgba(110,135,255,.08);border:1px solid rgba(145,165,255,.16);border-radius:9px;margin:7px 0";
    const timeTag=make("strong","",time);timeTag.style.cssText="min-width:70px;color:#99bfff";
    const label=make("div","",phase+" — "+text);
    box.append(timeTag,label);story.append(box);
  }
  story.append(make("p","","Voice-over: "+e.voiceover));
  summary.textContent="Draft only · "+e.type+" · Fact checking pending · No video generated";
  for(const child of list.children)child.setAttribute("aria-selected",child.dataset.id===e.id?"true":"false");
 }
 function renderRows(){
  list.replaceChildren();
  for(const item of entries){
    const btn=make("button","",(item.type==="Shorts"?"SHORTS":"VIDEO")+" · "+item.title);
    btn.type="button";btn.dataset.id=item.id;btn.style.cssText="text-align:left;background:rgba(116,139,255,.09);border:1px solid rgba(153,172,255,.15);color:#ecf0ff;border-radius:10px;padding:10px 12px;cursor:pointer;min-height:41px";
    btn.addEventListener("click",()=>select(item));list.append(btn);
    const option=make("option","",item.type+" · "+item.title);option.value=item.id;selected.append(option);
  }
 }
 selected.addEventListener("change",()=>{const v=entries.find(x=>x.id===selected.value);if(v)select(v);});
 copy.addEventListener("click",async()=>{if(!current)return;try{await navigator.clipboard.writeText(brief(current));summary.textContent="Brief copied. Source still requires verification."; }catch{summary.textContent="Browser copy permission denied; choose HTTPS / copy manually."; }});
 dateJump.addEventListener("click",()=>{if(!current)return;window.BIMA_NAVIGATE?.('kalender');});
 fetch("./autonomous-calendar-2026.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("calendar JSON HTTP "+r.status);return r.json()}).then(data=>{
  entries=data.items||[];if(!entries.length)throw Error("empty calendar");
  by("autonomousCount").textContent=entries.length+" ide · "+entries.filter(x=>x.type==="Shorts").length+" Shorts / "+entries.filter(x=>x.type==="Video").length+" Videos";
  renderRows();select(entries[0]);
 }).catch(err=>summary.textContent="Calendar could not be loaded: "+String(err.message||err));
})();
