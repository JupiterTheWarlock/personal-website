import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256, assetUrl, validateManifest, wireShell, PLAY_PATH } from './lib/unity-assets.mjs';
import { getAsset } from './lib/asset-http.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifestFile = path.join(root, 'config/aaa-sewer-king.release.json');
let manifest;
try { manifest = validateManifest(JSON.parse(await readFile(manifestFile, 'utf8'))); }
catch (error) { if (error.code === 'ENOENT') process.exit(0); throw error; }
const shell = manifest.files.find(file => file.path === 'index.html');
if (!shell || shell.bytes > 25 * 1024 * 1024) throw new Error('Invalid Pages runtime shell');
const response = await getAsset(assetUrl(manifest.assetBase, shell.path), {}, shell.bytes + 1);
if (response.status !== 200 || response.body.length !== shell.bytes || sha256(response.body) !== shell.sha256) throw new Error('CDN shell does not match the approved release');
const html = wireShell(response.body.toString('utf8'), manifest);
const destination = path.join(root, 'out', PLAY_PATH.slice(1));
await mkdir(destination, { recursive: true });
await writeFile(path.join(destination, 'index.html'), html);
console.log(`Prepared ${manifest.game} ${manifest.version} at ${PLAY_PATH}`);
