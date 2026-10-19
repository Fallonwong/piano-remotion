// Original synthetic notation/performance fixture. Creates inputs only, never approvals.
import fs from 'node:fs';import path from 'node:path';import {compilePerformance} from '../scripts/music.mjs';import {hashObject,sha256} from '../scripts/audio.mjs';
const project=path.resolve(process.argv[2]??''),out=path.join(project,'public/score/rc6-smoke');
if(!process.argv[2]||!fs.existsSync(path.join(project,'package.json'))||fs.existsSync(out))throw Error('Supply an existing test project with no public/score/rc6-smoke directory.');
fs.mkdirSync(out,{recursive:true});
const n=(id,pitch,x,y,durationFrames,extra={})=>({id,pitch,x,y,durationFrames,voice:'1',...extra});
const events=[
 {hand:'right',frame:10,x:130,y:85,notes:[n('r0','C5',130,85,15,{tieStart:true}),n('r1','E5',130,65,15)]},
 {hand:'left',frame:10,x:130,y:230,notes:[n('l0','C3',130,230,60,{voice:'2'})]},
 {hand:'right',frame:25,x:260,y:75,notes:[n('r2','C5',260,85,15,{tieStop:true}),n('r3','G5',260,55,15,{slurs:[{id:'s1',type:'start'}]})]},
 {hand:'right',frame:40,x:390,y:45,notes:[n('r4','A5',390,45,15,{slurs:[{id:'s1',type:'stop'}]})]},
 {hand:'right',frame:70,x:550,y:60,notes:[n('r5','F5',550,60,15,{tieStart:true})]},
 {hand:'left',frame:70,x:550,y:210,notes:[n('l1','G3',550,210,30,{voice:'2'})]},
 {hand:'right',frame:85,x:680,y:60,notes:[n('r6','F5',680,60,15,{tieStop:true})]},
 {hand:'left',frame:115,x:850,y:220,notes:[n('l2','E3',850,220,15,{voice:'2'})]},
];
const t=compilePerformance({fps:30,durationInFrames:150,scoreWidth:1000,scoreHeight:350,events,status:'original_synthetic_fixture'},{strict:true});
const lines=[...Array(5)].flatMap((_,i)=>[75+i*10,195+i*10]).map(y=>`<line x1="50" y1="${y}" x2="950" y2="${y}" stroke="#333"/>`).join('');
let idx=0;const mapping=[];const glyphs=t.events.flatMap((e,i)=>e.notes.map((note,j)=>{const id=`head-${idx++}`;mapping.push({eventIndex:i,noteIndex:j,svgId:id,x:note.x,y:note.y});return `<ellipse id="${id}" cx="${note.x}" cy="${note.y}" rx="9" ry="6" fill="#242029"/><line x1="${note.x+8}" y1="${note.y}" x2="${note.x+8}" y2="${note.y-35}" stroke="#242029"/>`;})).join('');
const ties='<path d="M 130 96 Q 195 120 260 96 M 550 71 Q 615 95 680 71" fill="none" stroke="#333" stroke-width="2"/>';
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="350" viewBox="0 0 1000 350"><rect width="1000" height="350" fill="#ddd3c2"/>${lines}${glyphs}${ties}<text x="50" y="320" font-size="18">Original synthetic fixture / ties, chord, slur, two hands</text></svg>`;
fs.writeFileSync(path.join(out,'score.svg'),svg);fs.writeFileSync(path.join(out,'timeline.json'),JSON.stringify(t,null,2)+'\n');
const layout={scoreSha256:sha256(svg),timelineSha256:hashObject(t),producer:{tool:'original-synthetic-fixture',runId:'rc6-original-fixture'},mapping};
fs.writeFileSync(path.join(out,'layout.json'),JSON.stringify(layout,null,2)+'\n');
const props={timeline:t,scoreSrc:'score/rc6-smoke/score.svg',title:'Piano / RC6',subtitle:'Original synthetic input',label:'TIES · TWO HANDS · USER REVIEW',camera:{scale:1.1,rotateZ:-8,rotateX:22,follow:true},overlay:{enabled:false},rightStyle:{starburst:true},leftStyle:{starburst:true}};
fs.writeFileSync(path.join(project,'song-props.json'),JSON.stringify(props,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({project,props:path.join(project,'song-props.json'),timeline:path.join(out,'timeline.json'),layout:path.join(out,'layout.json'),next:'Create a score request; do not fabricate user approvals.'},null,2));
