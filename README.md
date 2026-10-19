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

### Unity 游戏接入约定

以下是交付接口，待游戏会话提供并验证 Unity 0.3.6 Web 包后接入；当前没有发布占位介绍页或无效试玩按钮。

- 介绍页：`/{locale}/games/aaa-sewer-king/`。
- 运行入口：`/games/aaa-sewer-king/play/index.html`。Pages 会规范跳转到同目录 `/games/aaa-sewer-king/play/`；目录跨版本保持不变，也不随语言变化，避免浏览器存档分散。
- 按游戏会话的更新接口，介绍页挂载 iframe 前先卸载垃圾场背景，关闭游戏后恢复；父页同时校验消息的 `origin` 和 iframe `source`，主动移除 iframe 时自行恢复背景。另提供独立打开运行入口。此交互将在正式包验收后接入。
- 资源放现有 R2/CDN 的独立版本目录，包含内容哈希的目录不可覆盖；Pages 只生成固定路径的运行壳。不将 Unity 工程、大型构建产物或未完成的 `web-r4` 加入本仓库。
- `scripts/unity-r2.mjs` 准备清单、配置 CORS、上传与检查；`scripts/prepare-unity.mjs` 在 Pages 构建时读取已批准的发布清单，校验运行壳的 SHA-256，再把 loader、data、framework、wasm 和 StreamingAssets URL 接到该版本的 CDN。
- 发布清单 `config/aaa-sewer-king.release.json` 尚不存在，因此当前构建不会生成游戏运行页。完整步骤见 [Unity 发布说明](docs/unity-r2-release.md)。
- `aaa-sewer-king`、`runawayengine` 和 `booom2026` 的新旧独立游戏域名保持退役。

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
