import type {PianoScoreSceneProps, PianoTimeline} from './PianoScoreScene';
import {OFFICIAL_HAND_PALETTE, type ScoreVideoConfig} from './ScoreVideoConfig';

export type ScoreVideoAssets = {
  timeline: PianoTimeline;
  scoreSrc: string;
  audioSrc?: string;
  /** Declare the supplied geometry; this resolver never generates a strip. */
  pipeline: ScoreVideoConfig['pipeline'];
  avatarSrc?: string;
  avatarDurationSeconds?: number;
};

/** Resolve once, persist these plain JSON props, then bind/review that exact file. */
export function resolveScoreVideoConfig(config: ScoreVideoConfig, assets: ScoreVideoAssets): PianoScoreSceneProps {
  const {aspectRatio, cameraMode, theme, texture, motionFx, typography, pipeline} = config;
  if (!['9:16','16:9'].includes(aspectRatio) ||
      !['portrait-focus','portrait-runway','landscape-classic'].includes(cameraMode) ||
      !['slate-gray','obsidian-dark','deep-sapphire'].includes(theme) ||
      !['black-multiply','metallic-screen'].includes(texture) ||
      !['cat','none'].includes(config.avatar) ||
      !['chinese-2x','bodoni-royal','clean'].includes(typography.style)) throw new Error('INVALID_VIDEO_CONFIG');
  if ((cameraMode === 'landscape-classic') !== (aspectRatio === '16:9')) throw new Error('CAMERA_ASPECT_MISMATCH');
  if (!['full-score','score-strip'].includes(pipeline) || assets.pipeline !== pipeline ||
      (cameraMode === 'portrait-runway') !== (pipeline === 'score-strip')) throw new Error('PIPELINE_CAMERA_MISMATCH');
  if (!assets.scoreSrc || !Number.isFinite(assets.timeline.fps) || assets.timeline.fps <= 0) throw new Error('INVALID_VIDEO_ASSETS');
  if (!Number.isInteger(motionFx.trailFrames) || motionFx.trailFrames<0 || motionFx.rippleFrames<0||!Number.isInteger(motionFx.rippleFrames) ||
      [motionFx.rippleOpacity,motionFx.inactiveNoteOpacity].some(n=>!Number.isFinite(n)||n<0||n>1) ||
      [motionFx.taperTrail,motionFx.followChordNotes,motionFx.rippleRing,typography.showStatusBar].some(v=>typeof v!=='boolean')) throw new Error('INVALID_MOTION_CONFIG');
  if (motionFx.rippleRing || motionFx.rippleOpacity!==0) throw new Error('RIPPLE_RETIRED');
  const expectedColors = {
    rightColor:OFFICIAL_HAND_PALETTE.right.color,rightGlow:OFFICIAL_HAND_PALETTE.right.glow,rightCore:OFFICIAL_HAND_PALETTE.right.core,
    leftColor:OFFICIAL_HAND_PALETTE.left.color,leftGlow:OFFICIAL_HAND_PALETTE.left.glow,leftCore:OFFICIAL_HAND_PALETTE.left.core,
  };
  for (const [key,value] of Object.entries(config.handColors??{})) {
    if (typeof value !== 'string' || value.toLowerCase() !== expectedColors[key as keyof typeof expectedColors]?.toLowerCase()) throw new Error('STANDARD_PALETTE_REQUIRED');
  }
  if (config.avatar === 'cat' && !assets.avatarSrc) throw new Error('AVATAR_ASSET_REQUIRED: supply your own transparent muted video, or select none');
  const seconds = assets.avatarDurationSeconds ?? 10;
  if (config.avatar==='cat' && (!Number.isFinite(seconds)||seconds<=0||Math.round(assets.timeline.fps*seconds)<1)) throw new Error('INVALID_AVATAR_DURATION');
  const style = (hand: 'right'|'left') => ({
    ...motionFx, color:OFFICIAL_HAND_PALETTE[hand].color,
    glowColor:OFFICIAL_HAND_PALETTE[hand].glow, coreColor:OFFICIAL_HAND_PALETTE[hand].core,
    rippleColor:OFFICIAL_HAND_PALETTE[hand].color,
    holdHighlightUntilNext:true,
  });
  return {
    timeline:assets.timeline,scoreSrc:assets.scoreSrc,...(assets.audioSrc?{audioSrc:assets.audioSrc}:{}),
    aspectRatio,cameraMode,theme,texture,pipeline,typographyStyle:typography.style,
    title:typography.title,chineseTitle:typography.chineseTitle,subtitle:typography.subtitle,
    showProgress:typography.showStatusBar,vignette:false,
    backgroundScene:theme==='deep-sapphire'?'deep-sapphire':'none',
    rightStyle:{...style('right'),arcHeight:58},leftStyle:{...style('left'),arcHeight:44},
    overlay:config.avatar==='none'?{enabled:false}:{enabled:true,src:assets.avatarSrc,kind:'video',transparent:true,loopFrames:Math.round(assets.timeline.fps*seconds)},
  };
}
