# Personal Website 优化规划文档

> **项目**: Next.js 14.2.15 + TypeScript + Tailwind CSS
> **部署**: Vercel 静态导出
> **风格**: ASCII 暗黑主题 + 多语言支持

---

## 📋 问题清单

### 🔴 高优先级（P0）

#### 1. basePath 与 vercel.json 冲突
**问题描述**:
- `basePath: '/personal-website'` 在 `next.config.js` 中配置
- Vercel 部署时产生路径冲突，导致静态资源 404

**根本原因**:
```javascript
// next.config.js
module.exports = {
  basePath: '/personal-website',
  output: 'export',
  // ...
}
```

```json
// vercel.json
{
  "rewrites": [
    { "source": "/personal-website/:path*", "destination": "/:path*" }
  ]
}
```
- Vercel 自动处理 basePath，不需要手动 rewrite
- 双重重写导致路径错误

**解决方案**:
```json
// vercel.json - 简化配置
{
  "cleanUrls": true,
  "trailingSlash": false
}
```

**验证步骤**:
1. 删除 vercel.json 中的 rewrites 配置
2. 本地构建测试: `npm run build && npm run export`
3. 检查 `out/personal-website/` 目录结构
4. 部署后验证所有静态资源加载正常

---

#### 2. 图片优化关闭
**问题描述**:
```javascript
// next.config.js
images: {
  unoptimized: true  // ❌ 完全关闭优化
}
```

**影响**:
- 无自动 WebP/AVIF 转换
- 无响应式图片尺寸
- 无懒加载支持
- 增加 LCP (Largest Contentful Paint)

**解决方案**:
```javascript
// next.config.js
images: {
  unoptimized: false,
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
}
```

```tsx
// components/optimized-image.tsx
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = ''
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      // Use priority for above-fold images
      // priority={true}
    />
  )
}
```

**迁移步骤**:
1. 逐步替换 `<img>` 标签为 `next/image`
2. 为 Hero 图片添加 `priority` 属性
3. 其他图片使用懒加载
4. Lighthouse 验证性能提升

---

#### 3. async 静态导出问题
**问题描述**:
```tsx
// pages/_app.tsx 或类似文件
type AppProps = {
  Component: NextComponentType
  pageProps: any
  // ❌ async components not supported in static export
}

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
```

**错误表现**:
```
Error: async component support is not available in static export
```

**解决方案**:
```tsx
// pages/index.tsx - 移除顶层 async
import { GetStaticProps } from 'next'

interface HomePageProps {
  translations: Record<string, string>
}

export default function HomePage({ translations }: HomePageProps) {
  // ✅ 同步组件
  return (
    <main>
      <h1>{translations.title}</h1>
    </main>
  )
}

// ✅ 使用 getStaticProps 预加载数据
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const translations = await loadTranslations(locale)

  return {
    props: {
      translations
    }
  }
}
```

**检查清单**:
- [ ] 无顶层 `async function` 组件
- [ ] 使用 `getStaticProps` 预取数据
- [ ] 避免动态 `useEffect` 数据获取

---

### 🟡 中优先级（P1）

#### 4. 翻译数据内联优化
**问题描述**:
```tsx
// ❌ 翻译硬编码在组件内
const translations = {
  en: { title: 'Home', welcome: 'Welcome' },
  zh: { title: '首页', welcome: '欢迎' }
}

export function Header() {
  const t = translations[locale]
  return <h1>{t.title}</h1>
}
```

**问题**:
- 增加首屏 JS 体积
- 无法按语言代码分割
- 翻译更新需重新构建

**解决方案**:
```tsx
// lib/translations.ts
export async function getTranslations(locale: string) {
  switch (locale) {
    case 'en':
      return import('../locales/en.json')
    case 'zh':
      return import('../locales/zh.json')
    default:
      return import('../locales/en.json')
  }
}

// pages/_app.tsx
import { GetStaticProps } from 'next'

export const getStaticProps: GetStaticProps = async (ctx) => {
  const locale = ctx.locale || 'en'
  const translations = await getTranslations(locale)

  return {
    props: {
      translations
    }
  }
}
```

```json
// locales/en.json
{
  "nav": {
    "home": "Home",
    "about": "About"
  }
}
```

**优化效果**:
- 按语言动态导入
- 减少初始 JS 体积
- 便于后续接入 CMS

---

#### 5. 外部图标依赖替换
**问题描述**:
```tsx
// ❌ 依赖外部 CDN
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
```

**风险**:
- 外部服务故障导致图标丢失
- 增加 HTTP 请求
- GDPR 合规问题

**解决方案 A - 内联 SVG**:
```tsx
// components/icons/github-icon.tsx
export function GitHubIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  )
}
```

**解决方案 B - Lucide React**:
```bash
npm install lucide-react
```

```tsx
import { GitHub, Twitter, Mail } from 'lucide-react'

export function SocialLinks() {
  return (
    <div className="flex gap-4">
      <GitHub className="w-6 h-6" />
      <Twitter className="w-6 h-6" />
      <Mail className="w-6 h-6" />
    </div>
  )
}
```

**推荐**: Lucide React（更轻量，Tree-shakeable）

---

### 🟢 低优先级（P2）

#### 6. 响应式设计缺失
**问题描述**:
```css
/* ❌ 固定宽度 */
.container {
  width: 1200px;
  margin: 0 auto;
}
```

**解决方案**:
```tsx
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    }
  }
}
```

```tsx
// components/responsive-container.tsx
export function ResponsiveContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      {children}
    </div>
  )
}
```

**断点策略**:
- Mobile First: 默认移动端，`sm:` 以上升级
- ASCII Art: 小屏隐藏或简化
- 导航: 移动端汉堡菜单

---

#### 7. 可访问性改进
**当前问题**:
```tsx
// ❌ 缺少语义化
<div onClick={handleClick}>Click me</div>
<img src="logo.png" />
```

**优化方案**:
```tsx
// ✅ 语义化 + ARIA
<button
  onClick={handleClick}
  className="..."
  aria-label="Open navigation menu"
>
  <MenuIcon aria-hidden="true" />
</button>

<img
  src="logo.png"
  alt="Company logo"
  loading="lazy"
/>

// ✅ 跳过导航链接
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

**检查清单**:
- [ ] 键盘导航支持
- [ ] ARIA 标签完整
- [ ] 焦点管理正确
- [ ] 色彩对比度 > 4.5:1
- [ ] 屏幕阅读器测试通过

---

#### 8. 错误处理与监控
**添加错误边界**:
```tsx
// components/error-boundary.tsx
import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // 发送到监控服务
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
        </div>
      )
    }

    return this.props.children
  }
}
```

**使用示例**:
```tsx
// pages/_app.tsx
import { ErrorBoundary } from '@/components/error-boundary'

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  )
}
```

---

## 🚀 实施计划

### Phase 1: 修复 P0 问题（预计 2-3 天）
1. **Day 1**: 修复 basePath/vercel.json 冲突
   - 备份当前配置
   - 修改 vercel.json
   - 本地验证
   - 部署测试

2. **Day 2**: 启用图片优化
   - 更新 next.config.js
   - 创建 OptimizedImage 组件
   - 迁移 Hero 图片
   - 性能测试

3. **Day 3**: 修复 async 静态导出
   - 审查所有 async 组件
   - 迁移到 getStaticProps
   - 构建测试

### Phase 2: 优化 P1 问题（预计 3-4 天）
1. **Day 4-5**: 翻译数据分离
   - 创建 locales 目录
   - 迁移现有翻译
   - 更新加载逻辑

2. **Day 6-7**: 图标系统替换
   - 安装 lucide-react
   - 创建图标组件库
   - 替换外部依赖

### Phase 3: 改进 P2 问题（预计 2-3 天）
1. **Day 8-9**: 响应式重构
   - 审查断点需求
   - 更新 Tailwind 配置
   - 移动端测试

2. **Day 10**: 可访问性与错误处理
   - 添加 ErrorBoundary
   - ARIA 标签检查
   - 键盘导航测试

---

## ✅ 验证清单

### 构建验证
```bash
# 本地构建
npm run build

# 检查输出
ls -lh out/

# 静态资源检查
grep -r "personal-website" out/ | head -20
```

### 性能验证
```bash
# Lighthouse CI
npx lighthouse http://localhost:3000 --view

# 检查指标
# - Performance > 90
# - Accessibility > 90
# - Best Practices > 90
```

### 部署验证
```bash
# Vercel 部署后
curl -I https://your-domain.vercel.app/personal-website/

# 检查资源加载
curl -s https://your-domain.vercel.app/personal-website/ | grep -o 'href="[^"]*"' | head -10
```

---

## 📚 参考资源

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Vercel Deployment Guide](https://vercel.com/docs/frameworks/nextjs)
- [Web.dev Accessibility Guide](https://web.dev/accessibility/)
- [Lighthouse Performance](https://web.dev/performance/)

---

**最后更新**: 2026-01-29
**维护者**: Io (Claude Code)
**状态**: Ready for Implementation
