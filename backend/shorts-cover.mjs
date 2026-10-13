import { spawn } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

// Burn the already-approved, video-derived PNG into the first 0.9 seconds.
// Write a separate MP4: never replace the owner's original approved video.
export async function createShortsCoverVideo(videoPath, thumbnailPath) {
  if (!existsSync(videoPath) || !existsSync(thumbnailPath)) throw Error("cover_source_missing");
  const output = path.join(path.dirname(videoPath), path.basename(videoPath, path.extname(videoPath)) + ".cover-v1.mp4");
  const temp = output + ".tmp.mp4";
  await fs.rm(temp, {force:true});
  const args = ["-hide_banner","-loglevel","error","-y",
    "-i",videoPath,"-loop","1","-i",thumbnailPath,
    "-filter_complex","[1:v][0:v]scale2ref=w=iw:h=ih[cover][base];[base][cover]overlay=0:0:enable='lt(t,0.9)':shortest=1,format=yuv420p[v]",
    "-map","[v]","-map","0:a?","-c:v","libx264","-preset","veryfast","-crf","20",
    "-c:a","copy","-movflags","+faststart","-max_muxing_queue_size","1024",temp];
  try {
    await new Promise((resolve,reject) => {
      const child=spawn(ffmpegPath,args,{stdio:["ignore","ignore","pipe"]});
      let err="",finished=false;
      const timer=setTimeout(()=>{child.kill("SIGKILL");},120000);
      child.stderr.on("data",data=>{err=(err+String(data)).slice(-1500);});
      child.on("error",e=>{if(!finished){finished=true;clearTimeout(timer);reject(e);}});
      child.on("close",code=>{if(!finished){finished=true;clearTimeout(timer);code===0?resolve():reject(Error("cover_encode_failed_"+code+":"+err));}});
    });
    const stat=await fs.stat(temp);
    if(stat.size<1024 || stat.size>150000000)throw Error("cover_output_invalid_size");
    await fs.rename(temp,output);
    return output;
  }catch(e){await fs.rm(temp,{force:true}).catch(()=>{});throw e;}
}
