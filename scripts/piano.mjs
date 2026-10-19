#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {validateTimeline} from './prepare.mjs';
import {sha256,hashObject,probeMedia,audioFeatures,checkAlignment,synthesize,retime,failure} from './audio.mjs';

const scripts=path.dirname(fileURLToPath(import.meta.url));
export const readJSON=(p)=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const writeJSON=(p,v)=>{fs.mkdirSync(path.dirname(path.resolve(p)),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
function args(argv){const out={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))throw failure('INVALID_ARGUMENT',argv[i],'Use --name value arguments.');const k=argv[i].slice(2);out[k]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}return out;}
function need(a,key){if(typeof a[key]!=='string')throw failure('ARGUMENT_REQUIRED',`--${key} is required`,`Supply --${key} <value>.`);return a[key];}
function publicAsset(project,relative){if(typeof relative!=='string'||!relative)throw failure('ASSET_REQUIRED','Public-relative asset path required','Provide explicit song scoreSrc/audioSrc.');const root=path.resolve(project,'public'),p=path.resolve(root,relative);if(!p.startsWith(root+path.sep)||!fs.statSync(p,{throwIfNoEntry:false})?.isFile())throw failure('ASSET_INVALID',relative,'Use an existing file within this project public directory.');return p;}
export function songInputs(project,propsFile){const props=readJSON(propsFile);props.timeline=validateTimeline(props.timeline);return {props,score:publicAsset(project,props.scoreSrc),audio:props.audioSrc?publicAsset(project,props.audioSrc):null};}
function xmlAttributes(s){return Object.fromEntries([...s.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1],m[2]]));}
export function validateLayout(props,svg,evidence){
  if(evidence.scoreSha256!==sha256(fs.readFileSync(svg))||evidence.timelineSha256!==hashObject(props.timeline))throw failure('LAYOUT_STALE','SVG/timeline differ from the layout evidence','Export the score and mapping together and regenerate the layout evidence.');
  if(!evidence.producer?.tool||!evidence.producer?.runId)throw failure('LAYOUT_PROVENANCE_REQUIRED','Layout tool and runId required','Record the actual engraving run, not an invented verified flag.');
  const text=fs.readFileSync(svg,'utf8'),svgRoot=xmlAttributes(text.match(/<svg\b([^>]*)>/)?.[1]??'');
  if([...text.matchAll(/<svg\b/g)].length!==1||/<(?:defs|symbol|use|style|script|foreignObject|animate\w*|set)\b/i.test(text)||/\bstyle\s*=/i.test(text))throw failure('LAYOUT_NORMALIZATION_REQUIRED','SVG contains unsupported nested, styled or indirect geometry','Use a flattened, static SVG with directly identified notehead ellipses/circles; retain the original export for review.');
  const box=svgRoot.viewBox?.trim().split(/[ ,]+/).map(Number);
  const expectedViewport=[0,0,props.timeline.scoreWidth,props.timeline.scoreHeight];
  if(!box||box.length!==4||!box.every((v,i)=>Number.isFinite(v)&&Math.abs(v-expectedViewport[i])<.001))throw failure('LAYOUT_NORMALIZATION_REQUIRED','SVG viewBox differs from the checked timeline viewport','Normalize SVG viewBox to 0 0 scoreWidth scoreHeight in the same layout operation.');
  const nodes=new Map([...text.matchAll(/<(ellipse|circle)\b([^>]*)>/g)].map(m=>{const a=xmlAttributes(m[2]);return [a.id,{x:Number(a.cx),y:Number(a.cy),attributes:a}];}));
  const map=evidence.mapping;if(!Array.isArray(map))throw failure('LAYOUT_MAPPING_REQUIRED','No notehead mapping','Provide eventIndex/noteIndex/svgId and coordinates from the same engraving.');
  let expected=0;
  props.timeline.events.forEach((e,i)=>e.notes.forEach((n,j)=>{expected++;const matches=map.filter(m=>m.eventIndex===i&&m.noteIndex===j);if(matches.length!==1)throw failure('LAYOUT_MAPPING_INCOMPLETE',`event ${i} note ${j}`,'Map every note once.');const m=matches[0],node=nodes.get(m.svgId);
    const rotation=node?.attributes.transform?.match(/^rotate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)$/);
    const transformSafe=!node?.attributes.transform||(rotation&&Math.abs(Number(rotation[2])-node.x)<.001&&Math.abs(Number(rotation[3])-node.y)<.001);
    if(!node||!transformSafe||![node.x,node.y,m.x,m.y].every(Number.isFinite)||Math.abs(node.x-n.x)>.01||Math.abs(node.y-n.y)>.01||Math.abs(m.x-n.x)>.01||Math.abs(m.y-n.y)>.01)throw failure('LAYOUT_COORDINATE_REVIEW_REQUIRED',`Mapping mismatch: ${m.svgId}`,'Use a normalized same-layout SVG with identified notehead ellipses/circles. Complex path/transform exports need a validated normalization adapter; never guess geometry.');}));
  if(map.length!==expected)throw failure('LAYOUT_EXTRA_MAPPING','Unexpected mapping entries','Remove stale entries and export together.');
  // Ancestor transforms affect coordinates too; unsupported layouts fail closed.
  if(/<g\b[^>]*\btransform\s*=|<svg\b[^>]*\btransform\s*=/.test(fs.readFileSync(svg,'utf8')))throw failure('LAYOUT_TRANSFORM_REVIEW_REQUIRED','Nested transformed SVG is not normalized','Flatten coordinates using the engraver mapping adapter first.');
  return {status:'geometry_checked',mappedNoteheads:expected,scope:'Checks SVG notehead coordinates, not recognition accuracy.'};
}

export function validateScoreReviewEvidence(reportFile,props,score,runId){
  const report=readJSON(reportFile),root=path.dirname(path.resolve(reportFile)),files=[];
  const stale=(message)=>{throw failure('SCORE_REVIEW_STALE',message,'Regenerate the actual comparison and review from unchanged source/layout inputs.');};
  const local=(name)=>{if(typeof name!=='string'||path.basename(name)!==name)stale('Invalid comparison artifact path');const p=path.join(root,name);if(!fs.statSync(p,{throwIfNoEntry:false})?.isFile())stale(`Missing comparison artifact: ${name}`);files.push(p);return p;};
  for(const k of ['source','musicxml','svg','timeline','layout']){
    const names=fs.readdirSync(root).filter(n=>n.startsWith(`original-${k}.`)&&fs.statSync(path.join(root,n)).isFile());
    if(names.length!==1)stale(`Missing or ambiguous original ${k} snapshot`);
    const file=local(names[0]);if(sha256(fs.readFileSync(file))!==report.bindings?.[`${k}Sha256`])stale(`Changed ${k} snapshot`);
    if(k==='timeline'&&hashObject(readJSON(file))!==hashObject(props.timeline))stale('Props timeline differs from reviewed timeline');
  }
  if(report.bindings.svgSha256!==sha256(fs.readFileSync(score)))stale('Props SVG differs from reviewed SVG');
  const evidence=readJSON(local('layout-evidence.json')),mapping=readJSON(local('mapping.json'));
  if(evidence.schema!=='piano-score-layout/v1'||evidence.sameRun!==true||evidence.runId!==runId||!evidence.producer||hashObject(evidence.bindings)!==hashObject(report.bindings)||hashObject(evidence)!==report.layoutEvidenceSha256)stale('Same-run producer evidence changed or is invalid');
  if(hashObject(mapping)!==report.mappingSha256||hashObject(mapping.bindings)!==hashObject(report.bindings))stale('Measure mapping changed');
  const structural=readJSON(local('check.json'));
  if(structural.structuralPassed!==true||structural.sourceSha256!==report.bindings.musicxmlSha256)stale('Structure check no longer matches MusicXML');
  for(const side of ['source','layout'])for(const item of report.pages?.[side]??[])if(sha256(fs.readFileSync(local(item.file)))!==item.sha256)stale('Comparison page bytes changed');
  if(!report.measures?.length||report.measures.some(m=>m.status!=='approved'))stale('Unapproved measure');
  for(const m of report.measures)for(const side of ['source','layout']){const item=m.crops?.[side];if(!item||sha256(fs.readFileSync(local(item.file)))!==item.sha256)stale('Measure crop bytes changed');}
  local('review-template.json');local('comparison.html');
  return [...new Set(files)];
}
export function bindJob(a){
  const project=path.resolve(need(a,'project')),propsFile=path.resolve(need(a,'props')),out=path.resolve(need(a,'out'));
  const {props,score,audio}=songInputs(project,propsFile),sourceType=a['source-type']??'svg';
  if(!['svg','musicxml','midi','audio','pdf','staff-image','jianpu-image'].includes(sourceType))throw failure('SOURCE_TYPE_INVALID',sourceType,'Use a documented source type.');
  const image=props.scoreImage??{};
  if((image.x??0)!==0||(image.y??0)!==0||(image.width??props.timeline.scoreWidth)!==props.timeline.scoreWidth||(image.height??props.timeline.scoreHeight)!==props.timeline.scoreHeight)throw failure('LAYOUT_NORMALIZATION_REQUIRED','Score image uses offsets/scales outside the checked SVG coordinate system','Normalize exported SVG and timeline together; the legacy component remains compatible with custom transforms.');
  if(!audio&&!a['silent-confirmed'])throw failure('AUDIO_MISSING','Song props have no audioSrc','Ask whether to synthesize piano-like audio or explicitly confirm a silent preview; do not claim an audible work.');
  const layoutFile=path.resolve(need(a,'layout')),layout=readJSON(layoutFile);validateLayout(props,score,layout);
  let scoreReview=null,reviewFiles=[];
  if(['pdf','staff-image','jianpu-image','musicxml','audio'].includes(sourceType)){
    if(!a['score-review'])throw failure('SCORE_REVIEW_REQUIRED','Structured score and visual review evidence required','Run piano score check/compare and resolve uncertain measures before binding.');
    scoreReview=readJSON(a['score-review']);
    if(scoreReview.structuralPassed!==true||scoreReview.visualReview?.status!=='approved'||scoreReview.visualReview?.complete!==true||scoreReview.layoutEvidenceVerified!==true||scoreReview.status!=='reviewed')throw failure('SCORE_REVIEW_REQUIRED','Score review has not passed both structure and visual comparison','Run score compare with actual measure crops, same-run evidence and explicit review; rendering SVG is not recognition verification.');
    reviewFiles=validateScoreReviewEvidence(a['score-review'],props,score,layout.producer.runId);
  }
  if(/needs_|uncertain/.test(props.timeline.status??'')&&!a.draft)throw failure('TIMELINE_REVIEW_REQUIRED','Timeline is still marked uncertain','Resolve the doubts, or explicitly request a labeled draft.');
  let alignment=null;
  if(audio){alignment=readJSON(need(a,'alignment'));if(alignment.audioSha256!==sha256(fs.readFileSync(audio))||alignment.timelineSha256!==hashObject(props.timeline)||alignment.status!=='sampled_onsets_passed')throw failure('AUDIO_ALIGNMENT_REQUIRED','Missing, stale or failing audio calibration','Run piano align; inspect and correct start/middle/end timestamp offsets.');const fresh=checkAlignment(props.timeline,audio,a);if(fresh.status!=='sampled_onsets_passed')throw failure('AUDIO_ALIGNMENT_REQUIRED','Current decoded audio failed calibration','Correct the timing; changing a report status cannot bypass this check.');alignment=fresh;}
  const entry=fs.existsSync(path.join(project,'src/piano-remotion-demo/song.tsx'))?'src/piano-remotion-demo/song.tsx':'src/song.tsx';
  if(!fs.existsSync(path.join(project,entry)))throw failure('SONG_ENTRY_MISSING','Checked song entry is not installed','Use piano install --project or --standalone first.');
  const files=[propsFile,score,layoutFile,...(audio?[audio]:[]),...(a.alignment?[path.resolve(a.alignment)]:[]),...(a['score-review']?[path.resolve(a['score-review'])]:[]),...reviewFiles];
  const job={schemaVersion:1,status:a.draft?'checked_draft':'bound',project,entry,composition:'PianoRemotion-Song',propsFile,propsSha256:sha256(fs.readFileSync(propsFile)),fingerprints:Object.fromEntries(files.map(p=>[p,sha256(fs.readFileSync(p))])),timelineSha256:hashObject(props.timeline),scoreSrc:props.scoreSrc,audioSrc:props.audioSrc??null,sourceType,silentConfirmed:!audio&&!!a['silent-confirmed'],draft:!!a.draft,alignment,scoreReview:scoreReview?'structure_and_visual_passed':'not_supplied',layout:validateLayout(props,score,layout)};
  writeJSON(out,job);return {status:job.status,job:out,audio:audio?'calibrated':'explicitly_silent',next:'Use piano preview/render --job with this exact frozen job.'};
}
export function loadJob(file){const job=readJSON(file);if(job.schemaVersion!==1||job.composition!=='PianoRemotion-Song')throw failure('INVALID_JOB','Not a checked song job','Bind the song first.');for(const [p,hash] of Object.entries(job.fingerprints))if(!fs.existsSync(p)||sha256(fs.readFileSync(p))!==hash)throw failure('JOB_STALE',`Changed input: ${p}`,'Revalidate and bind a new job; do not change props between preview and render.');
  const {props,score,audio}=songInputs(job.project,job.propsFile);
  if(sha256(fs.readFileSync(job.propsFile))!==job.propsSha256||hashObject(props.timeline)!==job.timelineSha256||props.scoreSrc!==job.scoreSrc||(props.audioSrc??null)!==job.audioSrc||!job.fingerprints[score]||(audio&&!job.fingerprints[audio]))throw failure('JOB_STALE','Job references differ from its frozen props/assets','Bind a new checked job; no demo fallback is permitted.');
  return job;}
function runtime(job){const require=createRequire(path.join(job.project,'package.json')),versions={};for(const [n,v] of Object.entries({'remotion':'4.0.515','@remotion/cli':'4.0.515','react':'19.2.4','react-dom':'19.2.4','typescript':'5.9.3'})){try{versions[n]=require(`${n}/package.json`).version;}catch{throw failure('ENVIRONMENT_MISSING',`Cannot resolve ${n}`,'Run piano doctor with authorized project roots; reuse a compatible installation before requesting install.');}if(versions[n]!==v)throw failure('ENVIRONMENT_INCOMPATIBLE',`${n}: ${versions[n]} (baseline ${v})`,'Use a validated compatible project, never link incompatible node_modules.');}return path.join(path.dirname(require.resolve('@remotion/cli/package.json')),'remotion-cli.js');}
export function verifyOutput(job,file,a={}){
  const media=probeMedia(file,a.ffprobe??'ffprobe'),props=readJSON(job.propsFile),video=media.streams.find(s=>s.codec_type==='video'),audio=media.streams.find(s=>s.codec_type==='audio');
  if(!video)throw failure('VIDEO_STREAM_MISSING','No video stream','Check renderer output.');
  const duration=props.timeline.durationInFrames/props.timeline.fps;
  if(Math.abs(Number(video.duration??media.duration)-duration)>.1||video.width!==(props.width??1280)||video.height!==(props.height??720))throw failure('VIDEO_METADATA_MISMATCH','Unexpected duration or dimensions','Render the complete checked composition with its own props.');
  const [num,den]=String(video.avg_frame_rate??video.r_frame_rate).split('/').map(Number);if(Math.abs(num/den-props.timeline.fps)>.001)throw failure('VIDEO_FPS_MISMATCH','Frame rate differs from timeline','Use the checked fps.');
  let decoded=null,alignment=null;
  if(job.audioSrc){if(!audio)throw failure('AUDIO_STREAM_MISSING','Rendered video has no audio','Use the same audioSrc and props in preview/export.');decoded=audioFeatures(file,a.ffmpeg??'ffmpeg');alignment=checkAlignment(props.timeline,file,a);if(alignment.status!=='sampled_onsets_passed')throw failure('RENDER_ALIGNMENT_REVIEW_REQUIRED','Rendered onset samples differ from the checked timeline','Inspect the decoded output at the reported timestamps.');}
  return {schemaVersion:1,status:job.draft?'draft_media_verified':'media_verified',file:path.resolve(file),fileSha256:media.fileSha256,video:{codec:video.codec_name,width:video.width,height:video.height,fps:num/den,duration},audio:audio?{codec:audio.codec_name,rms:decoded?.rms,peak:decoded?.peak}:null,silentConfirmed:job.silentConfirmed,alignment,limits:'Stream and sampled onset checks do not certify all pitches or all note timings.'};
}
export async function main(argv){
  const [command,...rest]=argv;
  if(['doctor','install','prepare','score'].includes(command)){const child=spawnSync(process.execPath,[path.join(scripts,`${command}.mjs`),...rest],{stdio:'inherit',windowsHide:true});return {exitCode:child.status??2,delegated:true};}
  if(!command||command==='--help')return {status:'help',commands:['doctor','install','prepare','score','synthesize','align','calibrate','bind','preview','render','verify'],usage:'node scripts/piano.mjs COMMAND --project ROOT --props FILE ...; preview/render require --job FILE. No automatic dependency installs.'};
  const a=args(rest);
  if(command==='synthesize'){return synthesize(validateTimeline(readJSON(need(a,'timeline'))),need(a,'out'),{confirmed:a.confirmed===true});}
  if(command==='align'){const {props,audio}=songInputs(need(a,'project'),need(a,'props'));if(!audio)throw failure('AUDIO_MISSING','No audioSrc in supplied props','Ask about synthesis or silent preview.');const report=checkAlignment(props.timeline,audio,a);writeJSON(need(a,'out'),report);return {...report,exitCode:report.status==='sampled_onsets_passed'?0:3};}
  if(command==='calibrate'){const {props}=songInputs(need(a,'project'),need(a,'props'));props.timeline=retime(props.timeline,Number(need(a,'offset-seconds')));writeJSON(need(a,'out'),props);return {status:'calibration_proposed',file:path.resolve(a.out),next:'Re-run align, review measured offsets and regenerate stale layout/review evidence. A global shift does not fix tempo drift.'};}
  if(command==='bind')return bindJob(a);
  const job=loadJob(need(a,'job'));
  if(command==='verify'){const report=verifyOutput(job,need(a,'video'),a);if(a.report)writeJSON(a.report,report);return report;}
  if(!['preview','render'].includes(command))throw failure('INVALID_COMMAND',command,'Use --help.');
  const cli=runtime(job),cliArgs=[command==='preview'?'studio':'render',job.entry];
  if(command==='render'){if(a.confirmed!==true)throw failure('EXPORT_CONFIRMATION_REQUIRED','Render requires explicit export intent','Confirm export, then pass --confirmed.');if(fs.existsSync(need(a,'out')))throw failure('OUTPUT_EXISTS',a.out,'Choose a new output file.');cliArgs.push(job.composition,path.resolve(a.out));}
  cliArgs.push(`--props=${job.propsFile}`);
  if(a.browser)cliArgs.push(`--browser-executable=${path.resolve(a.browser)}`);
  if(command==='preview'&&a.port)cliArgs.push(`--port=${a.port}`);
  if(command==='preview')cliArgs.push('--no-open');
  if(command==='render')cliArgs.push('--concurrency=2');
  const result=spawnSync(process.execPath,[cli,...cliArgs],{cwd:job.project,stdio:'inherit',windowsHide:true});
  if(result.error||result.status!==0)throw failure('REMOTION_FAILED',result.error?.message??`exit ${result.status}`,'Inspect CLI diagnostics; checked song props were used without a demo fallback.');
  if(command==='preview')return {status:'preview_closed'};
  const report=verifyOutput(job,a.out,a);writeJSON(a.report??`${a.out}.verification.json`,report);return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const result=await main(process.argv.slice(2));if(!result.delegated)console.log(JSON.stringify(result,null,2));process.exitCode=result.exitCode??0;}
  catch(error){console.error(JSON.stringify({status:'blocked',code:error.code??'INVALID_INPUT',message:error.message,next:error.next??'Check arguments and supplied files; no success was recorded.'},null,2));process.exitCode=2;}
}
