---
name: piano-remotion
description: Make piano-score videos with original two-hand leaps, glow trails and camera. Review notation revisions, reuse sampled audio tools, and stop for score approval then actual keyframe/audition approval before exporting.
---

# Piano Remotion — V1.0.0

Read the installed official `remotion-best-practices` first. Reuse compatible authorized environments; Python/OMR are optional. First installs or large downloads require paths, versions, content, size/reason and user permission. Preserve private sources, personal overlays off, original ScoreNoteLeap/PianoScoreScene visuals. No license has been assigned.

Use `node <skill>/scripts/piano.mjs`. Read [audio and recognition workflow](references/workflow.md) for audio or PDF/images; [RC6 workflow](references/rc6-workflow.md) documents geometry and existing stage mechanics. Use production evidence and notation-audit arguments with those commands. Do not use legacy Demo calls as checked song completion.

## Execute the task with two content review stops

1. **Discover/classify.** Reuse the current project and explicitly authorized compatible tools. Missing PATH or a probe timeout is not evidence of absence. Reliable MusicXML/MIDI take priority over re-recognition. PDF/staff images prefer installed professional OMR; missing tools produce options, not invented transcription. Jianpu requires explicit key/octave/rhythm interpretation. Never silently write a per-song recognizer or simplify voices.
2. **Prepare and review notation.** Retain editable MusicXML, real pitch/duration/meter/rest/chord/voice/staff/beam/tie/slur semantics. Check original/reflow crops for every measure; balanced bars are not correctness. `notation-audit` adds revision differences, dense/connected/polyphonic pilot measures and evidence-bound doubts. Use `--previous` after corrections and `--expected-measures` when a user identified a bounded change. Show unexpected changes; do not reset already-correct music for camera edits. New PDF/image `score-request` requires `--notation-audit`. Show crops/differences/doubts, return WAITING_FOR_SCORE_APPROVAL and END THE TURN. Agent self-review cannot approve.
3. **Record real user consent.** Quote actual user words with the displayed requestId/message reference or use their review-page response. Never fabricate actor=user or approval. Score response records provided/synthesize/silent; generated audio choice does not approve unseen timbre. Local JSON binds versions, not human identity.
4. **Produce the approved song/audio.** Preserve the original animation and native SVG geometry. Same-pitch ties sound once for their full duration; slurred pitches remain separate; beams are not ties. Discover with `audio-plan`: user recording first, then existing sampled engine/font. `audio-render` exports the complete approved XML through verified MuseScore Basic; `audio-master` records explicit global gain/padding and protects audible release tails. New checked bind needs `--audio-evidence`. Do not register Agent-generated waveforms as user recordings. Built-in `synthesize --preview-only` is calibration draft only; never replace production audio with custom oscillators just to pass alignment.
5. **Show actual keyframes and audition.** Use the same final full-song master/props/job for preview/export. `keyframes` generates real frames and a short audition/motion clip. Show audio source/profile/mix plus both hands/chords/line changes/connections/camera. Return WAITING_FOR_KEYFRAME_APPROVAL and END THE TURN. Optional early timbre audition is useful, not a mandatory third gate. A 10–15s excerpt cannot replace the full-song master. Audio/engine/mix changes invalidate this review.
6. **Export after both approvals.** `render --approval ... --confirmed` uses the frozen job. --confirmed alone cannot bypass review. Verify decoded streams, audibility, duration, fps/size and sampled sounding attacks. A missing energy peak is inconclusive for dense/legato music: preserve sound and return needs_review; never shorten decay or change notes to satisfy the detector. Do not fake a passing report. Retain actual commands, inputs and results.

## Recognition quality and limits

Inspect scan quality, page/crop provenance, accidentals/key/clef/octave, dots/beams/tuplets, rests, chord count, voices/hands and tie vs slur. Start difficult long scores with a representative 3–5 measure pilot; cross-check with a second existing method when useful. A model reading twice is not independent ground truth. Never claim an accuracy percentage without a human-corrected benchmark. Keep per-measure uncertainty evidence and explain each correction.

Two failures on one path require diagnosis/alternatives. If no reviewable result exists after roughly ten minutes, report blockers; do not silently run an hour. Complete routine work autonomously inside each stage; do not ask micro-permission for ordinary reversible steps or authorized mixing adjustments.

This release adds no OMR engine. Existing professional OMR adapter remains optional, real OMR accuracy unverified. MuseScore/VexFlow engraving and a finished video do not certify original-score correctness. See [tests](TEST-RESULTS-RC7.md), [usage](README_使用说明.md) and [prompts](examples/agent-prompts.md). Preserve legacy jobs for inspection; re-bind new work with V1.0.0 evidence rather than overwriting finished artifacts.
