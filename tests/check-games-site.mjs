import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8096';
const origin = 'https://games.jupiterthewarlock.com';
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
for (const locale of ['zh-CN','zh-TW','en-US','ja-JP']) {
  const copy = JSON.parse(await readFile(new URL(`../app/i18n/messages/${locale}.json`, import.meta.url), 'utf8'));
  for (const path of ['/', '/aaa-sewer-king/']) {
    const response = await fetch(`${base}${path}?lang=${locale}`, { redirect: 'manual', headers: { Cookie: 'NEXT_LOCALE=invalid' } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control'), /private.*no-store/);
    assert.equal(response.headers.get('content-language'), locale);
    const html = await response.text();
    const head = html.split('</head>')[0];
    assert.ok(head.includes('name="twitter:card" content="summary_large_image"'));
    const imageUrl = `${origin}/images/games/aaa-sewer-king-promo${locale === 'zh-CN' ? '-zh-CN' : ''}.jpg`;
    assert.ok(head.includes(`property="og:image" content="${imageUrl}"`));
    assert.ok(head.includes(`name="twitter:image" content="${imageUrl}"`));
    assert.ok(html.includes(`<html lang="${locale}">`));
    assert.ok(html.includes(escape(copy.sewerKing.title)));
    assert.ok(html.includes(`rel="canonical" href="${origin}${path}?lang=${locale}"`));
    assert.ok(html.includes('class="language-select"'));
    assert.ok(!html.includes('data-jthewl-scene') && !html.includes('data-unity-game='));
    assert.ok(!html.includes('href="https://jupiterthewarlock.com') && !html.includes('href="https://blog.') && !html.includes('href="https://stars.'));
    assert.ok(!html.includes('#contact') && !html.includes('#notes'));
    if (path !== '/') for (const key of ['tagline','description','desktopCombat','touchControls','beginnerNote','saveNote']) assert.ok(html.includes(escape(copy.sewerKing[key])), `${locale}: ${key}`);
  }
  console.log(`${locale}: short route, game-only home, copy, language selector and canonical passed`);
}
const preferred = await fetch(`${base}/aaa-sewer-king/`, { headers: { Cookie: 'NEXT_LOCALE=ja-JP' }, redirect: 'manual' });
assert.equal(preferred.status, 200);
assert.equal(preferred.headers.get('content-language'), 'ja-JP');
for (const path of ['/personal-website/', '/zh-CN/', '/animations/', '/notes/', '/unknown-game/']) assert.equal((await fetch(`${base}${path}`, { redirect:'manual' })).status, 404, path);
const index = await fetch(`${base}/aaa-sewer-king/play/index.html?ref=share`, { redirect: 'manual' });
assert.equal(index.status, 308);
assert.equal(new URL(index.headers.get('location')).pathname, '/aaa-sewer-king/play/');
assert.equal(new URL(index.headers.get('location')).search, '?ref=share');
const runtime = await fetch(`${base}/aaa-sewer-king/play/`);
assert.equal(runtime.status, 200);
assert.match(runtime.headers.get('cache-control'), /no-cache/);
const shell = await runtime.text();
assert.ok(shell.includes('content="noindex"') && shell.includes('autoSyncPersistentDataPath:true'));
assert.ok(shell.includes('https://cfr2cdn.jthewl.cc/games/aaa-sewer-king/releases/0.3.6-'));
for (const filename of ['aaa-sewer-king-promo-zh-CN.jpg', 'aaa-sewer-king-promo.jpg', 'aaa-sewer-king-icon.png']) assert.equal((await fetch(`${base}/images/games/${filename}`)).status, 200);
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
assert.ok(sitemap.includes(origin) && !sitemap.includes('/play/') && !sitemap.includes('https://jupiterthewarlock.com'));
console.log('Unknown routes, fixed runtime, noindex/cache, images and game-only sitemap passed');
