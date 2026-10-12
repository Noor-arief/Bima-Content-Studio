/* Merge standalone 81-day editorial plan into the actual Content Studio calendar.
   Additive and idempotent: never delete, replace or publish existing drafts. */
(()=>{"use strict";
 const url="./autonomous-calendar-2026.json";
 const marker="mixed-calendar-2026-v1";
 function asCalendar(e){
   const scenes=(Array.isArray(e.storyboard)?e.storyboard:[]).map((scene,i)=>{
     const [time,phase,text]=scene;
     return "Scene "+(i+1)+" ("+time+") — "+phase+": "+text;
   }).join("\n");
   return {
     id:e.id,date:e.date,time:e.time||"19:30",
     title:e.title,
     format:e.type==="Video"?"Video · "+e.targetSeconds+"s":"Shorts · "+e.targetSeconds+"s",
     status:"Research Required",
     platform:"youtube",
     caption:"Editorial research draft — do not publish before verification.",
     prompt:"ORBIT & OCEAN — EDITORIAL DRAFT. FACT CHECK REQUIRED BEFORE PRODUCTION.\n"+
       "Date: "+e.date+" · "+e.type+" · target "+e.targetSeconds+" seconds · "+e.aspect+"\n"+
       "Title: "+e.title+"\n"+
       "Science concept: "+e.mechanism+"\nSTORYBOARD (distinct scenes):\n"+scenes+"\n"+
       "VOICEOVER: "+e.voiceover+"\n"+
       "Before rendering, verify facts, sources, scene continuity and voiceover timing; ensure the narration ends cleanly. No auto publishing.",
     notes:"Imported from 81 mixed editorial schedules. Research candidate (UNVERIFIED): "+e.referenceCandidate+
       ". Source status: "+e.referenceStatus+". Thumbnail brief: "+e.thumbnailBrief+
       ". Do not generate or publish until reviewed. Historical dates must not be automatically uploaded.",
     approved:false,mediaName:"",youtubeId:""
   };
 }
 async function sync(){
   const r=await fetch(url,{cache:"no-store"});
   if(!r.ok)throw Error("Editorial calendar HTTP "+r.status);
   const data=await r.json(),records=data.items;
   if(!Array.isArray(records)||records.length!==81)throw Error("Editorial source is not 81 entries");
   if(new Set(records.map(e=>e.id)).size!==81)throw Error("Editorial source has duplicate IDs");
   if(typeof state==="undefined"||!state.items?.youtube||typeof render!=="function")throw Error("Main calendar not loaded");
   const ids=new Set(state.items.youtube.map(e=>e.id));
   let added=0,updatedCount=0;
   for(const e of records){
     if(!/^2026-(10|11|12)-\d{2}$/.test(e.date)||!e.id||!e.title)throw Error("Invalid editorial entry");
     if(ids.has(e.id)){
       // Upgrade only the originally auto-imported, untouched generic brief.
       // Never overwrite manual changes, completed media, uploads or saved workflows.
       const existing=state.items.youtube.find(x=>x.id===e.id);
       const generic=existing&&typeof existing.prompt==="string"&&
         (existing.prompt.includes("Ask one intriguing scientific question")||existing.prompt.includes("Frame the problem"));
       if(generic&&!existing.approved&&!existing.youtubeId&&!existing.mediaName&&!existing.episodePlan){
         const updated=asCalendar(e);
         existing.prompt=updated.prompt;existing.notes=updated.notes;updatedCount++;
       }
       continue;
     }
     state.items.youtube.push(asCalendar(e));ids.add(e.id);added++;
   }
   if(added||updatedCount){
     try{localStorage.setItem("bima-content-studio-v3",JSON.stringify(state));}
     catch(err){console.warn("81-day calendar merged in memory; browser persistence failed",err);}
     render();
   }
   const summary=document.getElementById("autonomousSummary");
   if(summary){const note=document.createElement("p");note.style.cssText="margin-top:6px;color:#a3ebd1;font-weight:650";note.textContent="81 editorial schedules are linked to the main calendar ("+added+" newly added, "+updatedCount+" generic briefs refreshed). Existing drafts preserved. No auto publishing.";summary.after(note);}
   document.dispatchEvent(new CustomEvent("bima:mixed-calendar-synced",{detail:{total:81,added,updatedCount}}));
 }
 sync().catch(err=>{
   console.warn("Mixed calendar sync failed",err);
   const root=document.getElementById("autonomousPlanner");
   if(root){const n=document.createElement("p");n.style.color="#f7ba91";n.textContent="Calendar sync incomplete: "+err.message;root.append(n);}
 });
})();
