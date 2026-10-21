import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const baseUrl = new URL(process.env.TEST_BASE_URL || 'http://localhost:3456');
// Use the same host throughout the preview so language cookies remain available.
if (['127.0.0.1', '[::1]'].includes(baseUrl.hostname)) baseUrl.hostname = 'localhost';
const base = baseUrl.origin;
const locales = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'];
const canonicalOrigin = 'https://jupiterthewarlock.com';
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

async function redirect(path, headers, expected) {
  const response = await fetch(`${base}${path}`, { headers, redirect: 'manual' });
  assert.equal(response.status, 307, path);
  const url = new URL(response.headers.get('location'), base);
  assert.equal(url.host, new URL(base).host, 'language redirects must preserve the requested host');
  assert.equal(`${url.pathname}${url.search}`, expected);
  assert.match(response.headers.get('cache-control'), /no-store/);
}

// Country and Accept-Language fallback are tested with real Pages context objects in
// i18n.test.cjs. The live platform supplies trusted request.cf data, not a spoofable header.
for (const locale of locales) {
  await redirect('/?source=test', { cookie:`NEXT_LOCALE=${locale}`, 'accept-language':'en' }, `/${locale}/?source=test`);
}
await redirect('/', { cookie:'NEXT_LOCALE=zh-TW', 'x-vercel-ip-country':'CN' }, '/zh-TW/');
await redirect('/animations/?source=test', { cookie:'NEXT_LOCALE=ja-JP' }, '/ja-JP/animations/?source=test');
await redirect('/personal-website/', { cookie:'NEXT_LOCALE=en-US' }, '/en-US/');
await redirect('/zh-Hant/', {}, '/zh-TW/');
await redirect('/personal-website/ja-JP/animations/?ref=legacy', {}, '/ja-JP/animations/?ref=legacy');
await redirect('/personal-website/images/notes/ai-game-music.jpg', {}, '/images/notes/ai-game-music.jpg');

for (const locale of locales) {
  const response = await fetch(`${base}/${locale}/`, { headers:{ cookie:'NEXT_LOCALE=fr-FR', 'x-vercel-ip-country':'CN' } });
  assert.equal(response.status, 200, locale);
  assert.equal(new URL(response.url).pathname, `/${locale}/`, 'explicit URL must win');
  const html = await response.text();
  const messages = JSON.parse(await readFile(new URL(`../app/i18n/messages/${locale}.json`, import.meta.url), 'utf8'));
  assert.ok(html.includes(`<html lang="${locale}">`), `${locale}: HTML language`);
  assert.ok(html.includes(`<title>${escape(messages.meta.title)}</title>`), `${locale}: metadata`);
  const select = html.match(/<select\b[^>]*class="language-select"[^>]*>([\s\S]*?)<\/select>/)?.[1];
  assert.ok(select, `${locale}: real language dropdown`);
  assert.equal([...select.matchAll(/<option\b/g)].length, locales.length);
  assert.match(select, new RegExp(`<option[^>]*value="${locale}"[^>]*selected=""`));
  assert.ok(!html.includes('language-button'));
  assert.ok(!html.includes('thejunkyardoftheend'));
  for (const [id, card] of Object.entries(messages.content)) {
    // Tool links render only after opening the menu; this checks static page cards.
    if (['pixel-cosmos-studio', 'game-art-style', 'spotlight-gamejam-2026'].includes(id)) continue;
    assert.ok(html.includes(`<strong>${escape(card.title)}</strong>`), `${locale}: ${card.title}`);
  }
  const head = html.split('</head>')[0];
  assert.ok(head.includes('name="twitter:card" content="summary_large_image"'));
  const imageUrl = `${canonicalOrigin}/images/social/home-card-en.png`;
  assert.ok(head.includes(`property="og:image" content="${imageUrl}"`));
  assert.ok(head.includes(`name="twitter:image" content="${imageUrl}"`));
  const image = await fetch(`${base}/images/social/home-card-en.png`, { headers: { 'user-agent': 'Twitterbot/1.0' } });
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type'), /image\/png/);
  const notes = html.match(/<section id="notes"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(notes.includes('2100813911104872633?s=20') && notes.includes('2064052795721085254?s=20'));
  assert.ok(!notes.includes('blog.jthewl.cc') && !notes.includes('blog.jupiterthewarlock.com'));
  assert.ok(html.includes(`rel="canonical" href="${canonicalOrigin}/${locale}/"`));
  assert.equal([...html.matchAll(/hrefLang="/g)].length, locales.length + 1);
  const animation = await fetch(`${base}/${locale}/animations/`);
  assert.equal(animation.status, 200);
  assert.ok((await animation.text()).includes(escape(messages.animations.title)));
  const gameTarget = `https://games.jupiterthewarlock.com/aaa-sewer-king/?lang=${locale}`;
  assert.ok(html.includes(`href="${gameTarget}"`));
  const game = await fetch(`${base}/${locale}/games/aaa-sewer-king/`, { redirect: 'manual' });
  assert.equal(game.status, 301);
  assert.equal(game.headers.get('location'), gameTarget);
  console.log(`${locale}: localized page, content, dropdown, metadata and subpage passed`);
}

assert.equal((await fetch(`${base}/xx-XX/`)).status, 404);
assert.equal((await fetch(`${base}/junkyard-scene/host.js`)).status, 200);
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
for (const locale of locales) assert.ok(sitemap.includes(`${canonicalOrigin}/${locale}/`));
assert.ok(!sitemap.includes('/games/aaa-sewer-king/'));
assert.ok(!sitemap.includes('/play/'));
const runtime = await fetch(`${base}/games/aaa-sewer-king/play/`);
assert.equal(runtime.status, 200);
assert.match(runtime.headers.get('cache-control'), /no-cache/);
const runtimeHtml = await runtime.text();
assert.ok(runtimeHtml.includes('content="noindex"'));
assert.ok(runtimeHtml.includes('autoSyncPersistentDataPath:true'));
assert.ok(runtimeHtml.includes('https://cfr2cdn.jthewl.cc/games/aaa-sewer-king/releases/0.3.6-'));
assert.ok(!runtimeHtml.includes('data-jthewl-scene'));
const robots = await (await fetch(`${base}/robots.txt`)).text();
assert.ok(robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`));
console.log('Saved preferences, legacy paths, 404, assets and static SEO files passed on Pages.');
