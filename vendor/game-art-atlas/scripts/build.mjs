import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const base=option('--base','/gameartstyle/');
if(!/^\/[a-z0-9/-]*\/$/.test(base))throw new Error('Base must be an absolute directory path');
const output=path.resolve(option('--out',path.join(root,'dist')));
const source=path.join(root,'public');
const [games,library,data]=await Promise.all(['games','library','styles'].map(async file=>JSON.parse(await readFile(path.join(source,'data',file+'.json'),'utf8'))));
const template=(await readFile(path.join(source,'index.html'),'utf8')).replace('<base href="/">',`<base href="${base}">`);
await mkdir(output,{recursive:true});
for(const file of ['app.js','styles.css','favicon.svg','recreate-prompt.zh-CN.txt','data/games.json','data/library.json','data/styles.json']){
  const target=path.join(output,file);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(source,file),target);
}
const assets=new Set(games.flatMap(game=>game.screenshots.flatMap(shot=>[shot.src,shot.thumb])));
for(const asset of assets){
  const relative=asset.replace(/^\//,'');
  if(!relative.startsWith('media/')||relative.includes('..'))throw new Error('Invalid asset path');
  const target=path.join(output,relative);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(source,relative),target);
}
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const routes=[['','游戏美术图鉴'],['games/','游戏索引 · 游戏美术图鉴'],['about/','关于图鉴 · 游戏美术图鉴'],...data.styles.map(s=>[`styles/${s.id}/`,`${s.name} · 游戏美术图鉴`]),...games.map(g=>[`games/${g.id}/`,`${g.name} · 游戏美术图鉴`])];
for(const [route,title] of routes){
  const target=path.join(output,route,'index.html');
  await mkdir(path.dirname(target),{recursive:true});
  const html=template.replace('<title>游戏美术图鉴</title>',`<title>${escape(title)}</title>\n  <link rel="canonical" href="https://jupiterthewarlock.com${base}${route}">`);
  await writeFile(target,html);
}
await writeFile(path.join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(([route])=>`<url><loc>https://jupiterthewarlock.com${base}${route}</loc></url>`).join('')}</urlset>`);
await writeFile(path.join(output,'manifest.json'),JSON.stringify({version:3,base,styles:data.styles.length,games:library.length,images:games.reduce((sum,g)=>sum+g.screenshots.length,0)},null,2));
console.log(JSON.stringify({output,base,routes:routes.length,assets:assets.size,games:games.length}));
