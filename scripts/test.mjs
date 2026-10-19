import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateTimeline } from './prepare.mjs';
import { parseMidi } from './midi.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const work = await fs.mkdtemp(path.join(root, '.test-run-'));
const fixture = (name) => path.join(root, 'fixtures', name);
const original = JSON.parse(await fs.readFile(fixture('timeline.json'), 'utf8'));
const clone = () => structuredClone(original);
let serial = 0;
const dest = () => path.join(work, `public score ${++serial}`, 'original miniature');
const exists = async (p) => !!await fs.lstat(p).catch(() => null);
const run = (args, env = {}) => {
  const childEnv = { ...process.env };
  for (const [key, value] of Object.entries(env)) {
    if (process.platform === 'win32') {
      for (const existing of Object.keys(childEnv)) if (existing.toLowerCase() === key.toLowerCase()) delete childEnv[existing];
    }
    childEnv[key] = value;
  }
  return spawnSync(process.execPath, [path.join(root, 'prepare.mjs'), ...args], {
    encoding: 'utf8', env: childEnv, windowsHide: true,
  });
};
const imports = (out) => ['--svg', fixture('score.svg'), '--timeline', fixture('timeline.json'), '--out', out];
const chunk = (type, bytes) => {
  const size = Buffer.alloc(4); size.writeUInt32BE(bytes.length);
  return Buffer.concat([Buffer.from(type), size, Buffer.from(bytes)]);
};
function midi({ format = 0, division = 480, tracks } = {}) {
  const header = Buffer.alloc(6); header.writeUInt16BE(format); header.writeUInt16BE(tracks.length, 2); header.writeUInt16BE(division, 4);
  return Buffer.concat([chunk('MThd', header), ...tracks.map((t) => chunk('MTrk', t))]);
}
// C4 begins at tick 0; tempo switches at tick 480; release at tick 960.
const tempoTrack = [0,0xff,0x51,3,7,0xa1,0x20, 0x83,0x60,0xff,0x51,3,0x0f,0x42,0x40, 0x83,0x60,0xff,0x2f,0];
const noteTrack = [0,0x90,60,100, 0x87,0x40,60,0, 0,0xff,0x2f,0]; // running status, zero velocity = release
const midiFixture = midi({ format: 1, tracks: [tempoTrack, noteTrack] });
await fs.writeFile(path.join(work, 'tempo changes.mid'), midiFixture);

test('import: two hands, chord, fractional frame, all optional byte copies and tempo notes', async () => {
  const out = dest();
  const audio = path.join(work, 'opaque-copy-only.mp3');
  // Opaque byte-copy fixture, deliberately not a decodable audio recording.
  await fs.writeFile(audio, Buffer.from('ID3\x04\0\0\0\0\0\0', 'binary'));
  const result = run([...imports(out), '--audio', audio, '--midi', path.join(work, 'tempo changes.mid'), '--musicxml', fixture('score.musicxml')]);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(await fs.readFile(path.join(out, 'manifest.json')));
  assert.equal(manifest.validation, 'structural_only');
  assert.equal(manifest.timelineStatus, 'needs_review');
  assert.deepEqual(manifest.hands, { left: 1, right: 2 });
  for (const [source, target] of [[fixture('score.svg'),'score.svg'],[audio,'audio.mp3'],[fixture('score.musicxml'),'score.musicxml'],[path.join(work,'tempo changes.mid'),'score.mid']]) {
    assert.deepEqual(await fs.readFile(path.join(out,target)), await fs.readFile(source));
  }
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(out, 'timeline.json'))), original);
  const timed = JSON.parse(await fs.readFile(path.join(out, 'timed-notes.json')));
  assert.equal(timed.notes[0].startSeconds, 0);
  assert.equal(timed.notes[0].endSeconds, 1.5);
  assert.equal(timed.notes[0].durationSeconds, 1.5);
  assert.equal(timed.tempoMap.length, 2);
  assert.equal('x' in timed.notes[0], false);
  assert.equal('hand' in timed.notes[0], false);
});

test('width alias normalizes without changing layout; conflicts rejected', () => {
  const t = clone(); t.width = t.scoreWidth; delete t.scoreWidth;
  assert.equal(validateTimeline(t).scoreWidth, 160);
  t.scoreWidth = 161; assert.throws(() => validateTimeline(t), /disagree/);
});

const invalid = [
  ['zero fps', (t) => { t.fps = 0; }],
  ['string fps', (t) => { t.fps = '30'; }],
  ['missing fps', (t) => { delete t.fps; }],
  ['missing width', (t) => { delete t.scoreWidth; }],
  ['negative height', (t) => { t.scoreHeight = -1; }],
  ['fractional duration', (t) => { t.durationInFrames = 1.5; }],
  ['unsafe duration', (t) => { t.durationInFrames = 1e20; }],
  ['empty events', (t) => { t.events = []; }],
  ['unknown hand', (t) => { t.events[0].hand = 'both'; }],
  ['negative frame', (t) => { t.events[0].frame = -1; }],
  ['end boundary frame', (t) => { t.events[2].frame = 60; }],
  ['null frame', (t) => { t.events[0].frame = null; }],
  ['string coordinate', (t) => { t.events[0].x = '40'; }],
  ['empty notes', (t) => { t.events[0].notes = []; }],
  ['missing notes', (t) => { delete t.events[0].notes; }],
  ['missing note coordinate', (t) => { delete t.events[0].notes[0].y; }],
  ['non-string pitch', (t) => { t.events[0].notes[0].pitch = 60; }],
  ['same hand duplicate frame', (t) => { t.events[2].frame = 0; }],
  ['per-hand descending frame', (t) => { t.events[0].frame = 40; }],
];
for (const [name, mutate] of invalid) test(`reject: ${name}`, async () => {
  const t = clone(); mutate(t);
  const source = path.join(work, `invalid-${++serial}.json`); await fs.writeFile(source, JSON.stringify(t));
  const out = dest(); const result = run(['--svg', fixture('score.svg'), '--timeline', source, '--out', out]);
  assert.equal(result.status, 2, result.stdout);
  assert.equal(JSON.parse(result.stderr).status, 'failed');
  assert.equal(await exists(out), false);
});

test('reject NaN, Infinity, boolean and overflowing JSON number', async () => {
  for (const value of [NaN, Infinity, -Infinity, true]) {
    const t = clone(); t.events[0].notes[0].x = value;
    assert.throws(() => validateTimeline(t));
  }
  const source = path.join(work, 'overflow.json');
  await fs.writeFile(source, JSON.stringify(original).replace('"fps":30', '"fps":1e999'));
  const result = run(['--svg', fixture('score.svg'), '--timeline', source, '--out', dest()]);
  assert.equal(result.status, 2); assert.match(result.stderr, /non-finite/);
  for (const literal of ['NaN', 'Infinity']) {
    await fs.writeFile(source, JSON.stringify(original).replace('"fps":30', `"fps":${literal}`));
    assert.equal(run(['--svg', fixture('score.svg'), '--timeline', source, '--out', dest()]).status, 2);
  }
});

test('incomplete without required assets; detection alone never claims conversion', () => {
  const result = run(['--midi', path.join(work,'tempo changes.mid'), '--out', dest()], { PATH: '' });
  assert.equal(result.status, 3, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'incomplete');
  assert.deepEqual(report.missing, ['svg', 'timeline']);
  assert.deepEqual(report.optionalTools.found, []);
});

test('supplied missing file is an error and cannot silently fall back', () => {
  const result = run(['--svg', path.join(work,'missing.svg'), '--out', dest()]);
  assert.equal(result.status, 2); assert.match(result.stderr, /readable file/);
});

const tinyImage=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9V8AAAAASUVORK5CYII=','base64');
for(const kind of ['musicxml','midi','svg','audio','score-image','jianpu-image','pdf'])test(`incomplete ${kind} source hands off without claiming recognition`,async()=>{
  const source=path.join(work,`source-${kind}`);
  let contents;
  if(kind==='musicxml')contents=await fs.readFile(fixture('score.musicxml'));
  else if(kind==='svg')contents=await fs.readFile(fixture('score.svg'));
  else if(kind==='midi')contents=midi({tracks:[[0,0x90,60,100,0x60,0x80,60,0,0,0xff,0x2f,0]]});
  else contents=kind.endsWith('image')?tinyImage:Buffer.from('opaque audio fixture, not decoded');
  await fs.writeFile(source,contents);const out=dest();const result=run([`--${kind}`,source,'--out',out],{PATH:''});
  assert.equal(result.status,3,result.stderr);const report=JSON.parse(result.stdout);
  assert.deepEqual(report.agentHandoff.availableSources,[kind]);
  assert.deepEqual(report.missing,kind==='svg'?['timeline']:['svg','timeline']);
  assert.equal(report.agentHandoff.workflowReference,'references/material-preparation.md');
  assert.equal(report.inputValidation,'file_existence_only_at_this_stage');assert.equal(await exists(out),false);
});
test('mixed image and audio sources remain distinct preparation inputs',async()=>{
  const staff=path.join(work,'staff.png'),jianpu=path.join(work,'jianpu.png'),audio=path.join(work,'opaque.mp3');
  await fs.writeFile(staff,tinyImage);await fs.writeFile(jianpu,tinyImage);await fs.writeFile(audio,'opaque fixture');
  const result=run(['--score-image',staff,'--jianpu-image',jianpu,'--audio',audio,'--out',dest()],{PATH:''});assert.equal(result.status,3,result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).agentHandoff.availableSources.sort(),['audio','jianpu-image','score-image']);
});
test('complete assets accept source images without copying or claiming recognition',async()=>{
  const source=path.join(work,'original staff.png');await fs.writeFile(source,tinyImage);const out=dest();
  const result=run([...imports(out),'--score-image',source]);assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);assert.ok(report.warnings.some(w=>w.includes('did not recognize')));
  assert.deepEqual(await fs.readFile(source),tinyImage);assert.deepEqual((await fs.readdir(out)).sort(),['manifest.json','score.svg','timeline.json']);
});

test('existing destination survives unchanged', async () => {
  const out = dest(); await fs.mkdir(out, { recursive:true }); await fs.writeFile(path.join(out, 'keep.txt'),'preserve');
  const result = run(imports(out));
  assert.equal(result.status,2); assert.equal(await fs.readFile(path.join(out,'keep.txt'),'utf8'),'preserve');
  assert.deepEqual(await fs.readdir(out), ['keep.txt']);
});

test('broken SVG, compressed XML and broken MIDI never publish', async () => {
  for (const [flag, name, contents] of [['svg','broken.svg','<svg>'], ['musicxml','compressed.mxl','PKxx'], ['midi','broken.mid','not midi']]) {
    const source = path.join(work,name); await fs.writeFile(source,contents);
    const out = dest(); const args = imports(out);
    const at = args.indexOf(`--${flag}`);
    if (at >= 0) args[at + 1] = source; else args.push(`--${flag}`,source);
    const result = run(args); assert.equal(result.status,2); assert.equal(await exists(out),false);
  }
});

test('argument errors are explicit', () => {
  for (const args of [[], ['--out'], ['--unknown','value'], ['--out',dest(),'--out',dest()]]) assert.equal(run(args).status,2);
  assert.equal(run(['--help']).status,0);
});

test('preprocessor missing executable and executable failure are explicit', () => {
  const missing = run(['--out',dest(),'--preprocessor',path.join(work,'does-not-exist')]);
  assert.equal(missing.status,2); assert.match(missing.stderr,/not found/);
  // Node is executable but does not implement the protocol; never run as a shell command.
  const failed = run(['--out',dest(),'--preprocessor',process.execPath]);
  assert.equal(failed.status,2); assert.match(failed.stderr,/preprocessor failed/);
});

test('SMF format 0 and default tempo', () => {
  const data = parseMidi(midi({ tracks:[noteTrack] }));
  assert.equal(data.format,0); assert.equal(data.notes[0].endSeconds,1);
});

test('SMF malformed and unsupported cases reject explicitly', () => {
  const eot = [0,0xff,0x2f,0];
  const cases = [
    midi({format:2,tracks:[eot]}), midi({division:0xe728,tracks:[eot]}),
    midi({tracks:[[0,60,1,...eot]]}), // no running status
    midi({tracks:[[0,0x90,60,100,...eot]]}), // unterminated note
    midi({tracks:[[0,0x80,60,0,...eot]]}), // orphan release
    midiFixture.subarray(0,midiFixture.length-1),
    midi({tracks:[[0,0xff,0x51,3,0,0,0,...eot]]}), // tempo zero
    midi({tracks:[[0,0x90,60,100]]}), // missing EOT
    midi({tracks:[[0,0xff,0x51,3,7,0xa1,0x20,0,0xff,0x51,3,0x0f,0x42,0x40,...eot]]}),
  ];
  for (const bytes of cases) assert.throws(() => parseMidi(bytes), /MIDI:/);
});

test('preprocessor success, absent outputs and PATH discovery (native fixture)', async (t) => {
  let executable;
  if (process.platform === 'win32') {
    const compiler = path.join(process.env.WINDIR || 'C:\\Windows','Microsoft.NET','Framework64','v4.0.30319','csc.exe');
    if (!await exists(compiler)) { t.skip('optional native test compiler unavailable'); return; }
    const source = path.join(work,'Preprocessor.cs');
    executable = path.join(work,'Fixture Preprocessor.exe');
    await fs.writeFile(source, `using System; using System.IO; class Fixture { static void Main(string[] a) {
      var o = a[1]; var capture = Environment.GetEnvironmentVariable("PIANO_TEST_ARGS"); if (!String.IsNullOrEmpty(capture)) File.WriteAllText(capture,String.Join("\\n",a)); if (Environment.GetEnvironmentVariable("PIANO_TEST_MISSING") == "1") return;
      File.Copy(Environment.GetEnvironmentVariable("PIANO_TEST_SVG"), Path.Combine(o,"score.svg"));
      File.Copy(Environment.GetEnvironmentVariable("PIANO_TEST_TIMELINE"), Path.Combine(o,"timeline.json"));
      File.WriteAllText(Path.Combine(o,"ignored.txt"),"not part of bundle");
    } }`);
    const compiled = spawnSync(compiler, ['/nologo',`/out:${executable}`,source], {encoding:'utf8',windowsHide:true,env:{...process.env,TEMP:work,TMP:work}});
    assert.equal(compiled.status,0,compiled.stdout + compiled.stderr);
  } else {
    executable = path.join(work,'fixture-preprocessor');
    await fs.writeFile(executable, `#!${process.execPath}\nconst fs=require('node:fs');const path=require('node:path');const o=process.argv[3];if(process.env.PIANO_TEST_ARGS)fs.writeFileSync(process.env.PIANO_TEST_ARGS,process.argv.slice(2).join('\\n'));if(process.env.PIANO_TEST_MISSING==='1')process.exit(0);fs.copyFileSync(process.env.PIANO_TEST_SVG,path.join(o,'score.svg'));fs.copyFileSync(process.env.PIANO_TEST_TIMELINE,path.join(o,'timeline.json'));fs.writeFileSync(path.join(o,'ignored.txt'),'ignore');\n`);
    await fs.chmod(executable,0o755);
  }
  const env = { PIANO_TEST_SVG:fixture('score.svg'), PIANO_TEST_TIMELINE:fixture('timeline.json') };
  const out = dest(); const result = run(['--out',out,'--preprocessor',executable],env);
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual((await fs.readdir(out)).sort(),['manifest.json','score.svg','timeline.json']);
  const missingOut = dest(); const missing = run(['--out',missingOut,'--preprocessor',executable],{...env,PIANO_TEST_MISSING:'1'});
  const staff=path.join(work,'adapter staff.png'),jianpu=path.join(work,'adapter jianpu.png'),capture=path.join(work,'adapter-arguments.txt');
  await fs.writeFile(staff,tinyImage);await fs.writeFile(jianpu,tinyImage);
  const imageRun=run(['--out',dest(),'--score-image',staff,'--jianpu-image',jianpu,'--preprocessor',executable],{...env,PIANO_TEST_ARGS:capture});
  assert.equal(imageRun.status,0,imageRun.stderr);const actualArgs=(await fs.readFile(capture,'utf8')).split(/\r?\n/);
  assert.equal(actualArgs[actualArgs.indexOf('--score-image')+1],path.resolve(staff));
  assert.equal(actualArgs[actualArgs.indexOf('--jianpu-image')+1],path.resolve(jianpu));
  assert.equal(missing.status,2); assert.match(missing.stderr,/did not produce/); assert.equal(await exists(missingOut),false);
  const discoverName = process.platform === 'win32' ? 'MuseScore4.exe' : 'musescore';
  await fs.copyFile(executable,path.join(work,discoverName));
  if (process.platform !== 'win32') await fs.chmod(path.join(work,discoverName),0o755);
  const discovery = run(['--out',dest()],{PATH:work});
  assert.equal(discovery.status,3);
  assert.ok(JSON.parse(discovery.stdout).optionalTools.found.some((x)=>process.platform === 'win32'
    ? x.executable.toLowerCase() === path.join(work,discoverName).toLowerCase()
    : x.executable === path.join(work,discoverName)));
});

// Keep authored fixtures and generated test evidence inside this task's write boundary.
test.after(async () => { console.log(`Isolated test artifacts: ${work}`); });
