import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { gzipSync } from 'node:zlib';
import { makeManifest, validateManifest, wireShell, safePath, assetMetadata, PLAY_PATH } from '../scripts/lib/unity-assets.mjs';

async function fixture(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'unity-release-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'Build'));
  await writeFile(path.join(dir, 'Build/test.loader.js'), '/* test fixture */');
  for (const ext of ['data', 'js', 'wasm']) await writeFile(path.join(dir, `Build/hash.${ext}.gz`), gzipSync(Buffer.from(`test ${ext}`)));
  const html = `<meta name="robots" content="noindex"><script src="Build/test.loader.js"></script><script>
    const config={dataUrl:'Build/hash.data.gz',frameworkUrl:'Build/hash.js.gz',codeUrl:'Build/hash.wasm.gz',streamingAssetsUrl:'StreamingAssets',autoSyncPersistentDataPath:true};
    createUnityInstance(canvas,config);window.parent.postMessage({type:'aaa-sewer-king:ready',game:'aaa-sewer-king'},location.origin);
  </script>`;
  await writeFile(path.join(dir, 'index.html'), html);
  return { dir, html };
}

test('wire loader, wasm, data and StreamingAssets to one immutable CDN release without changing runtime origin', async t => {
  const { dir, html } = await fixture(t);
  const manifest = await makeManifest(dir, '0.3.6', 'https://cdn.example.com');
  validateManifest(manifest);
  const wired = wireShell(html, manifest);
  assert.equal(manifest.playPath, PLAY_PATH);
  for (const name of ['test.loader.js', 'hash.data.gz', 'hash.js.gz', 'hash.wasm.gz']) assert.ok(wired.includes(manifest.assetBase+'/Build/'+name));
  assert.ok(wired.includes(manifest.assetBase+'/StreamingAssets'));
  assert.ok(wired.includes('location.origin'));
  assert.ok(wired.includes('autoSyncPersistentDataPath:true'));
  assert.equal(manifest.files.find(f => f.path.endsWith('.wasm.gz')).contentType, 'application/wasm');
  assert.equal(manifest.files.find(f => f.path.endsWith('.data.gz')).contentEncoding, 'gzip');
});

test('content changes create a new release prefix even with the same version', async t => {
  const { dir } = await fixture(t);
  const first = await makeManifest(dir, '0.3.6', 'https://cdn.example.com');
  await writeFile(path.join(dir, 'Build/hash.data.gz'), gzipSync(Buffer.from('changed')));
  const second = await makeManifest(dir, '0.3.6', 'https://cdn.example.com');
  assert.notEqual(first.prefix, second.prefix);
  assert.equal(first.playPath, second.playPath);
});

test('reject incomplete gzip, missing shell dependencies and threaded builds before upload', async t => {
  const { dir, html } = await fixture(t);
  const manifest = await makeManifest(dir, '0.3.6', 'https://cdn.example.com');
  assert.throws(() => wireShell(html.replace('Build/hash.data.gz', 'Build/missing.data.gz'), manifest), /missing asset/);
  assert.throws(() => wireShell(html.replace('const config={', "const config={workerUrl:'Build/worker.js',"), manifest), /Threaded builds/);
  await writeFile(path.join(dir, 'Build/hash.data.gz'), gzipSync(Buffer.from('truncated')).subarray(0, 12));
  await assert.rejects(makeManifest(dir, '0.3.6', 'https://cdn.example.com'));
});

test('reject changed manifests and unsafe object keys', async t => {
  const { dir } = await fixture(t);
  const manifest = await makeManifest(dir, '0.3.6', 'https://cdn.example.com');
  manifest.files[0].sha256 = '0'.repeat(64);
  assert.throws(() => validateManifest(manifest), /digest mismatch/);
  for (const key of ['../secret', 'Build/../../secret', '/etc/key', 'C:\\secret', 'Build/test?x=1']) assert.throws(() => safePath(key));
});

test('serve gzip with its inner MIME type and keep shell cache separate', async () => {
  assert.equal(assetMetadata('x.js.gz').contentType, 'application/javascript');
  assert.equal(assetMetadata('x.data.gz').contentType, 'application/octet-stream');
  assert.equal(assetMetadata('x.wasm.gz').contentType, 'application/wasm');
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const wildcard = headers.split('/games/aaa-sewer-king/play/*\n')[1].split('\n\n')[0];
  assert.ok(!wildcard.includes('Cache-Control'));
  assert.match(headers, /\/games\/aaa-sewer-king\/play\/\n  Cache-Control: no-cache/);
});
