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
     id:e.id,date:e.date,time:e.time||"19:30",sourceSchedule:"mixed-81",category:e.category,
     title:e.title,
     format:e.type==="Video"?"Video · "+e.targetSeconds+"s":"Shorts · "+e.targetSeconds+"s",
     status:"Research Required",
     platform:"youtube",
     caption:e.title+". Exploring "+e.mechanism.toLowerCase()+" through an original science explainer. Research draft: verify the facts and final narration before publishing.",
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
   // Editorial 81-day plan is an IDEA BANK, not 81 automatic publication slots.
   // Older versions imported it to the live calendar; clean up only pristine, unedited
   // imports. Preserve approved, published, media-attached and manually edited drafts.
   const r=await fetch(url,{cache:"no-store"});
   if(!r.ok)throw Error("Editorial bank HTTP "+r.status);
   const data=await r.json(),records=data.items;
   if(!Array.isArray(records)||records.length!==81||new Set(records.map(e=>e.id)).size!==81)throw Error("Editorial bank validation failed");
   if(typeof state==="undefined"||!state.items?.youtube||typeof render!=="function")throw Error("Calendar unavailable");
   let removed=0,preserved=0;
   for(const entry of records){
     const i=state.items.youtube.findIndex(x=>x.id===entry.id);
     if(i<0)continue;
     const existing=state.items.youtube[i],initial=asCalendar(entry);
     const unedited=existing.title===initial.title&&existing.date===initial.date&&
       existing.prompt===initial.prompt&&existing.notes===initial.notes&&
       (!existing.caption||existing.caption===initial.caption||existing.caption==="Editorial research draft — do not publish before verification.")&&
       (!existing.status||["Research Required","Research required"].includes(existing.status))&&
       !existing.episodePlan&&!existing.approved&&!existing.mediaName&&!existing.youtubeId&&!existing.filePath;
     if(unedited){state.items.youtube.splice(i,1);removed++;}
     else preserved++;
   }
   if(removed){
     try{localStorage.setItem("bima-content-studio-v3",JSON.stringify(state));}
     catch(e){console.warn("Cannot persist editorial bank migration",e);}
     render();
   }
   const summary=document.getElementById("autonomousSummary");
   if(summary){
     const note=document.createElement("p");
     note.style.cssText="margin-top:6px;color:#a3ebd1;font-weight:650";
     note.textContent="81 ideas in editorial backlog · "+removed+" duplicate schedule imports cleared · "+preserved+" edited drafts preserved. This does NOT schedule 81 uploads.";
     summary.after(note);
   }
   document.dispatchEvent(new CustomEvent("bima:mixed-calendar-synced",{detail:{total:81,removed,preserved,mode:"idea_bank_only"}}));
 }

 sync().catch(err=>{
   console.warn("Mixed calendar sync failed",err);
   const root=document.getElementById("autonomousPlanner");
   if(root){const n=document.createElement("p");n.style.color="#f7ba91";n.textContent="Calendar sync incomplete: "+err.message;root.append(n);}
 });
})();
