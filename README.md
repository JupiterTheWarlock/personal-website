# Jupiter The Warlock - Personal Website

> ASCII 风格个人网站 | Indie Game Developer's Personal Website

## 🎨 风格

- **主题**: ASCII 码风格 + 暗黑模式
- **灵感**: 终端界面、Cyberpunk UI、Retro Terminal
- **视觉效果**: CRT 扫描线、Glow 发光、闪烁光标

## 🛠️ 技术栈

- **框架**: Next.js 14.2.15 (修复 CVE-2025-66478)
- **语言**: TypeScript
- **样式**: Tailwind CSS 3.4.17
- **部署**: GitHub Pages / Vercel

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
├── vercel.json           # Vercel 配置
├── .nvmrc               # Node 版本 (18)
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

# 启动生产服务器
npm start
```

## 📦 部署

### GitHub Pages

1. 构建静态网站:
```bash
npm run build
```

2. 推送到 GitHub

3. 在 GitHub 仓库设置中启用 GitHub Pages:
   - Settings → Pages
   - Source: `main` 分支
   - Root: `/`

### Vercel

Vercel 应该会自动检测到新提交并部署。

如果需要手动触发：
1. 访问：https://vercel.com/dashboard
2. 选择项目：`JupiterTheWarlock/personal-website`
3. 点击 "Redeploy" → "Redeploy to Production"

## 🌐 多语言

支持 9 个语种：简体中文、繁体中文、英语、日语、韩语、德语、法语、西班牙语、葡萄牙语。导航栏使用语言下拉选框；界面、项目标题与描述、笔记摘录以及页面元信息一起切换。

- 首次访问无语言前缀的首页：按 Vercel 的访问地区选择语言；地区没有映射时参考浏览器语言，最终使用英语。
- 手动选择会保存一年，并优先于地区判断；直接打开某个语言的链接时尊重该链接。
- 切换语言保留当前子页面、查询参数与锚点。
- 原始内容和链接存放在 `app/content/home.ts`，译文存放在 `app/i18n/messages/`，通过稳定 ID 关联。内容缺译时逐字段回退英语，再回退原始内容。
- 本地化规则见 [AGENTS.md](AGENTS.md)，包括必须使用下拉选框的约束。

验证方式：

```bash
npm test
npm run build
npm start -- -p 3456
# 在另一个终端检查 9 个语言页面及地区跳转
npm run test:site
```

`test:site` 默认访问 `http://localhost:3456`，可通过 `TEST_BASE_URL` 修改。地区模拟使用 `x-vercel-ip-country` 请求头，应在本地运行；Vercel 在线环境使用平台提供的真实地区信息。

## 🔗 链接

- **X**: https://x.com/JupiterTheWL
- **GitHub**: https://github.com/JupiterTheWarlock
- **itch.io**: https://jupiter-the-warlock.itch.io/
- **Makerworld**: https://makerworld.com.cn/zh/@JtheWL
- **博客**: https://blog.jthewl.cc

## 📄 许可

© 2025 Jupiter The Warlock. All rights reserved.
