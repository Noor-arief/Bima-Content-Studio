import {readFileSync} from 'node:fs';
const seeds=JSON.parse(readFileSync(new URL('./shopee-bank-seed.json',import.meta.url),'utf8'));
export const BANK_VERSION='20261025-bank1';
export const NICHES={home_daily:'Perlengkapan rumah & kebutuhan harian',beauty:'Perawatan & kecantikan',fashion:'Fashion',gadget:'Aksesori gadget',mixed:'Campuran'};
const error=(code,status=422)=>Object.assign(Error(code),{status});
export const wibDate=(at=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(at);
export function validDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
export const addDays=(date,n)=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const age=(date,today)=>validDate(date)?Math.round((Date.parse(today)-Date.parse(date))/86400000):Infinity;
const hosts=['shopee.co.id','s.shopee.co.id','shp.ee','shope.ee'];
function url(value,offer=false){if(!value)return '';let u;try{u=new URL(value);}catch{throw error('invalid_shopee_link');}if(u.protocol!=='https:'||u.username||u.password||!(offer?u.hostname==='affiliate.shopee.co.id':hosts.includes(u.hostname)))throw error('invalid_shopee_link');return u.href;}
export function productKey(p){const u=String(p.productUrl||'');const m=u.match(/\/product\/\d+\/(\d+)/)||u.match(/-i\.\d+\.(\d+)/);return m?.[1]||String(p.id);}
export function validateProduct(input,today){
 const id=String(input.id||'').trim();if(!/^[a-zA-Z0-9_-]{3,80}$/.test(id)||['__proto__','constructor','prototype'].includes(id))throw error('invalid_bank_product_id');
 const out={id};for(const [k,max] of Object.entries({product:180,category:60,facts:3000,source:500,salesLabel:80})){out[k]=String(input[k]||'').trim();if(out[k].length>max)throw error('bank_text_too_long');}if(!out.product)throw error('product_name_required');
 out.niche=Object.hasOwn(NICHES,input.niche)?input.niche:'home_daily';
 for(const k of ['price','videoCommission','maxCommission','rating','sold','visualEase']){const raw=input[k];out[k]=raw==null||raw===''?null:Number(raw);if(out[k]!=null&&(!Number.isFinite(out[k])||out[k]<0||(k.includes('Commission')&&out[k]>100)||(['rating','visualEase'].includes(k)&&out[k]>5)))throw error('invalid_bank_economics');}
 out.productUrl=url(input.productUrl);out.affLink=url(input.affLink);out.offerUrl=url(input.offerUrl,true);
 out.observedAt=input.observedAt||today;if(!validDate(out.observedAt)||out.observedAt>today)throw error('invalid_evidence_date');
 out.paused=input.paused===true;out.videoVerified=input.videoVerified===true;
 out.verifiedAt=out.videoVerified?(input.verifiedAt||today):null;if(out.verifiedAt&&(!validDate(out.verifiedAt)||out.verifiedAt>today))throw error('invalid_evidence_date');
 if(out.videoVerified&&(!out.productUrl||!out.affLink||!out.source||!out.facts||!out.price||!out.videoCommission||out.rating==null||out.sold==null))throw error('complete_video_commission_evidence');
 return out;
}
export function assessProduct(p,today,niche='home_daily'){
 const issues=[];if(p.paused)issues.push('Produk dijeda');if(niche!=='mixed'&&p.niche!==niche)issues.push('Di luar niche');
 if(!p.videoVerified||!p.verifiedAt)issues.push('Komisi kanal Shopee Video belum diverifikasi');else if(age(p.verifiedAt,today)>7)issues.push('Periksa ulang data: lebih dari 7 hari');
 if(!p.productUrl)issues.push('URL produk belum diperiksa');if(!p.affLink)issues.push('Link affiliate belum ada');
 if(p.rating==null)issues.push('Rating belum diperiksa');else if(p.rating<4.5)issues.push('Rating di bawah 4,5');if(p.sold==null)issues.push('Penjualan belum diperiksa');else if(p.sold<100)issues.push('Penjualan di bawah 100');
 if(!(p.price>0&&p.videoCommission>0))issues.push('Harga/komisi Video belum lengkap');
 const estimate=p.videoVerified&&p.price>0&&p.videoCommission>0?Math.round(p.price*p.videoCommission/100):null;
 const parts={commission:estimate==null?0:Math.min(30,Math.round(30*Math.log1p(estimate)/Math.log1p(15000))),demand:p.sold==null?0:Math.min(25,Math.round(25*Math.log1p(p.sold)/Math.log1p(10000))),rating:p.rating==null?0:Math.round(Math.max(0,p.rating-4)/1*20),niche:niche==='mixed'||p.niche===niche?15:0,visual:p.visualEase==null?0:Math.round(p.visualEase*2)};
 return {eligible:issues.length===0,issues,estimate,score:Object.values(parts).reduce((a,b)=>a+b,0),parts,evidenceAgeDays:Number.isFinite(age(p.verifiedAt,today))?age(p.verifiedAt,today):null,assessment:'Aturan BIMA; bukan prediksi penjualan atau pendapatan'};
}
export function createProductBank({state,persist,saveDraft,publicDraft,clock=()=>new Date()}){
 function ensure(){const s=state();s.bankItems||={};s.dailyPlans||={};s.bankSettings||={niche:'home_daily',dailyTarget:1,time:'19:00',noRepeat:true};let changed=false;for(const raw of seeds)if(!s.bankItems[raw.id]){s.bankItems[raw.id]={...raw,productUrl:raw.productUrl||'',affLink:raw.affLink||'',videoVerified:raw.videoVerified===true,paused:false,origin:'catalog_research'};changed=true;}return changed;}
 const today=()=>wibDate(clock());
 function products(){ensure();const s=state();return Object.values(s.bankItems).map(p=>({...p,key:productKey(p),analysis:assessProduct(p,today(),s.bankSettings.niche)})).sort((a,b)=>Number(b.analysis.eligible)-Number(a.analysis.eligible)||b.analysis.score-a.analysis.score||a.id.localeCompare(b.id));}
 function planStatus(plan,byId){if(!plan.itemId)return 'needs_product';const p=byId[plan.itemId];if(!p)return 'needs_product';const draft=state().drafts[plan.draftId];if(draft?.publication)return 'published';if(draft?.stage==='rendering')return 'rendering';if(draft?.stage==='approved')return 'ready_to_upload';if(draft?.render)return 'review';return p.analysis.eligible?(draft?'in_production':'ready'):'needs_verification';}
 function snapshot(){ensure();const s=state(),list=products(),byId=Object.fromEntries(list.map(p=>[p.id,p])),day=today();const calendar=Array.from({length:14},(_,i)=>{const date=addDays(day,i),plan=s.dailyPlans[date]||{date,itemId:null};return {...plan,product:byId[plan.itemId]?.product||null,status:planStatus(plan,byId),analysis:byId[plan.itemId]?.analysis||null};});
 const completed=Object.values(s.drafts).filter(d=>d.publication&&wibDate(new Date(d.publication.confirmedAt))===day).length;
 return {version:BANK_VERSION,settings:{...s.bankSettings,nicheLabel:NICHES[s.bankSettings.niche]},today:day,target:1,completedToday:completed,completionSource:'owner_confirmed_shopee_url',products:list,calendar,readyCount:list.filter(p=>p.analysis.eligible).length,pendingCount:list.filter(p=>!p.analysis.eligible&&!p.paused).length,unfilledDays:calendar.filter(p=>!p.itemId).length,researchMode:'catalog_review_not_live_api',niches:NICHES};}
 let ticking=false;
 async function tick(){if(ticking)return;ticking=true;try{let changed=ensure();const s=state(),day=today(),list=products().filter(p=>!p.paused&&(s.bankSettings.niche==='mixed'||p.niche===s.bankSettings.niche));const used=new Set(Object.values(s.dailyPlans).filter(p=>p.itemId).map(p=>productKey(s.bankItems[p.itemId]||{id:p.itemId})));for(const d of Object.values(s.drafts)){if(d.publication&&d.bankItemId)used.add(productKey(s.bankItems[d.bankItemId]||{id:d.bankItemId}));}
 let lastCategory=s.bankItems[s.dailyPlans[addDays(day,-1)]?.itemId]?.category;
 for(let i=0;i<14;i++){const date=addDays(day,i);if(s.dailyPlans[date]?.itemId){lastCategory=s.bankItems[s.dailyPlans[date].itemId]?.category;continue;}const choices=list.filter(p=>!used.has(p.key)).sort((a,b)=>Number(b.analysis.eligible)-Number(a.analysis.eligible)||(b.analysis.score-(b.category===lastCategory?8:0))-(a.analysis.score-(a.category===lastCategory?8:0))||a.id.localeCompare(b.id));const p=choices[0];if(p){s.dailyPlans[date]={date,itemId:p.id,time:s.bankSettings.time,assignedAt:clock().toISOString(),source:'bank_rules'};used.add(p.key);lastCategory=p.category;changed=true;}}
 if(changed)await persist();}finally{ticking=false;}}
 async function upsert(input){ensure();const s=state(),p=validateProduct(input,today());const duplicate=Object.values(s.bankItems).find(x=>x.id!==p.id&&productKey(x)===productKey(p));if(duplicate)throw error('duplicate_bank_product');s.bankItems[p.id]={...p,origin:'owner_review',updatedAt:clock().toISOString()};for(const [date,plan] of Object.entries(s.dailyPlans))if(date>=today()&&!plan.draftId)delete s.dailyPlans[date];await persist();await tick();return snapshot();}
 async function settings(input){ensure();if(!Object.hasOwn(NICHES,input.niche))throw error('invalid_niche');const time=String(input.time||state().bankSettings.time);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw error('invalid_schedule');state().bankSettings={niche:input.niche,time,dailyTarget:1,noRepeat:true};for(const [date,p] of Object.entries(state().dailyPlans))if(date>=today()&&!p.draftId)delete state().dailyPlans[date];await persist();await tick();return snapshot();}
 async function open(input={}){await tick();const s=state(),date=input.date||today();if(!validDate(date)||date<today()||date>addDays(today(),13))throw error('invalid_production_date');const plan=s.dailyPlans[date];if(!plan?.itemId)throw error('bank_needs_more_products',409);const p=s.bankItems[plan.itemId],analysis=assessProduct(p,today(),s.bankSettings.niche);if(!analysis.eligible)throw error('bank_product_needs_verification',409);
 if(plan.draftId&&s.drafts[plan.draftId])return {draft:publicDraft(s.drafts[plan.draftId]),bank:snapshot()};
 const old=Object.values(s.drafts).find(d=>d.productUrl===p.productUrl&&!d.bankPlanDate&&!d.publication);
 let d=old;if(!d){const short=p.product.slice(0,85);d=await saveDraft({id:'shopee-'+date.replaceAll('-','')+'-'+p.id,product:p.product,productUrl:p.productUrl,affLink:p.affLink,price:p.price,videoCommission:p.videoCommission,facts:p.facts,date,time:plan.time,scenes:[{text:'Mau lihat pilihan '+short+'?',visual:'Foto produk asli dan varian yang sama dengan listing.'},{text:'Perhatikan detail dan pilih varian sesuai kebutuhanmu.',visual:'Detail asli produk; jangan mengarang demonstrasi atau klaim.'},{text:'Cek informasi lengkap dan harga terbarunya lewat tag produk.',visual:'Tampilan utuh produk; tag ditambahkan di aplikasi Shopee.'}],caption:p.product+'. Cek detail, varian dan harga terbaru lewat tag produk.\n\nKonten affiliate; saya dapat menerima komisi dari pembelian. #ShopeeVideo #Affiliate'});}
 d.bankItemId=p.id;d.bankPlanDate=date;d.date=date;d.time=plan.time;plan.draftId=d.id;plan.startedAt=clock().toISOString();await persist();return {draft:publicDraft(d),bank:snapshot()};}
 return {tick,snapshot,upsert,settings,open};
}
