import React from 'react';
import {useCurrentFrame} from 'remotion';

export type ScoreAttack = {frame:number; x:number; y:number; notes?:{x:number;y:number;pitch?:string;attack?:boolean;soundingStartFrame?:number;soundingEndFrame?:number;highlightEndFrame?:number}[]};
export type ScoreNoteLeapProps = {
  events?: ScoreAttack[]; color?:string; coreColor?:string; width?:number; height?:number;
  arcHeight?:number; trailFrames?:number; highlightFrames?:number;
  holdHighlightUntilNext?:boolean;
  glowColor?:string; glowStrength?:number; starburst?:boolean; trailWidth?:number;
  taperTrail?:boolean;
  className?:string; style?:React.CSSProperties;
};
/** Coordinates share the score's pixel space. Every time value is in frames. */
export const ScoreNoteLeap:React.FC<ScoreNoteLeapProps> = ({events=[],color='#ffd477',coreColor='#fff9e9',width=1600,height=320,arcHeight=42,trailFrames=5,highlightFrames=10,holdHighlightUntilNext=false,glowColor=color,glowStrength=0,starburst=false,trailWidth=2,taperTrail=true,className,style}) => {
  const frame=useCurrentFrame();
  const point=(f:number) => {
    if(!events.length || f<events[0].frame) return null;
    const index=events.findIndex((e)=>e.frame>f);
    const a=events[index===-1?events.length-1:index-1];
    const b=events[index===-1?events.length-1:index];
    if(a!==b && (b.x<a.x-200 || Math.abs(b.y-a.y)>200)) return null;
    const t=a===b?0:Math.max(0,Math.min(1,(f-a.frame)/(b.frame-a.frame)));
    return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t-4*arcHeight*t*(1-t)};
  };
  const head=point(frame);
  const sampleCount = Math.max(30, Math.round(trailFrames * 3));
  const rawTail = Array.from({length: sampleCount}, (_, i) =>
    point(frame - trailFrames + (i * trailFrames) / (sampleCount - 1))
  ).filter((p): p is {x: number; y: number} => p !== null);
  const tail: {x:number;y:number}[] = [];
  if (head) {
    tail.push(head);
    for (let i = rawTail.length - 2; i >= 0; i--) {
      const p = rawTail[i];
      const prev = tail[tail.length - 1];
      if (Math.abs(p.x - prev.x) > 200 || Math.abs(p.y - prev.y) > 150) break;
      tail.push(p);
    }
    tail.reverse();
  }

  const segments: {p1:{x:number;y:number}; p2:{x:number;y:number}; t:number}[] = [];
  if (tail.length >= 2) {
    const N = tail.length - 1;
    for (let i = 0; i < N; i++) {
      segments.push({
        p1: tail[i],
        p2: tail[i + 1],
        t: (i + 0.5) / N,
      });
    }
  }

  return <svg className={className} width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:'visible',...style}}>
    {events.map((event,i)=>{
      const age=frame-event.frame;
      if(age<0) return null;
      const isHeld=holdHighlightUntilNext&&(i===events.length-1||frame<events[i+1].frame);
      const strength=isHeld?Math.max(.7,1-age/highlightFrames):Math.max(0,1-age/highlightFrames);
      return <g key={i}>{(event.notes??[event]).map((n,j)=>{
        // Optional performance metadata: legacy leap geometry/trails stay unchanged.
        const soundingEnd='highlightEndFrame' in n?n.highlightEndFrame:('soundingEndFrame' in n?n.soundingEndFrame:undefined);
        const isContinuation='attack' in n&&n.attack===false;
        const noteStrength=soundingEnd!==undefined?(frame<soundingEnd?(isContinuation ? .7 : Math.max(.7,strength)):0):strength;
        return <g key={j}>
        {glowStrength>0&&noteStrength>0&&<ellipse cx={n.x} cy={n.y} rx={15} ry={10} fill={glowColor} opacity={noteStrength*.5} style={{filter:`blur(${4+glowStrength}px)`}}/>}
        <ellipse cx={n.x} cy={n.y} rx={10+noteStrength*3} ry={6+noteStrength*2} transform={`rotate(-18 ${n.x} ${n.y})`} fill={color} fillOpacity={noteStrength*.25} stroke={glowStrength>0&&noteStrength>.2?glowColor:color} strokeWidth={1.5+noteStrength} opacity={.24+noteStrength*.76} style={{filter:`drop-shadow(0 0 ${2+noteStrength*7}px ${glowStrength>0?glowColor:color})`}} />
      </g>;})}</g>;
    })}
    {taperTrail ? (
      <>
        {glowStrength > 0 && segments.length > 0 && (
          <g style={{filter: `blur(${glowStrength * 2}px)`}}>
            {segments.map((seg, idx) => (
              <line
                key={idx}
                x1={seg.p1.x}
                y1={seg.p1.y}
                x2={seg.p2.x}
                y2={seg.p2.y}
                stroke={glowColor}
                strokeWidth={Math.max(0.6, (trailWidth + glowStrength * 3) * Math.pow(seg.t, 1.2))}
                opacity={0.65 * (0.05 + 0.95 * Math.pow(seg.t, 1.1))}
                strokeLinecap="round"
              />
            ))}
          </g>
        )}
        {segments.length > 0 && (
          <g style={{filter: `drop-shadow(0 0 5px ${glowColor})`}}>
            {segments.map((seg, idx) => (
              <line
                key={idx}
                x1={seg.p1.x}
                y1={seg.p1.y}
                x2={seg.p2.x}
                y2={seg.p2.y}
                stroke={glowStrength > 0 ? glowColor : color}
                strokeWidth={Math.max(0.3, trailWidth * Math.pow(seg.t, 1.2))}
                opacity={0.08 + 0.92 * Math.pow(seg.t, 1.1)}
                strokeLinecap="round"
              />
            ))}
          </g>
        )}
      </>
    ) : (
      <>
        {glowStrength>0&&<polyline points={tail.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={glowColor} strokeWidth={trailWidth+glowStrength*3} opacity={.65} style={{filter:`blur(${glowStrength*2}px)`}}/>}
        <polyline points={tail.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={glowStrength>0?glowColor:color} strokeWidth={trailWidth} strokeLinecap="round" style={{filter:`drop-shadow(0 0 5px ${glowColor})`}}/>
      </>
    )}
    {head&&<g>
      {glowStrength>0&&<><circle cx={head.x} cy={head.y} r={10+glowStrength*7} fill={glowColor} opacity={.55} style={{filter:`blur(${6+glowStrength*3}px)`}}/><circle cx={head.x} cy={head.y} r={7+glowStrength} fill={glowColor} style={{filter:`drop-shadow(0 0 8px ${glowColor})`}}/></>}
      {starburst&&<path d={`M${head.x-19},${head.y} H${head.x+19} M${head.x},${head.y-19} V${head.y+19}`} stroke={coreColor} strokeWidth={1} opacity={.85} style={{filter:`drop-shadow(0 0 4px ${glowColor})`}}/>}
      <circle cx={head.x} cy={head.y} r={13} fill={color} opacity={.14}/><circle cx={head.x} cy={head.y} r={4.5} fill={coreColor} style={{filter:`drop-shadow(0 0 9px ${glowColor}) drop-shadow(0 0 3px ${glowColor})`}}/>
    </g>}
  </svg>;
};
