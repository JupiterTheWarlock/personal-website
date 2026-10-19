# 独立游戏站

分享入口：https://games.jupiterthewarlock.com/aaa-sewer-king/ 。根目录只展示游戏列表，没有个人主页、博客、笔记或联系入口。

游戏站是同一仓库里的独立 Next 导出应用，与个人站分别部署。复用四语言游戏内容、宣传插画、介绍组件和 Unity 播放器，不引入个人主页布局或垃圾场背景。新增游戏时同时扩展列表、路由白名单和 sitemap，不在根目录回退到个人站。

- Pages 项目：`jupiter-games`，GitHub `JupiterTheWarlock/personal-website` 的 `main`。
- Pages 根目录：`games-site`；命令：`npm run build`；输出：`out`；Node.js 22。
- 此目录的构建脚本先在父目录 `npm ci`，再执行父目录 `build:games`，共用锁定依赖和发布清单。
- 本机从仓库根运行 `npm run build:games`、`npm run start:games`（8096）、`node tests/check-games-site.mjs`。
- `worker.ts` 在不改变短网址的情况下提供对应语言 HTML。`?lang=` 明确选择优先于浏览器保存值、访问地区和浏览器语言；下拉框保存选择并保留路径、其他参数和锚点。页面使用私有缓存，四种语言分别有 canonical 和替代链接。
- 未知路径返回 404；内部语言目录不作为公开入口。`/aaa-sewer-king/play/` 是跨版本固定运行目录，独立打开和 iframe 共用它，运行页不参与语言跳转。
- `prepare-games.mjs` 仅复制两张游戏宣传插画与游戏图标，生成 Worker、响应头、404、robots、sitemap。`prepare-unity.mjs` 从已批准的 R2 清单生成运行壳，全部 Build 资源仍由 R2/CDN 提供。

个人站作品卡片和旧四语言介绍页指向游戏站。旧个人站 `/games/aaa-sewer-king/play/` 保留，以免原浏览器存档失去运行入口；新旧域名存储隔离，旧存档不会自动复制到新域名。网站不会清除或覆盖旧 IndexedDB。新站未来发布继续使用当前运行目录。

这实现的是入口分离：删除游戏 slug 会到游戏列表。子域名仍能看出所属主域名，不能作为匿名或访问控制手段。
