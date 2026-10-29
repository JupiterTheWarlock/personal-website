# Jupiter The Warlock - Personal Website

> ASCII 风格个人网站 | Indie Game Developer's Personal Website

## 🎨 风格

- **主题**: ASCII 码风格 + 暗黑模式
- **灵感**: 终端界面、Cyberpunk UI、Retro Terminal
- **视觉效果**: CRT 扫描线、Glow 发光、闪烁光标

## 🛠️ 技术栈

- **框架**: Next.js 14.2.15（静态导出）
- **语言**: TypeScript
- **样式**: Tailwind CSS 3.4.17
- **部署**: Cloudflare Pages + Pages Functions

## 📁 项目结构

```
personal-website/
├── app/
│   ├── [locale]/          # 多语言路由
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── i18n/             # 多语言配置
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 根页面
├── components/
│   ├── layout/            # 布局组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── LanguageSwitcher.tsx
│   └── content/          # 内容组件
│       └── SocialLinks.tsx
├── functions/            # Pages 语言跳转
├── wrangler.toml         # Pages 配置
├── .nvmrc                # Node 版本 (22)
└── lib/                  # 工具函数
```

## 🚀 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动 Pages 本地预览（http://localhost:3456）
npm start
```

## 📦 部署

正式网址：https://jupiterthewarlock.com 。Pages 项目为 `jupiterthewarlock`，预览地址为 `jupiterthewarlock.pages.dev`。

- Git 仓库：`JupiterTheWarlock/personal-website`，生产分支 `main`。
- 构建命令：`npm run build`；输出目录：`out`；Node.js 22。
- 本机手动发布时，先构建并验证，再执行 `npm run deploy`。Wrangler 使用本机授权；凭据、`.wrangler/`、构建产物不提交。
- `wrangler.toml` 记录项目名、输出目录及与固定 Wrangler 版本匹配的运行兼容日期。
- 旧 `jthewl.cc`、`www.jthewl.cc` 的 301 在 Cloudflare 保留。
- `vercel.json` 关闭旧平台的 Git 自动部署，旧部署仅保留作迁移回退。

`next.config.js` 启用 `output: 'export'`。`middleware.ts` 用于 `next dev` 和原 Vercel 备用配置；静态构建提示它不进入导出产物属于预期，Pages 上由 `functions/_middleware.ts` 执行语言跳转。两者复用 `app/i18n/request-routing.ts`。

`public/_routes.json` 让四语言静态页、Next 资源、背景和图片直接由 Pages 提供，其他需要语言判断或兼容旧路径的请求进入 Function。没有全站 SPA 回退，未知页面返回 404。

### 工具菜单与美术风格图鉴

顶部“工具”下拉包含聚光灯2026gamejam 排行榜、美术风格图鉴和星空生成器，不另增首页分区。菜单标题和描述支持四种语言；排行榜链接 `https://spotlight.jupiterthewarlock.com`，星空生成器继续链接现有 Pixel Cosmos Studio 页面。

图鉴发布路径为 `/gameartstyle/`，它是独立的中文工具页面，不随主站的语言前缀跳转。独立源码由 `JupiterTheWarlock/GameArtAtlas` 管理，主站在 `vendor/game-art-atlas` 保留公开网页所需文件的发布快照。`snapshot.json` 记录源提交和文件校验值；截图缓存、Steam 原始账户记录和本机操作服务不进入该目录的版本控制。

`scripts/prepare-tools.mjs` 校验快照、下载缺少的公开截图，再将图鉴合入 `out/gameartstyle/`。GitHub 触发的 Pages 构建只需主站仓库与 Node.js 22，不需要私人仓库权限或 Steam 登录。所有页面一起发布到现有 Pages 项目。

更新图鉴时，先在独立项目中修改、检查并提交，再同步主站的快照：

```powershell
# 在个人站目录中；默认寻找工作区下平级的 GameArtAtlas
node scripts/sync-atlas.mjs --with-assets
npm run build
```

其他目录布局可设置 `ATLAS_SOURCE_PATH`。该变量也允许本地构建直接使用图鉴源码；正式自动构建默认使用已提交的快照。不要只部署图鉴产物覆盖整个个人站。发布前检查工具菜单、图鉴深层链接、图片复制及 `/gameartstyle/recreate-prompt.zh-CN.txt`。提交工具改动时保留并排除其他尚未完成的背景修改。

### Unity 游戏接入约定

游戏的当前公开分享入口为 **https://games.jupiterthewarlock.com/aaa-sewer-king/**，由独立 Pages 项目 `jupiter-games` 承载。删除 slug 只会进入游戏列表，游戏站没有个人主页导航。主站作品卡片和旧介绍页转到该地址，四种语言继续保留。完整构建和发布方式见 [独立游戏站](games-site/README.md)。

2026-10-26 起 Web 试玩下线：介绍页的“在 TapTap 上试玩”按钮打开 https://www.taptap.cn/app/978232 ，不再挂载 iframe；主站与游戏站都不再生成 `/play/` 运行壳。R2 上的 0.3.6 构建保留，发布清单 `config/aaa-sewer-king.release.json` 和 `scripts/unity-r2.mjs`、`scripts/prepare-unity.mjs` 保留，供将来恢复 Web 试玩时使用。

- 介绍页：`/{locale}/games/aaa-sewer-king/`。
- 主站旧地址 `/{locale}/games/aaa-sewer-king/` 继续 301 到游戏站；主站和游戏站旧 `/play/` 入口均 301 到 TapTap。
- 资源放现有 R2/CDN 的独立版本目录；当前不再由 Pages 生成运行壳，也不再随构建更新。
- `aaa-sewer-king`、`runawayengine` 和 `booom2026` 的新旧独立游戏域名保持退役。

## 分享卡片

主站和游戏站在静态 HTML 中输出 Open Graph 与 X 大图卡片信息。主站各语言共用英文名片模式的 1200 × 630 截图 `public/images/social/home-card-en.png`，卡片标题与描述仍随链接语言切换。当前封面在名片模式基础上将文字和场景取景下移约 25 像素，并稍微压暗简介背后的背景；这些调整只用于分享封面。更新封面时打开英文首页，按 Alt + 反引号键切入名片模式，隐藏导航和作品列表后截图；保留文件名，或同时修改 `app/i18n/metadata.ts` 的引用。游戏站使用现有宣传插画。图鉴首页使用 `public/social/atlas.png`，风格与游戏详情页使用各自的真实截图，随图鉴发布快照一起同步。

## 🌐 多语言

支持 4 个语种：简体中文、繁体中文、英语、日语。导航栏使用语言下拉选框；界面、项目标题与描述、笔记摘录以及页面元信息一起切换。

- 首次访问无语言前缀的首页：按 Cloudflare 的访问地区选择语言；地区没有映射时参考浏览器语言，最终使用英语。
- 手动选择会保存一年，并优先于地区判断；直接打开某个语言的链接时尊重该链接。
- 切换语言保留当前子页面、查询参数与锚点。
- 原始内容和链接存放在 `app/content/home.ts`，译文存放在 `app/i18n/messages/`，通过稳定 ID 关联。内容缺译时逐字段回退英语，再回退原始内容。
- 本地化规则见 [AGENTS.md](AGENTS.md)，包括必须使用下拉选框的约束。

验证方式：

```bash
npm test
npm run build
npm start
# 在另一个终端检查 4 个语言页面及跳转
npm run test:site
```

`test:site` 默认访问 `http://localhost:3456`，可通过 `TEST_BASE_URL` 修改为 Pages 预览或正式站。国家与浏览器语言回退通过单元测试验证；线上国家来自 Cloudflare，不能通过伪造请求头模拟。自动跳转使用 `private, no-store`，避免公共缓存固定访客的语言。

## 🔗 链接

- **X**: https://x.com/JupiterTheWL
- **GitHub**: https://github.com/JupiterTheWarlock
- **itch.io**: https://jupiter-the-warlock.itch.io/
- **Makerworld**: https://makerworld.com.cn/zh/@JtheWL
- **博客**: https://blog.jupiterthewarlock.com

## 📄 许可

© 2025 Jupiter The Warlock. All rights reserved.
