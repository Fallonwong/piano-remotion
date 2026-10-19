import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {validateTimeline} from './prepare.mjs';
const target=path.resolve(process.argv[2]??'.');
const report={project:target,node:process.version,checks:[],optional:{}};
const check=(name,ok,detail)=>report.checks.push({name,ok,detail});
check('node',Number(process.versions.node.split('.')[0])>=20,'Node >=20');
let req;
let projectPackage;
try {const p=path.join(target,'package.json');projectPackage=JSON.parse(fs.readFileSync(p,'utf8'));req=createRequire(p);check('package.json',true,p);} catch(e){check('package.json',false,e.message);}
const versions={};
for(const name of ['remotion','@remotion/cli','react','react-dom','typescript'])try{versions[name]=req(`${name}/package.json`).version;check(name,true,versions[name]);}catch(e){check(name,false,'Not installed; in standalone runtime run npm ci. Existing projects use their own lockfile/package manager.');}
check('remotion-version-match',!!versions.remotion&&versions.remotion===versions['@remotion/cli'],'remotion and @remotion/cli must match; bundled baseline 4.0.515');
check('react-version-match',!!versions.react&&versions.react===versions['react-dom'],'React and ReactDOM versions must match');
check('typescript-config',fs.existsSync(path.join(target,'tsconfig.json')),'tsconfig.json');
check('lockfile',['package-lock.json','pnpm-lock.yaml','yarn.lock','bun.lock'].some(f=>fs.existsSync(path.join(target,f))),'Use the project lockfile; package manager is not switched automatically');
let material;
const propsIndex=process.argv.indexOf('--props');
try {
  if(propsIndex!==-1){if(!process.argv[propsIndex+1])throw new Error('--props needs a JSON filename');const propsFile=path.resolve(process.argv[propsIndex+1]);material=JSON.parse(fs.readFileSync(propsFile,'utf8'));report.assetSelection={mode:'explicit-props',propsFile};}
  else {
    let slug;
    if(projectPackage?.name==='piano-remotion-portable-runtime'&&fs.existsSync(path.join(target,'src/index.tsx'))) {slug='demo';report.assetSelection={mode:'standalone',slug};}
    else if(fs.existsSync(path.join(target,'src/piano-remotion-demo/index.tsx'))) {slug='piano-remotion-demo';report.assetSelection={mode:'existing-project',slug};}
    else if(['demo','piano-remotion-demo'].some(s=>fs.existsSync(path.join(target,'public/score',s,'timeline.json')))) throw new Error('Score directories exist but no Piano installation is identified; pass --props <song-props.json> explicitly.');
    if(slug){const p=path.join(target,'public/score',slug,'timeline.json');material={timeline:JSON.parse(fs.readFileSync(p,'utf8')),scoreSrc:`score/${slug}/score.svg`};}
  }
  if(material){validateTimeline(material.timeline);check('timeline',true,`${material.timeline.events.length} attacks; structural check only`);
    for(const [label,value] of [['score',material.scoreSrc],['audio',material.audioSrc],['overlay',material.overlay?.enabled?material.overlay.src:undefined]]) {
      if(!value&&label==='score')throw new Error('scoreSrc required');
      if(!value&&label==='overlay'&&material.overlay?.enabled)throw new Error('Enabled overlay requires src');
      if(value){const publicRoot=path.resolve(target,'public');const f=path.resolve(publicRoot,value);check(`asset:${label}`,f.startsWith(publicRoot+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile(),String(value));}
    }
  } else report.assets='No demo assets installed yet; install first or pass --props <song-props.json> to check user assets.';
}catch(e){check('materials',false,e.message);}
for(const name of ['ffmpeg','ffprobe','mscore','MuseScore4','musescore','audiveris','verovio']) {const r=spawnSync(process.platform==='win32'?'where.exe':'which',[name],{encoding:'utf8',windowsHide:true});report.optional[name]=r.status===0?r.stdout.trim().split(/\r?\n/):'not found (optional)';}
report.browser='Remotion provisions a headless browser on first CLI use if needed; offline machines must supply --browser-executable. No browser launch is claimed by doctor.';
console.log(JSON.stringify(report,null,2));
if(report.checks.some(c=>!c.ok))process.exitCode=1;
