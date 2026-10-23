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
