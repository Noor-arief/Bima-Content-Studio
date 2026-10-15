import {promises as fs} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';

export function runMedia(args){
  return new Promise((resolve,reject)=>{
    const p=spawn(ffmpeg,['-nostdin','-hide_banner',...args],{stdio:['ignore','ignore','pipe']});
    let stderr=''; const timer=setTimeout(()=>p.kill('SIGKILL'),180000);
    p.stderr.on('data',b=>{stderr=(stderr+b).slice(-12000);});
    p.on('error',e=>{clearTimeout(timer);reject(e);});
    p.on('close',code=>{clearTimeout(timer);code===0?resolve(stderr):reject(Error('media_processing_failed'));});
  });
}
export async function inspectMedia(file,seconds){
  const metadata=await runMedia(['-i',file,'-t','0.1','-f','null','-']);
  const d=/Duration:\s*(\d+):(\d+):([\d.]+)/.exec(metadata);
  const wh=/Video:[^\n]*?(\d{3,5})x(\d{3,5})/.exec(metadata);
  const duration=d?Number(d[1])*3600+Number(d[2])*60+Number(d[3]):0;
  if(!wh||Number(wh[1])!==720||Number(wh[2])!==1280||Math.abs(duration-seconds)>0.3||!/Audio:/.test(metadata))throw Error('video_format_duration_or_audio_failed');
  // Decode the entire file, not just its header.
  await runMedia(['-v','error','-i',file,'-f','null','-']);
  return {width:720,height:1280,duration,hasAudio:true,decoded:true};
}
export function validateCues(cues,expected){
  if(!Array.isArray(cues)||!cues.length||cues.length>20)throw Error('subtitle_timing_missing');
  let end=0;
  for(const c of cues){
    if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<end||c.end<=c.start||c.end>8||typeof c.text!=='string'||!c.text.trim()||c.text.length>110)throw Error('subtitle_timing_invalid');
    end=c.end;
  }
  const norm=s=>s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  if(norm(cues.map(c=>c.text).join(' '))!==norm(expected))throw Error('subtitle_transcript_mismatch');
  return cues;
}
function wrap(text){
  const words=text.trim().split(/\s+/);const lines=[''];
  for(const w of words){if(w.length>28)throw Error('subtitle_word_too_long');if((lines.at(-1)+' '+w).trim().length>28)lines.push('');lines[lines.length-1]=(lines.at(-1)+' '+w).trim();}
  if(lines.length>4)throw Error('subtitle_too_many_lines');return lines.join('\n');
}
export async function assembleGoogleAffiliate({clips,scenes,outputPath}){
  if(clips.length!==3||scenes.length!==3)throw Error('three_scenes_required');
  const dir=await fs.mkdtemp(path.join(path.dirname(outputPath),'tt-captions-'));
  const temp=outputPath+'.rendering.mp4';
  try{
    const filters=[];const args=['-y','-v','error'];
    for(let i=0;i<3;i++){
      await inspectMedia(clips[i],8);args.push('-i',clips[i]);
      const cues=validateCues(scenes[i].qa.cues,scenes[i].voice);
      filters.push(`[${i}:v]fps=24,setsar=1,trim=duration=8,setpts=PTS-STARTPTS[v${i}base]`);
      for(let n=0;n<cues.length;n++){
        const file=path.join(dir,`${i}-${n}.txt`);await fs.writeFile(file,wrap(cues[n].text));
        const safe=file.replace(/\\/g,'\\\\').replace(/:/g,'\\:').replace(/'/g,"\\'");
        filters.push(`[v${i}${n===0?'base':n-1}]drawtext=textfile='${safe}':expansion=none:fontsize=32:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=10:line_spacing=6:x=(w-text_w)/2:y=h*0.70:enable='between(t,${cues[n].start},${cues[n].end})'[v${i}${n}]`);
      }
      filters.push(`[v${i}${cues.length-1}]format=yuv420p[v${i}]`);
      filters.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=duration=8,asetpts=PTS-STARTPTS[a${i}]`);
    }
    filters.push('[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[v][a]');
    args.push('-filter_complex',filters.join(';'),'-map','[v]','-map','[a]','-t','24','-c:v','libx264','-preset','veryfast','-crf','23','-c:a','aac','-movflags','+faststart',temp);
    await runMedia(args);const technical=await inspectMedia(temp,24);
    await fs.rename(temp,outputPath);return technical;
  }finally{await fs.rm(dir,{recursive:true,force:true});await fs.rm(temp,{force:true});}
}
