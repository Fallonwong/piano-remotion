# Local visual configuration upgrade (1.2.0-local.2)

This local candidate is not a GitHub release. Use `SCORE_PRESETS` from
`components/ScoreVideoConfig.ts` and `resolveScoreVideoConfig` from
`components/resolveScoreVideoConfig.ts`. The resolver returns ordinary
`PianoScoreScene` props: serialize those resolved props before the existing bind,
keyframes and render workflow. Do not bind a wrapper whose settings differ from
the JSON reviewed by the user.

## Confirm only missing choices

Offer these choices before parsing/rendering a new song; reuse actual choices
already supplied. Recommendations are not consent.

| Section | Recommended / available |
|---|---|
| Aspect | **9:16**; 16:9 |
| Camera | portrait-focus; portrait-runway; landscape-classic |
| Theme | **slate-gray**; cosmic-nebula; obsidian-dark; deep-sapphire; vintage-parchment |
| Surface | **black-multiply**; metallic-screen; white-invert |
| Hand colors | right #b895ff / left #E95514; standard for new presets |
| Motion | 16-frame tapered trail, chord split/merge, ripple opacity .35, inactive highlight opacity 0 |
| Avatar | **cat**, when an actual supplied transparent video is available; none |
| Typography | chinese-2x; bodoni-royal; clean; optional status/progress bar |
| Pipeline | full-score for focus/classic; supplied score-strip for runway |

Preset factories return independent mutable FX objects; modifying one preset
does not change future presets. New presets do not include the discarded 62-degree
camera or cyan/magenta hand palette. Existing low-level props and old jobs remain
compatible. Do not force these choices onto explicitly requested different work.

| Factory | Aspect / camera | Theme / surface | Avatar |
|---|---|---|---|
| SlateClassic | 9:16 / portrait-focus | slate-gray / black-multiply | supplied cat |
| CosmicRunway | 9:16 / portrait-runway | cosmic-nebula / metallic-screen | supplied cat |
| ObsidianFocus | 9:16 / portrait-focus | obsidian-dark / white-invert | supplied cat |
| SapphireLandscape | 16:9 / landscape-classic | deep-sapphire / metallic-screen | supplied cat |
| ParchmentManuscript | 9:16 / portrait-focus | vintage-parchment / black-multiply | none |

## Resolved scene example

```tsx
import {SCORE_PRESETS} from './animations/score/ScoreVideoConfig';
import {resolveScoreVideoConfig} from './animations/score/resolveScoreVideoConfig';
// approvedTimeline contains the actual measured per-frame focusPath.
const config = SCORE_PRESETS.SlateClassic('曲目名', 'Piano Study');
config.avatar = 'none'; // Only when this is the user's actual choice.
const props = resolveScoreVideoConfig(config, {
  timeline: approvedTimeline,
  scoreSrc: 'score/my-song/score.svg',
  audioSrc: 'score/my-song/audio.wav',
  pipeline: 'full-score',
});
// Save JSON.stringify(props), then bind that file. Render PianoScoreScene.
```

For cat, pass `avatarSrc` and its measured `avatarDurationSeconds` (default 10).
The resolver uses round(fps * seconds); the video is transparent, muted and at
zIndex 400. No cat video, fonts or song media are distributed. This user's local
project suggests `ip/piano-alpha.webm`, but verify it exists before use.

## Configuration record

Keep `piano-production/v2` and the real `confirmationQuote` / `messageRef`.
For new presets, include `visual` with `cameraMode`, `texture`, `pipeline`,
`typographyStyle`, `showProgress`, and `motionFx` from the selected config.
Set `rightColor='#b895ff'`, `leftColor='#E95514'`; these are the main colors,
while glow/core colors are separate. `validateProduction(record, resolvedProps)`
checks the new visual choices and FX. Historical records without `visual`
continue to compare their original glow-color fields. Never invent user approval
for diagnostics. Inspect `production-check` output as configuration validation,
not song correctness or visual acceptance.

## Compatibility and boundaries

- `classic` keeps its original defaults. `landscape-classic` selects that modern
  16:9 behavior; `portrait-focus` uses tiltX 36, tiltZ -7, scale 1.18 and (540,960).
  `portrait-classic` remains a legacy flat portrait option, not a new recommendation.
- Old theme names remain accepted. `slate-gray` matches `slate`; the new parchment
  is #f5ede0 while historical `parchment` retains its old color. No silent rewrites.
- New texture props explicitly control filters and blending. Inverted textures
  include a black-point contrast adjustment so white SVG paper does not leave a
  gray rectangle. Supply neutral white or transparent score backgrounds; colored
  scanned paper needs its own reviewed surface preparation. Star backgrounds are
  self-contained deterministic components. Set resolved `backgroundScene='none'`
  to disable atmosphere; freeze and review the resulting props.
- The dynamic pivot, not every tilted note, has depth zero. All score geometry,
  highlights and trails share one transform. Check both staves and late systems.
- Runway requires an already prepared, verified continuous SVG and matching
  timeline/focusPath. Declaring `pipeline='score-strip'` does not create or verify
  one. Use [score-strip](score-strip.md) to prepare a strip from measured system bounds and source geometry.
- `ScoreCosmicRunway`'s independent procedural scene is not bundled as a substitute
  for native notation. No per-song timing repair scripts are included.
- The status bar uses the hand palette and progress. It is not an audio activity
  detector or a measure counter. Inactive opacity applies to note highlights;
  the current held note and moving trail retain their original sustain behavior.
- chinese-2x doubles the title size and uses the Chinese font stack with fallback.
  Test long titles; fonts are not downloaded automatically.

## Review

Keep both existing review stops: actual notation approval, then actual keyframes
and audition approval. Inspect first four reviewed bars plus later risk positions:
both staves, chord split/merge, rests/ties, line transitions, final systems, long
titles, and avatar clearance. Title zIndex 300 / avatar 400; masks cannot cover
active notes. A synthetic style render is engineering evidence only. Preserve
16:9 historical geometry, palette and defaults when no new props are selected.
