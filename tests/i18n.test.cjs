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
const { games, explorations, notes } = loadTypeScript('app/content/home.ts');
const { localizeCards, getHomeContent } = loadTypeScript('app/content/localized.ts');

test('manual preference wins over region and browser; invalid cookies are ignored', () => {
  assert.equal(detectLocale({ saved: 'fr-FR', country: 'CN', acceptLanguage: 'ja' }), 'fr-FR');
  assert.equal(detectLocale({ saved: '../../evil', country: 'JP', acceptLanguage: 'en' }), 'ja-JP');
});

test('regions cover all nine languages and unknown regions use the browser', () => {
  for (const [country, locale] of Object.entries({ CN:'zh-CN', TW:'zh-TW', HK:'zh-TW', MO:'zh-TW', US:'en-US', JP:'ja-JP', KR:'ko-KR', DE:'de-DE', FR:'fr-FR', MX:'es-ES', BR:'pt-BR' })) {
    assert.equal(detectLocale({ country, acceptLanguage: 'en-US' }), locale, country);
  }
  assert.equal(detectLocale({ country: 'CA', acceptLanguage: 'fr-CA,en;q=0.8' }), 'fr-FR');
  assert.equal(detectLocale({ country: 'ZZ', acceptLanguage: 'ru' }), 'en-US');
  assert.equal(detectLocale({}), 'en-US');
});

test('browser matching respects weights, exclusions, language variants and Chinese scripts', () => {
  assert.equal(browserLocale('en;q=0.2,ja-JP;q=0.9,de;q=0'), 'ja-JP');
  assert.equal(browserLocale('ru-RU,fr-CA;q=0.8'), 'fr-FR');
  assert.equal(browserLocale('de;q=0,en;q=0,ko;q=garbage'), undefined);
  assert.equal(browserLocale('*'), undefined);
  for (const tag of ['zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant', 'zh-Hant-CN']) assert.equal(matchLanguage(tag), 'zh-TW');
  for (const tag of ['zh', 'zh-CN', 'zh-SG', 'zh-Hans-HK']) assert.equal(matchLanguage(tag), 'zh-CN');
  assert.equal(matchLanguage('pt-PT'), 'pt-BR');
  assert.equal(matchLanguage('de-DE'), 'de-DE');
  assert.equal(matchLanguage('not-a-language'), undefined);
});

test('locale replacement preserves page, query parameters and anchor', () => {
  assert.equal(localizedPath('/zh-CN/animations/?ref=home#notes', 'de-DE'), '/de-DE/animations/?ref=home#notes');
  assert.equal(localizedPath('/en-US/', 'zh-TW'), '/zh-TW/');
  assert.equal(localizedPath('/animations/', 'ja-JP'), '/ja-JP/animations/');
});

test('all nine dictionaries have complete UI and content translations', () => {
  const cards = [...games, ...explorations, ...notes];
  const ids = cards.map((card) => card.id).sort();
  assert.equal(locales.length, 9);
  function checkShape(source, value, keyPath) {
    if (typeof source === 'string') return assert.ok(typeof value === 'string' && value.trim(), keyPath);
    assert.deepEqual(Object.keys(value).sort(), Object.keys(source).sort(), keyPath);
    for (const key of Object.keys(source)) checkShape(source[key], value[key], `${keyPath}.${key}`);
  }
  for (const locale of locales) {
    checkShape(dictionaries['zh-CN'], dictionaries[locale], locale);
    assert.deepEqual(Object.keys(dictionaries[locale].content).sort(), ids, locale);
    const localized = getHomeContent(locale);
    const entries = [...localized.games, ...localized.explorations, ...localized.notes];
    assert.deepEqual(entries.map(({ url, image }) => ({ url, image })), cards.map(({ url, image }) => ({ url, image })));
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
  assert.equal(games.length, 6);
  assert.ok(!games.some((game) => game.url.includes('thejunkyardoftheend')));
  assert.deepEqual(notes.map((note) => note.url), [
    'https://x.com/JupiterTheWL/status/2100813911104872633?s=20',
    'https://x.com/JupiterTheWL/status/2064052795721085254?s=20',
  ]);
});
