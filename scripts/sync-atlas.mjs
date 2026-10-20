// Export only the public application inputs from a committed standalone atlas.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(process.env.ATLAS_SOURCE_PATH||path.join(root,'../../../GameArtAtlas'));
const destination=path.join(root,'vendor/game-art-atlas');
const git=(...args)=>execFileSync('git',['-c','core.fsmonitor=false','-C',source,...args],{encoding:'utf8',windowsHide:true}).trim();
if(git('status','--porcelain'))throw new Error('请先提交图鉴源码，再生成发布快照。');
const revision=git('rev-parse','HEAD');
const repository=git('remote','get-url','origin');
const files=[
  'package.json','scripts/build.mjs','scripts/prepare-assets.mjs',
  'public/index.html','public/app.js','public/styles.css','public/favicon.svg',
  'public/recreate-prompt.zh-CN.txt',
  'public/data/games.json','public/data/library.json','public/data/styles.json',
];
const hashes={};
for(const file of files){
  const buffer=execFileSync('git',['-C',source,'show',`${revision}:${file}`],{windowsHide:true,maxBuffer:8*1024*1024});
  hashes[file]=createHash('sha256').update(buffer).digest('hex');
  const target=path.join(destination,file);
  await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,buffer);
}
await writeFile(path.join(destination,'snapshot.json'),JSON.stringify({repository,revision,files:hashes},null,2)+'\n');
await writeFile(path.join(destination,'README.md'),'# 美术风格图鉴发布快照\n\n由 `scripts/sync-atlas.mjs` 从独立图鉴仓库的已提交版本生成。修改应先在源项目完成，再同步本目录。`snapshot.json` 固定版本与文件校验值。截图缓存不进 Git；构建时根据公开图片来源下载。不含 Steam 账户原始记录或本机操作接口。\n');
if(process.argv.includes('--with-assets')){
  const games=JSON.parse(await readFile(path.join(source,'public/data/games.json'),'utf8'));
  for(const uri of new Set(games.flatMap(game=>game.screenshots.flatMap(shot=>[shot.src,shot.thumb])))){
    if(!uri.startsWith('/media/')||uri.includes('..'))throw new Error('Invalid image path');
    const target=path.join(destination,'public',uri);
    await mkdir(path.dirname(target),{recursive:true});
    await copyFile(path.join(source,'public',uri),target);
  }
}
console.log(JSON.stringify({sourceRevision:revision,publicFiles:files.length,destination}));
