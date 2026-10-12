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
 let active=false;
 async function status(){
   const d=await api("/api/piapi/status");active=d.enabled;
   $("piapiBudget").textContent="PiAPI "+(d.enabled?"Ready":"Not configured")+" · reserved $"+Number(d.reservedUsd).toFixed(2)+" / $3.00";
   button.disabled=!active;
   const list=$("piapiJobs");list.replaceChildren();
   for(const j of [...(d.jobs||[])].reverse().slice(0,5)){
     const row=document.createElement("div");row.className="note";row.style.marginTop="8px";
     const label=document.createElement("p");label.textContent=j.title+" · "+j.status+" · $"+(j.estimatedCents/100).toFixed(2)+" reserved";row.append(label);
     if(j.error||j.lastPollError){const err=document.createElement("small");err.textContent=j.error||j.lastPollError;row.append(err);}
     if(j.status==="review_required"){
       const reject=document.createElement("button");reject.className="btn ghost";reject.type="button";reject.textContent="Reject hasil video";
       reject.onclick=()=>safe(async()=>{
         if(!confirm("Reject hasil Venus pertama? Ini tidak mengembalikan biaya video sebelumnya. Tidak ada video baru yang akan dibuat."))return;
         await api("/api/piapi/reject","POST",{id:j.id});
         say("Video pertama ditolak. Retry bisa dilakukan dengan konfirmasi biaya baru.");
         await status();
       });row.append(reject);
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
 const safe=async(fn)=>{button.disabled=true;refresh.disabled=true;try{await fn();}catch(e){say("Belum berhasil: "+e.message);}finally{refresh.disabled=false;button.disabled=!active;}};
 button.onclick=()=>safe(async()=>{
   const item=typeof getSelected==="function"?getSelected():null;
   if(!item)throw Error("Pilih konten draft di kalender.");
   const id=item.id,title=$("fTitle")?.value?.trim()||item.title;
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
   const description=$("fCaption")?.value||item.caption||"";
   if(item.approved||item.youtubeId||item.mediaName)
     throw Error("Konten ini sudah approved/di-upload. Pilih draft Test Only.");
   if(item.id!=="yt26-20261013-piapi-pilot")
     throw Error("Pilot hanya untuk draft Venus Test Only tanggal 13 Okt.");
   if(prompt.trim().length<40)throw Error("Scene 1 belum cukup detail.");
   const date=$("fDate")?.value||item.date,time=$("fTime")?.value||item.time||"19:30";
   const publishAt=new Date(date+"T"+time+":00+07:00").toISOString();
   const before=await status();
   if(!before.enabled)throw Error("Backend PiAPI belum aktif.");
   if(before.reservedUsd+0.77>3)throw Error("Batas pilot US$3 tidak cukup.");
   const retry=before.jobs?.some(j=>j.id===id&&j.status==="rejected")||false;
   if(!confirm((retry?"RETRY setelah Reject: ":"")+"Generate SATU video Seedance Fast 720p, 9:16, 8 detik? BIAYA BARU estimasi $0.768 (reservasi $0.77), tidak refund video sebelumnya. Video hanya untuk preview, TIDAK diupload ke YouTube. Lanjut?"))return;
   await api("/api/content","POST",{id,title,description,publishAt,madeForKids:false,containsSyntheticMedia:true});
   await api("/api/piapi/generate","POST",{id,title,prompt,confirmCost:true,retryApproved:retry});
   say("PiAPI menerima proses video. Gunakan Refresh untuk melihat hasil. Tidak ada upload YouTube.");
   await status();
 });
 refresh.onclick=()=>safe(async()=>{await status();say("Status produksi diperbarui.");});
 button.disabled=true;
 if(token())status().catch(e=>say("Status PiAPI belum tersedia: "+e.message));
 else say("Login owner melalui Publishing dulu, kemudian klik Refresh.");
})();
