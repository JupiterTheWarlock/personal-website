const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const ts = require('typescript');

// Use the project's TypeScript compiler, without another test runner dependency.
const cache = new Map();
function loadTypeScript(filename) {
  filename = path.resolve(__dirname, '..', filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const nativeRequire = createRequire(filename);
  const requireLocal = (specifier) => {
    const target = path.resolve(path.dirname(filename), `${specifier}.ts`);
    return specifier.startsWith('.') && fs.existsSync(target)
      ? loadTypeScript(target) : nativeRequire(specifier);
  };
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  new Function('require', 'module', 'exports', outputText)(requireLocal, module, module.exports);
  return module.exports;
}

const { detectLocale, browserLocale, matchLanguage, localizedPath } = loadTypeScript('app/i18n/routing.ts');
const { locales } = loadTypeScript('app/i18n/config.ts');
const { dictionaries } = loadTypeScript('app/i18n/messages.ts');
const { games, tools, explorations, notes } = loadTypeScript('app/content/home.ts');
const { localizeCards, getHomeContent } = loadTypeScript('app/content/localized.ts');
const { languageRedirect } = loadTypeScript('app/i18n/request-routing.ts');
const { onRequest } = loadTypeScript('functions/_middleware.ts');
const { isUnityMessage } = loadTypeScript('lib/unity-message.ts');
const gamesWorker = loadTypeScript('games-site/worker.ts').default;

test('game host serves only game pages at short URLs and keeps locale choices private', async () => {
  const requested = [];
  const env = { ASSETS: { async fetch(request) { requested.push(new URL(request.url).pathname); return new Response('game page'); } } };
  for (const [path, cookie, expected] of [
    ['/aaa-sewer-king/?lang=ja-JP', 'NEXT_LOCALE=zh-CN', '/ja-JP/aaa-sewer-king/'],
    ['/', 'NEXT_LOCALE=zh-TW', '/zh-TW/'],
    ['/aaa-sewer-king/?lang=bad', 'NEXT_LOCALE=%broken', '/en-US/aaa-sewer-king/'],
  ]) {
    const response = await gamesWorker.fetch(new Request(`https://games.example${path}`, { headers: { cookie, 'accept-language':'en' } }), env);
    assert.equal(response.status, 200);
    assert.equal(requested.at(-1), expected);
    assert.match(response.headers.get('cache-control'), /private.*no-store/);
  }
  for (const path of ['/zh-CN/', '/animations/', '/personal-website/', '/notes/', '/not-a-game/']) {
    const response = await gamesWorker.fetch(new Request(`https://games.example${path}`), env);
    assert.equal(response.status, 404, path);
    assert.equal(requested.at(-1), '/404.html');
  }
  const response = await gamesWorker.fetch(new Request('https://games.example/aaa-sewer-king/play/index.html?from=share'), env);
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), 'https://games.example/aaa-sewer-king/play/?from=share');
});

test('Unity messages require both the runtime window and origin, and a known game event', () => {
  const frame = {};
  const event = { origin: 'https://jupiterthewarlock.com', source: frame, data: { game:'aaa-sewer-king', type:'aaa-sewer-king:closed' } };
  assert.equal(isUnityMessage(event, frame, event.origin), true);
  assert.equal(isUnityMessage({ ...event, source:{} }, frame, event.origin), false);
  assert.equal(isUnityMessage({ ...event, origin:'https://example.com' }, frame, event.origin), false);
  assert.equal(isUnityMessage({ ...event, data:null }, frame, event.origin), false);
  assert.equal(isUnityMessage({ ...event, data:{ ...event.data, game:'other' } }, frame, event.origin), false);
  assert.equal(isUnityMessage({ ...event, data:{ ...event.data, type:'unknown' } }, frame, event.origin), false);
  assert.equal(isUnityMessage(event, null, event.origin), false);
});

test('Pages redirects preserve host, query and private language preferences', async () => {
  const request = new Request('https://preview.pages.dev/?from=home', {
    headers: { cookie: 'other=1; NEXT_LOCALE=ja-JP', 'accept-language': 'en' },
  });
  Object.defineProperty(request, 'cf', { value: { country: 'CN' } });
  const response = await onRequest({ request, next() { assert.fail('must redirect'); } });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://preview.pages.dev/ja-JP/?from=home');
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
  assert.match(response.headers.get('vary'), /Cookie/);
  assert.match(response.headers.get('vary'), /Accept-Language/);
});

test('Pages uses trusted country metadata and safely ignores malformed saved preferences', async () => {
  for (const [country, locale] of Object.entries({ CN:'zh-CN', TW:'zh-TW', JP:'ja-JP', DE:'en-US' })) {
    const request = new Request('https://example.com/', {
      headers: { cookie: 'NEXT_LOCALE=%broken', 'accept-language': 'en', 'cf-ipcountry': 'TW' },
    });
    Object.defineProperty(request, 'cf', { value: { country } });
    const response = await onRequest({ request, next() { assert.fail('must redirect'); } });
    assert.equal(new URL(response.headers.get('location')).pathname, `/${locale}/`);
  }
  const response = languageRedirect(new Request('https://example.com/', { headers: { 'accept-language': 'ru,ja;q=0.8' } }));
  assert.equal(new URL(response.headers.get('location')).pathname, '/ja-JP/');
});

test('legacy and aliased routes retain their content path, query and fragment', () => {
  for (const [input, expected] of [
    ['/personal-website/zh-CN/animations/?x=1#demo', '/zh-CN/animations/?x=1#demo'],
    ['/zh-Hant/animations/', '/zh-TW/animations/'],
    ['/personal-website/images/notes/ai-game-music.jpg', '/images/notes/ai-game-music.jpg'],
    ['/games/aaa-sewer-king/?ref=home', '/en-US/games/aaa-sewer-king/?ref=home'],
  ]) {
    const response = languageRedirect(new Request(`https://example.com${input}`));
    assert.equal(response.headers.get('location'), `https://example.com${expected}`);
  }
});

test('explicit locales, Unity runtime and assets bypass language routing', async () => {
  const asset = new Response('asset', { headers: { 'content-type': 'application/wasm' } });
  for (const path of ['/zh-CN/', '/ja-JP/animations/', '/games/aaa-sewer-king/play/',
    '/games/aaa-sewer-king/play/index.html', '/games/aaa-sewer-king/play/Build/game.wasm',
    '/junkyard-scene/index.html', '/gameartstyle/', '/gameartstyle/styles/watercolor/', '/gameartstyle/data/games.json', '/sitemap.xml', '/xx-XX/']) {
    const request = new Request(`https://example.com${path}`, { headers: { cookie:'NEXT_LOCALE=zh-TW' } });
    assert.equal(await onRequest({ request, next: async () => asset }), asset, path);
  }
});

test('manual preference wins over region and browser; invalid cookies are ignored', () => {
  assert.equal(detectLocale({ saved: 'zh-TW', country: 'CN', acceptLanguage: 'ja' }), 'zh-TW');
  assert.equal(detectLocale({ saved: 'fr-FR', country: 'JP', acceptLanguage: 'en' }), 'ja-JP');
  assert.equal(detectLocale({ saved: '../../evil', country: 'JP', acceptLanguage: 'en' }), 'ja-JP');
});

test('regions cover all four languages and unknown regions use the browser', () => {
  for (const [country, locale] of Object.entries({ CN:'zh-CN', TW:'zh-TW', HK:'zh-TW', MO:'zh-TW', US:'en-US', JP:'ja-JP' })) {
    assert.equal(detectLocale({ country, acceptLanguage: 'en-US' }), locale, country);
  }
  assert.equal(detectLocale({ country: 'CA', acceptLanguage: 'fr-CA,ja;q=0.8' }), 'ja-JP');
  assert.equal(detectLocale({ country: 'KR', acceptLanguage: 'ko' }), 'en-US');
  assert.equal(detectLocale({ country: 'ZZ', acceptLanguage: 'ru' }), 'en-US');
  assert.equal(detectLocale({}), 'en-US');
});

test('browser matching respects weights, exclusions, language variants and Chinese scripts', () => {
  assert.equal(browserLocale('en;q=0.2,ja-JP;q=0.9,de;q=0'), 'ja-JP');
  assert.equal(browserLocale('ru-RU,en-GB;q=0.8'), 'en-US');
  assert.equal(browserLocale('ja;q=0,en;q=0,zh;q=garbage'), undefined);
  assert.equal(browserLocale('*'), undefined);
  for (const tag of ['zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant', 'zh-Hant-CN']) assert.equal(matchLanguage(tag), 'zh-TW');
  for (const tag of ['zh', 'zh-CN', 'zh-SG', 'zh-Hans-HK']) assert.equal(matchLanguage(tag), 'zh-CN');
  assert.equal(matchLanguage('en-GB'), 'en-US');
  assert.equal(matchLanguage('de-DE'), undefined);
  assert.equal(matchLanguage('not-a-language'), undefined);
});

test('locale replacement preserves page, query parameters and anchor', () => {
  assert.equal(localizedPath('/zh-CN/animations/?ref=home#notes', 'ja-JP'), '/ja-JP/animations/?ref=home#notes');
  assert.equal(localizedPath('/en-US/', 'zh-TW'), '/zh-TW/');
  assert.equal(localizedPath('/animations/', 'ja-JP'), '/ja-JP/animations/');
});

test('all four dictionaries have complete UI and content translations', () => {
  const cards = [...games, ...tools, ...explorations, ...notes];
  const ids = [...new Set(cards.map((card) => card.id))].sort();
  assert.deepEqual([...locales], ['zh-CN', 'zh-TW', 'en-US', 'ja-JP']);
  function checkShape(source, value, keyPath) {
    if (typeof source === 'string') return assert.ok(typeof value === 'string' && value.trim(), keyPath);
    assert.deepEqual(Object.keys(value).sort(), Object.keys(source).sort(), keyPath);
    for (const key of Object.keys(source)) checkShape(source[key], value[key], `${keyPath}.${key}`);
  }
  for (const locale of locales) {
    checkShape(dictionaries['zh-CN'], dictionaries[locale], locale);
    assert.deepEqual(Object.keys(dictionaries[locale].content).sort(), ids, locale);
    const localized = getHomeContent(locale);
    const entries = [...localized.games, ...localized.tools, ...localized.explorations, ...localized.notes];
    assert.deepEqual(entries.map(({ url, image }) => ({ url, image })), cards.map(({ id, url, image }) => ({
      url: id === 'aaa-sewer-king' ? `${url}?lang=${locale}` : url.startsWith('/') && id !== 'game-art-style' ? `/${locale}${url}` : url,
      image: id === 'aaa-sewer-king'
        ? `/images/games/aaa-sewer-king-promo${locale === 'zh-CN' ? '-zh-CN' : ''}.jpg`
        : image,
    })));
    if (!locale.startsWith('zh') && locale !== 'ja-JP') {
      for (const card of entries) assert.doesNotMatch(card.description, /[\u3400-\u9fff]/u, `${locale}: ${card.id}`);
    }
  }
});

test('missing content fields fall back to English then source without losing cards', () => {
  const source = [{ id:'example', title:'原文', description:'原文描述', url:'https://example.com' }];
  assert.deepEqual(localizeCards(source, { example: { title:'Titre', description:' ' } }, { example: { title:'Title', description:'English text' } }), [
    { ...source[0], title:'Titre', description:'English text' },
  ]);
  assert.deepEqual(localizeCards(source, {}, {}), source);
});

test('delisted game stays removed; notes link to the two requested X articles', () => {
  assert.equal(games.length, 7);
  assert.deepEqual(tools.map(tool => tool.id), ['game-art-style', 'pixel-cosmos-studio']);
  assert.equal(tools[0].url, '/gameartstyle/');
  assert.ok(!games.some(game => game.id === 'pixel-cosmos-studio'));
  assert.equal(games.find(game => game.id === 'aaa-sewer-king').url, 'https://games.jupiterthewarlock.com/aaa-sewer-king/');
  assert.ok(!games.some(game => /(?:aaa-sewer-king|runawayengine|booom2026)\.(?:jthewl\.cc|jupiterthewarlock\.com)/.test(game.url)));
  assert.ok(!games.some((game) => game.url.includes('thejunkyardoftheend')));
  assert.deepEqual(notes.map((note) => note.url), [
    'https://x.com/JupiterTheWL/status/2100813911104872633?s=20',
    'https://x.com/JupiterTheWL/status/2064052795721085254?s=20',
  ]);
});
