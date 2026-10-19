import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { parseArgs, parseEnv } from 'node:util';
import { gzipSync, gunzipSync } from 'node:zlib';
import { S3Client, GetBucketCorsCommand, PutBucketCorsCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { proxyAgent, getAsset } from './lib/asset-http.mjs';
import { GAME, makeManifest, validateManifest, assetUrl, assetMetadata, sha256 } from './lib/unity-assets.mjs';

const { positionals, values } = parseArgs({ allowPositionals: true, options: { 'env-file': { type: 'string' }, version: { type: 'string', default: '0.3.6' } } });
const [command, source, manifestFile] = positionals;
const env = { ...(values['env-file'] ? parseEnv(await readFile(values['env-file'], 'utf8')) : {}), ...process.env };
const publicUrl = env.R2_PUBLIC_URL;
if (!publicUrl || new URL(publicUrl).protocol !== 'https:') throw new Error('Set R2_PUBLIC_URL to the existing HTTPS CDN');

async function save(file, value) {
  if (!file) throw new Error('Output manifest path is required');
  await mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2) + '\n');
}

function connection() {
  for (const key of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY', 'R2_SECRET_KEY', 'R2_BUCKET']) if (!env[key]) throw new Error(`Missing ${key}`);
  return new S3Client({ region: 'auto', endpoint: env.R2_ENDPOINT || `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: env.R2_ACCESS_KEY, secretAccessKey: env.R2_SECRET_KEY }, requestHandler: new NodeHttpHandler({ httpsAgent: proxyAgent(), connectionTimeout: 15000, requestTimeout: 120000, throwOnRequestTimeout: true }), requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED', maxAttempts: 2 });
}

const origins = ['https://jupiterthewarlock.com', 'https://www.jupiterthewarlock.com', 'https://jupiterthewarlock.pages.dev', 'http://localhost:3456', 'http://127.0.0.1:3456', 'http://localhost:8096', 'http://127.0.0.1:8096'];
const corsRule = { ID: 'personal-site-unity', AllowedOrigins: origins, AllowedMethods: ['GET', 'HEAD'], AllowedHeaders: ['Range'], ExposeHeaders: ['Content-Length', 'Content-Encoding', 'Content-Type', 'ETag', 'Accept-Ranges', 'Content-Range', 'Last-Modified'], MaxAgeSeconds: 3600 };

if (command === 'plan') {
  if (!source || !manifestFile) throw new Error('Usage: plan <verified-build-directory> <manifest.json> --env-file <path>');
  const manifest = await makeManifest(source, values.version, publicUrl);
  await save(manifestFile, manifest);
  console.log(JSON.stringify({ manifest: path.resolve(manifestFile), assetBase: manifest.assetBase, files: manifest.files.length, bytes: manifest.files.reduce((sum, f) => sum + f.bytes, 0), abovePagesLimit: manifest.files.filter(f => f.bytes > 25 * 1024 * 1024).map(f => f.path) }, null, 2));
} else if (command === 'cors') {
  const client = connection();
  try {
    let rules = [];
    try { rules = (await client.send(new GetBucketCorsCommand({ Bucket: env.R2_BUCKET }))).CORSRules || []; }
    catch (error) { if (error.name !== 'NoSuchCORSConfiguration') throw error; }
    // Place exact site origins first, keeping all unrelated bucket rules.
    const desired = [corsRule, ...rules.filter(rule => rule.ID !== corsRule.ID)];
    if (JSON.stringify(rules) !== JSON.stringify(desired)) await client.send(new PutBucketCorsCommand({ Bucket: env.R2_BUCKET, CORSConfiguration: { CORSRules: desired } }));
    const actual = (await client.send(new GetBucketCorsCommand({ Bucket: env.R2_BUCKET }))).CORSRules;
    const rule = actual.find(rule => rule.ID === corsRule.ID);
    if (!rule || !origins.every(origin => rule.AllowedOrigins.includes(origin))) throw new Error('CORS readback did not match');
    console.log(JSON.stringify({ bucket: env.R2_BUCKET, rule, preservedOtherRules: actual.length - 1 }, null, 2));
  } finally { client.destroy(); }
} else if (command === 'upload') {
  if (!source || !manifestFile) throw new Error('Usage: upload <verified-build-directory> <manifest.json> --env-file <path>');
  const manifest = validateManifest(JSON.parse(await readFile(manifestFile, 'utf8')));
  const current = await makeManifest(source, manifest.version, publicUrl);
  if (JSON.stringify(current) !== JSON.stringify(manifest)) throw new Error('Build changed after planning; no files uploaded');
  const client = connection();
  try {
    for (const file of manifest.files) {
      const Key = `${manifest.prefix}/${file.path}`;
      let existing;
      try { existing = await client.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key })); }
      catch (error) { if (error.$metadata?.httpStatusCode !== 404) throw error; }
      if (existing) {
        if (existing.Metadata?.sha256 !== file.sha256 || existing.ContentLength !== file.bytes || existing.ContentType !== file.contentType || existing.ContentEncoding !== file.contentEncoding || existing.CacheControl !== file.cacheControl) throw new Error(`Immutable object mismatch: ${Key}`);
        console.log(`Already uploaded: ${file.path}`);
        continue;
      }
      await client.send(new PutObjectCommand({ Bucket: env.R2_BUCKET, Key, Body: createReadStream(path.join(source, ...file.path.split('/'))), ContentLength: file.bytes, ContentType: file.contentType, ContentEncoding: file.contentEncoding, CacheControl: file.cacheControl, Metadata: { sha256: file.sha256 }, IfNoneMatch: '*' }));
      const stored = await client.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key }));
      if (stored.ContentLength !== file.bytes || stored.Metadata?.sha256 !== file.sha256 || stored.ContentType !== file.contentType || stored.ContentEncoding !== file.contentEncoding) throw new Error(`Uploaded metadata mismatch: ${file.path}`);
      console.log(`Uploaded: ${file.path} (${file.bytes} bytes)`);
    }
    console.log('Upload complete. Verify the CDN and browser before copying the manifest to config/aaa-sewer-king.release.json.');
  } finally { client.destroy(); }
} else if (command === 'probe') {
  const client = connection();
  const samples = { 'data': Buffer.from('Unity R2 gzip and CORS verification\n'), 'js': Buffer.from('globalThis.unityR2Probe=true;\n'), 'wasm': Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]) };
  const results = [];
  try {
    for (const [extension, bytes] of Object.entries(samples)) {
      const body = gzipSync(bytes);
      const key = `games/${GAME}/checks/${sha256(body)}.${extension}.gz`;
      const metadata = assetMetadata(key);
      await client.send(new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, Body: body, ContentLength: body.length, ContentType: metadata.contentType, ContentEncoding: 'gzip', CacheControl: metadata.cacheControl, Metadata: { sha256: sha256(body) } }));
      const response = await getAsset(assetUrl(publicUrl, key), { Origin: origins[0] }, 4096);
      if (response.status !== 200 || response.headers['content-type']?.split(';')[0] !== metadata.contentType || response.headers['content-encoding'] !== 'gzip' || ![origins[0], '*'].includes(response.headers['access-control-allow-origin']) || !gunzipSync(response.body).equals(bytes)) throw new Error(`CDN gzip/CORS probe failed: ${key}`);
      results.push({ url: assetUrl(publicUrl, key), contentType: response.headers['content-type'], encoding: response.headers['content-encoding'], cors: response.headers['access-control-allow-origin'], expose: response.headers['access-control-expose-headers'], cache: response.headers['cache-control'], compressedBytes: body.length, decodedBytes: bytes.length });
    }
    if (source) await save(source, results);
    console.log(JSON.stringify(results, null, 2));
  } finally { client.destroy(); }
} else {
  throw new Error('Commands: plan <build> <manifest>, cors, probe [report.json], upload <build> <manifest>. All accept --env-file <local R2 config>.');
}
