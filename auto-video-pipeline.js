/* BIMA Autonomous Video Production. Owner-only; no API keys in browser. */
(()=>{"use strict";
 const get=id=>document.getElementById(id);
 const root=get("veoProduction");
 if(!root)return;
 const feedback=get("veoMessage"),wallet=get("veoBudget"),jobs=get("veoJobs"),player=get("veoPlayer"),preview=get("veoPreview");
 let videoUrl=null,overview=null;
 const SERVER="https://content-studio-api-production-3fe2.up.railway.app";
 const token=()=>sessionStorage.getItem("bima_content_server_session")||"";
 const api=async(route,method="GET",body)=>{
   if(!token())throw Error("Connect YouTube (Google OAuth) dulu di Publishing Setup.");
   const r=await fetch(SERVER+route,{method,headers:{Authorization:"Bearer "+token(),...(body!==undefined?{"Content-Type":"application/json"}:{})},body:body!==undefined?JSON.stringify(body):undefined});
   const data=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(data.error||"Server HTTP "+r.status);
   return data;
 };
 const selected=()=>{
   if(typeof getSelected!=="function")throw Error("Content Studio draft belum dimuat.");
   const item=getSelected();
   if(!item)throw Error("Pilih satu konten di kalender terlebih dahulu.");
   return item;
 };
 const notice=(msg)=>{feedback.textContent=msg;};
 const lock=async(btn,fn)=>{btn.disabled=true;try{await fn();}catch(e){notice("Belum berhasil: "+(e.message||e));}finally{btn.disabled=false;}};
 const currentDateTime=i=>{
   const d=new Date((get("fDate")?.value||i.date)+"T"+(get("fTime")?.value||i.time||"19:30")+":00+07:00");
   if(!Number.isFinite(d.getTime()))throw Error("Waktu publikasi tidak valid.");
   return d.toISOString();
 };
 const current=()=>{
   const item=selected();
   return {id:item.id,title:get("fTitle")?.value?.trim()||item.title,
    description:get("fCaption")?.value||item.caption||"",
    prompt:get("fPrompt")?.value||item.prompt||"",
    voiceover:get("veoVoice")?.value?.trim()||"",
    publishAt:currentDateTime(item)};
 };
 const selectedModel=()=>get("veoModel").value;
 const cost=()=>selectedModel()==="veo-3.1-lite-generate-preview"?0.74:1.06; // Veo + $0.10 QA allowance
 const updateWallet=()=>{
   wallet.textContent=overview?
     "Veo API: "+(overview.configured?(overview.enabled?"Ready":"Key detected, generation disabled"):"API key not configured")+
     " · Reserved $"+overview.reservedUsd.toFixed(2)+" of $"+overview.limitUsd.toFixed(2)+
     " · Remaining $"+overview.remainingUsd.toFixed(2):
     "Connecting to Railway…";
 };
 const updateJobs=()=>{
   jobs.replaceChildren();
   if(!overview){jobs.textContent="No status available.";return;}
   const list=[...(overview.jobs||[])].reverse();
   if(!list.length){jobs.textContent="No video produced yet. Start with one selected Shorts draft.";return;}
   for(const job of list.slice(0,9)){
     const block=document.createElement("div");block.className="veo-job-row";
     const top=document.createElement("div");top.style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;";
     const title=document.createElement("strong");title.textContent=job.title+" · v"+job.revision;
     const status=document.createElement("span");status.textContent=job.status.replaceAll("_"," ");
     top.append(title,status);block.appendChild(top);
     const info=document.createElement("small");
     info.textContent="ID "+job.id+" · $"+(job.cents/100).toFixed(2)+" reserved · "+(job.qa?.semanticPass?"Story + narration + ending AI QA PASS (owner review required)":job.qa?.issues?.join(", ")||(job.qa?.technicalPass?"Technical QA PASS · semantic review pending":"Awaiting output"));
     block.appendChild(info);
     if(job.error){const p=document.createElement("p");p.textContent=job.error;block.appendChild(p);}
     if(["needs_owner_review","qa_failed","approved","rejected"].includes(job.status)){
       const btn=document.createElement("button");btn.className="btn";btn.textContent="Preview";btn.type="button";
       btn.addEventListener("click",()=>lock(btn,async()=>{await loadPreview(job.id);}));
       block.appendChild(btn);
       if(job.status==="needs_owner_review"){
         const yes=document.createElement("button");yes.className="btn primary";yes.textContent="Approve & send to publishing";yes.type="button";
         yes.addEventListener("click",()=>lock(yes,async()=>{await approveVideo(job.id);}));
         const no=document.createElement("button");no.className="btn ghost";no.textContent="Request revision";no.type="button";
         no.addEventListener("click",()=>lock(no,async()=>{const reason=prompt("What needs improvement? The rejected video remains available for review.","Narration / visuals / storyboard");if(reason===null)return;await api("/api/veo/"+encodeURIComponent(job.id)+"/reject","POST",{reason});notice("Revision requested. A new generation costs more and needs separate confirmation.");await reload();}));
         block.append(yes,no);
       }
     }
     jobs.appendChild(block);
   }
 };
 const reload=async()=>{
   overview=await api("/api/veo/status");updateWallet();updateJobs();
 };
 async function loadPreview(id){
   const r=await fetch(SERVER+"/api/veo/"+encodeURIComponent(id)+"/video",{headers:{Authorization:"Bearer "+token()}});
   if(!r.ok)throw Error("Preview unavailable · HTTP "+r.status);
   const blob=await r.blob();
   if(!blob.type.includes("video"))throw Error("Invalid video preview response");
   if(videoUrl)URL.revokeObjectURL(videoUrl);
   videoUrl=URL.createObjectURL(blob);player.src=videoUrl;preview.hidden=false;
   notice("Preview ready. Watch the entire video with audio before approval. Technical QA cannot guarantee a complete narration.");
   player.scrollIntoView({behavior:"smooth",block:"nearest"});
 }
 async function approveVideo(id){
   const job=overview?.jobs?.find(j=>j.id===id);
   if(!job||job.status!=="needs_owner_review")throw Error("Video not ready for approval");
   if(!confirm("Have you watched the FULL video and checked voiceover, factual accuracy, storyboard and ending? Approve this exact MP4 for the YouTube pipeline?"))return;
   await api("/api/veo/"+encodeURIComponent(id)+"/accept","POST",{});
   let note="Video accepted and securely stored for publishing.";
   try{
     const r=await api("/api/content/"+encodeURIComponent(id)+"/approve","POST",{});
     note="Owner approved. YouTube job "+r.item.status+".";
     if(get("veoAutoQueue").checked&&get("veoAutoQueue").dataset.productionReady==="true"){
       const s=await api("/api/status");
       if(s.uploadsEnabled&&s.publicSchedulingEnabled){
         await api("/api/content/"+encodeURIComponent(id)+"/submit","POST",{});
         note="Approved and submitted to YouTube for scheduling. Check verification.";
       }else note+=" Auto-post still locked at Railway; no upload attempted.";
     }
   }catch(e){note+=" Publish approval pending: "+(e.message||e);}
   notice(note);await reload();
 }
 get("veoRefresh").addEventListener("click",()=>lock(get("veoRefresh"),async()=>{await reload();notice("Updated from secure Railway backend.");}));
 get("veoPilot").addEventListener("click",()=>lock(get("veoPilot"),async()=>{
   if(!overview)await reload();
   if(!overview.enabled)throw Error("Veo API belum diaktifkan di Railway. Tidak ada biaya yang dikenakan.");
   if(typeof state==="undefined"||!state.items?.youtube)throw Error("Kalender YouTube belum tersedia.");
   const now=Date.now()+20*60000;
   const candidates=[...state.items.youtube].filter(i=>{
     const time=Date.parse(i.date+"T"+(i.time||"19:30")+":00+07:00");
     return String(i.format||"").toLowerCase().includes("shorts")&&
       i.prompt?.length>=40 && !i.mediaName && !i.approved &&
       Number.isFinite(time)&&time>now;
   }).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,3);
   if(candidates.length===0)throw Error("Tidak ada 3 Shorts mendatang dengan storyboard siap. Lengkapi kalender dahulu.");
   const model=selectedModel(),resolution=get("veoModel").selectedOptions[0].dataset.resolution;
   const estimated=candidates.length*cost();
   if(estimated>overview.remainingUsd+0.001)throw Error("Sisa batas pilot tidak cukup: $"+overview.remainingUsd.toFixed(2));
   const summary=candidates.map((i,n)=>(n+1)+". "+i.date+" · "+i.title).join("\n");
   if(!confirm("Approve ONE autonomous pilot batch for these "+candidates.length+" videos?\n\n"+summary+
      "\n\nMaximum reservation for this batch: $"+estimated.toFixed(2)+" including QA allowance."+
      "\nBIMA generates sequentially, never regenerates a failed video automatically."+
      "\nVideos will wait for your review; NO automatic YouTube publishing. Continue?"))return;
   const drafts=[];
   for(const i of candidates){
     const publishAt=new Date(i.date+"T"+(i.time||"19:30")+":00+07:00").toISOString();
     await api("/api/content","POST",{id:i.id,title:i.title,description:i.caption||"",
       publishAt,madeForKids:false,containsSyntheticMedia:true});
     drafts.push({id:i.id,title:i.title,prompt:i.prompt,description:i.caption||"",
       model,resolution,voiceover:""});
   }
   const q=await api("/api/veo/queue","POST",{jobs:drafts,confirmBudget:true});
   overview=q.summary;updateWallet();updateJobs();
   notice("BIMA menerima "+q.queued.length+" video dalam pilot. Proses otomatis berjalan satu per satu; review hasil di bawah.");
 }));
 get("veoCreate").addEventListener("click",()=>lock(get("veoCreate"),async()=>{
   const d=current();
   if(!d.prompt||d.prompt.length<40)throw Error("Calendar draft needs a full storyboard prompt.");
   const price=cost();
   if(!overview)await reload();
   if(!overview.enabled)throw Error("Veo requires GEMINI_API_KEY and ENABLE_VEO_GENERATION in Railway. No charge was made.");
   if(overview.remainingUsd<price)throw Error("Pilot budget exhausted.");
   const consent="Generate ONE 8-second video with native voiceover for "+d.title+"?\nModel: "+get("veoModel").selectedOptions[0].text+
   "\nBudget reservation: $"+price.toFixed(2)+" (Veo + QA allowance) per generation.\nEach new attempt reserves additional budget. Remaining before request: $"+
   overview.remainingUsd.toFixed(2)+".\nNo auto-regeneration. Continue?";
   if(!confirm(consent))return;
   await api("/api/content","POST",{id:d.id,title:d.title,description:d.description,publishAt:d.publishAt,madeForKids:false,containsSyntheticMedia:true});
   const result=await api("/api/veo/generate","POST",{
     id:d.id,title:d.title,prompt:d.prompt,description:d.description,voiceover:d.voiceover,
     model:selectedModel(),resolution:get("veoModel").selectedOptions[0].dataset.resolution,confirmCost:true});
   notice("BIMA started Veo job for "+d.title+". Generation may take several minutes. Status will refresh automatically.");
   overview=result.summary;updateWallet();updateJobs();
 }));
 get("veoModel").addEventListener("change",()=>{get("veoEstimate").textContent="Estimated $"+cost().toFixed(2)+" USD / 8s incl. QA reserve";});
 get("veoEstimate").textContent="Estimated $1.06 USD / 8s incl. QA reserve";
 setInterval(()=>{if(token())reload().catch(()=>{});},20000);
 if(token())reload().catch(e=>{notice("Veo status unavailable: "+e.message);});
 else{notice("Connect YouTube via the Publishing tab first. Veo generation stays disabled until API billing/key is configured.");}
})();
