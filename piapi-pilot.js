/* Isolated PiAPI pilot controls. Never upload or approve YouTube content. */
(()=>{"use strict";
 const root=document.getElementById("piapiPilot");if(!root)return;
 const $=id=>document.getElementById(id);
 const server="https://content-studio-api-production-3fe2.up.railway.app";
 const token=()=>sessionStorage.getItem("bima_content_server_session")||"";
 const say=t=>{$("piapiMessage").textContent=t;};
 const api=async(path,method="GET",payload)=>{
   if(!token())throw Error("Login owner YouTube di Publishing terlebih dahulu.");
   const r=await fetch(server+path,{method,headers:{Authorization:"Bearer "+token(),...(payload?{"Content-Type":"application/json"}:{})},body:payload?JSON.stringify(payload):undefined});
   const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||"HTTP "+r.status);return data;
 };
 const button=$("piapiGenerate");const refresh=$("piapiRefresh");
 // Production planning is intentionally read-only until a full-episode renderer,
 // audio synchronizer and fresh owner budget approval are implemented.
 const planBox=document.createElement("section");
 planBox.id="piapiFullEpisodePlan";
 planBox.style.cssText="border:1px solid rgba(148,163,255,.27);border-radius:12px;padding:16px;margin:16px 0;color:#dbe5ff";
 const planTitle=document.createElement("h3");planTitle.textContent="Next · Venus Shorts 30s — Production Plan";
 const planText=document.createElement("p");planText.textContent="Use the third 8-second PiAPI test as an opening candidate (owner visual review); create unique 11s explanation and 11s payoff clips, then record and sync ONE continuous English narration. This is a plan, not an automated final video.";
 const sceneText=document.createElement("p");sceneText.textContent="0–8s: Venus close-up (existing candidate) · 8–19s: demonstrate 243-day axial rotation · 19–30s: compare with 225-day orbit and resolve the ending.";
 const budgetText=document.createElement("p");budgetText.id="piapiFullBudget";budgetText.textContent="Checking remaining internal pilot budget…";
 const warning=document.createElement("p");warning.textContent="No more paid renders from the 8s pilot while preparing the 30s workflow. Voiceover and MP4 stitching are NOT implemented yet; review is required before any publishing.";
 warning.style.color="#f6c28d";
 planBox.append(planTitle,planText,sceneText,budgetText,warning);
 root.append(planBox);
 const fullActions=document.createElement("div");fullActions.className="actions";fullActions.style.marginTop="10px";
 const fullStatus=document.createElement("p");fullStatus.id="venusFullStatus";fullStatus.className="hint";fullStatus.textContent="Checking production readiness…";
 const fullStart=document.createElement("button");fullStart.type="button";fullStart.className="btn primary";fullStart.textContent="Produce full 30s · approx $2.17";fullStart.disabled=true;
 const fullRefresh=document.createElement("button");fullRefresh.type="button";fullRefresh.className="btn";fullRefresh.textContent="Refresh 30s production";
 const fullVideo=document.createElement("video");fullVideo.controls=true;fullVideo.playsInline=true;fullVideo.hidden=true;fullVideo.style.cssText="display:none;width:min(100%,360px);max-height:650px;margin:10px auto;border-radius:12px;background:#000";
 fullActions.append(fullStart,fullRefresh);planBox.append(fullActions,fullStatus,fullVideo);
 async function refreshFull(){
   const d=await api("/api/venus-production/status");
   fullStatus.textContent="30s production: "+d.status+" · Scene 1 archived: "+(d.scene1Archived?"Yes":"No")+" · additional estimate $"+Number(d.totalEstimateUsd||0).toFixed(2);
   fullStart.disabled=!(d.status==="not_started"&&d.scene1Archived);
   if(d.finalReady&&!fullVideo.dataset.loaded){
     const v=await fetch(server+"/api/venus-production/video",{headers:{Authorization:"Bearer "+token()}});
     if(!v.ok)throw Error("final_video_fetch_"+v.status);
     const blob=await v.blob();if(!blob.type.includes("video"))throw Error("invalid_final_video");
     fullVideo.src=URL.createObjectURL(blob);fullVideo.dataset.loaded="true";fullVideo.hidden=false;fullVideo.style.display="block";
   }
   return d;
 }
 fullRefresh.onclick=async()=>{fullRefresh.disabled=true;try{
   await api("/api/venus-production/refresh","POST",{});
   await refreshFull();
 }catch(e){fullStatus.textContent="Production check: "+e.message;}finally{fullRefresh.disabled=false;}};
 fullStart.onclick=async()=>{
   const status=await refreshFull();if(status.status!=="not_started"||!status.scene1Archived)return;
   if(!confirm("Produce the remaining two AI clips (11s each), English AI narration, and assemble 30s MP4? Estimated NEW charge $2.17 USD; failed/rejected output may still consume credits. Not uploaded to YouTube. This requires additional PiAPI balance and explicit approval. Continue?"))return;
   fullStart.disabled=true;
   try{await api("/api/venus-production/start","POST",{confirmPaidProduction:true,maximumUsd:2.18});await refreshFull();}
   catch(e){fullStatus.textContent="Production not started: "+e.message;await refreshFull().catch(()=>{});}
 };
 if(token())(async()=>{
   // Owner previously selected Scene 1. Complete the server-side archive silently;
   // this downloads an existing finished video and creates NO paid PiAPI task.
   try{
     let d=await refreshFull();
     if(!d.scene1Archived){
       const pilotId="yt26-20261013-piapi-pilot";
       const saved=localStorage.getItem("bima_piapi_scene1_"+pilotId);
       const jobs=await api("/api/piapi/status");
       const match=jobs.jobs?.find(j=>j.id===pilotId&&j.taskId===saved&&j.status==="review_required");
       if(match){
         fullStatus.textContent="Archiving approved Scene 1 (no API generation charge)…";
         await api("/api/piapi/use-scene1","POST",{id:pilotId});
         d=await refreshFull();
       }
     }
   }catch(e){fullStatus.textContent="Scene archive needs attention: "+e.message;}
 })();


 const reference=$("piapiReferenceUrl"),approved=$("piapiReferenceApproved"),image=$("piapiReferencePreview");
 reference.addEventListener("input",()=>{
   approved.checked=false;
   try{const u=new URL(reference.value.trim());if(u.protocol!=="https:")throw Error();
     image.onload=()=>{image.hidden=false;image.style.display="block";};
     image.onerror=()=>{image.hidden=true;image.style.display="none";};
     image.src=u.href;
   }catch{image.removeAttribute("src");image.hidden=true;image.style.display="none";}
   button.disabled=true;
 });
 approved.addEventListener("change",()=>{button.disabled=true;});
 if(reference.value.trim())reference.dispatchEvent(new Event("input"));

 let active=false;
 const locallyRejected=new Set();
 let statusSerial=0;
 async function status(){
   const serial=++statusSerial;
   const d=await api("/api/piapi/status");
   if(serial!==statusSerial)return d;
   active=d.enabled;
   $("piapiBudget").textContent="PiAPI "+(d.enabled?"Ready":"Not configured")+" · reserved $"+Number(d.reservedUsd).toFixed(2)+" / $3.00";
   const remaining=Math.max(0,Number(d.capUsd||3)-Number(d.reservedUsd||0));
   $("piapiFullBudget").textContent="Two new 11s clips at 720p: estimated $2.12 (2 × $1.056, rounded up). Remaining internal pilot reservation: $"+remaining.toFixed(2)+". Shortfall: $"+Math.max(0,2.12-remaining).toFixed(2)+". Not a provider spending cap; no charges triggered.";

   button.disabled=true;
   const list=$("piapiJobs");list.replaceChildren();
   const visible=[...(d.jobs||[])].filter(j=>j.status!=="rejected"&&!locallyRejected.has(j.id)).reverse().slice(0,5);
   if(!visible.some(j=>j.status==="review_required")){const player=$("piapiPlayer");player.pause();player.removeAttribute("src");player.load();$("piapiPreview").hidden=true;}
   for(const j of visible){
     const row=document.createElement("div");row.className="note";row.style.marginTop="8px";
     const label=document.createElement("p");label.textContent=j.title+" · "+j.status+" · $"+(j.estimatedCents/100).toFixed(2)+" reserved";row.append(label);
     if(j.error||j.lastPollError){const err=document.createElement("small");err.textContent=j.error||j.lastPollError;row.append(err);}
     if(j.status==="review_required"){
       const reject=document.createElement("button");reject.className="btn ghost";reject.type="button";reject.textContent="Reject hasil video";
       reject.onclick=()=>safe(async()=>{
         if(!confirm("Reject hasil Venus pertama? Ini tidak mengembalikan biaya video sebelumnya. Tidak ada video baru yang akan dibuat."))return;
         await api("/api/piapi/reject","POST",{id:j.id});
         locallyRejected.add(j.id);
         ++statusSerial;
         const player=$("piapiPlayer");player.pause();player.removeAttribute("src");player.load();
         $("piapiPreview").hidden=true;
         row.remove();
         say("Video pertama ditolak. Retry bisa dilakukan dengan konfirmasi biaya baru.");
         await status();
       });row.append(reject);
     }
     if(j.status==="review_required"&&j.videoUrl){
       const use=document.createElement("button");use.type="button";use.className="btn primary";
       const localKey="bima_piapi_scene1_"+j.id;
       let localTaskId="";try{localTaskId=localStorage.getItem(localKey)||"";}catch{}
       const selected=d.production?.[j.id]?.scene1?.taskId===j.taskId||localTaskId===j.taskId;
       use.textContent=selected?"✓ Scene 1 selected":"Use as Scene 1";
       use.disabled=selected;
       use.onclick=()=>safe(async()=>{
         if(!confirm("Pakai video Venus ini sebagai opening 8 detik dalam RENCANA Shorts 30 detik? Tidak memulai render, tidak upload YouTube."))return;
         try{
           await api("/api/piapi/use-scene1","POST",{id:j.id});
           say("Scene 1 tercatat di backend. Tidak ada biaya atau upload.");
         }catch(e){
           if(String(e.message)!=="not_found")throw e;
           try{localStorage.setItem(localKey,j.taskId);}
           catch{throw Error("Backend belum melayani Scene 1, dan browser menolak penyimpanan lokal.");}
           say("Scene 1 disimpan sementara di browser. Sinkronisasi backend belum berhasil; belum menjadi aset permanen.");
         }
         await status();
       });
       row.append(use);
     }
     if(j.status==="review_required"&&j.videoUrl){
       const watch=document.createElement("button");watch.className="btn";watch.textContent="Preview video";watch.onclick=()=>{
         const u=new URL(j.videoUrl);if(u.protocol!=="https:")return;
         const player=$("piapiPlayer");player.src=u.href;$("piapiPreview").hidden=false;player.load();player.scrollIntoView({block:"center",behavior:"smooth"});
       };row.append(watch);
     }
     list.append(row);
   }
   return d;
 }
 const safe=async(fn)=>{button.disabled=true;refresh.disabled=true;try{await fn();}catch(e){say("Belum berhasil: "+e.message);}finally{refresh.disabled=false;button.disabled=!active||!approved.checked;}};
 button.onclick=()=>safe(async()=>{
   throw Error("Pilot 8s ditahan. Jangan generate lagi sebelum plan 30s dan biaya disetujui.");
   const referenceImageUrl=reference.value.trim();
   if(!approved.checked||!referenceImageUrl.startsWith("https://"))throw Error("Setujui gambar referensi Venus dulu.");
   const item=(typeof state!=="undefined"?state.items?.youtube?.find(x=>x.id==="yt26-20261013-piapi-pilot"):null);
   if(!item)throw Error("Draft Venus Test Only belum ditemukan di kalender. Refresh halaman.");
   const id=item.id,title=item.title;
   // The full 24s episode brief is >4k chars and is NOT a single 8s video prompt.
   // For PiAPI's 8s pilot, use ONLY scene 1 of the saved episode workflow.
   const plan=item.episodePlan;
   if(!plan||!Array.isArray(plan.scenes)||plan.scenes.length<3)
     throw Error("Workflow belum disimpan. Klik Use workflow in draft sekali.");
   const scene=(plan.overrides?.[plan.duration]?.[0]||plan.scenes[0]||"").trim();
   if(scene.length<40)throw Error("Scene 1 belum siap.");
   const prompt=[
     "ORBIT & OCEAN. ONE 8-second TEST CLIP, visual-only, not the full episode.",
     "TITLE: "+item.title,
     "SCENE 1 — HOOK: "+scene,
     "PLANET ACCURACY MUST BE STRICT: Venus is a rocky terrestrial planet enveloped in thick featureless pale yellow-white sulfuric acid clouds. NO Jupiter-like horizontal bands, NO Great Red Spot, NO storm-eye vortex, NO brown gas-giant texture, NO rings. Do not depict Jupiter. Smooth cloud-covered Venus only.",
     "Visual style: premium stylized 3D educational animation; coherent subject and smooth cinematic camera motion.",
     "Output vertical 9:16, 720p. Keep the subject centered with no on-screen words.",
     "No narration or human speech. Do not include later scenes. End on a clean stable frame.",
     "Never show logos, watermarks or unrelated visuals."
   ].join("\n");
   if(prompt.length>3900)throw Error("Scene 1 terlalu panjang untuk pilot. Ringkas storyboard.");
   const description=item.caption||"";
   if(item.approved||item.youtubeId||item.mediaName)
     throw Error("Konten ini sudah approved/di-upload. Pilih draft Test Only.");
   if(prompt.trim().length<40)throw Error("Scene 1 belum cukup detail.");
   const date=item.date,time=item.time||"19:30";
   const publishAt=new Date(date+"T"+time+":00+07:00").toISOString();
   const before=await status();
   if(!before.enabled)throw Error("Backend PiAPI belum aktif.");
   if(before.reservedUsd+0.77>3)throw Error("Batas pilot US$3 tidak cukup.");
   const retry=before.jobs?.some(j=>j.id===id&&["rejected","review_required"].includes(j.status))||locallyRejected.has(id);
   if(!confirm((retry?"RETRY setelah Reject: ":"")+"Generate SATU video dari GAMBAR REFERENSI Venus 720p, 9:16, 8 detik? BIAYA BARU estimasi $0.768 (reservasi $0.77), tidak refund video sebelumnya. Video hanya untuk preview, TIDAK diupload ke YouTube. Lanjut?"))return;
   await api("/api/content","POST",{id,title,description,publishAt,madeForKids:false,containsSyntheticMedia:true});
   await api("/api/piapi/generate","POST",{id,title,prompt,confirmCost:true,retryApproved:retry,referenceImageUrl,referenceApproved:true});
   locallyRejected.delete(id);
   say("PiAPI menerima proses video. Gunakan Refresh untuk melihat hasil. Tidak ada upload YouTube.");
   await status();
 });
 refresh.onclick=()=>safe(async()=>{await status();say("Status produksi diperbarui.");});
 button.disabled=true;button.textContent="8s pilot paused · Plan 30s";
 if(token())status().catch(e=>say("Status PiAPI belum tersedia: "+e.message));
 else say("Login owner melalui Publishing dulu, kemudian klik Refresh.");
})();
