import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {synthesize,checkAlignment,hashObject,sha256,audioFeatures,retime} from './audio.mjs';
import {bindJob,loadJob,validateLayout} from './piano.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),temp=fs.mkdtempSync(path.join(os.tmpdir(),'piano-workflow-'));
const timeline={fps:30,durationInFrames:90,scoreWidth:500,scoreHeight:200,status:'verified_test',events:[{hand:'right',frame:9,x:100,y:100,notes:[{x:100,y:100,pitch:'C5'}]},{hand:'right',frame:39,x:200,y:100,notes:[{x:200,y:100,pitch:'E5'}]},{hand:'right',frame:69,x:300,y:100,notes:[{x:300,y:100,pitch:'G5'}]}]};
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="500" height="200" viewBox="0 0 500 200">'+timeline.events.map((e,i)=>`<ellipse id="n${i}" cx="${e.x}" cy="${e.y}" rx="10" ry="6"/>`).join('')+'</svg>';
let serial=0;
function setup(){const p=path.join(temp,`case-${++serial}`);fs.mkdirSync(path.join(p,'public/song'),{recursive:true});fs.mkdirSync(path.join(p,'src'),{recursive:true});fs.writeFileSync(path.join(p,'src/song.tsx'),'// fixture song entry');const score=path.join(p,'public/song/score.svg');fs.writeFileSync(score,svg);const props={timeline:structuredClone(timeline),scoreSrc:'song/score.svg'};const propsFile=path.join(p,'props.json');const layout={scoreSha256:sha256(svg),timelineSha256:hashObject(props.timeline),producer:{tool:'original-test-generator',runId:`fixture-${serial}`},mapping:timeline.events.map((e,i)=>({eventIndex:i,noteIndex:0,x:e.x,y:e.y,svgId:`n${i}`}))};const layoutFile=path.join(p,'layout.json');fs.writeFileSync(propsFile,JSON.stringify(props));fs.writeFileSync(layoutFile,JSON.stringify(layout));return {p,propsFile,props,score,layout,layoutFile,out:path.join(p,'job.json')};}
test('missing audio produces actionable error instead of silently binding a voiced work',()=>{const s=setup();assert.throws(()=>bindJob({project:s.p,props:s.propsFile,layout:s.layoutFile,out:s.out}),e=>e.code==='AUDIO_MISSING');});
test('synthesis requires confirmation and actual pitches',()=>{assert.throws(()=>synthesize(timeline,path.join(temp,'no.wav')),e=>e.code==='SYNTHESIS_CONFIRMATION_REQUIRED');const t=structuredClone(timeline);t.events[0].notes[0].pitch='guessed';assert.throws(()=>synthesize(t,path.join(temp,'invalid.wav'),{confirmed:true}),e=>e.code==='PITCH_REQUIRED');});
test('synthetic piano-like audio is decoded and calibrated at beginning/middle/end',()=>{const file=path.join(temp,'piano.wav');synthesize(timeline,file,{confirmed:true});const report=checkAlignment(timeline,file);assert.equal(report.status,'sampled_onsets_passed',JSON.stringify(report));assert.equal(report.samples.length,3);assert.ok(report.audibility.rms>0);fs.writeFileSync(path.join(temp,'alignment.json'),JSON.stringify(report,null,2));});
test('shifted timeline cannot pass audio calibration',()=>{const shifted=structuredClone(timeline);for(const e of shifted.events)e.frame+=6;const r=checkAlignment(shifted,path.join(temp,'piano.wav'));assert.equal(r.status,'needs_review');assert.ok(r.samples.some(s=>!s.passed));});
test('a decodable but silent audio stream is explicitly rejected',()=>{const bytes=fs.readFileSync(path.join(temp,'piano.wav'));bytes.fill(0,44);const file=path.join(temp,'silence.wav');fs.writeFileSync(file,bytes);assert.throws(()=>audioFeatures(file),e=>e.code==='SILENT_AUDIO');});
test('explicit calibration adjusts timing/camera without changing notes or original data',()=>{const source=structuredClone(timeline);source.cameraPath=Array.from({length:90},(_,i)=>({cameraX:i,cameraY:0}));const shifted=retime(source,.1);assert.equal(shifted.events[0].frame,12);assert.deepEqual(shifted.events[0].notes,source.events[0].notes);assert.equal(source.events[0].frame,9);assert.equal(shifted.cameraPath[20].cameraX,17);assert.equal(shifted.status,'needs_audio_alignment');assert.throws(()=>retime(source,-2),e=>e.code==='CALIBRATION_OUT_OF_RANGE');});
test('explicit silent preview can bind but is labeled silent',()=>{const s=setup();bindJob({project:s.p,props:s.propsFile,layout:s.layoutFile,out:s.out,'silent-confirmed':true});assert.equal(loadJob(s.out).silentConfirmed,true);});
test('changed props invalidate the frozen job before preview/export',()=>{const s=setup();bindJob({project:s.p,props:s.propsFile,layout:s.layoutFile,out:s.out,'silent-confirmed':true});fs.appendFileSync(s.propsFile,' ');assert.throws(()=>loadJob(s.out),e=>e.code==='JOB_STALE');});
test('redirecting a job to different props cannot fall back to a demo',()=>{const s=setup();bindJob({project:s.p,props:s.propsFile,layout:s.layoutFile,out:s.out,'silent-confirmed':true});const alternate=path.join(s.p,'demo-props.json');fs.writeFileSync(alternate,JSON.stringify({...s.props,title:'unrelated demo'}));const job=JSON.parse(fs.readFileSync(s.out,'utf8'));job.propsFile=alternate;fs.writeFileSync(s.out,JSON.stringify(job));assert.throws(()=>loadJob(s.out),e=>e.code==='JOB_STALE');});
test('stale, incomplete and wrong same-layout geometry is rejected',()=>{const s=setup();assert.throws(()=>validateLayout(s.props,s.score,{...s.layout,scoreSha256:'bad'}),e=>e.code==='LAYOUT_STALE');const incomplete=structuredClone(s.layout);incomplete.mapping.pop();assert.throws(()=>validateLayout(s.props,s.score,incomplete),e=>e.code==='LAYOUT_MAPPING_INCOMPLETE');const wrong=structuredClone(s.layout);wrong.mapping[0].x+=3;assert.throws(()=>validateLayout(s.props,s.score,wrong),e=>e.code==='LAYOUT_COORDINATE_REVIEW_REQUIRED');});
test('uncertain PDF score cannot bind solely because SVG exists',()=>{const s=setup();assert.throws(()=>bindJob({project:s.p,props:s.propsFile,layout:s.layoutFile,out:s.out,'silent-confirmed':true,'source-type':'pdf'}),e=>e.code==='SCORE_REVIEW_REQUIRED');const review=path.join(s.p,'review.json');fs.writeFileSync(review,JSON.stringify({structuralPassed:true,visualReview:{status:'needs_review'}}));assert.throws(()=>bindJob({project:s.p,props:s.propsFile,layout:s.layoutFile,out:s.out,'silent-confirmed':true,'source-type':'pdf','score-review':review}),e=>e.code==='SCORE_REVIEW_REQUIRED');});
test('valid same-layout mapping passes without rewriting original animation',()=>{const s=setup();assert.equal(validateLayout(s.props,s.score,s.layout).mappedNoteheads,3);});
test('mismatched viewBox or nested/styled/indirect SVG cannot certify misplaced noteheads',()=>{
  for(const variant of [svg.replace('viewBox="0 0 500 200"','viewBox="0 0 1000 400"'),svg.replace('</svg>','<svg x="80"/>\n</svg>'),svg.replace('<ellipse','<ellipse style="transform:translateX(80px)"'),svg.replace('<ellipse','<defs><ellipse').replace('</svg>','</defs></svg>')]){
    const s=setup();fs.writeFileSync(s.score,variant);s.layout.scoreSha256=sha256(variant);assert.throws(()=>validateLayout(s.props,s.score,s.layout),e=>e.code==='LAYOUT_NORMALIZATION_REQUIRED');
  }
});
test('synthetic review protocol freezes source snapshots, sidecar and comparison crops',()=>{
  const s=setup(),dir=path.join(s.p,'comparison');fs.mkdirSync(dir);
  const write=(n,v)=>fs.writeFileSync(path.join(dir,n),typeof v==='string'?v:JSON.stringify(v));
  const bindings={};
  const originals={source:'original-source.png',musicxml:'original-musicxml.musicxml',svg:'original-svg.svg',timeline:'original-timeline.json',layout:'original-layout.png'};
  for(const [key,name] of Object.entries(originals)){
    const bytes=key==='svg'?svg:key==='timeline'?JSON.stringify(s.props.timeline):`synthetic protocol ${key}`;
    write(name,bytes);bindings[`${key}Sha256`]=sha256(bytes);
  }
  const producer={schema:'piano-score-layout/v1',sameRun:true,runId:s.layout.producer.runId,producer:'synthetic protocol test',bindings};
  const mapping={bindings,measures:[]};
  write('layout-evidence.json',producer);write('mapping.json',mapping);
  write('check.json',{structuralPassed:true,sourceSha256:bindings.musicxmlSha256});
  write('crop-source.png','synthetic source crop');write('crop-layout.png','synthetic layout crop');
  const crop=n=>({file:n,sha256:sha256(fs.readFileSync(path.join(dir,n)))});
  const report={status:'reviewed',structuralPassed:true,visualReview:{status:'approved',complete:true},layoutEvidenceVerified:true,bindings,layoutEvidenceSha256:hashObject(producer),mappingSha256:hashObject(mapping),pages:{source:[],layout:[]},measures:[{id:'m1',status:'approved',crops:{source:crop('crop-source.png'),layout:crop('crop-layout.png')}}]};
  write('report.json',report);write('review-template.json',{});write('comparison.html','synthetic protocol only');
  const base={project:s.p,props:s.propsFile,layout:s.layoutFile,'silent-confirmed':true,'source-type':'pdf','score-review':path.join(dir,'report.json')};
  bindJob({...base,out:s.out});assert.equal(loadJob(s.out).status,'bound');
  for(const name of [...Object.values(originals),'layout-evidence.json','crop-source.png','crop-layout.png']){
    const file=path.join(dir,name),bytes=fs.readFileSync(file);fs.writeFileSync(file,name==='layout-evidence.json'?JSON.stringify({...producer,sameRun:false}):'changed');
    try{assert.throws(()=>bindJob({...base,out:path.join(s.p,'rejected.json')}),e=>e.code==='SCORE_REVIEW_STALE');assert.throws(()=>loadJob(s.out),e=>e.code==='JOB_STALE');}
    finally{fs.writeFileSync(file,bytes);}
  }
  assert.equal(loadJob(s.out).status,'bound');assert.equal(fs.existsSync(path.join(s.p,'rejected.json')),false);
});
console.log(`Workflow evidence: ${temp}`);
