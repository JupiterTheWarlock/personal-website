import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';
import { createGunzip } from 'node:zlib';

export const GAME = 'aaa-sewer-king';
export const PLAY_PATH = `/games/${GAME}/play/`;
export const CACHE = 'public, max-age=31536000, immutable';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function safePath(value) {
  if (!value || value.includes('\\') || value.split('/').some(p => !p || p === '.' || p === '..') || /[\x00-\x1f:#?]/.test(value)) {
    throw new Error(`Invalid asset path: ${value}`);
  }
  return value;
}

export function assetMetadata(filename) {
  const gzip = filename.endsWith('.gz');
  const extension = path.posix.extname(gzip ? filename.slice(0, -3) : filename).toLowerCase();
  const types = { '.wasm': 'application/wasm', '.data': 'application/octet-stream', '.js': 'application/javascript', '.json': 'application/json', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
  if (gzip && !['.wasm', '.data', '.js', '.json'].includes(extension)) throw new Error(`Unknown compressed asset: ${filename}`);
  return { contentType: types[extension] || 'application/octet-stream', ...(gzip ? { contentEncoding: 'gzip' } : {}), cacheControl: CACHE };
}

export function assetUrl(base, filename) {
  return `${base.replace(/\/$/, '')}/${safePath(filename).split('/').map(encodeURIComponent).join('/')}`;
}

export function wireShell(html, manifest) {
  if (!html.includes('createUnityInstance') || !/autoSyncPersistentDataPath\s*:\s*true/.test(html) || !/name=["']robots["'][^>]*content=["']noindex["']/.test(html)) {
    throw new Error('Unity shell must contain createUnityInstance, noindex and persistent data sync');
  }
  if (html.includes('{{{') || /^\s*#(?:if|endif)/m.test(html)) throw new Error('Unbuilt Unity template is not a release');
  if (/\bworkerUrl\s*:/.test(html)) throw new Error('Threaded builds require a separate COOP/COEP and worker URL review before release');
  const files = new Set(manifest.files.map(f => safePath(f.path)));
  let loader = false;
  const result = html.replace(/(["'])((?:Build|StreamingAssets|TemplateData)(?:\/[^"'<>]*)?)\1/g, (match, quote, filename) => {
    if (filename !== 'StreamingAssets' && !files.has(filename)) throw new Error(`Shell references missing asset: ${filename}`);
    if (/\.loader\.js$/.test(filename)) loader = true;
    return quote + assetUrl(manifest.assetBase, filename) + quote;
  });
  if (!loader) throw new Error('Unity loader reference was not found');
  for (const key of ['dataUrl', 'frameworkUrl', 'codeUrl']) {
    if (!new RegExp(key + '\\s*:\\s*["\']https://').test(result)) throw new Error(`Missing CDN URL: ${key}`);
  }
  return result;
}

export async function makeManifest(source, version, publicUrl) {
  if (!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(version)) throw new Error('Invalid release version');
  if (new URL(publicUrl).protocol !== 'https:') throw new Error('CDN must use HTTPS');
  const root = path.resolve(source);
  const files = [];
  async function scan(dir, prefix = '') {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const relative = safePath(prefix + entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symlinks are not allowed: ${relative}`);
      if (entry.isDirectory()) { await scan(path.join(dir, entry.name), relative + '/'); continue; }
      if (!entry.isFile()) throw new Error(`Unexpected entry: ${relative}`);
      if (relative !== 'index.html' && !/^(Build|StreamingAssets|TemplateData)\//.test(relative)) throw new Error(`Unexpected release file: ${relative}`);
      const absolute = path.join(root, ...relative.split('/'));
      const hash = createHash('sha256');
      for await (const chunk of createReadStream(absolute)) hash.update(chunk);
      if (relative.endsWith('.gz')) await pipeline(createReadStream(absolute), createGunzip(), new Writable({ write(chunk, encoding, done) { done(); } }));
      const stat = await lstat(absolute);
      files.push({ path: relative, bytes: stat.size, sha256: hash.digest('hex'), ...assetMetadata(relative) });
    }
  }
  await scan(root);
  const digest = sha256(JSON.stringify({ version, files }));
  const prefix = `games/${GAME}/releases/${version}-${digest.slice(0, 20)}`;
  const manifest = { schema: 1, game: GAME, version, digest, prefix, assetBase: `${publicUrl.replace(/\/$/, '')}/${prefix}`, playPath: PLAY_PATH, files };
  const shell = await readFile(path.join(root, 'index.html'), 'utf8');
  wireShell(shell, manifest);
  return manifest;
}

export function validateManifest(manifest) {
  if (manifest.schema !== 1 || manifest.game !== GAME || manifest.playPath !== PLAY_PATH || !Array.isArray(manifest.files)) throw new Error('Invalid Unity release manifest');
  if (sha256(JSON.stringify({ version: manifest.version, files: manifest.files })) !== manifest.digest) throw new Error('Manifest digest mismatch');
  const expected = `games/${GAME}/releases/${manifest.version}-${manifest.digest.slice(0, 20)}`;
  if (manifest.prefix !== expected || !manifest.assetBase.endsWith('/' + expected) || new URL(manifest.assetBase).protocol !== 'https:') throw new Error('Invalid CDN release prefix');
  for (const file of manifest.files) {
    safePath(file.path);
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 0 || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error('Invalid file size or hash');
  }
  return manifest;
}
