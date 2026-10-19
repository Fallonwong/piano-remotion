import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export function isMain(url){
  try {const a=fs.realpathSync(process.argv[1]??''),b=fs.realpathSync(fileURLToPath(url));return process.platform==='win32'?a.toLowerCase()===b.toLowerCase():a===b;}catch{return false;}
}
