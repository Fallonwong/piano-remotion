import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {performance,attackFrames} from './music.mjs';

export const sha256=(value)=>crypto.createHash('sha256').update(value).digest('hex');
export const canonical=(v)=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
export const hashObject=(v)=>sha256(canonical(v));
export function failure(code,message,next){return Object.assign(new Error(message),{code,next});}
export function run(exe,args,options={}) {
  const r=spawnSync(exe,args,{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:8*1024*1024,...options});
  if(r.error||r.status!==0)throw failure('TOOL_FAILED',`${exe}: ${r.error?.message||r.stderr||r.stdout}`,`Check the supplied executable and input. No dependency was installed.`);
  return r.stdout;
}
export function probeMedia(file,ffprobe='ffprobe') {
  if(!fs.existsSync(file))throw failure('MEDIA_MISSING',`Missing media: ${file}`,'Provide a readable local media file.');
  const data=JSON.parse(run(ffprobe,['-v','error','-show_format','-show_streams','-of','json',file]));
  const duration=Number(data.format?.duration);
  if(!Number.isFinite(duration)||duration<=0)throw failure('INVALID_MEDIA_DURATION','No positive media duration','Supply a decodable recording.');
  return {duration,streams:data.streams??[],fileSha256:sha256(fs.readFileSync(file))};
}
export function audioFeatures(file,ffmpeg='ffmpeg') {
  const bytes=run(ffmpeg,['-v','error','-i',file,'-vn','-ac','1','-ar','22050','-f','s16le','pipe:1'],{encoding:null,maxBuffer:256*1024*1024});
  if(bytes.length<2)throw failure('AUDIO_DECODE_FAILED','No decoded PCM samples','Check audio codec and decoder.');
  const sampleCount=Math.floor(bytes.length/2),window=220,energies=[];let sum=0,peak=0;
  for(let start=0;start<sampleCount;start+=window){let square=0,count=0;for(let i=start;i<Math.min(start+window,sampleCount);i++){const s=bytes.readInt16LE(i*2)/32768;square+=s*s;sum+=s*s;peak=Math.max(peak,Math.abs(s));count++;}energies.push(Math.sqrt(square/count));}
  const floor=Math.max(.002,energies.reduce((a,b)=>Math.max(a,b),0)*.035),onsets=[];
  for(let i=1;i<energies.length;i++) {
    const before=energies.slice(Math.max(0,i-6),i),baseline=before.reduce((a,b)=>a+b,0)/before.length;
    if(energies[i]>floor&&energies[i]>baseline*1.65&&energies[i]-baseline>floor*.65){const seconds=i*window/22050;if(!onsets.length||seconds-onsets.at(-1)>.075)onsets.push(seconds);}
  }
  const rms=Math.sqrt(sum/sampleCount);
  if(rms<.0001||peak<.001)throw failure('SILENT_AUDIO','Decoded audio is effectively silent','Choose an audible recording; a silent AAC stream is not proof of music.');
  return {sampleRate:22050,duration:sampleCount/22050,rms,peak,onsets};
}
export function checkAlignment(timeline,audioFile,{ffmpeg='ffmpeg',ffprobe='ffprobe',toleranceSeconds=2/timeline.fps}={}) {
  const media=probeMedia(audioFile,ffprobe);
  if(!media.streams.some(s=>s.codec_type==='audio'))throw failure('AUDIO_STREAM_MISSING','No audio stream in supplied recording','Provide an audio file with an audio stream.');
  const features=audioFeatures(audioFile,ffmpeg),frames=attackFrames(timeline);
  if(frames.length<3)throw failure('ALIGNMENT_REVIEW_REQUIRED','At least three distinct attacks are needed for automatic start/middle/end sampling','Provide manual timestamp evidence for a sparse score.');
  const selected=[frames[0],frames[Math.floor(frames.length/2)],frames.at(-1)];
  const samples=selected.map((frame,i)=>{
    const expected=frame/timeline.fps;
    const nearest=features.onsets.reduce((best,x)=>Math.abs(x-expected)<Math.abs((best??Infinity)-expected)?x:best,null);
    const delta=nearest===null?null:nearest-expected;
    return {region:['beginning','middle','end'][i],frame,expectedSeconds:expected,observedOnsetSeconds:nearest,offsetSeconds:delta,passed:delta!==null&&Math.abs(delta)<=toleranceSeconds};
  });
  const lastAttack=frames.at(-1)/timeline.fps,scoreDuration=timeline.durationInFrames/timeline.fps;
  const durationPassed=media.duration>=lastAttack&&Math.abs(media.duration-scoreDuration)<=Math.max(.25,2/timeline.fps);
  return {schemaVersion:1,status:durationPassed&&samples.every(s=>s.passed)?'sampled_onsets_passed':'needs_review',audioSha256:media.fileSha256,timelineSha256:hashObject(timeline),method:'decoded_pcm_energy_onsets',toleranceSeconds,scoreDuration,audioDuration:media.duration,durationPassed,samples,audibility:{rms:features.rms,peak:features.peak},onsetCount:features.onsets.length,limitations:['Energy onsets are candidates, not pitch recognition.','Three sampled attacks do not certify every note.','Dense/polyphonic or legato audio may require manual onset/pitch review.','A missed energy onset is inconclusive, not proof of a missing note. Never shorten decays, trim sustains or rewrite notes to satisfy this detector.']};
}
export function retime(timeline,offsetSeconds){
  if(!Number.isFinite(offsetSeconds))throw failure('INVALID_OFFSET','Calibration offset must be finite seconds','Use a measured signed offset from the alignment report.');
  const result=structuredClone(timeline),delta=offsetSeconds*timeline.fps;
  result.events=result.events.map(e=>({...e,frame:e.frame+delta}));
  for(const e of result.events)for(const n of e.notes??[])for(const k of ['soundingStartFrame','soundingEndFrame','highlightEndFrame'])if(n[k]!==undefined)n[k]+=delta;
  if(result.events.some(e=>e.frame<0||e.frame>=result.durationInFrames))throw failure('CALIBRATION_OUT_OF_RANGE','Offset moves an attack outside the composition','Review leading audio/score duration; no destructive trimming was performed.');
  if(result.cameraPath)result.cameraPath=Array.from({length:result.durationInFrames},(_,f)=>structuredClone(timeline.cameraPath[Math.max(0,Math.min(timeline.cameraPath.length-1,Math.round(f-delta)))]));
  result.status='needs_audio_alignment';result.timingRevision={originalTimelineSha256:hashObject(timeline),offsetSeconds,method:'explicit_global_offset'};
  return result;
}
export function verifyAudioTransfer(source,output,{ffmpeg='ffmpeg',fps=30}={}){
  const decode=file=>run(ffmpeg,['-v','error','-i',file,'-vn','-ac','1','-ar','11025','-f','s16le','pipe:1'],{encoding:null,maxBuffer:256*1024*1024});
  const a=decode(source),b=decode(output),rate=11025,window=rate/2|0,limit=Math.ceil(2/fps*rate),samples=[];
  const count=Math.min(a.length,b.length)/2|0;
  for(let region=0;region<5;region++){
    const start=Math.floor((count-window)*region/4);if(start<0)continue;let energy=0;
    for(let i=0;i<window;i+=4)energy+=(a.readInt16LE((start+i)*2)/32768)**2;
    if(energy/window<1e-7)continue;
    let best={similarity:-1,lagSamples:0};
    for(let lag=-limit;lag<=limit;lag+=4){let dot=0,aa=0,bb=0;for(let i=0;i<window;i+=4){const j=start+i+lag;if(j<0||j>=b.length/2)continue;const x=a.readInt16LE((start+i)*2),y=b.readInt16LE(j*2);dot+=x*y;aa+=x*x;bb+=y*y;}const similarity=dot/Math.sqrt(Math.max(1,aa*bb));if(similarity>best.similarity)best={similarity,lagSamples:lag};}
    samples.push({region,...best,lagSeconds:best.lagSamples/rate});
  }
  if(!samples.length||samples.some(s=>s.similarity<.95))throw failure('AUDIO_TRANSFER_REVIEW_REQUIRED','Output audio differs from the reviewed master','Inspect encoding, offsets, gain and source selection; no content accuracy was inferred.');
  return {status:'sampled_master_transfer_passed',samples,limits:'Checks sampled master preservation, not every pitch or all samples.'};
}
export function synthesize(timeline,out,{confirmed=false}={}) {
  if(!confirmed)throw failure('SYNTHESIS_CONFIRMATION_REQUIRED','No audio was supplied; synthesis is opt-in','Ask whether the user wants synthetic piano-like audio, or explicitly confirms a silent preview.');
  if(fs.existsSync(out))throw failure('OUTPUT_EXISTS',out,'Choose a new output file.');
  const rate=22050,length=Math.ceil(timeline.durationInFrames/timeline.fps*rate),pcm=new Float64Array(length);
  const pitch=(p)=>{if(Number.isInteger(p)&&p>=0&&p<=127)return p;const m=/^([A-G])([#b]?)(-?\d+)$/.exec(p??'');if(!m)throw failure('PITCH_REQUIRED',`Cannot synthesize pitch ${p}`,'Provide actual MIDI pitches or C4-style pitches; do not invent notes.');return (Number(m[3])+1)*12+({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]])+(m[2]==='#'?1:m[2]==='b'?-1:0);};
  const music=performance(timeline);
  for(const n of music.spans) {
    const midi=pitch(n.pitch);if(midi<0||midi>127)throw failure('INVALID_PITCH',String(n.pitch),'Use a valid pitch.');const freq=440*2**((midi-69)/12),start=Math.round(n.startFrame/timeline.fps*rate),span=Math.min(length-start,Math.round((n.endFrame-n.startFrame+n.legatoOverlapFrames)/timeline.fps*rate));
    for(let k=0;k<span;k++){const t=k/rate,attack=Math.min(1,k/100),release=Math.min(1,(span-k)/180);pcm[start+k]+=.14*attack*release*Math.exp(-(n.segments[0].legacyDuration?5:2.4)*t)*[1,.48,.22,.1].reduce((s,a,j)=>s+a*Math.sin(2*Math.PI*freq*(j+1)*t),0);}
  }
  const peak=pcm.reduce((a,b)=>Math.max(a,Math.abs(b)),0),scale=peak>.85?.85/peak:1;
  const buffer=Buffer.alloc(44+length*2);buffer.write('RIFF');buffer.writeUInt32LE(36+length*2,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(rate,24);buffer.writeUInt32LE(rate*2,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(length*2,40);for(let i=0;i<length;i++)buffer.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(pcm[i]*scale*32767))),44+i*2);
  fs.writeFileSync(out,buffer,{flag:'wx'});return {status:'synthetic_audio_created',purpose:'calibration-preview',file:out,seconds:length/rate,soundingAttacks:music.spans.length,legacyDurations:music.legacyDurations,timbre:'original additive damped-harmonic piano-like synthesis, not a sampled piano',limits:'Slur pitches remain separate attacks; explicit durations connect their boundaries. This is not a sampled acoustic piano or pedal model.'};
}
