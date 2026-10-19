import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {failure} from './audio.mjs';
export function executeLogged(executable,args,{cwd,log,timeout=600000}={}){
  const start=new Date().toISOString();
  const r=spawnSync(executable,args,{cwd,encoding:'utf8',timeout,windowsHide:true,maxBuffer:32*1024*1024});
  const record={executable,args,cwd,startedAt:start,endedAt:new Date().toISOString(),exitCode:r.status,error:r.error?.message??null,stdout:r.stdout??'',stderr:r.stderr??''};
  if(log){fs.mkdirSync(path.dirname(path.resolve(log)),{recursive:true});fs.writeFileSync(log,JSON.stringify(record,null,2)+'\n',{flag:'wx'});}
  if(r.error||r.status!==0)throw failure('TOOL_EXECUTION_FAILED',`${executable}: ${r.error?.message??r.stderr?.slice(-1200)??r.status}`,`Inspect ${log??'tool output'}. Do not suppress errors or repeat the same failed path more than twice.`);
  return record;
}
