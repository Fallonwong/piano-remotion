import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {discoverEnvironment,BASELINE,probe} from './environment.mjs';

const skill=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const evidence=path.resolve(skill,'../environment-evidence');
fs.mkdirSync(evidence,{recursive:true});
const work=fs.mkdtempSync(path.join(evidence,'run-'));
const write=(p,value)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof value==='string'?value:JSON.stringify(value));};
const save=(name,value)=>write(path.join(work,name+'.json'),value);
let serial=0;
function fixture({versions=BASELINE,cli=true,metadataOnly=false}={}) {
  const root=path.join(work,`project ${++serial}`);
  write(path.join(root,'package.json'),{name:'fixture',dependencies:versions});
  write(path.join(root,'tsconfig.json'),'{}');write(path.join(root,'package-lock.json'),'{}');
  for(const [name,version] of Object.entries(versions)) {
    const d=path.join(root,'node_modules',name);
    write(path.join(d,'package.json'),{name,version,main:'index.js',...(name==='@remotion/cli'?{bin:{remotion:'cli.cjs'}}:{})});
    if(!metadataOnly)write(path.join(d,'index.js'),'module.exports = {};');
    if(name==='@remotion/cli'&&cli)write(path.join(d,'cli.cjs'),`console.log('@remotion/cli ${version}'); process.exit(1);`);
  }
  return root;
}
function run(script,args,expected=0) {
  const r=spawnSync(process.execPath,[path.join(skill,'scripts',script),...args],{encoding:'utf8',windowsHide:true,timeout:60000,maxBuffer:2*1024*1024});
  assert.equal(r.status,expected,r.stderr||r.error?.message);
  return r.stdout?JSON.parse(r.stdout):null;
}
const compatible=fixture(), second=fixture(), incompatible=fixture({versions:{...BASELINE,react:'19.2.3'}}), missing=path.join(work,'missing');

test('authorized discovery, exact baseline and current priority; JSON serializable',async()=>{
  const e=await discoverEnvironment({project:compatible,authorizedProjects:[second,incompatible,missing]});
  save('discovery-fixtures',e);
  assert.equal(e.selectedProject,compatible);assert.equal(e.projects.length,4);
  assert.equal(e.projects[1].compatible,true);
  assert.equal(e.projects[2].compatible,false);assert.match(e.projects[2].issues.join(' '),/expected 19.2.4/);
  assert.equal(e.projects[2].cliProbe,null,'mismatched versions must not be executed for reuse');
  assert.equal(e.projects[3].compatible,false);
  assert.ok(path.isAbsolute(e.projects[0].cliPath));
  const result=await probe(process.execPath,[e.projects[0].cliPath,'--version'],compatible);
  assert.equal(result.exitCode,1);assert.match(result.stdout,/4.0.515/);
  assert.deepEqual(JSON.parse(JSON.stringify(e)),e);
});
test('missing current uses authorized compatible project only',async()=>{
  const e=await discoverEnvironment({project:missing,authorizedProjects:[incompatible,second]});
  assert.equal(e.selectedProject,second);
  const alone=await discoverEnvironment({project:missing});
  assert.equal(alone.selectedProject,null);assert.equal(alone.projects.length,1);
});
test('metadata alone and broken CLI do not qualify',async()=>{
  const p=fixture({metadataOnly:true}), broken=fixture();
  write(path.join(broken,'node_modules/@remotion/cli/cli.cjs'),"console.error('dependency load failed');process.exit(1)");
  const e=await discoverEnvironment({project:p,authorizedProjects:[broken]});
  assert.equal(e.selectedProject,null);assert.ok(e.projects.every(p=>p.issues.length));
});
test('child processes time out instead of hanging',async()=>{
  const script=path.join(work,'hang.cjs');write(script,'setInterval(()=>{},1000)');
  const start=Date.now(),r=await probe(process.execPath,[script]);
  save('timeout',r);assert.equal(r.timedOut,true);assert.equal(r.ok,false);assert.ok(Date.now()-start<12000);
});
test('first install plan is read only and reports exact npm intent',()=>{
  const p=path.join(work,'plan only');
  const r=run('install.mjs',['--plan','--standalone',p]);save('first-install-plan',r);
  assert.equal(fs.existsSync(p),false);assert.equal(r.confirmation_required,true);
  assert.equal(r.dependencies.action,'confirmation_required');assert.equal(r.npmCi.executed,false);
  assert.equal(r.npmCi.expected.dependencies.remotion,'4.0.515');assert.ok(r.npmCi.expected.lockedPackageCount>10);
});
test('legacy standalone copies additively, never installs dependencies, refuses existing target',()=>{
  const p=path.join(work,'standalone legacy');const r=run('install.mjs',['--standalone',p]);save('first-install',r);
  assert.equal(r.confirmation_required,true);assert.equal(fs.existsSync(path.join(p,'node_modules')),false);
  assert.ok(fs.existsSync(path.join(p,'src/index.tsx')));run('install.mjs',['--standalone',p],1);
});
test('incompatible reuse and target version ranges fail before writes',()=>{
  const p=path.join(work,'reject reuse');run('install.mjs',['--standalone',p,'--reuse-project',incompatible],1);
  assert.equal(fs.existsSync(p),false);
  const target=fixture({versions:{...BASELINE,react:'^19.2.4'}});
  run('install.mjs',['--project',target,'--reuse-project',compatible],1);
  assert.equal(fs.existsSync(path.join(target,'src')),false);
});
test('explicit reuse plans then links matching environment; doctor retains material checks',()=>{
  const p=path.join(work,'reuse install');
  const plan=run('install.mjs',['--standalone',p,'--reuse-project',compatible,'--plan']);
  assert.equal(fs.existsSync(p),false);assert.equal(plan.dependencies.action,'link');assert.equal(plan.confirmation_required,false);
  const installed=run('install.mjs',['--standalone',p,'--reuse-project',compatible]);save('reuse-install',installed);
  assert.equal(fs.realpathSync(path.join(p,'node_modules')),fs.realpathSync(path.join(compatible,'node_modules')));
  const good=run('doctor.mjs',[p]);save('doctor-reused',good);
  assert.equal(good.environment.selectedProject,p);assert.equal(good.assetSelection.slug,'demo');
  assert.ok(good.checks.find(c=>c.name==='timeline').ok);
  fs.renameSync(path.join(p,'public/score/demo/score.svg'),path.join(p,'public/score/demo/score.saved.svg'));
  const bad=run('doctor.mjs',[p],1);assert.equal(bad.checks.find(c=>c.name==='asset:score').ok,false);
});
test('doctor parses flags before positional path, repeat authorization, explicit props and missing audio',()=>{
  const target=fixture({metadataOnly:true});
  const timeline=JSON.parse(fs.readFileSync(path.join(skill,'scripts/fixtures/timeline.json'),'utf8'));
  write(path.join(target,'public/song.svg'),'<svg/>');const props=path.join(target,'song props.json');
  write(props,{timeline,scoreSrc:'song.svg'});
  const r=run('doctor.mjs',['--authorized-project',compatible,'--authorized-project',second,'--props',props,target]);
  assert.equal(r.environment.selectedProject,compatible);assert.equal(r.assetSelection.mode,'explicit-props');
  assert.ok(r.checks.find(c=>c.name==='environment').ok);assert.doesNotMatch(JSON.stringify(r),/run npm ci/);
  write(props,{timeline,scoreSrc:'song.svg',audioSrc:'absent.mp3'});
  const bad=run('doctor.mjs',[target,'--props',props,'--authorized-project',compatible],1);
  assert.equal(bad.checks.find(c=>c.name==='asset:audio').ok,false);
});
test('doctor rejects ambiguous asset directories and retains overlay validation',()=>{
  const target=fixture();write(path.join(target,'public/score/demo/timeline.json'),'{}');
  let r=run('doctor.mjs',[target],1);assert.match(r.checks.find(c=>c.name==='materials').detail,/pass --props/);
  const props=path.join(target,'props.json');write(props,{timeline:JSON.parse(fs.readFileSync(path.join(skill,'scripts/fixtures/timeline.json'),'utf8')),scoreSrc:'song.svg',overlay:{enabled:true}});
  r=run('doctor.mjs',[target,'--props',props],1);assert.match(r.checks.find(c=>c.name==='materials').detail,/Enabled overlay requires src/);
});
test('installer rejects differing existing files before copying',()=>{
  const target=fixture();const sentinel=path.join(target,'src/piano-remotion-demo/index.tsx');write(sentinel,'private work');
  run('install.mjs',['--project',target],1);assert.equal(fs.readFileSync(sentinel,'utf8'),'private work');
  assert.equal(fs.existsSync(path.join(target,'public')),false);
});

test('project installation includes independent song entry and remains additive',()=>{
  const target=fixture();const original=fs.readFileSync(path.join(target,'package.json'),'utf8');
  const r=run('install.mjs',['--project',target]);save('project-song-install',r);
  assert.equal(r.songEntry,'src/piano-remotion-demo/song.tsx');
  const song=fs.readFileSync(path.join(target,r.songEntry),'utf8');
  assert.match(song,/from '\.\.\/animations\/score\/PianoScoreScene'/);
  assert.match(song,/SONG_PROPS_REQUIRED/);assert.match(song,/PianoRemotion-Song/);
  assert.equal(fs.readFileSync(path.join(target,'package.json'),'utf8'),original);
  run('install.mjs',['--project',target]);
  assert.equal(fs.readFileSync(path.join(target,r.songEntry),'utf8'),song);
});
test('existing dependency directory cannot be replaced by reuse',()=>{
  const target=fixture();run('install.mjs',['--project',target,'--reuse-project',compatible],1);
  assert.equal(fs.existsSync(path.join(target,'src')),false);
});
test('optional executable failures retain discovered path and actual probe',async()=>{
  const file=path.join(work,'unlaunchable-tool.exe');write(file,'not an executable');
  const e=await discoverEnvironment({project:compatible,toolPaths:[file]});
  const t=e.tools['unlaunchable-tool'];assert.equal(t.available,false);assert.equal(t.paths[0],file);
  assert.equal(t.probes[0].ok,false);assert.ok(t.probes[0].error);
});
test('real npm version probe succeeds and all manager keys retain missing/failure records',async()=>{
  const e=await discoverEnvironment({project:compatible});save('package-managers-live',e.packageManagers);
  assert.deepEqual(Object.keys(e.packageManagers),['npm','pnpm','yarn','bun']);
  const npm=e.packageManagers.npm;
  assert.equal(npm.available,true,JSON.stringify(npm));assert.match(npm.version,/^\d+\.\d+\.\d+/);
  assert.ok(path.isAbsolute(npm.path));assert.ok(npm.paths.length);
  const actual=npm.probes.find(p=>p.ok&&p.version===npm.version);
  assert.ok(actual);assert.equal(actual.exitCode,0);assert.equal(actual.timedOut,false);
  if(/\.[cm]?js$/i.test(actual.cliPath))assert.equal(actual.path,process.execPath);
  for(const entry of Object.values(e.packageManagers))if(!entry.available) {
    assert.equal(entry.path,null);assert.equal(entry.version,null);assert.ok(entry.issues.length);
    assert.ok(entry.probes.every(p=>!p.ok));
  }
});
test('Windows wrappers are never executed; existing CLI scripts run through Node and absent backing scripts are recorded',async t=>{
  if(process.platform!=='win32'){t.skip('Windows wrapper test');return;}
  const bin=path.join(work,'manager & shell fixture'),sentinel=path.join(work,'wrapper-was-executed');
  const script=path.join(bin,'node_modules/npm/bin/npm-cli.js');
  write(path.join(bin,'node_modules/npm/package.json'),{name:'npm',bin:{npm:'bin/npm-cli.js'}});
  write(script,"console.log('99.1.2')");
  write(path.join(bin,'npm.cmd'),`@echo unsafe > "${sentinel}"`);
  const pnpmScript=path.join(bin,'relative scripts/pnpm.mjs');write(pnpmScript,"console.log('99.2.3')");
  write(path.join(bin,'pnpm.cmd'),`@echo unsafe > "${sentinel}"\n"%~dp0node.exe" "%~dp0relative scripts\\pnpm.mjs" %*`);
  write(path.join(bin,'yarn.cmd'),`@echo unsafe > "${sentinel}"`);
  const previous=process.env.PATH;
  try {
    process.env.PATH=bin;
    const e=await discoverEnvironment({project:compatible});save('package-managers-wrappers',e.packageManagers);
    const npm=e.packageManagers.npm,fixtureProbe=npm.probes.find(p=>p.cliPath===script);
    assert.ok(fixtureProbe?.ok);assert.equal(fixtureProbe.path,process.execPath);assert.equal(fixtureProbe.version,'99.1.2');
    assert.deepEqual(fixtureProbe.args,[script,'--version']);
    assert.equal(fs.existsSync(sentinel),false);
    const pnpmProbe=e.packageManagers.pnpm.probes.find(p=>p.cliPath===pnpmScript);
    assert.equal(pnpmProbe?.ok,true);assert.equal(pnpmProbe.path,process.execPath);assert.equal(pnpmProbe.version,'99.2.3');
    assert.ok(e.packageManagers.pnpm.paths.includes(path.join(bin,'pnpm.cmd')));
    assert.ok(e.packageManagers.yarn.issues.some(s=>s.includes(path.join(bin,'yarn.cmd'))&&s.includes('not executed')));
    assert.ok(Object.values(e.packageManagers).every(m=>m.probes.every(p=>!p.path.endsWith('.cmd'))));
  }finally {if(previous===undefined)delete process.env.PATH;else process.env.PATH=previous;}
});
test('non-PATH Python is discovered via project venv and VIRTUAL_ENV without creating environments',async t=>{
  const python=process.env.PIANO_LIVE_PYTHON;
  if(!python||process.platform!=='win32'){t.skip('Windows live Python path not supplied');return;}
  const target=fixture(),home=path.dirname(python);
  const venv=path.join(target,'.venv');fs.mkdirSync(venv);
  fs.symlinkSync(home,path.join(venv,'Scripts'),'junction');
  const previous=process.env.VIRTUAL_ENV,previousPath=process.env.PATH;
  try {
    process.env.PATH='';process.env.VIRTUAL_ENV=home;
    const e=await discoverEnvironment({project:target});save('non-path-python',e);
    assert.ok(e.pythons.some(p=>p.valid&&p.path===fs.realpathSync(python)));
    assert.equal(e.pythonRequired,false);assert.ok(e.selectedPython);
    assert.equal(e.tools.MuseScore4.available,true);
  } finally {
    if(previous===undefined)delete process.env.VIRTUAL_ENV;else process.env.VIRTUAL_ENV=previous;
    if(previousPath===undefined)delete process.env.PATH;else process.env.PATH=previousPath;
  }
});

test('live authorized projects, bundled Python, non-PATH MuseScore and real CLI',async t=>{
  const project=process.env.PIANO_LIVE_PROJECT;
  if(!project){t.skip('Live project not supplied');return;}
  const python=process.env.PIANO_LIVE_PYTHON;
  const authorizedProjects=(process.env.PIANO_LIVE_AUTHORIZED??'').split(path.delimiter).filter(Boolean);
  const e=await discoverEnvironment({project,authorizedProjects,pythonPaths:python?[python]:[]});save('live-environment',e);
  assert.equal(e.projects[0].compatible,true);assert.equal(e.selectedProject,path.resolve(project));
  assert.ok(fs.existsSync(e.projects[0].cliPath));
  if(python){assert.equal(e.pythons.find(p=>p.discoveredPath===fs.realpathSync(python))?.valid,true);}
  if(process.platform==='win32'&&fs.existsSync('C:/Program Files/MuseScore 4/bin/MuseScore4.exe'))assert.equal(e.tools.MuseScore4.available,true);
  const p=path.join(work,'live linked runtime');const r=run('install.mjs',['--standalone',p,'--reuse-project',project]);save('live-reuse-install',r);
  assert.equal(r.dependencies.action,'link');
  assert.ok(fs.existsSync(path.join(p,r.songEntry)));
  const d=run('doctor.mjs',[p,...(python?['--python',python]:[])]);save('live-doctor',d);assert.equal(d.environment.projects[0].compatible,true);
});
console.log(`Environment evidence: ${work}`);
