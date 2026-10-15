import {createHash} from 'node:crypto';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {createGoogleAffiliateProvider,GOOGLE_AFFILIATE_MODEL,GOOGLE_AFFILIATE_ESTIMATE_CENTS} from './tiktok-google-provider.mjs';
import {assembleGoogleAffiliate} from './tiktok-google-media.mjs';

const terminal=new Set(['storyboard_pending','ready_for_review','approved','qa_failed','failed','requires_reconciliation','revision_requested']);
const digest=s=>createHash('sha256').update(s).digest('hex');
export function affiliateStory(product,notes=''){
  const voice=[`Yuk, lihat detail ${product.name}.`,product.fact,'Cek detail, pilihan varian, dan harga terbaru sebelum membeli.'];
  if(voice.some(s=>s.length>140||s.split(/\s+/).length>18))throw Error('product_name_or_fact_too_long_for_scene');
  const visual=['Opening close-up, subtle camera push in.','Show a different close detail of the same product.','Pull back gently to a clean closing product hero shot.'];
  return voice.map((s,i)=>({voice:s,visual:visual[i],status:'queued',prompt:[
    'Create one 8-second portrait 9:16 realistic Indonesian product video. Preserve the exact product shape, color, branding and components in the supplied image. No invented product capabilities or fake testimonial. No text or shopping basket graphics.',
    visual[i],'Natural warm Indonesian female narrator, consistent across clips. Say exactly this DATA sentence between 0.4s and 7.3s: '+JSON.stringify(s),
    'Include soft original instrumental music, no lyrics, low under the narration. Clean settled ending, no cut-off words.',
    'Product DATA: '+JSON.stringify({name:product.name,fact:product.fact}),
    notes?'Owner revision feedback (do not alter verified product facts): '+JSON.stringify(notes):''
  ].join(' ')}));
}

export function createGoogleAffiliateWorker({db,persist,mediaDir,env=process.env,provider=createGoogleAffiliateProvider(),assemble=assembleGoogleAffiliate,now=()=>new Date().toISOString()}){
  db.tiktokGoogle ||= {jobs:{},reservedCents:0};
  const state=db.tiktokGoogle;let busy=false;
  const cap=()=>{const n=Number(env.TIKTOK_GOOGLE_BUDGET_CENTS||0);return Number.isSafeInteger(n)&&n>=0?n:0;};
  const enabled=()=>env.ENABLE_TIKTOK_GOOGLE==='true'&&Boolean(env.GEMINI_API_KEY);
  const dir=path.resolve(mediaDir,'tiktok-google');
  const publicJob=j=>({id:j.id,product:j.product.name,productSource:j.product.url,selectionReason:null,status:j.status,revision:j.revision,createdAt:j.createdAt,updatedAt:j.updatedAt,error:j.error||null,estimatedUsd:j.cents/100,
    storyboardApproved:Boolean(j.storyboardApproved),storyboard:j.scenes.map((s,i)=>({scene:i+1,durationSeconds:8,visual:s.visual,voice:s.voice,audio:'Narasi Indonesia dan musik instrumental lembut',format:'9:16',status:s.status})),scenes:j.scenes.map(s=>({status:s.status,voice:s.voice})),qa:j.qa||null,reviewNotes:j.reviewNotes||null,videoReady:Boolean(j.file),mediaHash:j.hash||null,published:false,publication:j.publication||null,revisionBlockedReason:j.revisionBlockedReason||null});
  const overview=()=>({provider:'google',model:GOOGLE_AFFILIATE_MODEL,apiConfigured:Boolean(env.GEMINI_API_KEY),enabled:enabled(),durationSeconds:24,estimateUsd:GOOGLE_AFFILIATE_ESTIMATE_CENTS/100,
    budgetUsd:cap()/100,reservedUsd:state.reservedCents/100,remainingUsd:Math.max(0,cap()-state.reservedCents)/100,
    blockers:[...(!env.GEMINI_API_KEY?['google_api_key_missing']:[]),...(!enabled()?['google_automation_not_enabled']:[]),...(state.reservedCents+GOOGLE_AFFILIATE_ESTIMATE_CENTS>cap()?['google_budget_not_available']:[]),'verified_product_source_missing'],
    sourceConnected:false,publishingConnected:false,jobs:Object.values(state.jobs).map(publicJob).slice(-30)});
  // Existing pilot screenshots have referenceOnly=true. They are never promoted to
  // verified commercial product assets by this worker. This is an internal intake
  // contract for a future catalog connector or an authenticated operator.
  async function enqueue(input){
    if(busy)throw Error('production_busy_try_later');busy=true;
    try{
      const p=input?.product;
      if(!p||typeof p.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(p.id)||typeof p.name!=='string'||p.name.length<3||p.name.length>60||typeof p.fact!=='string'||p.fact.length<15||p.fact.length>100)throw Error('verified_product_details_required');
      if(p.factsVerified!==true||p.assetsLicensed!==true||typeof p.evidence!=='string'||p.evidence.length<10||p.evidence.length>1000)throw Error('product_verification_evidence_required');
      let source;try{source=new URL(p.url);}catch{throw Error('product_source_required');}
      if(source.protocol!=='https:'||source.username||source.password)throw Error('product_source_required');
      const m=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(input.imageData||'');
      if(!m)throw Error('licensed_product_reference_required');
      const image=Buffer.from(m[2],'base64');
      if(image.length<1500||image.length>750000)throw Error('reference_image_size_invalid');
      const mime=image.subarray(0,8).toString('hex')==='89504e470d0a1a0a'?'image/png':image.subarray(0,3).toString('hex')==='ffd8ff'?'image/jpeg':image.toString('ascii',0,4)==='RIFF'&&image.toString('ascii',8,12)==='WEBP'?'image/webp':null;
      if(mime!==m[1])throw Error('reference_image_signature_invalid');
      const product={id:p.id,name:p.name.trim(),fact:p.fact.trim(),url:source.href,evidence:p.evidence};
      const id=digest(JSON.stringify(product)+digest(image)).slice(0,24);
      if(state.jobs[id])return publicJob(state.jobs[id]);
      const scenes=affiliateStory(product);
      await fs.mkdir(dir,{recursive:true,mode:0o700});const reference=path.join(dir,id+'.reference');
      await fs.writeFile(reference,image,{mode:0o600});
      const job={id,product,reference,mimeType:mime,scenes,status:'storyboard_pending',storyboardApproved:false,revision:0,cents:GOOGLE_AFFILIATE_ESTIMATE_CENTS,createdAt:now(),updatedAt:now()};
      state.jobs[id]=job;await persist();return publicJob(job);
    }finally{busy=false;}
  }
  // At-most-once paid submission: ambiguous attempts require reconciliation.
  // Local composition can safely resume; completed clips and QA are checkpoints.
  for(const j of Object.values(state.jobs)){
    for(const s of j.scenes){if(s.status==='submitting'){s.status='requires_reconciliation';j.status='requires_reconciliation';j.error='submission_interrupted_do_not_resubmit';}}
    if(j.status==='assembling')j.status='running';
    if(j.status==='auditing_final'){j.status='requires_reconciliation';j.error='final_qa_interrupted';}
    for(const s of j.scenes){if(s.status==='auditing'){j.status='requires_reconciliation';j.error='scene_qa_interrupted';}}
  }
  async function approveStoryboard(id){
    if(busy)throw Error('production_busy_try_later');
    const j=state.jobs[id];if(!j||j.status!=='storyboard_pending')throw Error('storyboard_not_pending');
    if(j.scenes.length!==3||j.scenes.some(s=>!s.prompt||!s.visual||!s.voice))throw Error('storyboard_incomplete');
    j.storyboardApproved=true;j.status='queued';j.storyboardApprovedAt=now();j.updatedAt=now();await persist();return publicJob(j);
  }
  async function tick(){
    if(busy||!enabled())return;busy=true;
    let j;
    try{
      j=Object.values(state.jobs).find(x=>!terminal.has(x.status));if(!j)return;
      if(!j.storyboardApproved){j.status='storyboard_pending';await persist();return;}
      if(!j.budgetReserved){
        if(state.reservedCents+j.cents>cap()){j.status='blocked_budget';await persist();return;}
        state.reservedCents+=j.cents;j.budgetReserved=true;j.status='running';await persist();
      }
      const image=await fs.readFile(j.reference);
      const s=j.scenes.find(x=>x.status!=='complete');
      if(s){
        const index=j.scenes.indexOf(s);const file=path.join(dir,`${j.id}-${index}.mp4`);
        if(s.status==='queued'){
          s.status='submitting';j.updatedAt=now();await persist();
          try{s.operation=await provider.submit({scene:s,image,mimeType:j.mimeType});s.status='running';}
          catch{j.status='requires_reconciliation';s.status='requires_reconciliation';j.error='google_submission_uncertain_do_not_retry';}
          await persist();return;
        }
        if(s.status==='running'){
          let remote;try{remote=await provider.poll(s.operation);}catch(e){
            j.error=String(e.message).slice(0,100);
            if(/generation_failed|missing_or_filtered/.test(j.error)){j.status='failed';s.status='failed';}
            await persist();return;
          }
          if(!remote.done)return;
          await provider.download(remote.uri,file);s.file=file;s.status='downloaded';await persist();
        }
        if(s.status==='downloaded'){
          s.status='auditing';await persist();
          s.qa=await provider.audit({file:s.file,scene:s,image,mimeType:j.mimeType});
          if(!s.qa.pass){j.status='qa_failed';j.error='scene_'+(index+1)+'_qa_failed';s.status='qa_failed';}
          else{s.status='complete';j.error=null;}
          j.updatedAt=now();await persist();return;
        }
        return;
      }
      j.status='assembling';await persist();
      const file=path.join(dir,j.id+'-final.mp4');
      j.technical=await assemble({clips:j.scenes.map(s=>s.file),scenes:j.scenes,outputPath:file});
      j.file=file;j.hash=digest(await fs.readFile(file));j.status='auditing_final';await persist();
      j.qa=await provider.audit({file,scene:{voice:j.scenes.map(s=>s.voice).join(' '),visual:j.product.fact},image,mimeType:j.mimeType,final:true});
      j.status=j.qa.pass?'ready_for_review':'qa_failed';j.updatedAt=now();j.error=j.qa.pass?null:'final_qa_failed';await persist();
    }catch(e){if(j){j.status='failed';j.error=String(e.message||e).slice(0,160);await persist();}}
    finally{busy=false;}
  }
  async function review(id,{decision,mediaHash,notes}){
    if(busy)throw Error('production_busy_try_later');busy=true;
    try{
      const j=state.jobs[id];if(!j||j.status!=='ready_for_review'||!j.qa?.pass||mediaHash!==j.hash)throw Error('current_reviewable_video_required');
      if(decision==='approve'){j.status='approved';j.approvedHash=j.hash;j.reviewedAt=now();j.updatedAt=now();
        j.publication={status:'blocked',reason:'shoppable_connector_not_connected',productId:j.product.id,productUrl:j.product.url,mediaHash:j.hash,queuedAt:now(),scheduledAt:null,publishedAt:null};await persist();return publicJob(j);}
      if(decision!=='request_revision'||typeof notes!=='string'||notes.trim().length<5||notes.length>600)throw Error('revision_notes_required');
      if(j.revision>=2){j.status='revision_requested';j.reviewNotes=notes;j.revisionBlockedReason='automatic_revision_limit_reached';j.updatedAt=now();await persist();return publicJob(j);}
      const revision=j.revision+1,newId=digest(j.id+':'+revision).slice(0,24);
      const next={...j,id:newId,status:'storyboard_pending',storyboardApproved:false,revision,scenes:affiliateStory(j.product,notes),reviewNotes:notes,createdAt:now(),updatedAt:now(),file:null,hash:null,qa:null,technical:null,error:null,budgetReserved:false};
      delete next.approvedHash;delete next.reviewedAt;delete next.publication;delete next.revisionBlockedReason;
      state.jobs[newId]=next;j.status='revision_requested';j.reviewNotes=notes;await persist();return publicJob(next);
    }finally{busy=false;}
  }
  return {overview,enqueue,tick,review,approveStoryboard,job:id=>state.jobs[id]};
}
