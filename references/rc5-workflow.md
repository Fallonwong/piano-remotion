# RC5 deterministic workflow

All Agent hosts use `node <skill>/scripts/piano.mjs <command>`. It delegates environment, installation, import and score checks to deterministic scripts and freezes one song job for preview/export. The base animation does not require Python. No script installs npm packages, creates a venv, downloads model weights or changes global PATH automatically.

## 1. Discover and plan before installing

```sh
node <skill>/scripts/piano.mjs doctor <project> --authorized-project <other-explicitly-authorized-project> --python <existing-python>
node <skill>/scripts/piano.mjs install --project <project> --plan
```

Repeat authorized-project/python arguments when appropriate. Discovery checks exact baseline versions, actual module/CLI usability, project/authorized venvs, launchers, PATH and bounded standard Windows locations. It does not scan every user project. Package-manager probes avoid Corepack downloads. A missing PATH entry is only one search result, not proof that the application is absent.

Reuse a compatible current project first. For an existing target with no dependencies, explicit `--reuse-project <authorized-project>` can create a dependency junction/symlink only after both installed versions and target declarations match. It refuses differing existing files or any existing dependency directory. Never replace a user's node_modules. A known existing junction in a user project is resolved and checked, not relinked silently.

```sh
node <skill>/scripts/piano.mjs install --project <project> --reuse-project <compatible-project>
```

For a genuinely new directory, first run `install --standalone <new-directory> --plan`. Explain target paths, versions, locked package count, expected package-manager work and why reuse was not suitable. Request confirmation before the first dependency install or any new large dependency. After authorization, scaffold with `--standalone`, then execute the reviewed package-manager command in that directory. `confirmation_required:true` and `npmCi.executed:false` are not successful dependency installation. Do not assume permission because a plan was printed. Reuse an existing browser explicitly with --browser rather than preparing a new one unnecessarily.

## 2. Separate sources and score correctness

Use prepare for already matched SVG/timeline/audio. PDF (`--pdf`), staff images and jianpu sources are not SVG generation tasks. Professional OMR/registered local recognition capabilities are preferred for PDF/staff images; no installed engine means `OMR_UNAVAILABLE` until an optional installation is authorized or a separately verified alternative is available. MuseScore/VexFlow are engraving tools, not evidence that recognition was correct. See [score validation](score-validation.md) and [material preparation](material-preparation.md).

```sh
node <skill>/scripts/piano.mjs score source --source <score.pdf> --out <new-evidence-dir> --python <existing-python> --pdftoppm <existing-pdftoppm>
node <skill>/scripts/piano.mjs score check --musicxml <recognized.musicxml> --out <new-check-dir> --python <existing-python>
```

The check preserves structured per-measure data and issues. Passes for structure and visual comparison are separate. `score compare` creates actual original/reflow pages, per-measure crops, a review template and HTML controls. Missing/uncertain/different measures remain pending; stale source/layout/review hashes fail. No automatic generic measure detector or universal semantic image-comparison engine is claimed. A review is an auditable human/Agent judgment, not a pixel-similarity proof. Preserve all doubts rather than rewriting complex rhythms to fit an engine.

Only after score confirmation should the actual engraving producer generate SVG and attack coordinates together. The same-run producer evidence used by score comparison is `piano-score-layout/v1`. The song job additionally requires a notehead mapping sidecar:

```json
{
  "scoreSha256": "exact SVG bytes SHA-256",
  "timelineSha256": "hashObject(timeline) from scripts/audio.mjs",
  "producer": {"tool":"actual engraver and version","runId":"same runId as score comparison"},
  "mapping": [{"eventIndex":0,"noteIndex":0,"svgId":"notehead-1","x":120,"y":80}]
}
```

Every timeline note needs one actual SVG ID/position. Current deterministic geometry validation supports normalized identified ellipse/circle noteheads, including rotations about their own center. Path glyphs/nested SVG or transforms/nontrivial image crops require a verified normalization adapter and are blocked for review; inline styles, stylesheets, defs/symbol/use and dynamic SVG are also outside this checked subset. Flatten them in the same actual layout operation; do not substitute guessed coordinates. This does not remove legacy PianoScoreScene transform support. Source/notation correctness still needs its separate review; matching positions alone is insufficient.

## 3. Require an audio decision and calibrate

Song props contain the full timeline and public-relative scoreSrc/audioSrc. With MP3, decode/probe it, check positive duration/audibility and sample onset offsets:

```sh
node <skill>/scripts/piano.mjs align --project <project> --props <song-props.json> --out <new-alignment.json>
```

No MP3: ask whether to create synthetic audio, request a recording, or explicitly confirm a silent preview. Never silently declare an audible work complete. Only after opt-in may `piano synthesize --timeline <timeline.json> --out <new.wav> --confirmed` create original damped-harmonic piano-like audio. This is not a sampled piano; real pitches are required. Convert/reuse it as appropriate, add audioSrc, then run alignment. Python is not needed for this synthesis.

Alignment checks three distinct beginning/middle/end attacks against decoded energy onset candidates (default tolerance two frames), duration and non-silent signal. Sparse, legato, dense polyphonic or difficult recordings can require manual/pitch-aware calibration; failed automatic checks are not waived by changing a status string. The current CLI does not ingest manual calibration overrides. It reports needs_review rather than falsely passing those recordings. Do not call three samples proof of every note or use them as proof of pitch accuracy.

For a measured constant offset, `piano calibrate --project <project> --props <props.json> --offset-seconds <signed-seconds> --out <new-props.json>` creates a non-destructive timing revision and shifts camera samples consistently. It rejects out-of-range attacks. Re-run alignment and regenerate stale review/layout evidence; it never treats a global shift as a solution to tempo drift or automatically marks the revision verified.

## 4. Bind and use the same song everywhere

```sh
node <skill>/scripts/piano.mjs bind --project <project> --props <song-props.json> --layout <notehead-layout.json> --alignment <alignment.json> --source-type svg --out <new-job.json>
node <skill>/scripts/piano.mjs preview --job <job.json> --browser <existing-browser>
```

For PDF/staff/jianpu/MusicXML/audio-transcribed sources, pass the true --source-type and --score-review <score-compare-dir/report.json>. Structure, visual approval, matching SVG/timeline and matching runId are required. Do not mislabel a transcribed source as SVG to bypass the gate. `--silent-confirmed` is only for an explicitly requested silent preview. `--draft` labels an uncertain timeline; it does not waive required score visual review or failed audio calibration.

The job pins props, SVG, audio, timeline, calibration and layout hashes. Preview/render use the dedicated PianoRemotion-Song entry with explicit props and no Demo fallback. Changed inputs invalidate the job. Existing Demo and original components remain available for compatibility; raw legacy/npm commands are outside these checked workflow gates and must not be represented as checked song completion.

## 5. Export, verify and report independent outcomes

After the current user asks for export:

```sh
node <skill>/scripts/piano.mjs render --job <job.json> --out <new-video.mp4> --confirmed --browser <existing-browser>
node <skill>/scripts/piano.mjs verify --job <job.json> --video <video.mp4> --report <new-verification.json>
```

Rendering automatically runs verification and writes video.mp4.verification.json. FFprobe checks full video dimensions/fps/duration and required audio stream. FFmpeg decodes audio to verify non-silent RMS/peak and beginning/middle/end onset offsets in the actual MP4. FFprobe/FFmpeg may be explicit executable paths using --ffprobe/--ffmpeg; do not install or infer success when unavailable. Independently view selected frames for notehead registration, both supplied parts, chord/highlight/trails and camera movement. AAC padding may slightly extend container duration; video duration is checked separately.

Return independent environment / recognition / structure / visual / layout / audio / render states, actual artifacts, measured offsets and unresolved issues. `media_verified` means media metadata/audibility/sampled timing passed; it does not certify recognition of every note. Errors are JSON code/message/next with a nonzero exit, or a documented needs_review/confirmation_required report. Never mark a blocked stage complete merely because another stage passed.
