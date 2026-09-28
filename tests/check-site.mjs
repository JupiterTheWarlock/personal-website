import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const baseUrl = new URL(process.env.TEST_BASE_URL || 'http://localhost:3456');
// Next.js 14 normalizes loopback IPs to localhost in middleware redirects.
// Start local checks on that same host so language cookies remain available.
if (['127.0.0.1', '[::1]'].includes(baseUrl.hostname)) baseUrl.hostname = 'localhost';
const base = baseUrl.origin;
const locales = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'es-ES', 'pt-BR'];
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

async function redirect(path, headers, expected) {
  const response = await fetch(`${base}${path}`, { headers, redirect: 'manual' });
  assert.equal(response.status, 307, path);
  const url = new URL(response.headers.get('location'), base);
  assert.equal(url.host, new URL(base).host, 'language redirects must preserve the requested host');
  assert.equal(`${url.pathname}${url.search}`, expected);
  assert.match(response.headers.get('cache-control'), /no-store/);
}

for (const [country, locale] of Object.entries({ CN:'zh-CN', TW:'zh-TW', JP:'ja-JP', KR:'ko-KR', US:'en-US', DE:'de-DE', FR:'fr-FR', ES:'es-ES', BR:'pt-BR' })) {
  await redirect('/?source=test', { 'x-vercel-ip-country':country, 'accept-language':'en' }, `/${locale}/?source=test`);
}
await redirect('/', { cookie:'NEXT_LOCALE=de-DE', 'x-vercel-ip-country':'CN' }, '/de-DE/');
await redirect('/', { 'accept-language':'ru,ja;q=0.9,en;q=0.5' }, '/ja-JP/');
await redirect('/', { 'accept-language':'ru' }, '/en-US/');
await redirect('/animations/?source=test', { cookie:'NEXT_LOCALE=fr-FR' }, '/fr-FR/animations/?source=test');
await redirect('/personal-website/', { cookie:'NEXT_LOCALE=ko-KR' }, '/ko-KR/');
await redirect('/zh-Hant/', {}, '/zh-TW/');

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
  assert.equal([...select.matchAll(/<option\b/g)].length, 9);
  assert.match(select, new RegExp(`<option[^>]*value="${locale}"[^>]*selected=""`));
  assert.ok(!html.includes('language-button'));
  assert.ok(!html.includes('thejunkyardoftheend'));
  for (const card of Object.values(messages.content)) {
    assert.ok(html.includes(`<strong>${escape(card.title)}</strong>`), `${locale}: ${card.title}`);
  }
  const notes = html.match(/<section id="notes"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(notes.includes('2100813911104872633?s=20') && notes.includes('2064052795721085254?s=20'));
  assert.ok(!notes.includes('blog.jthewl.cc'));
  assert.ok(html.includes(`href="https://www.jthewl.cc/${locale}/"`));
  assert.equal([...html.matchAll(/hrefLang="/g)].length, 10);
  const animation = await fetch(`${base}/${locale}/animations/`);
  assert.equal(animation.status, 200);
  assert.ok((await animation.text()).includes(escape(messages.animations.title)));
  console.log(`${locale}: localized page, content, dropdown, metadata and subpage passed`);
}

assert.equal((await fetch(`${base}/xx-XX/`)).status, 404);
assert.equal((await fetch(`${base}/junkyard-scene/host.js`)).status, 200);
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
for (const locale of locales) assert.ok(sitemap.includes(`https://www.jthewl.cc/${locale}/`));
console.log('Region, saved preference, browser fallback, legacy paths, 404 and asset checks passed.');
