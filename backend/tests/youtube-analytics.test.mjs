import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchAnalytics,reportRange,apiError,TARGET_CHANNEL} from '../youtube-analytics.mjs';
const now=new Date('2026-10-22T03:00:00Z');
const report=(names,rows)=>({columnHeaders:names.map(name=>({name})),rows});
test('report dates use completed Pacific days and reject unbounded periods',()=>{
 assert.deepEqual(reportRange(7,now),{days:7,startDate:'2026-10-14',endDate:'2026-10-20',timeZone:'America/Los_Angeles'});
 assert.throws(()=>reportRange(365,now),/invalid_analytics_period/);
});
test('channel lock rejects before any Google request',async()=>{
 await assert.rejects(fetchAnalytics({token:'test',channelId:'other',fetchImpl:()=>{throw Error('must not fetch');}}),/channel_mismatch/);
});
test('Shorts totals exclude long videos and preserve averages from aggregate report',async()=>{
 const seen=[];
 const fetchImpl=async(raw,options)=>{const u=new URL(raw);seen.push(u);assert.equal(options.headers.Authorization,'Bearer private');let data;
 if(u.hostname==='www.googleapis.com')data={items:[{id:'short1',snippet:{title:'Actual title'}}]};
 else if(u.searchParams.get('dimensions')==='day,creatorContentType')data=report(['day','creatorContentType','views','likes','comments','shares','subscribersGained','subscribersLost'],[['2026-10-20','SHORTS',10,2,1,1,1,0],['2026-10-20','VIDEO_ON_DEMAND',999,99,99,99,99,0]]);
 else if(u.searchParams.get('dimensions')==='creatorContentType')data=report(['creatorContentType','views','engagedViews','estimatedMinutesWatched','averageViewDuration','averageViewPercentage'],[['SHORTS',10,5,2,24,120],['VIDEO_ON_DEMAND',999,999,999,999,999]]);
 else data=report(['video','creatorContentType','views'],[['short1','SHORTS',10],['long1','VIDEO_ON_DEMAND',999]]);
 return {ok:true,json:async()=>data};};
 const result=await fetchAnalytics({token:'private',channelId:TARGET_CHANNEL,fetchImpl,now});
 assert.equal(result.summary.views,10);assert.equal(result.summary.likes,2);assert.equal(result.summary.averageViewPercentage,120);
 assert.equal(result.daily.length,1);assert.equal(result.videos.length,1);assert.equal(result.videos[0].title,'Actual title');
 assert.ok(!JSON.stringify(result).includes('private'));assert.equal(seen.length,4);
 assert.ok(seen.slice(0,3).every(u=>u.searchParams.get('ids')==='channel=='+TARGET_CHANNEL));
});
test('empty reports stay absent instead of fabricated zero totals',async()=>{
 const r=await fetchAnalytics({token:'x',channelId:TARGET_CHANNEL,fetchImpl:async()=>({ok:true,json:async()=>report([],[])}),now});assert.equal(r.summary,null);assert.deepEqual(r.videos,[]);
});
test('permission failures produce actionable safe codes',()=>{
 assert.equal(apiError(403,{error:{details:[{reason:'ACCESS_TOKEN_SCOPE_INSUFFICIENT'}]}}).message,'youtube_analytics_consent_required');
 assert.equal(apiError(403,{error:{errors:[{reason:'accessNotConfigured'}]}}).message,'youtube_analytics_api_disabled');
});

test('empty Shorts classification uses supported channel queries and clears recovered video error',async()=>{
 const seen=[];
 const fullMetrics=['views','engagedViews','estimatedMinutesWatched','likes','comments','shares','subscribersGained','subscribersLost','averageViewDuration','averageViewPercentage'];
 const values=[100,60,20,7,2,1,3,0,20,110];
 const fetchImpl=async raw=>{
   const u=new URL(raw),q=u.searchParams;seen.push(u);
   assert.ok(!String(q.get('filters')).includes('creatorContentType'));
   if(u.hostname==='www.googleapis.com')return {ok:true,json:async()=>({items:[{id:'short1',snippet:{title:'Short title'}}]})};
   const dims=q.get('dimensions')||'';
   if(dims==='video,creatorContentType')return {ok:false,status:400,json:async()=>({error:{message:'The query is not supported'}})};
   let data;
   if(dims.includes('creatorContentType'))data=report([],[]);
   else if(dims==='video')data=report(['video',...fullMetrics],[['short1',...values]]);
   else if(dims==='day')data=report(['day',...(q.get('metrics')==='views'?['views']:fullMetrics)],[['2026-10-20',...(q.get('metrics')==='views'?[100]:values)]]);
   else data=report(fullMetrics,[values]);
   return {ok:true,json:async()=>data};
 };
 const r=await fetchAnalytics({token:'private',channelId:TARGET_CHANNEL,fetchImpl,now});
 assert.equal(r.contentType,'CHANNEL_ALL');
 assert.equal(r.shortsBreakdownUnavailable,true);
 assert.equal(r.shortsFilterAttempted,false);
 assert.equal(r.videoReportUnavailable,false);
 assert.equal(r.videos[0].likes,7);
 assert.equal(r.videos[0].averageViewPercentage,110);
 assert.equal(r.daily[0].likes,7);
 assert.equal(r.reporting.deltaViews,0);
 assert.equal(r.videos[0].title,'Short title');
});

test('unavailable Shorts interaction metrics remain unknown and cutoff never mixes channel totals into Shorts',async()=>{
 const fetchImpl=async raw=>{
   const q=new URL(raw).searchParams,d=q.get('dimensions');
   assert.ok(d,'must not request a channel aggregate to reconcile Shorts');
   if(d==='day,creatorContentType'&&q.get('metrics').includes('likes'))return {ok:false,status:400,json:async()=>({error:{message:'The query is not supported'}})};
   const data=d==='day,creatorContentType'?report(['day','creatorContentType','views','estimatedMinutesWatched'],[['2026-10-19','SHORTS',10,2]]):d==='creatorContentType'?report(['creatorContentType','views'],[['SHORTS',10]]):report([],[]);
   return {ok:true,json:async()=>data};
 };
 const r=await fetchAnalytics({token:'x',channelId:TARGET_CHANNEL,fetchImpl,now});
 assert.equal(r.summary.likes,null);
 assert.equal(r.cutoffComparison,null);
});
