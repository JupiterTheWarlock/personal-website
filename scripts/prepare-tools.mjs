import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {access,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const atlas = process.env.ATLAS_SOURCE_PATH
  ? path.resolve(process.env.ATLAS_SOURCE_PATH)
  : path.join(root, 'vendor/game-art-atlas');
const builder = path.join(atlas, 'scripts/build.mjs');
try { await access(builder); }
catch { throw new Error('找不到图鉴发布快照。请先运行 scripts/sync-atlas.mjs，或设置 ATLAS_SOURCE_PATH 指向 GameArtAtlas。'); }
if(!process.env.ATLAS_SOURCE_PATH){
  const snapshot=JSON.parse(await readFile(path.join(atlas,'snapshot.json'),'utf8'));
  for(const [file,expected] of Object.entries(snapshot.files)){
    const actual=createHash('sha256').update(await readFile(path.join(atlas,file))).digest('hex');
    if(actual!==expected)throw new Error(`图鉴发布快照已被修改，请从源项目重新同步：${file}`);
  }
}
execFileSync(process.execPath,[path.join(atlas,'scripts/prepare-assets.mjs')],{
  cwd:atlas,stdio:'inherit',windowsHide:true,
});
execFileSync(process.execPath, [builder, '--base', '/gameartstyle/', '--out', path.join(root, 'out/gameartstyle')], {
  cwd: atlas, stdio: 'inherit', windowsHide: true,
});
