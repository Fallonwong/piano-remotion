import {failure} from './audio.mjs';
export function focusPath({timeline,systems,transitionFrames=14}){
  if(!Number.isInteger(transitionFrames)||transitionFrames<12||transitionFrames>16)throw failure('CAMERA_WINDOW','Use 12..16 frames','Supply an explicit reviewed transition window.');
  if(!systems?.length||new Set(systems.map(s=>s.id)).size!==systems.length)throw failure('SYSTEMS_REQUIRED','Unique layout systems required','Use actual layout coordinates.');
  const centers=new Map(systems.map(s=>[s.id,s.centerY]));
  if(systems.some(s=>!Number.isFinite(s.centerY)))throw failure('SYSTEMS_REQUIRED','Invalid center','Measure grand-staff centers from the actual layout.');
  const ordered=[...timeline.events].sort((a,b)=>a.frame-b.frame);
  const groups=[];for(const e of ordered){if(!Number.isFinite(e.frame)||!Number.isFinite(e.x)||!Number.isFinite(e.y))throw failure('CAMERA_EVENTS_REQUIRED','Nonfinite frame/point','Use checked events.');if(!centers.has(e.systemId))throw failure('SYSTEM_MAPPING_REQUIRED',String(e.systemId),'Assign every event a real systemId.');const prev=groups.at(-1);if(prev?.frame===e.frame){if(prev.systemId!==e.systemId)throw failure('CAMERA_SYSTEM_CONFLICT','Simultaneous hands on different systems','Review system/occurrence mapping.');prev.points.push(e);}else groups.push({frame:e.frame,systemId:e.systemId,points:[e]});}
  const targets=groups.map(g=>{const r=g.points.find(e=>e.hand==='right')??g.points[0];return {frame:g.frame,systemId:g.systemId,x:r.x,y:centers.get(g.systemId)};});
  if(!targets.length)throw failure('CAMERA_EVENTS_REQUIRED','Empty timeline','Supply mapped events.');
  return Array.from({length:timeline.durationInFrames},(_,f)=>{
    let k=targets.findIndex(t=>t.frame>f);if(k===0)return {focusX:targets[0].x,focusY:targets[0].y};if(k<0)k=targets.length;
    const a=targets[k-1],b=targets[k]??a;let u=a===b?0:Math.max(0,Math.min(1,(f-a.frame)/(b.frame-a.frame)));
    if(a.systemId!==b.systemId){const start=Math.max(a.frame,b.frame-transitionFrames);u=Math.max(0,Math.min(1,(f-start)/(b.frame-start)));u=u*u*(3-2*u);}
    return {focusX:a.x+(b.x-a.x)*u,focusY:a.y+(b.y-a.y)*u};
  });
}
