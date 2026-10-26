import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { access } from 'node:fs/promises';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = process.env.ART_INSPIRATION_SOURCE_PATH || path.resolve(root, '../../../ArtInspirationAtlas');
const builder = path.join(source, 'scripts/integrate.mjs');
try { await access(builder); } catch { throw new Error('找不到 ArtInspirationAtlas；请设置 ART_INSPIRATION_SOURCE_PATH 指向图鉴源码及媒体目录。'); }
execFileSync(process.execPath, [builder, path.join(root, 'out'), 'https://jupiterthewarlock.com'], { stdio: 'inherit', windowsHide: true });
