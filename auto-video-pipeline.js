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
 const cost=()=>selectedModel()==="veo-3.1-lite-generate-preview"?0.64:0.96;
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
     info.textContent="ID "+job.id+" · $"+(job.cents/100).toFixed(2)+" reserved · "+(job.qa?.technicalPass?"MP4 + audio track + portrait PASS":job.qa?.issues?.join(", ")||"Awaiting output");
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
 get("veoCreate").addEventListener("click",()=>lock(get("veoCreate"),async()=>{
   const d=current();
   if(!d.prompt||d.prompt.length<40)throw Error("Calendar draft needs a full storyboard prompt.");
   const price=cost();
   if(!overview)await reload();
   if(!overview.enabled)throw Error("Veo requires GEMINI_API_KEY and ENABLE_VEO_GENERATION in Railway. No charge was made.");
   if(overview.remainingUsd<price)throw Error("Pilot budget exhausted.");
   const consent="Generate ONE 8-second video with native voiceover for "+d.title+"?\nModel: "+get("veoModel").selectedOptions[0].text+
   "\nEstimated cost: $"+price.toFixed(2)+" per successful generation.\nEach new attempt reserves additional budget. Remaining before request: $"+
   overview.remainingUsd.toFixed(2)+".\nNo auto-regeneration. Continue?";
   if(!confirm(consent))return;
   await api("/api/content","POST",{id:d.id,title:d.title,description:d.description,publishAt:d.publishAt,madeForKids:false,containsSyntheticMedia:true});
   const result=await api("/api/veo/generate","POST",{
     id:d.id,title:d.title,prompt:d.prompt,description:d.description,voiceover:d.voiceover,
     model:selectedModel(),resolution:get("veoModel").selectedOptions[0].dataset.resolution,confirmCost:true});
   notice("BIMA started Veo job for "+d.title+". Generation may take several minutes. Status will refresh automatically.");
   overview=result.summary;updateWallet();updateJobs();
 }));
 get("veoModel").addEventListener("change",()=>{get("veoEstimate").textContent="Estimated "+cost().toFixed(2)+" USD / 8s clip";});
 get("veoEstimate").textContent="Estimated $0.96 USD / 8s clip";
 setInterval(()=>{if(token())reload().catch(()=>{});},20000);
 if(token())reload().catch(e=>{notice("Veo status unavailable: "+e.message);});
 else{notice("Connect YouTube via the Publishing tab first. Veo generation stays disabled until API billing/key is configured.");}
})();
