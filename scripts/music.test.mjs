import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {performance,compilePerformance,musicIdentity,validateNotationMapping,fromStructuredScore} from './music.mjs';import {synthesize} from './audio.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'piano-music-'));
const note=(id,pitch,durationFrames,more={})=>({id,pitch,durationFrames,voice:'1',x:50,y:50,...more});
const e=(frame,notes,hand='right')=>({hand,frame,x:50,y:50,notes});const t=events=>({fps:30,durationInFrames:150,scoreWidth:500,scoreHeight:200,events});
test('same-pitch ties sustain once; long-note waveform exactly matches the merged chain',()=>{
 const tied=t([e(6,[note('a','C4',30,{tieStart:true})]),e(36,[note('b','C4',30,{tieStop:true})])]);const single=t([e(6,[note('a','C4',60)])]);
 assert.equal(performance(tied,{strict:true}).spans.length,1);assert.equal(performance(tied).spans[0].endFrame,66);
 const a=path.join(dir,'tie.wav'),b=path.join(dir,'single.wav');synthesize(tied,a,{confirmed:true});synthesize(single,b,{confirmed:true});assert.deepEqual(fs.readFileSync(a),fs.readFileSync(b));
 const bytes=fs.readFileSync(a);let peak=0;for(let k=22050;k<23050;k++)peak=Math.max(peak,Math.abs(bytes.readInt16LE(44+k*2)));assert.ok(peak>100,'long tone must exist after the old 0.65 second cutoff');
});
test('partial-chord ties and independent voices do not merge unrelated attacks',()=>{
 const p=performance(t([e(0,[note('a','C4',30,{tieStart:true}),note('b','E4',30)]),e(30,[note('c','C4',30,{tieStop:true}),note('d','G4',30)])]),{strict:true});assert.equal(p.spans.length,3);
 const v=performance(t([e(0,[note('a','C4',30,{voice:'1'}),note('b','C4',30,{voice:'2'})])]),{strict:true});assert.equal(v.spans.length,2);
});
test('multi-segment ties work for the left hand and over distant score coordinates',()=>{
 const a=t([e(0,[note('a','C3',30,{tieStart:true})],'left'),e(30,[note('b','C3',30,{tieStart:true,tieStop:true,x:350,y:180})],'left'),e(60,[note('c','C3',30,{tieStop:true})],'left')]);assert.equal(performance(a,{strict:true}).spans[0].endFrame,90);
 const c=compilePerformance(a,{strict:true});assert.equal(c.events[1].notes[0].attack,false);assert.equal(c.events[0].notes[0].highlightEndFrame,30);assert.deepEqual(c,compilePerformance(c,{strict:true}));
});
test('ties with gaps, pitch mismatches, missing endpoints or missing durations fail',()=>{
 for(const a of [t([e(0,[note('a','C4',30,{tieStart:true})])]),t([e(0,[note('a','C4',30,{tieStart:true})]),e(31,[note('b','C4',30,{tieStop:true})])]),t([e(0,[note('a','C4',30,{tieStart:true})]),e(30,[note('b','D4',30,{tieStop:true})])])])assert.throws(()=>performance(a,{strict:true}),/./);
 assert.throws(()=>performance(t([e(0,[{id:'a',pitch:'C4',x:0,y:0}])]),{strict:true}),x=>x.code==='MUSIC_DURATION_REQUIRED');
});
test('slurred different pitches remain separate sounding attacks; beams do not join notes',()=>{
 const p=performance(t([e(0,[note('a','C4',30,{slurs:[{id:'s1',type:'start'}],beams:['begin']})]),e(30,[note('b','D4',30,{slurs:[{id:'s1',type:'stop'}],beams:['end']})])]),{strict:true});assert.equal(p.spans.length,2);assert.deepEqual(p.spans.map(x=>x.pitch),['C4','D4']);
 assert.throws(()=>performance(t([e(0,[note('a','C4',30,{slurs:[{id:'s',type:'start'}]})])])),x=>x.code==='SLUR_UNCLOSED');
});
test('presentation and geometry edits leave music identity; note edits invalidate it',()=>{const a=t([e(0,[note('a','C4',30)])]),b=structuredClone(a);b.cameraPath=[];b.events[0].notes[0].x=300;assert.equal(musicIdentity(a),musicIdentity(b));b.events[0].notes[0].pitch='D4';assert.notEqual(musicIdentity(a),musicIdentity(b));});
test('structured MusicXML mapping preserves duration, ties, hand declarations and rejects lost semantics',()=>{
 const check={structuralPassed:true,sourceSha256:'fixture',issues:[],measures:[{id:'P1:1',part:'P1',durationQuarter:'2',events:[{kind:'note',onsetQuarter:'0',durationQuarter:'1',voice:'1',staff:1,pitch:{step:'C',alter:'0',octave:4},ties:['start'],slurs:[]},{kind:'note',onsetQuarter:'1',durationQuarter:'1',voice:'1',staff:1,pitch:{step:'C',alter:'0',octave:4},ties:['stop'],slurs:[]}]}]};
 const p={tempoBpm:60,scoreWidth:500,scoreHeight:200,handMap:{'P1:1:1':'right'},notes:[{id:'P1:1:0',svgId:'n0',x:50,y:50},{id:'P1:1:1',svgId:'n1',x:100,y:50}]};const {timeline}=fromStructuredScore(check,p);assert.equal(validateNotationMapping(timeline,check).writtenNotes,2);timeline.events[1].notes[0].tieStop=false;assert.throws(()=>validateNotationMapping(timeline,check),x=>x.code==='NOTATION_SEMANTICS_LOST');
 assert.throws(()=>fromStructuredScore(check,{...p,handMap:{}}),x=>x.code==='NOTE_PLACEMENT_REQUIRED');
});
