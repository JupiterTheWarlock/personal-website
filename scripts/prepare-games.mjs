import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'games-site/out');
await mkdir(path.join(out, 'images/games'), { recursive: true });
for (const name of ['aaa-sewer-king-promo-zh-CN.jpg', 'aaa-sewer-king-promo.jpg', 'aaa-sewer-king-icon.png']) {
  await copyFile(path.join(root, 'public/images/games', name), path.join(out, 'images/games', name));
}
await build({ entryPoints: [path.join(root, 'games-site/worker.ts')], outfile: path.join(out, '_worker.js'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022' });
await writeFile(path.join(out, '_headers'), `/_next/static/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
await writeFile(path.join(out, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width"><title>404</title><body style="background:#18181B;color:#ECE8E1;font:18px system-ui;padding:3rem"><h1>404</h1><a href="/" style="color:#DA7756">Games</a></body></html>');
await writeFile(path.join(out, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://games.jupiterthewarlock.com/sitemap.xml\n');
const urls = ['/', '/aaa-sewer-king/'].flatMap(page => ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'].map(locale => `https://games.jupiterthewarlock.com${page}?lang=${locale}`));
await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`);
console.log('Prepared isolated games site: game catalog, four languages and short public routes.');
