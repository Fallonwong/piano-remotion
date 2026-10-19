---
name: piano-remotion
description: Animate piano scores with the original two-hand note leaps, chord highlights and glow trails. Accept SVG, MusicXML, MIDI, MP3, staff-notation images or numbered-notation images; guide the Agent to reuse available recognition and preparation tools when layout or timing data is missing.
---

# Piano Remotion

Invoke as `$piano-remotion`. Agents without Skill discovery (including alternate WorkBuddy setups) should read this file and run its Node scripts directly. No Codex MCP, Python, account, or agent-specific CLI is required for the base workflow.

Installation and user-facing invocation examples: [README](README.md) and [prompt examples](examples/agent-prompts.md). Load examples only when helping users invoke this Skill.

## Prerequisite: official Remotion Agent Skills

This is a specialized extension of Remotion. **Before using this Skill as an Agent workflow, locate and read the official `remotion-best-practices` Skill first**, then follow the piano-specific instructions below.

1. Check the Agent's available Skill catalog and configured project/user Skill directories for `remotion-best-practices`. Reuse an existing installation; do not assume a particular user's absolute path or reinstall it unnecessarily.
2. If missing, install Remotion's official Agent Skills using the documented command `npx skills add remotion-dev/skills`. Select the target Agent and intended project/user scope in the installer. Official source and installation instructions: [Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills), [upstream repository](https://github.com/remotion-dev/skills). Installation success must be confirmed by locating and reading the actual `remotion-best-practices/SKILL.md` and its referenced files. Do not declare the prerequisite satisfied merely because the command was suggested or dispatched.
3. If an Agent (including a WorkBuddy configuration) cannot discover installed Skills, read that installed `SKILL.md` by its actual path, preserving the upstream directory structure so referenced child files resolve. If network, permissions or installation fails, report the missing prerequisite and pause dependent Agent development/modification work; do not pretend it was loaded.
4. Follow its routing: read the relevant markup guidance for TSX changes, Studio guidance for preview, and rendering guidance for an explicitly requested export. Then apply this Skill's score coordinate/timing, asset isolation and compatibility contracts. Official Skill updates do not authorize upgrading this project's pinned runtime or adopting APIs absent from Remotion 4.0.515.

The official Skill is **Agent guidance**, while `remotion`, `@remotion/cli`, React and TypeScript are **runtime/build dependencies**. Installing one does not install the other. Already-extracted projects can execute their existing preview/render scripts without loading Agent guidance; this does not waive the prerequisite for Agent-led development or modification. `doctor.mjs` checks runtime/assets only: it does not prove that an Agent has read the official Skill. No upstream Skill content is bundled or relicensed in this archive.

## Preserve the real animation

`components/ScoreNoteLeap.tsx` is copied unchanged from the source project. Keep the legacy export; `PianoRemotion` is its public alias. `PianoScoreScene.tsx` extracts the existing shared score transform, two-hand color/glow treatment, camera path/following, vignette, fade, title and progress layers. Do not replace it with a simpler animation. Read [the contract](references/data-contract.md) before changing score geometry or timing.

## Execute

Complete the official Skill prerequisite above before this workflow.

1. Inspect the user's existing project, lockfile, entry and authorized assets. Prefer the existing project and installed dependencies. Do not modify the main entry, upgrade packages, overwrite source, or create a git commit as an incidental step.
2. Run `node <skill>/scripts/doctor.mjs <project>`. Distinguish required dependency failures from optional preprocessing tools. The shipped baseline is Remotion **4.0.515**, React **19.2.4**, TS **5.9.3**; use matching Remotion packages and respect the user's lockfile. No CLI is installed by doctor.
3. Install additively: `node <skill>/scripts/install.mjs --project <project>`. This creates an isolated entry `src/piano-remotion-demo/index.tsx`; it leaves the existing entry and indexes intact. Append exports/index descriptions only when integration into the user's animation library is requested. A differing existing file blocks the whole install; do not overwrite it. For explicit standalone validation or use on an empty machine: `node <skill>/scripts/install.mjs --standalone <new-directory>`, then `npm ci` in that directory. This is the same extracted implementation, not a new animation design.
4. Choose the intended content BEFORE preview or rendering. For a generic demonstration use the installed synthetic demo. For user inputs (MusicXML, MIDI, SVG, MP3, staff images, numbered-notation images or combinations), read [material preparation](references/material-preparation.md). Inventory the actual Agent's Skills, libraries, tools and permitted services; reuse suitable existing capabilities to fill ONLY the missing notation, layout, coordinate or alignment stages. If prepare returns incomplete, continue the Agent workflow where possible rather than requiring the user to hand-author JSON or install a named CLI. Import the resulting same-layout SVG + checked timeline and optional MP3 using [the importer](references/input-preparation.md). Never manufacture score coordinates or claim recognition/alignment without verification.
5. For a user's song create a JSON props file with the full `timeline` object, `scoreSrc`, optional `audioSrc`, and scene configuration. Run `node <skill>/scripts/doctor.mjs <project> --props <file>`. Pass `--props=<file>` to EVERY subsequent Remotion compositions/studio/render command so the user's song is used instead of the demo. The entry calculates fps/duration from timeline; adjust its width/height for a requested output format. See [usage](README_使用说明.md). Without --props, doctor recognizes the installed standalone/project entry; unrecognized candidate score directories require explicit props rather than a guess.
6. In an existing project run `npx --no-install remotion compositions src/piano-remotion-demo/index.tsx`, then `npx --no-install remotion studio src/piano-remotion-demo/index.tsx`. In the standalone runtime use `npm run compositions` and `npm run studio`. For user songs append the selected props (`npm run studio -- --props=<file>`, likewise for other npm scripts). Open the printed URL. Run standalone `npm run typecheck`; for existing projects use their typecheck command and check the isolated entry too if tsconfig excludes it.
7. Render only when the CURRENT user explicitly requests an export; package history and previous acceptance runs do not authorize a new render. Use `npm run render` in standalone mode, or `npx --no-install remotion render src/piano-remotion-demo/index.tsx PianoRemotion-Demo out/PianoRemotion-Demo.mp4` in an existing project, including the selected song props when applicable. Inspect selected frames and verify MP4 metadata, chord highlights, both hands, row jumps and score/overlay registration. Do not claim success based only on dependency checks or composition discovery.

## Media and trust boundary

No song recording, original score, private timeline, custom font, personal character video or brand is shipped. Generic assets are newly generated synthetic test data. `overlay` is absent/disabled by default; enable only for user-supplied authorized assets. `credit` defaults to empty. Do not copy the private example into the distributable. Read [assets policy](references/assets-policy.md) for public/private separation and licensing status.

Built-in scripts provide deterministic import/validation and an optional adapter interface; the Agent can use its own Skills, code, libraries or authorized services to prepare the same final assets. No single recognition engine or complete CLI suite is mandatory. Explain the exact missing capability only when existing routes cannot complete it; preserve partial results and continue independent work. Distinguish file import, structural validation, notation recognition, layout mapping and performance alignment. Report only checks actually performed. The test report records the host and limitations; it does not certify every OS or Agent host.
