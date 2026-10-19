import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.env.PIANO_SCORE_EVIDENCE || path.join(here, '..', '..', 'score-evidence', `run-${Date.now()}`));
const python = process.env.PIANO_SCORE_PYTHON || 'python3';
fs.mkdirSync(root, {recursive:true});
let serial = 0;
const write = (name, data) => {const p=path.join(root,name);fs.writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data,null,2));return p;};
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function cli(command, options, label=command) {
  const out=path.join(root,`${String(++serial).padStart(2,'0')}-${label}`);
  const args=[path.join(here,'score.mjs'),command,'--python',python,'--out',out];
  for (const [k,v] of Object.entries(options)) args.push('--'+k,v);
  const r=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,timeout:180000});
  assert.ok(r.stdout, r.stderr || r.error?.message);
  const report=JSON.parse(r.stdout);
  write(`${String(serial).padStart(2,'0')}-cli.json`, {command,args,exit:r.status,report});
  return {out, report, exit:r.status};
}
const note=(step='C',octave=4,duration=4,extra='')=>`<note>${extra}<pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>${duration}</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>`;
const attributes='<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>';
const music=body=>`<?xml version="1.0"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Original RC5 fixture</part-name><score-instrument id="I1"><instrument-name>Piano</instrument-name></score-instrument><midi-instrument id="I1"><midi-channel>1</midi-channel><midi-program>1</midi-program></midi-instrument></score-part></part-list><part id="P1">${body}</part></score-partwise>`;
const contents=note()+note('E',4,4,'<chord/>')+'<note><rest/><duration>12</duration><voice>1</voice><type>half</type><dot/><staff>1</staff></note><backup><duration>16</duration></backup><note><pitch><step>C</step><octave>3</octave></pitch><duration>16</duration><voice>2</voice><type>whole</type><staff>2</staff></note>';
const xml=write('original.musicxml', music(`<measure number="1">${attributes}${contents}</measure>`));
const py=(code,args=[])=>{const r=spawnSync(python,['-B','-c',code,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,PYTHONUTF8:'1',PYTHONDONTWRITEBYTECODE:'1'}});assert.equal(r.status,0,r.stderr);return r.stdout;};

test('preflight and structural extraction preserve chord/rest/voices, keep visual pending',()=>{
  const r=cli('capabilities',{});assert.equal(r.exit,0);write('preflight.json',r.report);
  const c=cli('check',{musicxml:xml},'valid');assert.equal(c.exit,3);assert.equal(c.report.structuralPassed,true);
  assert.equal(c.report.visualReview.complete,false);
  const e=c.report.measures[0].events;
  assert.equal(e[0].onsetQuarter,'0');assert.equal(e[1].onsetQuarter,'0');assert.equal(e[2].kind,'rest');
  assert.equal(e[2].durationQuarter,'3');assert.equal(e[4].voice,'2');assert.equal(e[4].staff,2);
  assert.ok(e.every(x=>x.hand==null));
});

test('broken and ambiguous scores retain explicit diagnostics',()=>{
  const cases=[
    ['bad-xml','<score-partwise>',false,'INVALID_XML'],
    ['bad-pitch',music(`<measure number="1">${attributes}${contents.replace('<step>C</step>','<step>H</step>')}</measure>`),false,'PITCH_RANGE'],
    ['bad-divisions',music(`<measure number="1">${attributes.replace('<divisions>4','<divisions>0')}${contents}</measure>`),false,'INVALID_DIVISIONS'],
    ['bad-chord',music(`<measure number="1">${attributes}${note('C',4,4,'<chord/>')}</measure>`),false,'INVALID_CHORD'],
    ['bad-backup',music(`<measure number="1">${attributes}<backup><duration>4</duration></backup>${note()}</measure>`),false,'NEGATIVE_CURSOR'],
    ['bad-tie',music(`<measure number="1">${attributes}${note('C',4,4).replace('<voice>','<tie type="stop"/><voice>')}</measure>`),false,'TIE_STOP_WITHOUT_START'],
    ['bad-slur',music(`<measure number="1">${attributes}${note().replace('</note>','<notations><slur type="start"/></notations></note>')}</measure>`),false,'UNSTOPPED_SLUR'],
    ['bad-tuplet',music(`<measure number="1">${attributes}${note().replace('</note>','<time-modification><actual-notes>0</actual-notes><normal-notes>2</normal-notes></time-modification></note>')}</measure>`),false,'INVALID_TUPLET'],
    ['bad-meter',music(`<measure number="1">${attributes.replace('<beats>4','<beats>0')}${contents}</measure>`),false,'INVALID_TIME'],
    ['bad-staff',music(`<measure number="1">${attributes}${contents.replace('<staff>1','<staff>3')}</measure>`),false,'INVALID_STAFF'],
    ['bad-duration',music(`<measure number="1">${attributes}${contents.replace('<duration>4','<duration>-4')}</measure>`),false,'INVALID_DURATION'],
    ['pickup-repeat',music(`<measure number="0" implicit="yes">${attributes}${note()}<barline><repeat direction="backward"/></barline></measure>`),true,'REPEAT_OR_JUMP'],
    ['fractional-alter',music(`<measure number="1">${attributes}${contents.replace('<octave>4','<alter>0.5</alter><octave>4')}</measure>`),true,'MICROTONAL'],
    ['entity','<!DOCTYPE score-partwise [<!ENTITY x "boom">]><score-partwise/>',false,'UNSAFE_XML'],
  ];
  for(const [name,body,passed,code] of cases){const p=write(`${name}.musicxml`,body),r=cli('check',{musicxml:p},name);assert.equal(r.report.structuralPassed,passed,name);assert.ok(r.report.code===code||r.report.issues?.some(i=>i.code===code),name+': '+JSON.stringify(r.report));}
});

test('ties stop/start, slurs, triplets, namespace and additive meter are preserved',()=>{
  const tied=(type)=>note().replace('<voice>',`<tie type="${type}"/><voice>`).replace('</note>',`<notations><tied type="${type}"/></notations></note>`);
  const body=`<measure number="0" implicit="yes">${attributes}${tied('start')}</measure><measure number="1" implicit="yes">${tied('stop')}</measure>`;
  const c=cli('check',{musicxml:write('valid-tie.musicxml',music(body).replace('<score-partwise version','<score-partwise xmlns="http://www.musicxml.org/ns/musicxml" version'))},'valid-tie');assert.equal(c.report.structuralPassed,true);assert.equal(c.report.measures.length,2);
  const triplet=i=>note('D',4,4).replace('<type>quarter','<type>eighth').replace('</note>',`<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification><notations>${i===0?'<slur type="start"/><tuplet type="start"/>':i===2?'<slur type="stop"/><tuplet type="stop"/>':''}</notations></note>`);
  const a=attributes.replace('<divisions>4','<divisions>12').replace('<beats>4','<beats>1+2');
  const r=cli('check',{musicxml:write('triplet.musicxml',music(`<measure number="1">${a}${[0,1,2].map(triplet).join('')}</measure>`))},'triplet');assert.equal(r.report.structuralPassed,true);assert.equal(r.report.measures[0].events[1].onsetQuarter,'1/3');assert.ok(!r.report.issues.some(i=>i.code==='NOTATED_DURATION_MISMATCH'));
});

let sourcePng,sourcePdf,svg,timeline,layout;
test('create original staff PNG/PDF; MuseScore actually re-engraves MusicXML',()=>{
  // PDF operation marker must be run once externally before this test creates its one PDF.
  const generator=String.raw`
from PIL import Image, ImageDraw
from reportlab.pdfgen import canvas
from pathlib import Path
import sys,json
p=Path(sys.argv[1]); im=Image.new('RGB',(600,320),'white'); d=ImageDraw.Draw(im)
for top in (70,200):
 for n in range(5): d.line((40,top+n*12,550,top+n*12),fill='black',width=2)
 d.line((550,top,550,top+48),fill='black',width=2)
d.line((40,70,40,248),fill='black',width=2)
# Original single measure: C4/E4 chord, dotted half rest; C3 whole bass.
for y in (130,112): d.ellipse((147,y-4,163,y+4),fill='black')
d.line((143,130,167,130),fill='black',width=2);d.line((162,90,162,130),fill='black',width=2)
d.rectangle((330,82,347,88),fill='black');d.ellipse((354,82,358,86),fill='black')
d.ellipse((145,225,165,235),outline='black',width=2)
d.text((45,55),'G clef / 4:4',fill='black');d.text((45,185),'F clef / 4:4',fill='black')
d.text((40,20),'Original RC5 fixture: C/E quarter + dotted half rest; bass C whole',fill='black')
im.save(p/'source.png')
c=canvas.Canvas(str(p/'source.pdf'),pagesize=(600,320));c.drawImage(str(p/'source.png'),0,0,width=600,height=320);c.showPage();c.save()
print(json.dumps({'original':True,'measures':1,'recognitionPerformed':False}))
`;
  write('fixture-generator.py',generator);write('fixture-provenance.json',JSON.parse(py(generator,[root])));
  sourcePng=path.join(root,'source.png');sourcePdf=path.join(root,'source.pdf');
  const muse=process.env.PIANO_MUSESCORE;
  assert.ok(muse&&fs.existsSync(muse),'Set PIANO_MUSESCORE to installed professional engraver (not OMR).');
  svg=path.join(root,'reflow.svg');
  const rendered=spawnSync(muse,['-o',svg,xml],{windowsHide:true,encoding:'utf8',timeout:120000,env:{...process.env,QT_QPA_PLATFORM:process.platform==='win32'?'windows':'offscreen'}});
  write('musescore-export.json',{args:['-o',svg,xml],exit:rendered.status,stdout:rendered.stdout,stderr:rendered.stderr});
  if(!fs.existsSync(svg)){
    const candidate=path.join(root,'reflow-1.svg');assert.ok(fs.existsSync(candidate),'MuseScore did not produce SVG: '+rendered.stderr);fs.copyFileSync(candidate,svg);
  }
  assert.ok(fs.statSync(svg).size>1000);
  py('import sys,xml.etree.ElementTree as E; assert E.parse(sys.argv[1]).getroot().tag.endswith("svg")',[svg]);
  if(rendered.status!==0)write('musescore-native-warning.json',{exit:rendered.status,note:'Nonzero native exit retained. Fresh exported SVG exists and XML parsed; this is artifact validation, not a clean process exit.'});
  // MuseScore PNG export from the exact score input; producer evidence remains absent.
  const png=path.join(root,'reflow.png');const r=spawnSync(muse,['-o',png,xml],{windowsHide:true,encoding:'utf8',timeout:120000,env:{...process.env,QT_QPA_PLATFORM:process.platform==='win32'?'windows':'offscreen'}});
  write('musescore-png-export.json',{exit:r.status,stdout:r.stdout,stderr:r.stderr});
  layout=fs.existsSync(png)?png:path.join(root,'reflow-1.png');assert.ok(fs.existsSync(layout),'No real reflow PNG');
  py('from PIL import Image; import sys; Image.open(sys.argv[1]).verify()',[layout]);
  timeline=write('binding-only-timeline.json',{purpose:'Hash binding regression fixture; not an attack timeline or same-run claim',events:[]});
});

test('source OMR absence and bad source never count as recognition success',()=>{
  for(const src of [sourcePng,sourcePdf]){const r=cli('source',{source:src},'no-omr');assert.equal(r.report.code,'OMR_UNAVAILABLE');assert.equal(r.exit,3);assert.equal(r.report.visualReview.complete,false);}
  const b=cli('source',{source:write('bad.png','not an image')},'bad-image');assert.equal(b.exit,2);assert.equal(b.report.code,'INVALID_SOURCE');
  const p=cli('source',{source:write('bad.pdf','%PDF-1.4\ngarbage')},'bad-pdf');assert.equal(p.exit,2);
  const a=cli('source',{source:sourcePng,omr:'missing-omr'},'no-protocol');assert.equal(a.report.code,'OMR_ADAPTER_REQUIRED');
  const m=cli('source',{source:sourcePng,omr:'missing-omr',adapter:'piano-omr/v1'},'missing-executable');assert.equal(m.report.code,'OMR_UNAVAILABLE');
  const f=cli('source',{source:sourcePng,omr:process.execPath,adapter:'piano-omr/v1'},'bad-adapter-exit');assert.equal(f.report.code,'OMR_FAILED');
});

test('measure crops, differences, complete approval and stale hash rejection',()=>{
  const options={source:sourcePdf,musicxml:xml,svg,timeline,layout};
  const pending=cli('compare',options,'real-comparison-pending');assert.equal(pending.exit,3);assert.equal(pending.report.structuralPassed,true);assert.equal(pending.report.layoutEvidenceVerified,false);
  const mapping=read(path.join(pending.out,'mapping.json'));
  // Known original fixture has exactly one measure: tight ink bounds give a real,
  // explicitly fixture-scoped measure mapping. No general measure detection claimed.
  for(const side of ['source','layout']){
    const page=pending.report.pages[side][0];
    const rect=JSON.parse(py(String.raw`from PIL import Image,ImageChops
import sys,json
im=Image.open(sys.argv[1]).convert('RGB'); b=ImageChops.difference(im,Image.new('RGB',im.size,'white')).getbbox();print(json.dumps([b[0],b[1],b[2]-b[0],b[3]-b[1]]))`,[path.join(pending.out,page.file)]));
    mapping.measures[0][side]={page:1,rect};
  }
  const mapped=write('fixture-mapping.json',mapping);
  const cropped=cli('compare',{...options,mapping:mapped},'real-crops-pending');assert.equal(cropped.exit,3);assert.ok(cropped.report.measures[0].crops.source.sha256);
  // Protocol-only approval exercises intentionally use a declared synthetic test
  // producer, never claim a human approved these drawings or a true music timeline.
  const evidence=write('test-only-layout-evidence.json',{schema:'piano-score-layout/v1',bindings:pending.report.bindings,sameRun:true,runId:'protocol-test-only',producer:'Synthetic protocol test declaration; NOT a verified MuseScore/timeline production run'});
  const prepared=cli('compare',{...options,mapping:mapped,'layout-evidence':evidence},'approval-protocol-template');
  const rev=read(path.join(prepared.out,'review-template.json'));
  rev.measures.forEach(r=>Object.assign(r,{status:'difference',reviewer:'AUTOMATED PROTOCOL TEST',note:'Fixture visual differences unresolved; not human review'}));
  const reviewFile=write('test-review.json',rev);
  const diff=cli('compare',{...options,mapping:mapped,'layout-evidence':evidence,review:reviewFile},'unresolved-difference');assert.equal(diff.exit,3);
  rev.measures.forEach(r=>Object.assign(r,{status:'approved',note:'Synthetic approval for binding regression only; not a musical/human signoff'}));write('test-review.json',rev);
  const approved=cli('compare',{...options,mapping:mapped,'layout-evidence':evidence,review:reviewFile},'synthetic-protocol-approval');assert.equal(approved.exit,0);assert.equal(approved.report.visualReview.complete,true);
  assert.equal(approved.report.runId,'protocol-test-only');
  const staleOptions={...options,mapping:mapped,'layout-evidence':evidence,review:reviewFile};
  const old=rev.measures[0].cropSha256.source;rev.measures[0].cropSha256.source='0'.repeat(64);write('test-review.json',rev);
  assert.equal(cli('compare',staleOptions,'stale-crop').report.code,'STALE_REVIEW');rev.measures[0].cropSha256.source=old;write('test-review.json',rev);
  const changed=structuredClone(mapping);changed.measures[0].source.rect[0]+=1;changed.measures[0].source.rect[2]-=1;
  assert.equal(cli('compare',{...staleOptions,mapping:write('changed-mapping.json',changed)},'stale-mapping-review').report.code,'STALE_REVIEW');
  for(const key of ['source','svg','timeline','layout','musicxml']){
    const original=fs.readFileSync(options[key]);fs.appendFileSync(options[key],key==='source'||key==='layout'?'changed':'\n');
    const r=cli('compare',staleOptions,'stale-'+key);assert.ok(['STALE_MAPPING','INVALID_INPUT_OR_TOOL_FAILURE'].includes(r.report.code),r.report.code);
    fs.writeFileSync(options[key],original);
  }
  const invalid=structuredClone(mapping);invalid.measures[0].source.rect=[0,0,999999,1];
  assert.equal(cli('compare',{...options,mapping:write('invalid-crop.json',invalid)},'invalid-crop').report.code,'INVALID_MAPPING');
  const reused=spawnSync(process.execPath,[path.join(here,'score.mjs'),'check','--python',python,'--musicxml',xml,'--out',pending.out],{encoding:'utf8',windowsHide:true});assert.equal(JSON.parse(reused.stdout).code,'OUTPUT_EXISTS');
  write('delivery-summary.json',{actualRecognitionSuccess:false,actualHumanReview:false,actualProductionSameRunEvidence:false,
    actualSourceSha256:hash(sourcePdf),realComparison:path.join(cropped.out,'comparison.html'),
    protocolApproval:path.join(approved.out,'report.json'),note:'Positive approval test is synthetic protocol regression only. Actual fixture reflow remains needs_review.'});
});

test('automatic environment discovery strips project flags and selects actually usable Pillow',()=>{
  const inputs=process.env.PIANO_SCORE_DISCOVERY_INPUT || root;
  const reflow=fs.existsSync(path.join(inputs,'reflow.png'))?'reflow.png':'reflow-1.png';
  const autoOut=path.join(root,'auto-python-compare');
  const argv=[path.join(here,'score.mjs'),'compare','--source',path.join(inputs,'source.pdf'),
    '--musicxml',path.join(inputs,'original.musicxml'),'--svg',path.join(inputs,'reflow.svg'),
    '--timeline',path.join(inputs,'binding-only-timeline.json'),'--layout',path.join(inputs,reflow),
    '--out',autoOut,'--project',path.resolve(here,'..')];
  if(process.env.PIANO_SCORE_AUTHORIZED_PROJECT) argv.push('--authorized-project',process.env.PIANO_SCORE_AUTHORIZED_PROJECT);
  const env={...process.env};delete env.PIANO_SCORE_PYTHON;
  const r=spawnSync(process.execPath,argv,{encoding:'utf8',windowsHide:true,timeout:180000,env,maxBuffer:4*1024*1024});
  assert.ok(r.stdout,r.stderr||r.error?.message);const actual=JSON.parse(r.stdout);
  write('auto-discovery-cli.json',{argv,exit:r.status,report:actual});
  assert.equal(r.status,3,JSON.stringify(actual));assert.equal(actual.code,'SCORE_NEEDS_REVIEW');
  assert.equal(actual.pythonSelection.method,'discoverEnvironment');assert.equal(actual.pythonSelection.requiresPillow,true);
  assert.doesNotMatch(actual.pythonSelection.path,/Microsoft[\\/]WindowsApps/i);
  assert.deepEqual(read(path.join(autoOut,'report.json')),actual);
  const importProbe=spawnSync(actual.pythonSelection.path,['-I','-B','-c','from PIL import Image; assert Image.new("RGB",(2,2)).size == (2,2)'],{windowsHide:true});assert.equal(importProbe.status,0);
});
