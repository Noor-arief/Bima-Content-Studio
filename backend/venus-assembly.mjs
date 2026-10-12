import { spawn } from "node:child_process";
import path from "node:path";
import { promises as fs } from "node:fs";
import ffmpegPath from "ffmpeg-static";

// Offline MP4 assembly stage: no AI API, no YouTube upload.
// All supplied media must already exist on the server's storage.
const BASE={width:720,height:1280,fps:30};
const exists=async p=>{const s=await fs.stat(p);if(!s.isFile()||s.size<1024)throw Error("missing_or_empty_asset");};
function ffmpeg(args,timeoutMs=180000){
 return new Promise((resolve,reject)=>{
  const proc=spawn(ffmpegPath,args,{stdio:["ignore","ignore","pipe"]});
  let err="",done=false;
  const timer=setTimeout(()=>{proc.kill("SIGKILL");},timeoutMs);
  proc.stderr.on("data",d=>{err=(err+d.toString()).slice(-3000);});
  proc.on("error",e=>{if(!done){done=true;clearTimeout(timer);reject(e);}});
  proc.on("close",code=>{if(done)return;done=true;clearTimeout(timer);code===0?resolve():reject(Error("ffmpeg_failed_"+code+": "+err.slice(-380)));});
 });
}
const validateInside=(dir,file)=>{
 const base=path.resolve(dir)+path.sep,resolved=path.resolve(file);
 if(!resolved.startsWith(base))throw Error("media_path_outside_storage");
 return resolved;
};
export async function buildVenusShort({mediaDir,clips,narrationFile,outFile}){
 if(!Array.isArray(clips)||clips.length!==3)throw Error("three_clips_required");
 const files=clips.map(p=>validateInside(mediaDir,p)),narration=validateInside(mediaDir,narrationFile),out=validateInside(mediaDir,outFile);
 await Promise.all([...files,narration].map(exists));
 const tmp=path.join(mediaDir,"venus-assemble-"+Date.now());
 await fs.mkdir(tmp,{recursive:true,mode:0o700});
 try{
  const durations=[8,11,11];
  const normalized=[];
  for(let i=0;i<3;i++){
   const name=path.join(tmp,"scene-"+i+".mp4");
   await ffmpeg(["-hide_banner","-loglevel","error","-y","-i",files[i],
    "-t",String(durations[i]),"-an","-vf",
    "scale="+BASE.width+":"+BASE.height+":force_original_aspect_ratio=increase,crop="+BASE.width+":"+BASE.height+",fps="+BASE.fps+",format=yuv420p",
    "-c:v","libx264","-preset","veryfast","-crf","23","-movflags","+faststart",name]);
   normalized.push(name);
  }
  const list=path.join(tmp,"concat.txt");
  await fs.writeFile(list,normalized.map(f=>"file '"+f.replace(/'/g,"'\\''")+"'").join("\n")+"\n");
  await ffmpeg(["-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",list,
    "-i",narration,"-filter_complex","[1:a]apad,atrim=0:30,afade=t=out:st=28:d=2[a]",
    "-map","0:v:0","-map","[a]","-t","30","-c:v","copy","-c:a","aac","-b:a","160k","-movflags","+faststart",out]);
  const stat=await fs.stat(out);
  if(stat.size<50_000)throw Error("final_mp4_too_small");
  return {path:out,bytes:stat.size,durationSeconds:30,ownerApprovalRequired:true,uploadedToYoutube:false};
 }finally{await fs.rm(tmp,{recursive:true,force:true}).catch(()=>{});}
}
