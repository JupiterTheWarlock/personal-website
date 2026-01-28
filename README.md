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

支持中英文切换:
- 中文 (zh-CN)
- 英文 (en-US)

## 🔗 链接

- **X**: https://x.com/JupiterTheWL
- **GitHub**: https://github.com/JupiterTheWarlock
- **itch.io**: https://jupiter-the-warlock.itch.io/
- **Makerworld**: https://makerworld.com.cn/zh/@JtheWL
- **博客**: https://blog.jthewl.cc

## 📄 许可

© 2025 Jupiter The Warlock. All rights reserved.
