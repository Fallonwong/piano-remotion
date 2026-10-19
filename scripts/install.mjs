import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [mode,targetArg]=process.argv.slice(2);
if(!['--standalone','--project'].includes(mode)||!targetArg) {console.error('Usage: node install.mjs --standalone NEW_DIRECTORY | --project EXISTING_REMOTION_DIRECTORY');process.exit(1);}
const target=path.resolve(targetArg), plan=[];
const add=(from,to)=>{for(const e of fs.readdirSync(from,{withFileTypes:true})) {if(['node_modules','.remotion','.cache','out'].includes(e.name))continue;const a=path.join(from,e.name),b=path.join(to,e.name);e.isDirectory()?add(a,b):plan.push([a,b]);}};
if(mode==='--standalone') {
  if(fs.existsSync(target)) throw new Error('Standalone target must not exist; refusing to overwrite');
  add(path.join(root,'assets/runtime'),target);
} else {
  const pkg=JSON.parse(fs.readFileSync(path.join(target,'package.json'),'utf8'));
  if(!({...pkg.dependencies,...pkg.devDependencies}).remotion) throw new Error('Expected an existing Remotion project');
  add(path.join(root,'assets/runtime/public/score/demo'),path.join(target,'public/score/piano-remotion-demo'));
  const entry=fs.readFileSync(path.join(root,'assets/runtime/src/index.tsx'),'utf8').replaceAll('../public/score/demo/','../../public/score/piano-remotion-demo/').replaceAll("'./animations/score/","'../animations/score/").replaceAll('score/demo/','score/piano-remotion-demo/');
  plan.push([null,path.join(target,'src/piano-remotion-demo/index.tsx'),entry]);
}
add(path.join(root,'components'),path.join(target,'src/animations/score'));
// Preflight the entire plan before any writes. Identical files may be reused.
for(const [src,dst,content] of plan) {
  for(let parent=path.dirname(dst);;parent=path.dirname(parent)) {
    if(fs.existsSync(parent)&&!fs.statSync(parent).isDirectory())throw new Error(`Parent path is not a directory: ${parent}. Nothing installed.`);
    if(parent===path.dirname(parent))break;
  }
  if(fs.existsSync(dst)&&(!fs.statSync(dst).isFile()||!fs.readFileSync(dst).equals(src?fs.readFileSync(src):Buffer.from(content)))) throw new Error(`Existing file differs: ${dst}. Nothing installed.`);
}
for(const [src,dst,content] of plan) {fs.mkdirSync(path.dirname(dst),{recursive:true});if(!fs.existsSync(dst)) src?fs.copyFileSync(src,dst,fs.constants.COPYFILE_EXCL):fs.writeFileSync(dst,content,{flag:'wx'});}
console.log(JSON.stringify({installed:target,mode,files:plan.length,entry:mode==='--standalone'?'src/index.tsx':'src/piano-remotion-demo/index.tsx',note:'Original entry, dependencies and animation indexes are unchanged. For library discovery append the exported components to your existing INDEX.md/index.ts; never replace either file.'},null,2));
