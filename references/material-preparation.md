# Material preparation across Agents

RC5 remediation adds executable gates: use [the deterministic workflow](rc5-workflow.md) and [score validation](score-validation.md). Existing capabilities may perform transcription, but script-generated structural, visual, layout and audio evidence must pass before completion. PDF is a distinct source (`prepare --pdf`, `score source`), not an SVG. Prefer an installed professional OMR for PDF/staff images; no installed engine is not a reason to guess notes with an engraver. First dependency installation or large additions require a concrete plan and current user confirmation.

Use this reference when input is MusicXML, MIDI, SVG, MP3, a staff-notation image, a numbered-notation (jianpu) image, or a combination. The objective is a same-layout SVG + checked timeline, optional original audio, song props, and a concise preparation report. Users need not author coordinates or JSON themselves. Preserve supplied files and keep preprocessing/intermediate data in the user's song workspace, outside the distributable Skill.

## Discover capabilities, then choose a route

Check what the current Agent can actually use: installed Skills/plugins, permitted local tools, existing Python/Node packages or models, CLI paths and authorized services. Read relevant tool instructions and confirm availability with a lightweight capability/version check. A missing CLI in PATH does not mean the Agent lacks the capability; a discovered executable does not prove it supports the required conversion. Check external tool documentation when its interface or supported format is uncertain; do not invent commands.

Prefer existing standard data and the user's available capabilities. Install or configure only the missing stage in an isolated environment when permitted by the current task. Do not install every optional CLI, change global PATH, upgrade the Remotion project, or download large model weights merely because an engine was mentioned. For a new paid service or uploading supplied media outside the already authorized environment, obtain the necessary authorization. Routine local processing within the task can proceed without repeated confirmation.

Ask only for information that cannot be established from inputs and would materially change the result: e.g. unreadable jianpu key/rhythm, an unresolvable repeat, or whether an intentional excerpt is acceptable. Tool choice and file conversion are normally the Agent's responsibility. If a route genuinely fails, retain intermediate artifacts, name the failed stage and error, and try a suitable existing alternative; do not loop blindly or quietly replace the requested piece with the demo.

## Route by supplied evidence

| Inputs | Reuse | Missing work to complete with available Agent capabilities |
|---|---|---|
| SVG + checked coordinate timeline | Both; preserve their shared layout | Validate frame/coordinate contract; align supplied audio if not already checked |
| MusicXML, optionally audio | Pitch, rhythm, staves, voices, ties and notation already present | Engrave/export SVG; derive attack occurrences and coordinates; derive nominal time or align audio |
| MIDI, optionally audio | Note-on/off events and tempo map; built-in MIDI parser can export timed notes after a complete import | Establish musical spelling/quantization and hand/voice assignment, engrave SVG, map noteheads; compare to actual audio timing |
| SVG without timeline | Existing page geometry | Recover note identities/positions from layout metadata or visual analysis, establish musical attacks and timing; request standard source only if available routes cannot recover them reliably |
| MP3 without usable notation | Original performance | Inspect/decode audio; transcribe notes with an available audio capability; correct musical interpretation, create notation/layout, map coordinates and retain performance timing |
| Staff-notation image | Visible staff notation | Use visual/OMR capability; verify clefs, key/time signatures, accidentals, pitch, duration, rests, voices, ties, repeats; derive standard representation and layout mapping |
| Numbered-notation image | Visible jianpu | Use jianpu-capable visual/OCR reasoning; recover tonic/key, octave dots, accidentals, duration lines/dots, rests, ties, meter, repeats and voice labels; create pitched notation before staff rendering |
| Mixed standard files + images/audio | The most reliable data for each stage | Cross-check discrepancies; do not run audio transcription if a matching accurate MusicXML/MIDI already supplies notes |

Do not use a universal pitch split as proof of left/right hands. Staff/voice/channel labels can assist but need review for crossing hands and multiple voices. Jianpu or a melody-only score may lack a left-hand arrangement; preserve only the supplied part and explain that scope. Do not invent accompaniment unless the user asks for an arrangement. If key/octave/rhythm is unreadable and cannot be established, mark the ambiguous passages and ask the specific question instead of guessing.

For a single known melody with no anatomical hand information, a single display stream may use `hand:'right'` as the renderer's naming convention; disclose that this is a display-part assignment, not recovered evidence of the performer's hand. Do not create a second stream. Ask about true hand assignment only when it is necessary for the user's requested result.

For photographs, first inspect orientation, cropping, legibility and page order. Use an existing vision/OMR capability suited to that notation. Generic text OCR output alone is not a verified musical transcription. Audiveris/MuseScore/Verovio names in PATH discovery are optional clues, not interchangeable proof of audio transcription or jianpu recognition.

## Prepare the final assets

1. **Inspect actual inputs.** Confirm readable XML/MIDI/SVG/images or decodable audio using available tools. The importer checks existence before an incomplete report; this is not a media decoder. Record duration, page/order, source notation, and relevant uncertainties. Separate an unavailable decoder from corrupt media.
2. **Establish musical events.** Preserve pitches, rests, voices, key, durations, grace-note decisions, ties and playback order. A tied continuation does not create a new attack. Expand repeats into distinct playback occurrences even if several occurrences point to one visible notehead. Keep an intermediate event ID and occurrence mapping.
3. **Establish performance time.** Without audio, derive nominal seconds from notated rhythm and tempo, and label them nominal. With audio, reuse transcription/performance timestamps or align notation to the recording. Constant BPM/one global offset alone does not demonstrate synchronization for tempo-varying performances. Preserve original audio; any leading trim/time stretch needs an explicit mapping. Frame positions use the chosen composition fps and must remain within durationInFrames.
4. **Create one consistent layout.** Prefer stable engraver note IDs or geometry metadata. Otherwise derive reviewed coordinates from the actual exported SVG, including nested transforms, viewBox, crop and image placement. Do not mix coordinates from a different engraving revision. Re-engraving invalidates prior coordinates. A numbered-notation image is a source for transcription here; the current scene's existing notehead highlights are designed for staff notation, so produce a matching staff SVG instead of claiming native jianpu glyph highlighting.
5. **Build the animation timeline.** Assign only established hands/parts; combine simultaneous attacks per hand into one event with all noteheads in notes. Do not merge a short arpeggio into a chord merely to simplify processing. Choose a head target from the actual chord and retain each pitch/position. Use the [timeline contract](data-contract.md); create a cameraPath when multiple systems need deliberate following.
6. **Validate and preview.** Use prepare for structural checks, doctor with explicit song props for asset checks, and Studio for the actual song. Inspect known noteheads, both supplied parts, chords, ties, row/page/repeat transitions and the final note. With audio check at least beginning, middle and end plus difficult transitions; record timestamp pairs and measured timing offsets, not just “looks synced”. Agree any accuracy target appropriate to the task; sampled checks do not certify every note.

If export is requested, render the song using its props, then inspect the output and audio. Do not render a full video just to satisfy this reference when the user asked only for setup or preview. An explicitly requested draft can proceed with unresolved passages clearly labeled; retain needs_review/needs_audio_alignment and do not call it a verified final result.

## Execution interfaces

**Agent-native route (preferred when already available):** use any suitable authorized Skill/tool/library or local script to produce score.svg and timeline.json, then import them with prepare. No special adapter executable is necessary for this route. Python/JS code can be run directly with the Agent's ordinary tools. The Skill does not require every Agent to have the same engine.

**Optional adapter route:** `prepare.mjs --preprocessor <executable>` invokes a trusted adapter with the documented protocol. New source arguments are `--score-image <file>` and `--jianpu-image <file>`; the adapter receives them with absolute paths. MP3/MIDI/MusicXML/SVG use their existing flags. An adapter must output missing score.svg/timeline.json; command success alone is insufficient. Existing explicit SVG/timeline inputs take precedence. The CLI accepts one file per image flag; the Agent can process multiple pages in its own workspace before importing the final assets.

**Minimal configuration handoff:** when no available route can finish a stage, state (a) which stage and input failed, (b) capabilities already checked, (c) the smallest missing capability and how to configure it using verified instructions, (d) the exact outputs needed to resume. Ask the user only for necessary authorization or source facts. Do not tell the user to install the entire tool list or handwrite a timeline as the default solution.

## Record what was actually established

Keep preparation-report.md beside the user's intermediate files, not inside the public Skill. Include supplied input names, selected tools/versions or actual Agent capabilities, intermediate and final paths, musical uncertainties, hand/voice decisions, layout provenance/mapping, nominal versus performance timing, sampled audio offsets, structural/visual checks performed, and remaining work. Use independent statuses for input decoding, transcription, geometry mapping, alignment and rendering: passed / needs_review / unavailable / not_run as appropriate.

A successful import proves structure only. A built-in synthetic test proves the tool interface, not successful recognition of a real user's music or notation. Do not upgrade needs_review to verified just because a model returned plausible-looking notes or a CLI exited zero.
