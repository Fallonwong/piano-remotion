# Piano Remotion acceptance — 2026-10-19 (Asia/Singapore)

Release status: **technically validated on this Windows host; public license unassigned**. The owner authorized public GitHub publication on 2026-10-19 while retaining the earlier choice not to assign a public license.

## 1.0.0-rc5 GitHub distribution instructions

Prepared the isolated repository for https://github.com/Fallonwong/piano-remotion. Added repository-specific Skills CLI installation commands, project/user scope guidance and six copyable Agent prompt scenarios. Clarified that authorized public publication is distinct from assigning an open-source license. The archive keeps all runtime, preprocessing and animation files identical to rc4.

Skills CLI local `add ./piano-remotion --list` successfully discovered exactly one Skill named piano-remotion. Added .gitattributes to preserve exact file bytes on Windows and other systems; Git's automatic newline conversion must not invalidate manifest hashes or the unchanged-source guarantee. Format, relative Markdown links, manifest and archive integrity are checked for this revision. Real rendering and preprocessing/doctor tests below remain the earlier versioned evidence, not newly executed music-recognition or WorkBuddy certification. Post-publication remote installation verification is recorded in the release notes.

## 1.0.0-rc4 material preparation across Agents

Added a unified preparation reference for MusicXML, MIDI, SVG, MP3, staff images, jianpu images and mixed inputs. Agent-native Skills/tools/libraries/authorized services may fill missing stages directly; no fixed recognition engine or complete CLI suite is mandatory. The guidance defines notation, hand/voice, layout/coordinate and timing handoffs, targeted missing-tool configuration, original-material preservation and verification/reporting requirements. README, usage instructions, Skill discovery description and UI prompt are consistent with this scope.

prepare.mjs now accepts `--score-image` and `--jianpu-image`, passes supplied paths to the optional executable adapter, and returns a structured Agent capability handoff when SVG/timeline is missing. It reports initial file-existence checks honestly, does not decode or recognize source images/audio, and does not bundle source images as if they were verified outputs. The Agent-native route does not require an executable adapter.

The preprocessing suite was run from an isolated writable script copy on this Windows host: **39 passed, 0 failed, 0 skipped**. Eight new test cases cover incomplete input handoff for all six input types, mixed image/audio inputs, and image source preservation with complete standard assets. The existing native adapter test additionally verifies actual absolute image argument forwarding. Images are a tiny synthetic PNG transport fixture and MP3-only handoff uses opaque test bytes: these prove interfaces, not musical recognition quality. Real MP3 decode/mux rendering evidence from rc1 remains separately described below.

An independent read-only forward review considered (1) MP3 plus existing Python transcription/engraving capabilities, (2) single-voice jianpu plus MP3 with an unreadable key, and (3) MusicXML/MIDI/SVG without recognition CLIs. It found no blocking contradiction, no mandatory CLI suite, no default invented accompaniment, and no inherited authorization for paid upload/export. This was a reasoning/flow review, not execution of real recognition models or a new WorkBuddy host test.

Animation components, runtime source/assets/dependencies, installer, doctor and MIDI parser remain unchanged from rc3. Their existing rendering and doctor-test evidence is retained, not presented as newly executed. rc4 reruns Skill format, Markdown links, ZIP CRC and manifest verification; the 39-test preprocessing run covers the changed production script. Public licensing remains pending. No models, dependencies or services were newly installed/invoked for real recognition, and no GitHub upload occurred.

## 1.0.0-rc3 release preparation

Fixed all three issues in the rc2 review: removed historical rendering authorization from the reusable workflow; prepared the user's song props before preview/export; selected doctor assets by recognized standalone/project installation rather than generic directory order; corrected preprocessing documentation paths. Added a GitHub README.md, an original-render preview, .gitignore and focused doctor regression tests.

`node --test scripts/doctor.test.mjs`: **7 passed, 0 failed, 0 skipped** on Windows. Cases cover an existing project's unrelated demo, standalone selection, one/multiple unrecognized candidate directories, explicit user props priority, missing installed assets without silent fallback, and checks before installation. These tests use package metadata fixtures to isolate doctor behavior, not real runtime installations. A separate check against the original real-dependency collision reproduction also passed with the corrected doctor.

All animation components, runtime source, synthetic score data, package/lockfile, installer and preprocessing production scripts remain byte-identical to rc2. No animation rerender or repeat of the unchanged 31-test preprocessing suite was needed; their original results remain below. This revision reran Skill format validation, local Markdown link checks, gitignore behavior checks, and ZIP CRC/manifest hash verification. Public licensing remains pending owner choice. No GitHub upload was performed.

## 1.0.0-rc2 documentation correction

Added the official `remotion-best-practices` Agent Skill as the explicit prerequisite, with discovery/reuse, the verified official `npx skills add remotion-dev/skills` command, read-after-install verification, cross-Agent direct-file loading, and failure handling. Source: https://www.remotion.dev/docs/ai/skills (checked 2026-10-19). Updated the user guide and default Agent prompt accordingly. No upstream Skill is redistributed.

This revision changes only guidance/UI text and release metadata. All runtime, animation, asset, installer and preprocessing files are byte-identical to rc1 (checked against its manifest); the render and 31-test results below are retained from rc1, not rerun or claimed newly executed. The official Skill was already installed on the authoring host and was read during initial packaging; this revision does not claim a fresh installation or a new WorkBuddy-host test. ZIP CRC and all manifest hashes are revalidated for rc2.

## Source and isolation

- Input draft was `Piano Remotion Skill.zip`, the actual root archive, not the differently named archive in the request. Read SKILL.md, packaging prompt, asset policy and data contract before extraction.
- ScoreNoteLeap is byte-identical to the source file: SHA-256 `e71f2d5ef61cce15c7e7fd1819a4cecbe91e163d7f0fe5cae5d153217fe2b395`.
- Snapshot/hash comparison: 18 existing source/asset/script/package files, **0 changed**. Existing compositions, original music, private video, fonts and timelines remain in place. Only new dist/, out/ and ignored .cache/ artifacts were created. No commit/push.
- Runtime was installed to an independent OS temporary directory outside the original project, with its **own physical node_modules**. It used no original La La Land files or dependency junction. A fresh npm ci installed 251 packages from the shipped lockfile. No optional recognition CLI was installed.

## Actual successful checks

| Check | Result |
|---|---|
| Host | Windows 10.0.26100, Node 24.19.0, npm 11.17.0 |
| Versions | remotion/@remotion/cli 4.0.515; React/ReactDOM 19.2.4; TS 5.9.3 |
| `npm ci --ignore-scripts --no-audit --no-fund` | Exit 0, 251 packages; own dependencies |
| `npm run typecheck` | Exit 0; also passed with additive project entry installed |
| `npm run compositions` | Exit 0; PianoRemotion-Demo, 1280×720, 30fps, 180 frames |
| Browser provisioning | Chrome Headless Shell downloaded independently by Remotion CLI |
| `npm run studio -- --no-open` | Server built, localhost:3000/PianoRemotion-Demo returned HTTP 200; in-app open request queued (live preview not visually certified) |
| `npm run render -- --concurrency=2` | Exit 0; H.264 MP4 successfully rendered, 180 video frames, video duration 6.000 s |
| MP4 inspection | ffprobe reports 1280×720, 30/1 fps; container may exceed 6 s slightly due to silent AAC padding |
| Visual inspection | Extracted frames 28, 40, 100, 134 viewed: chord highlights, both hand trails, preserved glow/taper, row discontinuity and second-system camera position visible; no private decoration |
| Optional MP3 + image overlay | Separate 30-frame CLI MP4 succeeded from additive entry with --props; original generated sine MP3 and explicitly enabled synthetic SVG image; frame 28 viewed |
| Audio verification | AAC present; volumedetect mean -24.1 dB, max -19.7 dB, proving non-silent MP3 decode/mux |
| Input import | SVG, timeline, original MIDI, MusicXML and generated MP3 import succeeded; 14 attacks: left 5, right 9; status structural_only |
| Preprocessing regression | `node --test scripts/test.mjs`: 31 passed, 0 failed, 0 skipped; includes format 0/1 MIDI tempo changes, invalid input, incomplete inputs, native adapter success/failure and overwrite rejection |
| Skill validation | Bundled skill-creator quick_validate.py: Skill is valid |
| Independent install audit | Existing-project install with spaces, idempotency, conflicting component refusal, relative imports, supplied assets and missing-CLI diagnostics passed |
| Installer ancestor conflict | Independent audit found partial output when an ancestor was a regular file; added full ancestor preflight, focused retest passed with no public directory created and sentinel unchanged |
| Source preservation | 18 hashes unchanged; exact core SHA shown above |

First render exposed the generic fixture's missing second-row camera motion; corrected fixture cameraPath and rerendered the full 180 frames. The core and scene logic were not simplified. The fixture tests the source's existing suppression of travel across row discontinuities.

The independent audit ran while final documentation was being written and initially reported TEST-RESULTS.md/manifest.json absent. Both are included in the finalized archive and are checked during packaging. It did not retest rendering; the render/audio evidence above comes from the main isolated acceptance.

## Reproduce the core acceptance

```sh
node <skill>/scripts/install.mjs --standalone <new-directory>
cd <new-directory>
npm ci
node <skill>/scripts/doctor.mjs .
npm run typecheck
npm run compositions
npm run studio
npm run render -- --concurrency=2
```

The MP4 and contact sheet are delivered separately from the Skill archive, in the task's `out/piano-remotion-validation/`. Raw render/doctor/test logs and source preservation JSON are supplied alongside them. The archive contains only allowlisted generic source, scripts, runtime metadata and synthetic input fixtures; no MP4/MP3/WebM/font/browser/node_modules/cache is included.

## Limits and unavailable tools

MuseScore/Audiveris/Verovio were not on PATH; no actual recognition/engraving conversion was attempted. The explicit adapter protocol was tested with an original native test program, not a production OMR system. MusicXML import does not derive beat events; compressed MXL is explicitly rejected. MP3 is not automatically transcribed or aligned. MIDI has no automatic hand assignment, sustain interpretation or SVG coordinate mapping. SVG + reviewed timeline are required for an accurate song. The synthetic test does not certify any real performance's synchronization.

Windows execution is proven. No Linux/macOS runtime or actual WorkBuddy host session was tested. Generic Node scripts and direct SKILL.md instructions provide the portable interface; they do not constitute host certification. Optional video overlay code is retained from the source composition but only the image-overlay branch was rendered during this acceptance.
