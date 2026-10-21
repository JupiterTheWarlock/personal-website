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
for(const file of ['app.js','styles.css','favicon.svg','recreate-prompt.zh-CN.txt','data/games.json','data/library.json','data/styles.json','social/atlas.png']){
  const target=path.join(output,file);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(source,file),target);
}
const assets=new Set(games.flatMap(game=>game.screenshots.flatMap(shot=>[shot.src,shot.thumb])));
for(const asset of assets){
  const relative=asset.replace(/^\//,'');
  if(!relative.startsWith('media/')||relative.includes('..'))throw new Error('Invalid asset path');
  const target=path.join(output,relative);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(source,relative),target);
}
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const origin='https://jupiterthewarlock.com';
const description='从熟悉的游戏出发，用真实游戏画面整理像素、绘画、图形与三维美术风格。';
const defaultCover={src:'/social/atlas.png',alt:'游戏美术图鉴的风格画廊与游戏画面'};
const coverFor=(game,index=game?.coverIndex)=>game?.screenshots[index]??game?.screenshots[0]??defaultCover;
const routes=[
  ['', '游戏美术图鉴', description, defaultCover],
  ['games/', '游戏索引 · 游戏美术图鉴', description, defaultCover],
  ['about/', '关于图鉴 · 游戏美术图鉴', description, defaultCover],
  ...data.styles.map(s=>[`styles/${s.id}/`,`${s.name} · 游戏美术图鉴`,s.description,coverFor(games.find(g=>g.id===s.coverGame),s.coverIndex)]),
  ...games.map(g=>[`games/${g.id}/`,`${g.name} · 游戏美术图鉴`,g.visualNote||description,coverFor(g)]),
];
for(const [route,title,summary,cover] of routes){
  const target=path.join(output,route,'index.html');
  await mkdir(path.dirname(target),{recursive:true});
  const url=`${origin}${base}${route}`;
  const image=`${origin}${base}${cover.src.replace(/^\//,'')}`;
  const meta=[
    `<link rel="canonical" href="${escape(url)}">`,
    ['property','og:type','website'],['property','og:site_name','游戏美术图鉴'],
    ['property','og:title',title],['property','og:description',summary],
    ['property','og:url',url],['property','og:locale','zh_CN'],
    ['property','og:image',image],['property','og:image:type',cover===defaultCover?'image/png':'image/jpeg'],['property','og:image:alt',cover.alt],
    ['name','twitter:card','summary_large_image'],['name','twitter:title',title],
    ['name','twitter:description',summary],['name','twitter:image',image],['name','twitter:image:alt',cover.alt],
  ].map(tag=>typeof tag==='string'?tag:`<meta ${tag[0]}="${tag[1]}" content="${escape(tag[2])}">`).join('\n  ');
  const html=template
    .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(summary)}">`)
    .replace('<title>游戏美术图鉴</title>',`<title>${escape(title)}</title>\n  ${meta}`);
  await writeFile(target,html);
}
await writeFile(path.join(output,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(([route])=>`<url><loc>https://jupiterthewarlock.com${base}${route}</loc></url>`).join('')}</urlset>`);
await writeFile(path.join(output,'manifest.json'),JSON.stringify({version:3,base,styles:data.styles.length,games:library.length,images:games.reduce((sum,g)=>sum+g.screenshots.length,0)},null,2));
console.log(JSON.stringify({output,base,routes:routes.length,assets:assets.size,games:games.length}));
