import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicRoot=path.join(root,'public');
const games=JSON.parse(await readFile(path.join(publicRoot,'data/games.json'),'utf8'));
const items=new Map();
for(const game of games)for(const shot of game.screenshots){
  items.set(shot.src,shot.originalUrl);
  items.set(shot.thumb,shot.thumbnailUrl||shot.originalUrl);
}
const jobs=[...items],failed=[];
let cursor=0,downloaded=0,cached=0;
const jpeg=buffer=>buffer.length>1000&&buffer[0]===0xff&&buffer[1]===0xd8;
async function prepare([uri,url]){
  if(!uri.startsWith('/media/')||uri.includes('..')||new URL(url).protocol!=='https:')throw new Error('Invalid public image reference');
  const target=path.resolve(publicRoot,'.'+uri);
  if(!target.startsWith(publicRoot+path.sep))throw new Error('Invalid image path');
  try{if(jpeg(await readFile(target))){cached++;return;}}catch(error){if(error.code!=='ENOENT')throw error;}
  for(let attempt=0;attempt<3;attempt++){
    try{
      const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const buffer=Buffer.from(await response.arrayBuffer());
      if(!jpeg(buffer))throw new Error('Expected a JPEG image');
      await mkdir(path.dirname(target),{recursive:true});
      await writeFile(target+'.partial',buffer);
      await rename(target+'.partial',target);
      downloaded++;return;
    }catch(error){
      if(attempt===2){failed.push({path:uri,error:error.message});return;}
      await new Promise(resolve=>setTimeout(resolve,600*(attempt+1)));
    }
  }
}
await Promise.all(Array.from({length:4},async()=>{
  while(cursor<jobs.length){const index=cursor++;await prepare(jobs[index]);}
}));
console.log(JSON.stringify({assets:jobs.length,cached,downloaded,failed}));
if(failed.length)process.exitCode=1;
