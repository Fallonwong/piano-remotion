import React from 'react';
import {AbsoluteFill, Audio, Img, Loop, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ScoreNoteLeap, type ScoreAttack, type ScoreNoteLeapProps} from './ScoreNoteLeap';

export type PianoTimeline = {
  fps: number; durationInFrames: number; scoreWidth: number; scoreHeight: number;
  events: (ScoreAttack & {hand: 'left' | 'right'})[];
  cameraPath?: {cameraX: number; cameraY: number}[];
  status?: string;
};
export type PianoScoreSceneProps = {
  timeline: PianoTimeline; scoreSrc: string; audioSrc?: string;
  title?: string; subtitle?: string; label?: string; credit?: string;
  background?: string; fontFamily?: string;
  scoreImage?: {x?: number; y?: number; width?: number; height?: number; blendMode?: React.CSSProperties['mixBlendMode']};
  camera?: {scale?: number; rotateZ?: number; rotateX?: number; anchorX?: number; anchorY?: number; follow?: boolean; left?: number; top?: number};
  rightStyle?: Partial<ScoreNoteLeapProps>; leftStyle?: Partial<ScoreNoteLeapProps>;
  vignette?: boolean; showProgress?: boolean; fadeFrames?: number;
  overlay?: {enabled?: boolean; src?: string; kind?: 'image' | 'video'; loopFrames?: number; transparent?: boolean; width?: number; height?: number; right?: number; bottom?: number};
};
/** Extracted shared score/camera/glow/layout from the existing full-score composition.
 * All asset paths are public-relative. The score and both hands share ONE transform.
 */
export const PianoScoreScene: React.FC<PianoScoreSceneProps> = ({
  timeline, scoreSrc, audioSrc, title='', subtitle='', label='', credit='', background='#6b6561', fontFamily='Arial, sans-serif',
  scoreImage={}, camera={}, rightStyle={}, leftStyle={}, vignette=true, showProgress=true, fadeFrames=8, overlay,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps, durationInFrames} = useVideoConfig();
  if (timeline.fps !== fps || timeline.durationInFrames !== durationInFrames) throw new Error('Composition fps/duration must equal timeline metadata');
  const D = durationInFrames;
  const fadeN = Math.min(Math.max(1, fadeFrames), (D-1)/2);
  const fade = interpolate(frame,[0,fadeN,D-fadeN,D],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const melody = timeline.events.filter(e=>e.hand==='right');
  const bass = timeline.events.filter(e=>e.hand==='left');
  const scale = camera.scale ?? 1.5;
  const z = camera.rotateZ ?? -15;
  const rx = camera.rotateX ?? 38;
  const track = melody.length ? melody : bass;
  const followX = track.length>1 ? interpolate(frame,track.map(e=>e.frame),track.map(e=>e.x),{extrapolateLeft:'clamp',extrapolateRight:'clamp'}) : (track[0]?.x ?? 0);
  const tilt = z*Math.PI/180;
  const path = timeline.cameraPath?.[Math.max(0,Math.min(Math.floor(frame),timeline.cameraPath.length-1))];
  const cameraX = path?.cameraX ?? (camera.follow===false ? camera.left??0 : (camera.anchorX??width*760/1920)-followX*scale*Math.cos(tilt));
  const cameraY = path?.cameraY ?? (camera.follow===false ? camera.top??0 : (camera.anchorY??height*400/1080)-followX*scale*Math.sin(tilt));
  const uiScale = Math.min(width/1920,height/1080);
  if (overlay?.enabled && !overlay.src) throw new Error('Enabled overlay requires an explicitly supplied asset');
  if (overlay?.enabled && overlay.loopFrames !== undefined && (!Number.isInteger(overlay.loopFrames) || overlay.loopFrames < 1)) throw new Error('overlay.loopFrames must be a positive integer');
  const overlayContent = overlay?.enabled && overlay.src ? (overlay.kind==='image'
    ? <Img src={staticFile(overlay.src)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
    : <OffthreadVideo src={staticFile(overlay.src)} transparent={overlay.transparent??false} muted style={{width:'100%',height:'100%'}}/>) : null;
  return <AbsoluteFill style={{background,overflow:'hidden'}}>
    {audioSrc&&<Audio src={staticFile(audioSrc)} volume={f=>interpolate(f,[Math.max(0,D-6),D],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}/>}
    <div style={{position:'absolute',left:cameraX,top:cameraY,width:timeline.scoreWidth,height:timeline.scoreHeight,transformOrigin:'0 0',transform:`rotateZ(${z}deg) rotateX(${rx}deg) scale(${scale})`}}>
      <div style={{position:'absolute',left:-3000,top:-3000,width:Math.max(8000,timeline.scoreWidth+6000),height:Math.max(16000,timeline.scoreHeight+6000),background}}/>
      <Img src={staticFile(scoreSrc)} style={{position:'absolute',left:scoreImage.x??0,top:scoreImage.y??0,width:scoreImage.width??timeline.scoreWidth,height:scoreImage.height??timeline.scoreHeight,mixBlendMode:scoreImage.blendMode??'multiply'}}/>
      <ScoreNoteLeap events={melody} color="#181045" coreColor="#fff6ff" glowColor="#b895ff" glowStrength={1.2} trailFrames={16} {...rightStyle} width={timeline.scoreWidth} height={timeline.scoreHeight} style={{...rightStyle.style,position:'absolute',inset:0}}/>
      <ScoreNoteLeap events={bass} color="#E95514" coreColor="#fff5db" glowColor="#ff9a46" glowStrength={1.2} arcHeight={34} trailFrames={16} {...leftStyle} width={timeline.scoreWidth} height={timeline.scoreHeight} style={{...leftStyle.style,position:'absolute',inset:0}}/>
    </div>
    {vignette&&<><AbsoluteFill style={{background:'radial-gradient(ellipse at 45% 52%,transparent 30%,rgba(58,50,68,.35) 70%,rgba(30,26,38,.7) 100%)',pointerEvents:'none'}}/><AbsoluteFill style={{background:'radial-gradient(ellipse at 100% 100%,rgba(0,0,0,.55) 0%,rgba(0,0,0,.24) 34%,transparent 72%)',pointerEvents:'none'}}/></>}
    <div style={{position:'absolute',left:110*uiScale,top:85*uiScale,opacity:fade,zIndex:200,fontFamily,color:'#f3eaff',textShadow:'0 2px 14px rgba(20,12,36,.5)'}}>
      <div style={{fontSize:17*uiScale,letterSpacing:6*uiScale,color:'#d8cfe4'}}>{label}</div>
      <div style={{fontSize:104*uiScale,letterSpacing:3*uiScale,marginTop:16*uiScale,lineHeight:1}}>{title}</div>
      <div style={{fontFamily:'Georgia, serif',fontSize:23*uiScale,color:'#d9d0dd',marginTop:12*uiScale}}>{subtitle}</div>
    </div>
    {showProgress&&<div style={{position:'absolute',left:110*uiScale,right:170*uiScale,bottom:62*uiScale,zIndex:150,pointerEvents:'none'}}>
      <div style={{display:'flex',alignItems:'center',gap:36*uiScale,marginBottom:22*uiScale,opacity:fade}}>
        {(['TREBLE','BASS'] as const).map((text,i)=><span key={text} style={{display:'inline-flex',alignItems:'center',gap:10*uiScale,fontFamily:'Arial, sans-serif',fontSize:17*uiScale,fontWeight:600,letterSpacing:3*uiScale,color:'#efe9f4'}}><span style={{width:12*uiScale,height:12*uiScale,borderRadius:'50%',background:i?'#E95514':'#b895ff',boxShadow:`0 0 8px ${i?'#E95514':'#b895ff'}`}}/>{text}</span>)}
      </div>
      <div style={{position:'relative',height:2,background:'rgba(255,255,255,.16)',borderRadius:1}}><div style={{position:'absolute',left:0,top:0,height:2,width:`${frame/D*100}%`,background:'linear-gradient(90deg,#b895ff,#E95514)',borderRadius:1}}/></div>
    </div>}
    {overlayContent&&<div style={{position:'absolute',right:overlay?.right??-2,bottom:overlay?.bottom??85*uiScale,width:overlay?.width??220*uiScale,height:overlay?.height??(220*832/928)*uiScale,zIndex:100}}>{overlay?.loopFrames?<Loop durationInFrames={overlay.loopFrames}>{overlayContent}</Loop>:overlayContent}</div>}
    {credit&&<div style={{position:'absolute',right:24*uiScale,bottom:48*uiScale,fontFamily,fontSize:21*uiScale,fontWeight:600,color:'#eee7df',textShadow:'0 2px 8px #000'}}>{credit}</div>}
  </AbsoluteFill>;
};
