// Read-only owner analytics. No tokens or private reports are persisted publicly.
export const ANALYTICS_SCOPE='https://www.googleapis.com/auth/yt-analytics.readonly';
export const TARGET_CHANNEL='UCTm_pCLEBWcENGFL4KH4-9w';
const metrics='views,engagedViews,estimatedMinutesWatched,likes,comments,shares,subscribersGained,subscribersLost';
export function reportRange(days, now=new Date()){
  days=Number(days);if(![7,28,90].includes(days))throw Object.assign(Error('invalid_analytics_period'),{status:400});
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const end=new Date(today+'T00:00:00Z');end.setUTCDate(end.getUTCDate()-1);
  const start=new Date(end);start.setUTCDate(start.getUTCDate()-days+1);
  return {days,startDate:start.toISOString().slice(0,10),endDate:end.toISOString().slice(0,10),timeZone:'America/Los_Angeles'};
}
export function rows(report){return (report.rows||[]).map(row=>Object.fromEntries(report.columnHeaders.map((h,i)=>[h.name,row[i]])));}
export function apiError(status,body){
  const reasons=JSON.stringify(body?.error||{});
  const code=/SERVICE_DISABLED|accessNotConfigured|API has not been used|API is disabled/i.test(reasons)?'youtube_analytics_api_disabled':
    /ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficientPermissions|insufficient authentication scopes/i.test(reasons)?'youtube_analytics_consent_required':
    status===401?'youtube_reconnect_required':
    status===429||/quotaExceeded|rateLimitExceeded/i.test(reasons)?'youtube_quota_exceeded':
    status===400||/invalidMetrics|invalidDimension|invalidFilters|incompatible|invalid query/i.test(reasons)?'youtube_analytics_query_invalid':
    'youtube_analytics_unavailable';
  return Object.assign(Error(code),{status:status===401||status===403?403:502});
}
export async function fetchAnalytics({token,channelId,days=28,fetchImpl=fetch,now=new Date()}){
  if(channelId!==TARGET_CHANNEL)throw Object.assign(Error('youtube_channel_mismatch'),{status:409});
  const range=reportRange(days,now);
  async function get(url){const r=await fetchImpl(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});const j=await r.json();if(!r.ok)throw apiError(r.status,j);return j;}
  const report=params=>get('https://youtubeanalytics.googleapis.com/v2/reports?'+new URLSearchParams({ids:'channel=='+channelId,startDate:range.startDate,endDate:range.endDate,...params}));
  // A rejected optional report must not blank the entire dashboard.
  // Query a small supported metric set first; enrich only if Google accepts it.
  const dailyReport=await report({dimensions:'day,creatorContentType',metrics:'views,engagedViews,estimatedMinutesWatched,likes,comments,shares,subscribersGained,subscribersLost',sort:'day'}).catch(async e=>{
    if(e.message!=='youtube_analytics_query_invalid')throw e;
    return report({dimensions:'day,creatorContentType',metrics:'views,estimatedMinutesWatched',sort:'day'});
  });
  let playbackReport;
  try{playbackReport=await report({dimensions:'creatorContentType',metrics:'views,engagedViews,estimatedMinutesWatched,averageViewDuration,averageViewPercentage'});}
  catch(e){
    if(e.message!=='youtube_analytics_query_invalid')throw e;
    playbackReport=await report({dimensions:'creatorContentType',metrics:'views,estimatedMinutesWatched'});
  }
  let videoReport={columnHeaders:[],rows:[]},videoReportUnavailable=false;
  try{videoReport=await report({dimensions:'video,creatorContentType',metrics:metrics+',averageViewDuration,averageViewPercentage',sort:'-views',maxResults:'200'});}
  catch(e){
    if(e.message!=='youtube_analytics_query_invalid')throw e;
    try{videoReport=await report({dimensions:'video,creatorContentType',metrics:'views,estimatedMinutesWatched',sort:'-views',maxResults:'200'});}
    catch(inner){if(inner.message!=='youtube_analytics_query_invalid')throw inner;videoReportUnavailable=true;}
  }
  // Google's grouped creatorContentType report may be empty despite channel activity.
  // Explicitly request Shorts as a filter; do not mislabel channel-wide data.
  let filteredDaily=null,filteredSummary=null,filteredVideos=null;
  if(!rows(playbackReport).some(r=>r.creatorContentType==='SHORTS')){
    try{
      filteredDaily=await report({dimensions:'day',filters:'creatorContentType==SHORTS',metrics:'views,estimatedMinutesWatched,likes,comments,shares,subscribersGained,subscribersLost',sort:'day'});
      filteredSummary=await report({filters:'creatorContentType==SHORTS',metrics:'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage'});
      filteredVideos=await report({dimensions:'video',filters:'creatorContentType==SHORTS',metrics:'views,estimatedMinutesWatched',sort:'-views',maxResults:'200'});
    }catch(e){console.warn('youtube_shorts_filtered_report_unavailable',e.message);}
  }
  const daily=filteredDaily?.rows?.length?rows(filteredDaily):rows(dailyReport).filter(r=>r.creatorContentType==='SHORTS');
  const summary=rows(playbackReport).find(r=>r.creatorContentType==='SHORTS')||(filteredSummary?.rows?.length?rows(filteredSummary)[0]:null);
  if(summary)for(const key of ['likes','comments','shares','subscribersGained','subscribersLost'])summary[key]=daily.reduce((s,r)=>s+Number(r[key]||0),0);
  const videos=filteredVideos?.rows?.length?rows(filteredVideos):rows(videoReport).filter(r=>r.creatorContentType==='SHORTS');
  let metadataUnavailable=false;
  for(let i=0;i<videos.length;i+=50){
    const batch=videos.slice(i,i+50);
    try{const details=await get('https://www.googleapis.com/youtube/v3/videos?'+new URLSearchParams({part:'snippet',id:batch.map(v=>v.video).join(',')}));
      const byId=new Map((details.items||[]).map(v=>[v.id,v.snippet]));
      for(const v of batch){const s=byId.get(v.video);v.title=s?.title||v.video;v.publishedAt=s?.publishedAt||null;}
    }catch{metadataUnavailable=true;for(const v of batch)v.title=v.video;}
  }
  return {channelId,range,summary,daily,videos,metadataUnavailable,videoReportUnavailable,shortsFilterAttempted:!!filteredDaily,videoLimit:200,videoLimitReached:(videoReport.rows||[]).length===200,
    latestReportedDay:daily.at(-1)?.day||null,fetchedAt:now.toISOString(),source:'YouTube Analytics API',contentType:'SHORTS'};
}
