import { spawn } from 'node:child_process';

const MAX_SECONDS = 65;
const TIMEOUT_MS = 180_000;

async function ffmpegBinary(){
  if(process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  const binary = (await import('ffmpeg-static')).default;
  if(!binary) throw Error('ffmpeg_unavailable');
  return binary;
}

function runFFmpeg(binary, args, timeoutMs, allowNonZero = false){
  return new Promise((resolve,reject)=>{
    const proc = spawn(binary, args, {stdio:['ignore','ignore','pipe']});
    let stderr = '';
    let finished = false;
    const timer = setTimeout(()=>proc.kill('SIGKILL'),timeoutMs);
    proc.stderr.on('data', b=>{stderr=(stderr+b.toString()).slice(-14000)});
    proc.on('error', err=>{if(finished)return;finished=true;clearTimeout(timer);reject(err)});
    proc.on('close',(code,signal)=>{
      if(finished)return;finished=true;clearTimeout(timer);
      if(signal==='SIGKILL') return reject(Error('conversion_timeout'));
      if(code!==0&&!allowNonZero)return reject(Error('ffmpeg_failed: '+stderr.slice(-800)));
      resolve(stderr);
    });
  });
}

export async function convertShortsVideo(inputPath,outputPath,{mode='blur'}={}){
  if(mode!=='blur'&&mode!=='crop')throw Error('invalid_conversion_mode');
  const binary=await ffmpegBinary();
  const metadata=await runFFmpeg(binary,['-hide_banner','-i',inputPath],15_000,true);
  const match=metadata.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if(!match||!/Video:\s/.test(metadata))throw Error('video_metadata_unavailable');
  const seconds=Number(match[1])*3600+Number(match[2])*60+Number(match[3]);
  if(seconds<=0||seconds>MAX_SECONDS)throw Error('shorts_duration_out_of_range');
  const vf=mode==='crop'
    ? '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v]'
    : '[0:v]split=2[bs][fs];[bs]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:12[bg];[fs]scale=1080:1920:force_original_aspect_ratio=decrease,setsar=1[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1,setsar=1[v]';
  await runFFmpeg(binary,['-nostdin','-hide_banner','-loglevel','error','-y','-i',inputPath,
    '-filter_complex',vf,'-map','[v]','-map','0:a?','-c:v','libx264','-preset','veryfast','-crf','24',
    '-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-shortest',outputPath],TIMEOUT_MS);
  return {durationSeconds:seconds,width:1080,height:1920,mode};
}
