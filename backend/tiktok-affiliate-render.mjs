import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

// TikTok-only offline compositor. Requires genuine owner-approved product visuals,
// a finished narration audio track, and commercially licensed music.
// It NEVER selects affiliate products, claims TikTok authorization, or publishes.
export async function renderTikTokAffiliateVideo({
  images, voicePath, musicPath, subtitlesPath, outputPath,
  approvedProductAssets=false, musicLicensed=false, ownerApproved=false
}){
  if(!ownerApproved)throw Error("owner_approval_required");
  if(!approvedProductAssets)throw Error("verified_product_assets_required");
  if(!musicLicensed)throw Error("commercial_music_license_required");
  if(!Array.isArray(images)||images.length!==3)throw Error("three_product_images_required");
  const input=[...images,voicePath,musicPath,subtitlesPath];
  for(const p of input){
    if(typeof p!=="string"||!path.isAbsolute(p)||!(await fs.stat(p).catch(()=>null))?.isFile())
      throw Error("local_input_missing");
  }
  if(typeof outputPath!=="string"||!path.isAbsolute(outputPath))throw Error("absolute_output_path_required");
  if(input.includes(outputPath))throw Error("output_must_not_overwrite_source");
  const stat=await fs.stat(subtitlesPath);
  if(stat.size>20000)throw Error("subtitles_too_large");
  const srt=await fs.readFile(subtitlesPath,"utf8");
  if(!/00:00:0[0-9],\d{3} --> 00:00:0[0-9],\d{3}/.test(srt)||!/00:00:1\d,\d{3} --> 00:00:2[0-4],\d{3}/.test(srt))
    throw Error("expected_24_second_srt_timeline");
  const temp=outputPath+".rendering.mp4";
  await fs.rm(temp,{force:true});
  // A clean, restrained Ken Burns move; no artificial alteration of product.
  const visual=images.map((_,i)=>`[${i}:v]scale=850:1500:force_original_aspect_ratio=increase,crop=850:1500,zoompan=z='min(zoom+0.00025,1.045)':d=192:s=720x1280:fps=24,trim=duration=8,setpts=PTS-STARTPTS[v${i}]`).join(";");
  // Use a dynamic sidechain compressor instead of constant music volume.
  const filter=`${visual};[v0][v1][v2]concat=n=3:v=1:a=0,format=yuv420p[raw];[3:a]aresample=48000,volume=1.0,atrim=duration=24,asplit=2[voiceSC][voiceMix];[4:a]aresample=48000,volume=0.16,atrim=duration=24[music];[music][voiceSC]sidechaincompress=threshold=0.018:ratio=8:attack=10:release=220[duck];[voiceMix][duck]amix=inputs=2:duration=longest:dropout_transition=1,atrim=duration=24[a]`;
  // Subtitle sidecar preserved separately: FFmpeg binaries can differ in libass support.
  // A renderer must not claim captions are burned in without an explicit QA step.
  const args=["-nostdin","-hide_banner","-loglevel","error","-y"];
  for(const im of images)args.push("-loop","1","-t","8","-i",im);
  args.push("-i",voicePath,"-stream_loop","-1","-i",musicPath,
    "-filter_complex",filter,"-map","[raw]","-map","[a]","-t","24",
    "-c:v","libx264","-preset","veryfast","-crf","24","-pix_fmt","yuv420p",
    "-c:a","aac","-b:a","128k","-movflags","+faststart",temp);
  try{
    await new Promise((resolve,reject)=>{
      const child=spawn(ffmpegPath,args,{stdio:["ignore","ignore","pipe"]});
      let msg="",done=false;
      const timer=setTimeout(()=>child.kill("SIGKILL"),180000);
      child.stderr.on("data",chunk=>msg=(msg+String(chunk)).slice(-1800));
      child.on("error",err=>{if(done)return;done=true;clearTimeout(timer);reject(err);});
      child.on("close",code=>{if(done)return;done=true;clearTimeout(timer);code===0?resolve():reject(Error("tiktok_render_failed_"+code+"_"+msg));});
    });
    const out=await fs.stat(temp);
    if(out.size<10000||out.size>150000000)throw Error("invalid_tiktok_mp4_size");
    await fs.rename(temp,outputPath);
    return {outputPath,width:720,height:1280,durationSeconds:24,voiceMixed:true,musicDucked:true,subtitlesBurned:false,subtitlesSidecar:subtitlesPath,uploaded:false,affiliateLinked:false};
  }catch(err){await fs.rm(temp,{force:true}).catch(()=>{});throw err;}
}
