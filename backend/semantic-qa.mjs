import {readFile,stat} from "node:fs/promises";

/** AI QA is a filter, not a substitute for owner preview. */
export function normalizeQa(raw,expectedVoice){
  if(!raw||typeof raw!=="object")throw Error("qa_invalid_response");
  const checks=["narrationComplete","narrationMatches","storyboardMatches","endingComplete","scientificVisualsPlausible"];
  if(!checks.every(k=>typeof raw[k]==="boolean"))throw Error("qa_incomplete_response");
  const issues=(Array.isArray(raw.issues)?raw.issues:[]).slice(0,8).map(x=>String(x).slice(0,120));
  const transcript=String(raw.heardNarration||"").trim().slice(0,300);
  if(!transcript||transcript.length<12)issues.push("narration_unverified");
  const normalized=x=>String(x||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
  const wt=normalized(expectedVoice).split(" ").filter(Boolean);
  const heard=new Set(normalized(transcript).split(" ").filter(Boolean));
  const overlap=wt.length?wt.filter(w=>heard.has(w)).length/wt.length:0;
  if(overlap<0.72)issues.push("spoken_words_mismatch");
  const ok=checks.every(k=>raw[k]===true)&&issues.length===0;
  return {pass:ok,heardNarration:transcript,narrationComplete:raw.narrationComplete,
    narrationMatches:raw.narrationMatches,storyboardMatches:raw.storyboardMatches,
    endingComplete:raw.endingComplete,scientificVisualsPlausible:raw.scientificVisualsPlausible,
    overlap:Number(overlap.toFixed(2)),issues,assessment:"AI-assisted; owner must still watch the whole video"};
}

export async function assessVideo({file,prompt,voiceover,key,model="gemini-2.5-flash",fetchImpl=fetch}){
  if(!key)throw Error("qa_missing_api_key");
  const info=await stat(file);
  if(info.size<1024||info.size>18_000_000)throw Error("qa_requires_mp4_under_18mb");
  const bytes=await readFile(file);
  const instruction=[
    "You are a STRICT quality-assurance editor for an 8-second English narrated science Short.",
    "Watch and listen to the ACTUAL video. NEVER infer dialogue from its expected script.",
    "If audio cannot be heard, mark narrationComplete and narrationMatches false.",
    "Judge shot order, natural movement, intended concept, narration, final spoken words",
    "and whether the ending is complete without an abrupt cut.",
    "If uncertain, set false. Judge scientific plausibility but do not overclaim fact checking.",
    "EXPECTED VOICEOVER:",JSON.stringify(String(voiceover||"").slice(0,220)),
    "REQUIRED STORYBOARD:",String(prompt||"").slice(0,2300),
    "Return ONLY JSON with keys: heardNarration (actual audio only),",
    "narrationComplete (boolean), narrationMatches (boolean), storyboardMatches (boolean),",
    "endingComplete (boolean), scientificVisualsPlausible (boolean), issues (string array)."
  ].join("\n");
  const response=await fetchImpl("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{
    method:"POST",headers:{"x-goog-api-key":key,"Content-Type":"application/json"},
    body:JSON.stringify({contents:[{parts:[{inlineData:{mimeType:"video/mp4",data:bytes.toString("base64")}}, {text:instruction}]}],
      generationConfig:{responseMimeType:"application/json",temperature:0.1,maxOutputTokens:650}}),
    signal:AbortSignal.timeout(110000)
  });
  const json=await response.json().catch(()=>({}));
  if(!response.ok)throw Error("qa_provider_http_"+response.status);
  let content=(json.candidates||[]).flatMap(c=>c.content?.parts||[]).map(p=>p.text||"").join("").trim();
  const tick=String.fromCharCode(96);
  if(content.startsWith(tick.repeat(3)))content=content.replace(new RegExp("^"+tick+"{3}(?:json)?\\s*","i"),"").replace(new RegExp(tick+"{3}$"),"");
  let parsed;
  try{parsed=JSON.parse(content)}catch{throw Error("qa_provider_returned_non_json")}
  return normalizeQa(parsed,voiceover);
}
