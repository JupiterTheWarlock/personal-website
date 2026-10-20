const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base = new URL('.', import.meta.url);
const routeURL = path => new URL(String(path || '').replace(/^\//, ''), base).pathname;
const fileURL = path => new URL(String(path).replace(/^\//, ''), base).href;
const shapes = {
  search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>', arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  external:'<path d="M14 4h6v6m0-6L10 14M10 4H4v16h16v-6"/>',
  expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  left:'<path d="m14 5-7 7 7 7"/>',right:'<path d="m10 5 7 7-7 7"/>',
  copy:'<rect x="8" y="8" width="12" height="13" rx="1"/><path d="M16 8V3H3v13h5"/>',
  folder:'<path d="M3 7V4h6l3 3h9v13H3Z"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="1"/><path d="m3 17 5-5 4 4 3-7 6 8"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || shapes.arrow}</svg>`;
const main=$('#main'), viewer=$('#viewer'), menu=$('#asset-menu'), toast=$('#toast');
let games,library,styles,groups,byId,byStyle,groupNames,assetMap,activeStyle;
let localAssets=false,currentRoute='',viewerItems=[],viewerIndex=0,menuAsset,menuFocus,viewerFocus,touchStart,toastTimer,searchTimer;
const galleryState={query:'',filter:'all'},libraryState={query:'',filter:'all'},scrollPositions=new Map();
const locationKey=()=>location.pathname+location.search;
const promptFor=style=>style.promptEn||style.prompt;
async function fetchJSON(path,options) {
  const response=await fetch(fileURL(path),options),data=await response.json();
  if(!response.ok) throw new Error(data.error||`请求未完成（${response.status}）`);
  return data;
}
const localAction=(path,body)=>fetchJSON(path,{method:'POST',headers:{'Content-Type':'application/json','X-Atlas-Action':'user'},body:JSON.stringify(body)});
function picture(game,index=game.coverIndex||0,options={}) {
  const shot=game.screenshots[index]||game.screenshots[0];
  if(!shot) return '<span class="missing-art">参考画面待补充</span>';
  return `<img src="${esc(fileURL(options.thumb?shot.thumb:shot.src))}" alt="${esc(shot.alt)}" data-asset-id="${shot.id}"
    loading="${options.eager?'eager':'lazy'}" decoding="async" width="1920" height="1080">`;
}
function styleCard(style,index=9) {
  const game=byId.get(style.coverGame);
  return `<a class="style-card" href="${routeURL(`styles/${style.id}/`)}"><div class="card-art">
    ${picture(game,style.coverIndex??game.coverIndex,{thumb:true,eager:index<3})}<span class="card-view">${icon('arrow')}</span></div>
    <div class="card-kicker"><span>${groupNames[style.group]}</span><span>${style.games.length} 款参考游戏</span></div>
    <h2>${esc(style.name)}</h2><p class="card-game">${esc(game.name)}<span class="sep">/</span>${esc(game.developer)}</p></a>`;
}
function searchField(placeholder,state) {
  return `<label class="search-field">${icon('search')}<input type="search" id="search" aria-label="${placeholder}" placeholder="${placeholder}"
    value="${esc(state.query)}" autocomplete="off" spellcheck="false"><button type="button" class="search-clear" aria-label="清空搜索" ${state.query?'':'hidden'}>${icon('close')}</button></label>`;
}
function tabs(state,label) {
  return `<div class="filter-tabs" role="group" aria-label="筛选">${[{id:'all',name:label},...groups].map(g=>`<button type="button"
    class="filter-tab ${state.filter===g.id?'selected':''}" data-filter="${g.id}" aria-pressed="${state.filter===g.id}">${g.name}</button>`).join('')}</div>`;
}
function emptyState() {return `<div class="empty-state">${icon('search')}<h2>还没有找到</h2><p>换个关键词，或者展开全部分类。</p><button type="button" class="button" data-reset>清空筛选</button></div>`;}
function readQuery(state) {
  const params=new URLSearchParams(location.search);
  state.query=params.get('q')||'';state.filter=params.get('category')||'all';
  if(!['all',...groups.map(g=>g.id)].includes(state.filter)) state.filter='all';
}
function rememberQuery(state) {
  const url=new URL(location.href);
  for(const [key,value] of [['q',state.query],['category',state.filter==='all'?'':state.filter]]) {
    if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);
  }
  history.replaceState(history.state,'',url);
}
function syncControls(state) {
  $('.search-clear').hidden=!state.query;
  $$('[data-filter]').forEach(button=>{
    button.classList.toggle('selected',state.filter===button.dataset.filter);
    button.setAttribute('aria-pressed',state.filter===button.dataset.filter);
  });
}
function wireSearch(state,update) {
  $('#search').addEventListener('input',event=>{
    state.query=event.target.value;clearTimeout(searchTimer);
    searchTimer=setTimeout(()=>{rememberQuery(state);update();},120);
  });
}
function galleryPage() {
  readQuery(galleryState);
  main.innerHTML=`<section class="page-heading"><div><p class="eyebrow">游戏画面与美术提示词</p><h1>把一种风格，看得更清楚</h1>
    <p class="page-description">从代表画面进入，观察不同游戏的共同语言，带走可以继续创作的提示词。</p></div>
    <div class="collection-stats"><span class="stat-number">${styles.length}</span><div class="stat-label"><strong>种美术风格</strong><span class="stat-extra">${games.length} 款游戏参考</span></div></div></section>
    <section class="toolbar" aria-label="搜索与分类">${searchField('搜索风格、游戏或画面特征',galleryState)}${tabs(galleryState,'全部风格')}</section>
    <div class="section-meta"><span>一种风格，一款代表游戏，多种画面参考</span><span id="result-count" role="status"></span></div><section id="results" aria-label="美术风格"></section>`;
  updateGallery();wireSearch(galleryState,updateGallery);
}
function updateGallery() {
  const query=galleryState.query.trim().toLowerCase();
  const matches=styles.filter(style=>{
    const text=[style.name,style.description,...style.tags,...style.games.flatMap(e=>{
      const g=byId.get(e.id);return[g.name,g.englishName,g.originalName];
    })].join(' ').toLowerCase();
    return(galleryState.filter==='all'||style.group===galleryState.filter)&&text.includes(query);
  });
  $('#result-count').textContent=`${matches.length} / ${styles.length} 种风格`;
  $('#results').className=matches.length?'gallery-grid':'';
  $('#results').innerHTML=matches.length?matches.map(styleCard).join(''):emptyState();
  syncControls(galleryState);
}
function gameEntry(entry) {
  const g=byId.get(entry.id),hasImage=g.screenshots.length>0,shot=g.screenshots[g.coverIndex||0];
  return `<article class="game-entry"><button type="button" class="game-image" data-view="${g.id}" data-index="${g.coverIndex||0}"
    aria-label="查看${esc(g.name)}画面与提示词" ${hasImage?'':'disabled'}>${picture(g)}${hasImage?`<span class="image-enlarge">${icon('expand')}</span>`:''}</button>
    <div class="game-heading"><h3>${esc(g.name)}</h3><a href="${esc(shot?.sourceUrl||g.storeUrl)}" target="_blank" rel="noopener" aria-label="${esc(g.name)}的图片来源">${icon('external')}</a></div>
    <p class="game-developer">${esc(g.developer)}</p><p class="game-note">${esc(entry.note||g.visualNote)}</p>
    ${hasImage?`<button type="button" class="text-action" data-view="${g.id}" data-index="${g.coverIndex||0}" data-scene>${icon('copy')}画面与提示词${icon('arrow')}</button>`:''}
    <details class="source-disclosure"><summary>图片来源与版权</summary><p>${shot?.sourceType==='community'?'Steam 社区用户上传截图，非官方商店宣传图。':'Steam 官方商店宣传截图。'}画面版权归相应权利人所有。</p>
    <a href="${esc(shot?.sourceUrl||g.storeUrl)}" target="_blank" rel="noopener">${shot?.sourceType==='community'?'社区来源':'官方商店'} ↗</a>${hasImage?`<a href="${esc(shot.originalUrl)}" target="_blank" rel="noopener">查看来源原图 ↗</a>`:''}</details></article>`;
}
function detailPage(style) {
  activeStyle=style;
  const g=byId.get(style.coverGame),index=style.coverIndex??g.coverIndex??0;
  const related=styles.filter(s=>s.id!==style.id).sort((a,b)=>Number(b.group===style.group)-Number(a.group===style.group)).slice(0,3);
  const query=new URLSearchParams();
  if(galleryState.query)query.set('q',galleryState.query);
  if(galleryState.filter!=='all')query.set('category',galleryState.filter);
  const back=routeURL('')+(query.size?`?${query}`:'');
  main.innerHTML=`<div class="breadcrumb"><a href="${back}">${icon('left')}风格画廊</a><span class="slash">/</span><span>${groupNames[style.group]}</span></div>
    <section class="page-heading detail-heading"><div><h1>${esc(style.name)}</h1><p class="page-description">${esc(style.description)}</p></div>
    <div class="collection-stats"><span class="stat-number">${style.games.length}</span><div class="stat-label"><strong>款参考游戏</strong></div></div></section>
    <section class="style-hero" aria-label="代表画面与观察"><div><button type="button" class="hero-image" data-view="${g.id}" data-index="${index}" aria-label="放大${esc(g.name)}代表画面">
    ${picture(g,index,{eager:true})}<span class="enlarge-label">${icon('expand')}放大画面</span></button><div class="hero-credit"><span>${esc(g.name)}</span><span>${esc(g.developer)}</span></div></div>
    <div class="look-for"><p>从这三个地方看</p>${style.observations.map((o,i)=>`<div class="observation"><span>0${i+1}</span><div><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p></div></div>`).join('')}</div></section>
    <section class="global-prompt" aria-label="全局美术风格提示词"><div class="prompt-heading"><div><h2>全局美术风格提示词</h2><p>统一角色、场景、界面与特效的视觉方向</p></div>
    <button type="button" class="button" data-copy-prompt="${style.id}">${icon('copy')}复制提示词</button></div><pre tabindex="0"><code>${esc(promptFor(style))}</code></pre>
    <span class="prompt-note">英文提示词 · 可作为项目美术规范的起点</span></section>
    <section class="detail-section"><div class="section-heading"><h2>代表游戏</h2><span>${style.games.length} 款 · 每幅画面均有提示词</span></div><div class="games-grid">${style.games.map(gameEntry).join('')}</div></section>
    <section class="detail-section"><div class="section-heading"><h2>继续探索</h2><a href="${back}" class="library-store">全部风格 →</a></div><div class="related-grid">${related.map(styleCard).join('')}</div></section>`;
}
const stylesFor=id=>styles.filter(s=>s.games.some(g=>g.id===id));
function libraryPage() {
  readQuery(libraryState);
  main.innerHTML=`<section class="page-heading library-heading"><div><p class="eyebrow">按游戏查找风格</p><h1>从熟悉的名字，找到画面</h1>
    <p class="page-description">我买过的游戏，加上家庭库里玩过的游戏。点击风格名称，进入对应的画面与提示词存档。</p></div>
    <div class="collection-stats"><span class="stat-number">${library.length}</span><div class="stat-label"><strong>款收藏游戏</strong></div></div></section>
    <section class="toolbar" aria-label="游戏搜索与筛选">${searchField('搜索中文或英文游戏名',libraryState)}${tabs(libraryState,'全部游戏')}</section>
    <div class="section-meta"><span>同一款游戏可以归入多种风格</span><span id="result-count" role="status"></span></div><section id="results" class="library-list" aria-label="游戏收藏"></section>`;
  updateLibrary();wireSearch(libraryState,updateLibrary);
}
function updateLibrary() {
  const q=libraryState.query.trim().toLowerCase();
  const matches=library.filter(g=>(libraryState.filter==='all'||stylesFor(g.id).some(s=>s.group===libraryState.filter))&&`${g.name} ${g.englishName}`.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));
  $('#result-count').textContent=`${matches.length} 款游戏`;
  $('#results').innerHTML=matches.length?matches.map((g,i)=>`<article class="library-row"><span class="library-index">${String(i+1).padStart(3,'0')}</span>
    <div class="library-name"><strong>${esc(g.name)}</strong>${g.englishName&&g.englishName!==g.name?`<small>${esc(g.englishName)}</small>`:''}</div>
    <div class="library-styles">${stylesFor(g.id).map(s=>`<a class="style-chip" href="${routeURL(`styles/${s.id}/`)}">${esc(s.name)}</a>`).join('')}</div>
    <a class="library-store" href="${esc(byId.get(g.id)?.screenshots[0]?.sourceUrl||g.storeUrl)}" target="_blank" rel="noopener">查看来源 ↗</a></article>`).join(''):emptyState();
  syncControls(libraryState);
}
function aboutPage() {
  main.innerHTML=`<article class="about"><p class="eyebrow">关于这本图鉴</p><h1>画面与提示词，一起存下来。</h1>
    <p class="lede">从我熟悉的游戏出发，整理美术风格的形状、配色、材质与光影。看到喜欢的画面，可以继续比较，也可以带走能用于创作的描述。</p>
    <section class="about-section"><h2>一张卡片，一种风格</h2><p>目前整理了 ${styles.length} 种风格，来自 ${library.length} 款游戏。每种风格用一款游戏作代表，再聚合同类画面。游戏索引帮助查找，画廊始终按风格组织。</p>
    <p>收藏范围是我买过的游戏，以及家庭库中我玩过的游戏；已购买但尚未启动的游戏也保留。</p></section>
    <section class="about-section"><h2>两种提示词，分别解决两件事</h2><p>全局提示词定义整套美术的视觉方向，覆盖角色、环境、界面与效果。画面提示词进一步描述一幅参考画面的视角、构图、色彩和细节。</p>
    <p>提示词根据可见画面重新编写，不是游戏开发者的内部资料，也不代表开发者使用过 AI。分类描述画面效果，不根据截图断言制作技术。</p></section>
    <section class="about-section"><h2>来源与使用</h2><p>大部分截图来自 Steam 官方商店；6 款商店资料不可用的游戏采用 Steam 社区用户截图，并在图片来源处单独标明。画面版权归相应权利人所有。每幅画面都保留来源；点击画面可放大、复制提示词和下载截图。</p>
    <p>结构与交互参考了 <a href="https://gameartstyle.loopyhop.com/" target="_blank" rel="noopener">游戏美术风格图鉴 ↗</a>。这里的收藏、分类说明与提示词围绕我的游戏库重新整理。</p></section>
    <section class="about-section"><h2>用自己的游戏库做一本</h2><p>把这份中文提示词复制给能够读取本机资料、浏览网页并编写代码的 AI 助手，即可从自己的 Steam 收藏开始制作。</p>
    <a class="button" href="${fileURL('recreate-prompt.zh-CN.txt')}" target="_blank" rel="noopener">打开复现提示词 ↗</a></section></article>`;
}
function navigate(url) {scrollPositions.set(locationKey(),scrollY);history.pushState({},'',url);renderRoute();}
function renderRoute() {
  clearTimeout(searchTimer);if(viewer.open)viewer.close();hideMenu();activeStyle=null;
  const route=location.pathname.slice(base.pathname.length).replace(/^\/|\/$/g,''),detail=route.match(/^styles\/([a-z0-9-]+)$/);
  let active='gallery',title='游戏美术图鉴';
  if(route==='games'){libraryPage();active='games';title='游戏索引 · 游戏美术图鉴';}
  else if(route==='about'){aboutPage();active='about';title='关于图鉴 · 游戏美术图鉴';}
  else if(detail&&byStyle.has(detail[1])){const s=byStyle.get(detail[1]);detailPage(s);title=`${s.name} · 游戏美术图鉴`;}
  else if(!route||route==='index.html')galleryPage();
  else main.innerHTML=`<div class="empty-state"><h1>这一页还没有收录</h1><a class="button" href="${routeURL('')}">返回风格画廊</a></div>`;
  $$('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===active);if(a.dataset.nav===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.title=title;currentRoute=route;
  requestAnimationFrame(()=>{main.focus({preventScroll:true});scrollTo({top:scrollPositions.get(locationKey())||0,behavior:'instant'});});
}
function showToast(message) {
  (viewer.open?viewer:document.body).append(toast);toast.textContent=message;toast.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),4200);
}
async function copyText(text,element) {
  try {
    try {
      if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(text);
    } catch {
      if(localAssets)await localAction('/api/clipboard/text',{text});
      else {
        const previous=document.activeElement,field=document.createElement('textarea');
        field.value=text;field.readOnly=true;field.setAttribute('aria-label','待复制提示词');
        field.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';
        (viewer.open?viewer:document.body).append(field);field.focus();field.select();
        const copied=document.execCommand('copy');field.remove();previous?.focus({preventScroll:true});
        if(!copied)throw new Error('clipboard unavailable');
      }
    }
    showToast('提示词已复制');
  } catch {
    if(element){const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);element.closest('pre')?.focus();}
    showToast('自动复制没有完成，已选中内容，请按 Ctrl+C 或长按复制。');
  }
}
function showImage() {
  const {game:g,shot}=viewerItems[viewerIndex],image=$('#viewer-image');
  $('.viewer-stage').classList.remove('zoomed');$('#viewer-zoom').setAttribute('aria-pressed','false');$('#viewer-zoom').setAttribute('aria-label','放大画面');
  $('#viewer-error').hidden=true;image.src=fileURL(shot.src);image.alt=shot.alt;image.dataset.assetId=shot.id;
  $('#viewer-title').textContent=g.name;$('#viewer-developer').textContent=g.developer;$('#viewer-count').textContent=`${viewerIndex+1} / ${viewerItems.length}`;
  $('#viewer-caption').textContent=`${activeStyle?.name||'参考画面'} · ${shot.sourceType==='community'?'Steam 社区截图':'官方商店截图'}`;$('#viewer-source').href=shot.sourceUrl;
  $('#viewer-source').textContent=shot.sourceType==='community'?'社区来源 ↗':'官方来源 ↗';
  $('#viewer-download').href=fileURL(shot.src);$('#viewer-download').download=`${g.name}-${shot.id}.jpg`;
  $('#viewer-scene').textContent=shot.sceneNote||g.visualNote||'';
  $('#viewer-prompt').textContent=shot.prompt||(activeStyle?promptFor(activeStyle):'');
  $('#viewer-prev').hidden=$('#viewer-next').hidden=viewerItems.length<2;
  const start=Math.max(0,Math.min(viewerIndex-3,viewerItems.length-7));
  $('#viewer-thumbnails').innerHTML=viewerItems.slice(start,start+7).map((entry,i)=>`<button type="button" class="${start+i===viewerIndex?'selected':''}" data-slide="${start+i}"
    title="${esc(entry.game.name)}" aria-label="查看${esc(entry.game.name)}截图" aria-pressed="${start+i===viewerIndex}">
    <img src="${esc(fileURL(entry.shot.thumb))}" alt="${esc(entry.shot.alt)}" data-asset-id="${entry.shot.id}"></button>`).join('');
  const next=new Image();next.src=fileURL(viewerItems[(viewerIndex+1)%viewerItems.length].shot.src);
}
function openViewer(id,index=0,showPrompt=false) {
  const game=byId.get(Number(id));if(!game?.screenshots.length)return;
  viewerItems=(activeStyle?activeStyle.games.map(e=>byId.get(e.id)):[game]).flatMap(g=>g.screenshots.map(shot=>({game:g,shot})));
  viewerIndex=Math.max(0,viewerItems.findIndex(e=>e.shot.id===game.screenshots[Number(index)||0].id));
  viewerFocus=document.activeElement;showImage();viewer.showModal();
  if(showPrompt&&innerWidth<700)$('.viewer-prompt').scrollIntoView({block:'nearest'});
}
function stepImage(step){hideMenu();viewerIndex=(viewerIndex+step+viewerItems.length)%viewerItems.length;showImage();}
function toggleZoom(){const zoom=$('.viewer-stage').classList.toggle('zoomed');$('#viewer-zoom').setAttribute('aria-pressed',zoom);$('#viewer-zoom').setAttribute('aria-label',zoom?'适应窗口':'放大画面');}
function hideMenu(restore=false){menu.hidden=true;if(restore&&menuFocus?.isConnected)menuFocus.focus({preventScroll:true});}
function showMenu(event,image) {
  const asset=assetMap[image.dataset.assetId];if(!asset)return;event.preventDefault();menuAsset=asset;menuFocus=image.closest('button,a')||image;
  (viewer.open?viewer:document.body).append(menu);
  menu.innerHTML=`<div class="menu-name">${esc(asset.game)} · 原始截图</div><button role="menuitem" type="button" data-asset-action="open">${icon('external')}打开原图</button>
    ${localAssets?`<button role="menuitem" type="button" data-asset-action="reveal">${icon('folder')}打开文件所在位置</button>`:''}
    <div class="menu-separator"></div><button role="menuitem" type="button" data-asset-action="image">${icon('image')}复制图片</button>
    ${localAssets?`<button role="menuitem" type="button" data-asset-action="file">${icon('copy')}复制文件</button>`:''}
    <button role="menuitem" type="button" data-asset-action="path" title="${esc(asset.path||fileURL(asset.src))}">${icon('copy')}复制${localAssets?'文件路径':'图片链接'}</button>
    <div class="menu-separator"></div><button role="menuitem" type="button" data-asset-action="download">${icon('download')}另存为 / 下载原图</button>`;
  menu.hidden=false;const rect=image.getBoundingClientRect(),x=event.clientX||rect.left+30,y=event.clientY||rect.top+30;
  menu.style.left=`${Math.max(8,Math.min(x,innerWidth-menu.offsetWidth-10))}px`;menu.style.top=`${Math.max(8,Math.min(y,innerHeight-menu.offsetHeight-10))}px`;
  $('button',menu).focus({preventScroll:true});
}
main.addEventListener('click',async event=>{
  const b=event.target.closest('button');if(!b)return;
  const state=currentRoute==='games'?libraryState:galleryState,update=currentRoute==='games'?updateLibrary:updateGallery;
  if(b.dataset.filter){state.filter=b.dataset.filter;rememberQuery(state);update();}
  if(b.matches('.search-clear,[data-reset]')){clearTimeout(searchTimer);state.query='';if(b.hasAttribute('data-reset'))state.filter='all';$('#search').value='';rememberQuery(state);update();$('#search').focus();}
  if(b.dataset.view)openViewer(b.dataset.view,b.dataset.index,b.hasAttribute('data-scene'));
  if(b.dataset.copyPrompt)await copyText(promptFor(byStyle.get(b.dataset.copyPrompt)),$('.global-prompt code'));
});
document.addEventListener('click',event=>{
  const a=event.target.closest('a[href]');if(!a||a.hasAttribute('download')||a.target||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
  if(a.classList.contains('skip-link')){event.preventDefault();main.focus();main.scrollIntoView();return;}
  const url=new URL(a.href);
  if(url.origin!==location.origin||!url.pathname.startsWith(base.pathname)||/\.(jpg|png|webp|svg)$/.test(url.pathname))return;
  event.preventDefault();navigate(url);
});
for(const [id,name] of [['close','close'],['prev','left'],['next','right'],['zoom','expand']])$('#viewer-'+id).innerHTML=icon(name);
$('#viewer-image').tabIndex=0;
$('#viewer-close').onclick=()=>viewer.close();$('#viewer-prev').onclick=()=>stepImage(-1);$('#viewer-next').onclick=()=>stepImage(1);$('#viewer-zoom').onclick=toggleZoom;
$('#viewer-image').ondblclick=toggleZoom;$('#viewer-copy').onclick=()=>copyText($('#viewer-prompt').textContent,$('#viewer-prompt'));
$('#viewer-image').onerror=()=>{$('#viewer-error').hidden=false;};$('#viewer-image').onload=()=>{$('#viewer-error').hidden=true;};
$('#viewer-retry').onclick=()=>{$('#viewer-image').src=fileURL(viewerItems[viewerIndex].shot.src)+`?retry=${Date.now()}`;};
$('#viewer-thumbnails').onclick=event=>{const b=event.target.closest('[data-slide]');if(b){viewerIndex=Number(b.dataset.slide);showImage();}};
$('.viewer-stage').addEventListener('touchstart',event=>{if(event.touches.length===1)touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});
$('.viewer-stage').addEventListener('touchend',event=>{
  if(!touchStart||$('.viewer-stage').classList.contains('zoomed'))return;
  const dx=event.changedTouches[0].clientX-touchStart.x,dy=event.changedTouches[0].clientY-touchStart.y;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)stepImage(dx>0?-1:1);touchStart=null;
},{passive:true});
viewer.addEventListener('cancel',event=>{if(!menu.hidden){event.preventDefault();hideMenu(true);}});
viewer.addEventListener('close',()=>{hideMenu();document.body.append(menu,toast);if(viewerFocus?.isConnected)viewerFocus.focus({preventScroll:true});});
viewer.addEventListener('click',event=>{if(event.target===viewer||event.target===$('.viewer-stage'))viewer.close();});
document.addEventListener('contextmenu',event=>{const image=event.target.closest('img[data-asset-id]')||event.target.closest('button,a')?.querySelector('img[data-asset-id]');if(image)showMenu(event,image);});
document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target))hideMenu();});
addEventListener('resize',()=>hideMenu());addEventListener('scroll',()=>{if(!menu.hidden)hideMenu();},{passive:true});
document.addEventListener('keydown',event=>{
  if(!menu.hidden){
    if(event.key==='Escape'){event.preventDefault();hideMenu(true);return;}
    const buttons=$$('button',menu),index=buttons.indexOf(document.activeElement);
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();
    }
    if(event.key==='Tab')hideMenu();return;
  }
  if(event.shiftKey&&event.key==='F10'){const el=document.activeElement,image=el.matches('img[data-asset-id]')?el:el.querySelector('img[data-asset-id]');if(image)showMenu(event,image);}
  if(viewer.open&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)&&!event.target.closest('pre')){
    event.preventDefault();if(['Home','End'].includes(event.key)){viewerIndex=event.key==='Home'?0:viewerItems.length-1;showImage();}else stepImage(event.key==='ArrowLeft'?-1:1);
  }
});
async function copyWebImage(asset){
  const image=new Image();image.src=fileURL(asset.src);await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  canvas.getContext('2d').drawImage(image,0,0);const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));await navigator.clipboard.write([new ClipboardItem({'image/png':png})]);
}
menu.addEventListener('click',async event=>{
  const b=event.target.closest('[data-asset-action]');if(!b)return;const action=b.dataset.assetAction,asset=menuAsset;hideMenu(true);
  if(action==='open'){window.open(fileURL(asset.src),'_blank','noopener');return;}
  if(action==='download'){const a=document.createElement('a');a.href=fileURL(asset.src);a.download=`${asset.game}-${asset.id}.jpg`;document.body.append(a);a.click();a.remove();return;}
  try{
    if(localAssets)await localAction('/api/assets/action',{id:asset.id,action});
    else if(action==='image')await copyWebImage(asset);else if(action==='path')await navigator.clipboard.writeText(fileURL(asset.src));
    showToast({reveal:'已在文件夹中定位原图',image:'图片已复制',file:'图片文件已复制',path:localAssets?'完整文件路径已复制':'图片链接已复制'}[action]);
  }catch{showToast('操作没有完成，请重试，或选择下载原图。');}
});
document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement)event.target.classList.add('image-error');},true);
try{
  const [g,l,s]=await Promise.all([fetchJSON('/data/games.json'),fetchJSON('/data/library.json'),fetchJSON('/data/styles.json')]);
  games=g;library=l;styles=s.styles;groups=s.groups;byId=new Map(g.map(g=>[g.id,g]));byStyle=new Map(styles.map(s=>[s.id,s]));groupNames=Object.fromEntries(groups.map(g=>[g.id,g.name]));
  assetMap=Object.fromEntries(games.flatMap(g=>g.screenshots.map(shot=>[shot.id,{...shot,game:g.name}])));
  if(['127.0.0.1','localhost'].includes(location.hostname)){
    try{if((await fetchJSON('/api/health')).app==='game-art-atlas'){assetMap=await fetchJSON('/api/assets');localAssets=true;}}catch{/* Browser-only static preview. */}
  }
  $('.nav-count').textContent=library.length;
  if(location.hash.startsWith('#/'))history.replaceState({},'',routeURL(location.hash.slice(2)));
  if('scrollRestoration' in history)history.scrollRestoration='manual';addEventListener('popstate',renderRoute);renderRoute();
}catch(error){console.error(error);main.innerHTML='<div class="empty-state"><h1>图鉴暂时没有展开</h1><p>数据未能加载，请刷新页面重试。</p><button class="button" id="retry">重新加载</button></div>';$('#retry').onclick=()=>location.reload();}
