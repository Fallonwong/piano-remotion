# RC6 executable workflow

Use `node <skill>/scripts/piano.mjs --help`. Runtime pins remain Remotion/CLI 4.0.515, React 19.2.4, TypeScript 5.9.3. Paths below are placeholders. Review packages/jobs are machine-local; re-bind after relocation.

## Discover and prepare notation

Run doctor against the actual project and explicit authorized roots, then install --plan if needed. Reuse existing tools. Python/OMR are optional and no package is installed automatically. A timeout requires diagnosis, not a presumption of absent software.

An optional **already installed** Audiveris executable can be used:

```sh
node <skill>/scripts/piano.mjs score source --source <original.pdf> --audiveris-exe <Audiveris.exe> --pdftoppm <existing-pdftoppm> --out <new-source-dir> --python <existing-python>
```

The adapter follows the [official CLI](https://audiveris.github.io/audiveris/_pages/guides/advanced/cli/): `-batch -transcribe -export -output DIR -- INPUT`. It retains command/stdout/stderr and accepts one XML/MusicXML/MXL score. Multiple movements need explicit selection; unsafe MXL paths are rejected. Integration/protocol tests are not real OMR accuracy evidence. Existing piano-omr/v1 wrappers and environment entry points remain supported. Missing OMR yields an actionable report, never invented transcription or forced installation.

For Agent-assisted reading, preserve note/measure uncertainties and original crops. Keep editable MusicXML. Start with a representative pilot for difficult scans. Do not silently invent a new per-song recognizer or discard rhythm, voices or ties.

```sh
node <skill>/scripts/piano.mjs score check --musicxml <score.musicxml> --out <check-dir> --python <existing-python>
node <skill>/scripts/piano.mjs music-from-check --check <check-dir/report.json> --placement <placement.json> --fps 30 --out <timeline.json>
```

Placement comes from the actual engraver, never a guessed universal pitch split:

```json
{"tempoBpm":90,"scoreWidth":1600,"scoreHeight":900,"handMap":{"P1:1:1":"right","P1:2:2":"left"},"notes":[{"id":"P1:1:0","svgId":"actual-notehead-id","x":120,"y":80}]}
```

IDs are `<measure.id>:<event-index-in-check>`; rests/chords still occupy their event indices. This compiler uses an explicitly chosen constant tempo. Repeat/jump/grace/microtonal cases block for upstream interpretation. Expand tempo changes upstream rather than flattening them. Review handMap and all semantic warnings explicitly.

For an existing timeline, `music --timeline <input.json> --out <compiled.json>` validates real durationFrames and tie/slur chains. Written notes retain stable IDs, voice/staff/part, durationFrames, tieStart/tieStop, slurs and beams. Same-pitch ties produce one sounding span across written heads, including partial chords; different-pitch slurs keep their attacks. Legacy duration fallback is not accepted for newly reviewed songs. No acoustic piano/pedal model is claimed.

## Preserve native SVG paths and coordinates

```sh
node <skill>/scripts/piano.mjs geometry --svg <score.svg> --timeline <timeline.json> --mapping <timeline.json.mapping.json> --browser <existing-Chromium.exe> --out <new-geometry-dir>
```

Mapping uses eventIndex/noteIndex/svgId. The existing browser measures actual notehead IDs with getBBox/getScreenCTM. Original paths, dots, beams and ties are retained. Output contains timeline.json and layout.json; bind remeasures native geometry. External resources/scripts are rejected. Missing IDs require a real adapter. Centres are geometry anchors, not pitch recognition. The bounded fixture adapter does not certify arbitrary engraver exports.

Generate original/reflow crops with score compare and actual producer sidecars as in [score-validation.md](score-validation.md). The geometry measurement run alone cannot prove an unrelated XML generated the SVG.

## First mandatory stop: score

```sh
node <skill>/scripts/piano.mjs score-request --source <original.pdf> --source-type pdf --timeline <compiled.json> --comparison <compare-dir/report.json> --out <score-review-dir>
```

For ready SVG/MIDI without MusicXML, omit comparison and supply the original source, compiled timeline and optional --score <display.svg>. This direct branch does not claim XML semantic certification. PDF/staff-image/jianpu-image/musicxml/audio-derived notation requires real structural/crop comparison. Written pitches/durations/ties/slurs are checked against MusicXML before a PDF review request. Original source stays hashed after conversion.

Show the returned HTML, all measures and doubts. **Return WAITING_FOR_SCORE_APPROVAL and END THE TURN.** The user can download a response from the page or confirm in chat. A chat response must quote actual user words and the actual host message reference:

```json
{"schema":"piano-user-response/v1","actor":"user","requestId":"displayed ID","bundleSha256":"displayed hash","decision":"approve","message":"actual user words","messageRef":"actual message reference","audioChoice":"synthesize"}
```

Audio choice is provided/synthesize/silent. Agent self-check cannot substitute for user confirmation. Local JSON binds versions, not cryptographic human identity. Never fabricate a response. A changes_requested response creates no approval.

```sh
node <skill>/scripts/piano.mjs approve --request <score-review-dir/request.json> --response <user-response.json> --out <score-approval.json>
node <skill>/scripts/piano.mjs synthesize --timeline <compiled.json> --score-approval <score-approval.json> --out <new.wav> --confirmed
```

Synthesize is allowed only if the user chose it. Set real public-relative scoreSrc/audioSrc and the compiled timeline in song props. Keep new camera paths in props.presentation.cameraPath. Align the actual audio, then bind:

```sh
node <skill>/scripts/piano.mjs align --project <project> --props <props.json> --out <alignment.json>
node <skill>/scripts/piano.mjs bind --project <project> --props <props.json> --layout <layout.json> --alignment <alignment.json> --source-type pdf --score-review <compare-dir/report.json> --score-approval <score-approval.json> --browser <existing-Chromium.exe> --out <job.json>
```

User-reviewed comparisons can remain pending in the Agent-check layer: no bulk auto-approval is needed. Explicit silence needs --silent-confirmed and the user's silent audio choice. Camera/style changes require fresh keyframes; music changes require renewed score review.

## Second mandatory stop: frames and audition

```sh
node <skill>/scripts/piano.mjs keyframes --job <job.json> --out <frames-dir> --browser <existing-Chromium.exe>
```

Actual Remotion stills, frame timestamps, a short audio audition and a bounded motion clip for tie/slur inputs are retained with command logs. Inspect coverage of both hands/chords/line changes/connections/camera extremes; add representative views when needed. Still PNGs cannot prove legato. **Show the review, return WAITING_FOR_KEYFRAME_APPROVAL, END THE TURN.**

```sh
node <skill>/scripts/piano.mjs approve --request <frames-dir/review/request.json> --response <user-response.json> --out <frame-approval.json>
node <skill>/scripts/piano.mjs render --job <job.json> --approval <frame-approval.json> --out <new.mp4> --browser <existing-Chromium.exe> --confirmed
```

Score approval or --confirmed alone cannot export a full song. Input/displayed media changes invalidate approval. Final verify checks actual streams/dimensions/fps/duration/non-silent PCM and sampled **sounding attacks**, excluding tie continuations. It does not certify all pitches or original-PDF accuracy. Legacy Demo/direct Remotion commands cannot be represented as checked completion.

## Bounded execution and portability

Preserve command/version/start/end/exit/output; no unconditional `|| true`. Diagnose after two repeated failures. If no reviewable score exists after about ten minutes, report blockers/options; this configurable budget is not an accuracy threshold. A simple new-user task still has exactly two content review stops plus any genuinely necessary install/audio decision.

The original leap/trail/camera algorithms stay intact; ScoreNoteLeap adds optional sustain metadata. Synthetic test approvals are explicitly protocol fixtures, never actual human or real-OMR acceptance. Do not publish private scores, music or local-path evidence.
