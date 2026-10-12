import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {normalizeQa,assessVideo} from "../semantic-qa.mjs";

const good={heardNarration:"An octopus has three hearts, and two pump blood to its gills.",
 narrationComplete:true,narrationMatches:true,storyboardMatches:true,endingComplete:true,
 scientificVisualsPlausible:true,issues:[]};

test("fail closed on incomplete audio, visual mismatch and transcription drift",()=>{
 const expected="An octopus has three hearts, and two pump blood to its gills.";
 assert.equal(normalizeQa(good,expected).pass,true);
 assert.equal(normalizeQa({...good,endingComplete:false},expected).pass,false);
 assert.equal(normalizeQa({...good,storyboardMatches:false},expected).pass,false);
 assert.equal(normalizeQa({...good,heardNarration:"Somewhere far from the sea."},expected).pass,false);
 assert.equal(normalizeQa({...good,issues:["third heart missing"]},expected).pass,false);
 assert.throws(()=>normalizeQa({heardNarration:"unverified"},"Science video"),/incomplete/);
});

test("multimodal QA sends actual video bytes to Gemini but never grants permission on model failure",async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),"bima-qa-"));
 try{
   const file=path.join(dir,"sample.mp4");
   const bytes=Buffer.alloc(1500,7);await writeFile(file,bytes);
   let checked=false;
   const fake=async(url,opts)=>{
     assert.match(url,/gemini-2\.5-flash:generateContent/);
     assert.equal(opts.headers["x-goog-api-key"],"fake-key");
     const request=JSON.parse(opts.body);assert.equal(request.contents[0].parts[0].inlineData.mimeType,"video/mp4");
     assert.equal(Buffer.from(request.contents[0].parts[0].inlineData.data,"base64").length,1500);
     checked=true;
     return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(good)}]}}]})};
   };
   const expected=good.heardNarration;
   const r=await assessVideo({file,prompt:"A bright octopus swims in a blue sea and reveals its three hearts.",voiceover:expected,key:"fake-key",fetchImpl:fake});
   assert.equal(checked,true);assert.equal(r.pass,true);
   await assert.rejects(()=>assessVideo({file,prompt:"test",voiceover:expected,key:"fake-key",fetchImpl:async()=>({ok:false,status:401,json:async()=>({})})}),/qa_provider_http_401/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
