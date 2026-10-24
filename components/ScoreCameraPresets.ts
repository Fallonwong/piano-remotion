import type {ScoreNoteLeapProps} from './ScoreNoteLeap';

export type ScoreCameraMode = 'classic' | 'portrait-runway' | 'portrait-focus' | 'landscape-classic' | 'portrait-classic';
export type RunwayCameraOptions = {
  /** Frame units; set 0 to start at the settled pose. */
  introFrames?: number;
  /** Score-coordinate pixels, not screen pixels. */
  leadIn?: number;
  /** Optional explicit layout profile. Omission preserves the original camera. */
  startScale?: number;
  settledScale?: number;
  scaleMultiplier?: number;
  stretchX?: number;
};

/** Optional reference-inspired camera. Call only with a measured grand-staff focus.
 * The pivot always stays at depth zero; positive score X recedes into the scene.
 * It does not turn separate engraved systems into a continuous strip.
 */
export const portraitRunwayPose = (
  frame = 0,
  focus = {focusX: 0, focusY: 0},
  {introFrames = 120, leadIn = 70, startScale = .90, settledScale = 1.18, scaleMultiplier = 1, stretchX = 1}: RunwayCameraOptions = {},
) => {
  if (!Number.isFinite(introFrames) || introFrames < 0 || !Number.isFinite(leadIn)) {
    throw new Error('INVALID_RUNWAY_CAMERA_OPTIONS');
  }
  if ([startScale, settledScale, scaleMultiplier, stretchX].some(n=>!Number.isFinite(n)||n<=0)) throw new Error('INVALID_RUNWAY_CAMERA_SCALE');
  const t = introFrames === 0 ? 1 : Math.max(0, Math.min(1, frame / introFrames));
  const ease = t * t * (3 - 2 * t);
  return {
    focusX: focus.focusX + leadIn * (1 - ease), focusY: focus.focusY,
    targetScreenX: 540, targetScreenY: 960,
    scale: (startScale + (settledScale - startScale) * ease) * scaleMultiplier,
    stretchX,
    rotateX: 0, rotateY: 60, rotateZ: -72,
    perspective: 1700,
  };
};

/** Established arc and 14-frame tapered glow, with per-note chord flights.
 * Colors stay with the song's reviewed palette; caller overrides win.
 * Defaults are frames at any composition fps, not seconds.
 */
export const portraitRunwayNoteStyle = (): Partial<ScoreNoteLeapProps> => ({
  trailFrames: 14, highlightFrames: 10, followChordNotes: true,
  trailWidth: 2.4, taperTrail: true, glowStrength: 1.2,
  holdHighlightUntilNext: true, starburst: false,
  rippleRing: false, rippleFrames: 0, rippleMaxRadius: 38,
});

/** Directional 3D embossed cast-shadow matching the setting-sun angle. */
export const portraitRunwayScoreFilter = () =>
  'drop-shadow(5px 9px 3px rgba(30, 18, 12, 0.42))';

