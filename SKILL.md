---
name: piano-remotion
description: Make piano-score videos with the original two-hand leaps, glow trails and camera. Prepare notation/PDF/images/audio, preserve ties and durations, stop for user score approval, then stop for keyframe/audition approval before exporting.
---

# Piano Remotion — RC6

Read the installed official `remotion-best-practices` first. Reuse compatible existing runtimes and authorized tools; the official Agent Skill and Remotion dependencies are separate. Python/OMR are optional, never base-animation requirements. Before first installs or large downloads, report exact paths, versions, content and reason, then wait for permission. Never install an entire CLI suite by default.

Use `node <skill>/scripts/piano.mjs` and [the executable RC6 workflow](references/rc6-workflow.md). Preserve private source files and the original two-hand leaps, tapered glow trails, chord highlights and camera geometry. RC6 adds optional sustain/continuation metadata without replacing the visual effect. Personal overlays stay off. License remains unassigned; see LICENSE.txt.

## One complete task, TWO user review stops

A new user can say “make this PDF into a piano video.” Execute routine work autonomously within each stage. A request for final MP4 does not approve content that has not yet been shown.

1. **Discover and classify.** Run doctor; prefer the current compatible project, then explicitly authorized projects. Missing PATH entries or a timed-out probe do not prove no installation. Keep original source type/hash after conversion. Prefer reliable MusicXML/MIDI over re-recognition. For PDF/staff images prefer installed professional OMR; `score source --audiveris-exe` is optional. MuseScore/VexFlow engraving is not OMR validation. With no OMR, offer existing Agent-assisted reading with explicit doubts or an optional installation plan. Do not silently build a per-song recognizer, invent notes, simplify voices or pad rhythm.
2. **Prepare notation and STOP.** Preserve pitch, duration, meter, rests, chords, voices, ties, slurs and beams. `score check/compare` produces structural checks and real original/reflow measure crops. `music-from-check` preserves notation with explicit hand/voice placement; `music` validates tie chains/durations. `score-request` creates the versioned review and WAITING_FOR_SCORE_APPROVAL. Show all measures/doubts and END THE TURN. Agent self-check, no reply, elapsed time or a generic request to “finish directly” cannot approve an unseen score.
3. **Record the actual user response.** Use the review page download, or quote a real user message with the current requestId and message reference. `approve` approves that stage only. Never fabricate actor=user, a quote, message reference or approval file. Ask once about audio when absent; the score response records provided/synthesize/silent. Ordinary local JSON cannot authenticate human identity across hosts: enforce the actual user-message boundary honestly, without claiming unforgeable approval.
4. **Build the approved song.** Written noteheads and sounding attacks are separate. Same-pitch ties sustain once across segments; different-pitch slurs keep their attacks; beams do not merge sounds. Missing durations or ambiguous chains block checked preparation. Synthesis requires score approval and the user's synthesis choice; the harmonic timbre is not a sampled piano. Bind real score/audio/timeline/props/layout with `--score-approval`. `geometry` measures actual native SVG notehead IDs in an existing browser, preserving paths/dots/ties; do not replace glyphs to satisfy a shape-only check.
5. **Generate keyframes/audition and STOP AGAIN.** `keyframes` renders actual representative PNGs, a short audition and a bounded motion clip for ties/slurs. Cover both hands, chords, connections, line changes and camera limits. Show WAITING_FOR_KEYFRAME_APPROVAL and END THE TURN. Still images alone cannot verify legato. Score approval does not approve unseen frames.
6. **Export after the second approval.** `render --approval <keyframe-approval> --confirmed` exports the exact reviewed job. --confirmed alone cannot bypass either gate. Changed relevant inputs invalidate approvals. Verify final streams, decoded audibility, fps/size/duration and sampled sounding attacks; this does not prove original-score accuracy. Report recognition, both approvals and media verification separately; retain actual tool logs.

## Accuracy and bounded effort

Keep uncertainty per note/measure with original-image evidence. Resolve or explicitly present HAND_UNDECLARED and other review issues; do not bulk-set approved. Claim no accuracy percentage without a labeled benchmark. Synthetic smoke tests are not real-PDF recognition tests.

Export editable MusicXML for upstream correction. Prefer a small representative recognition pilot for difficult long scores; explain blurry/cropped sources. Two failures on one path require diagnosis/alternatives. If no reviewable score exists after about ten minutes, report blockers/options; this configurable effort budget is not a correctness cutoff. Do not run silently for an hour.

Put new camera paths under `props.presentation.cameraPath`; presentation edits require new frames, not new optical recognition. Music edits require renewed score review. Record tool command/version/start/end/exit/output; never suppress errors with unconditional `|| true`.

See [usage](README_使用说明.md), [score evidence](references/score-validation.md) and [prompts](examples/agent-prompts.md). Legacy Demo/jobs remain inspectable, but cannot bypass user review for new song export. Do not claim real OMR accuracy or full WorkBuddy/OS coverage without actual evidence.
