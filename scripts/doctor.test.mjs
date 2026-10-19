import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const skill=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const work=fs.mkdtempSync(path.join(os.tmpdir(),'piano-doctor-regression-'));
const versions={'remotion':'4.0.515','@remotion/cli':'4.0.515','react':'19.2.4','react-dom':'19.2.4','typescript':'5.9.3'};
let serial=0;
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));};
const run=(script,args)=>spawnSync(process.execPath,[path.join(skill,'scripts',script),...args],{encoding:'utf8',windowsHide:true});
function project(mode='project') {
  const p=path.join(work,`case ${++serial}`);
  if(mode==='standalone') {const r=run('install.mjs',['--standalone',p]);assert.equal(r.status,0,r.stderr);}
  else {
    write(path.join(p,'package.json'),{name:'existing-user-project',dependencies:{remotion:versions.remotion}});
    write(path.join(p,'tsconfig.json'),'{}');write(path.join(p,'package-lock.json'),'{}');
    if(mode==='project'){const r=run('install.mjs',['--project',p]);assert.equal(r.status,0,r.stderr);}
  }
  // Executable fixtures isolate selection logic; they are not real runtime installs.
  for(const [name,version] of Object.entries(versions)){
    const d=path.join(p,'node_modules',name);
    write(path.join(d,'package.json'),{name,version,main:'index.js',...(name==='@remotion/cli'?{bin:{remotion:'cli.cjs'}}:{})});
    write(path.join(d,'index.js'),'module.exports = {};');
    if(name==='@remotion/cli')write(path.join(d,'cli.cjs'),`console.log('@remotion/cli ${version}');process.exit(1);`);
  }
  return p;
}
function doctor(p,args=[]) {const r=run('doctor.mjs',[p,...args]);assert.ok(r.stdout,r.stderr);return {exit:r.status,report:JSON.parse(r.stdout)};}
function wrongDemo(p,slug='demo'){write(path.join(p,'public/score',slug,'timeline.json'),{belongsTo:'unrelated user work'});}
test('project installation ignores unrelated score/demo',()=>{
  const p=project();wrongDemo(p);const r=doctor(p);assert.equal(r.exit,0);assert.equal(r.report.assetSelection.slug,'piano-remotion-demo');assert.equal(r.report.assetSelection.mode,'existing-project');
});
test('standalone chooses its demo even when another piano demo is present',()=>{
  const p=project('standalone');wrongDemo(p,'piano-remotion-demo');const r=doctor(p);assert.equal(r.exit,0);assert.equal(r.report.assetSelection.slug,'demo');assert.equal(r.report.assetSelection.mode,'standalone');
});
for(const slugs of [['demo'],['demo','piano-remotion-demo']])test(`unrecognized installation does not guess among ${slugs.join(', ')}`,()=>{
  const p=project('uninstalled');for(const s of slugs)wrongDemo(p,s);const r=doctor(p);assert.equal(r.exit,1);assert.match(r.report.checks.find(c=>c.name==='materials').detail,/pass --props/);
});
test('explicit props override discovery and validate the user song',()=>{
  const p=project();wrongDemo(p,'piano-remotion-demo');
  const timeline=JSON.parse(fs.readFileSync(path.join(skill,'scripts/fixtures/timeline.json'),'utf8'));
  write(path.join(p,'public/score/user/score.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');
  const file=path.join(p,'user props.json');write(file,{timeline,scoreSrc:'score/user/score.svg'});
  const r=doctor(p,['--props',file]);assert.equal(r.exit,0);assert.equal(r.report.assetSelection.mode,'explicit-props');assert.equal(r.report.checks.find(c=>c.name==='asset:score').detail,'score/user/score.svg');
});
test('missing installed asset fails without falling back to another demo',()=>{
  const p=project();fs.renameSync(path.join(p,'public/score/piano-remotion-demo/timeline.json'),path.join(p,'saved-timeline.json'));wrongDemo(p);
  const r=doctor(p);assert.equal(r.exit,1);assert.match(r.report.checks.find(c=>c.name==='materials').detail,/piano-remotion-demo/);
});
test('before install no absent assets are reported as validated',()=>{
  const p=project('uninstalled');const r=doctor(p);assert.equal(r.exit,0);assert.match(r.report.assets,/No demo assets installed/);assert.equal(r.report.checks.some(c=>c.name==='timeline'),false);
});
console.log(`Doctor regression evidence: ${work}`);
