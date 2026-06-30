# 个人网站全面重构建议

日期：2026-07-01  
对象：`personal-website` 最新 `origin/main`，提交 `b35fc88`  
目标：从“修补当前 ASCII 终端页”转为“重新设计一个更强的个人品牌入口”。

## 一句话判断

当前网站的问题不是某个按钮、木星或 PPT 翻页单点做坏了，而是整站的表达重心错了：它更像一个技术 demo，把“ASCII + 木星 + 终端风”放在最前面，但没有把最该被看见的东西放到最前面。

更好的方向应该是：

> 让访客在 10 秒内理解：术士木星是谁，正在做什么游戏，为什么这个人的 AI-native 创作方式值得关注，下一步可以去哪里试玩、阅读或联系。

推荐重构成 **AI-Native Game Lab / Jupiter Control Deck**：一个暗色、橙色、终端感的个人作品入口，但内容组织按游戏作品集和创作者主页来做，不再按“PPT 翻页 + 卡片堆叠”来做。

## 外部案例给出的原则

我查了 portfolio / game developer portfolio 的当前案例和指南，结论比较一致：

- Awwwards 的 portfolio 分类把 portfolio 定义为“展示作品的创意媒介”，核心是内容展示，不是装饰本身。
- Figma 的 portfolio 指南强调：精选最能代表当前能力和目标机会的作品，给强项目描述，体现个人品牌，并定期更新。
- UXfolio 的 digital portfolio 指南把最低结构归纳为：短介绍、精选作品、清晰联系方式；很多领域还需要结构化 case study。
- Creative Bloq 的 2026 作品集案例反复出现两个方向：要么让作品自己说话，要么用清晰人格和方法论增强记忆点。
- Game developer portfolio 相关指南更明确：项目需要截图、GIF、视频、试玩链接、你的角色和贡献说明；作品集是“证据”，不是简历复述。

对你的站来说，最关键的是最后一点：你是独立游戏开发者，当前首页却没有让游戏本身真正成为主角。

参考来源：

- [Awwwards Portfolio Websites](https://www.awwwards.com/websites/portfolio/)
- [Figma Portfolio Website Examples & Tips](https://www.figma.com/resource-library/portfolio-website-examples/)
- [UXfolio Digital Portfolio Best Practices](https://blog.uxfol.io/digital-portfolio/)
- [Creative Bloq Design Portfolio Examples 2026](https://www.creativebloq.com/portfolios/examples-712368)
- [SiteBuilderReport Game Developer Portfolios 2026](https://www.sitebuilderreport.com/inspiration/game-developer-portfolios)
- [Alexia Mandeville: How to Make a Great Game Design Portfolio](https://alexiamandeville.medium.com/how-to-make-a-great-game-design-portfolio-14169d6838fb)
- [Linden Reid: Game Dev Portfolio Guide](https://lindenreidblog.com/2019/02/24/game-dev-portfolio-guide/)
- [Game Design Skills Portfolio Guide](https://gamedesignskills.com/game-design/portfolio/)

## 当前站为什么显得“不太行”

### 1. 视觉风格抢了内容的工作

现在的第一印象是“暗色终端 + ASCII 木星”，但不是“这个人做了什么有意思的游戏”。风格本身没有错，问题是它没有服务内容。

木星是一个好品牌资产，但当前像背景噪声：太暗，又穿过标题和卡片。它既没有成为主视觉，也没有退到干净背景。

### 2. 首页没有足够强的作品证据

现在的项目区是封面图 + 名字，缺少：

- 游戏类型和玩法一句话
- 你在项目中的角色
- 试玩入口的优先级
- GIF / trailer / gameplay 片段
- 为什么这个项目代表你

这会让页面像链接目录，而不是作品集。

### 3. “AI Native”是口号，还不是体验

“AI 接管低维，人类专注高维”很有辨识度，但现在只停留在文案。页面没有展示你的 AI-native 工作流、创作方法、工具链或实验痕迹。

如果这个是你的核心差异化，就应该被设计成一个可理解的 section，而不是 hero 下的一句话。

### 4. PPT 翻页限制了内容叙事

强制 scroll snap 会让每段像演示页，但你的内容不是 pitch deck。作品、文章、工具链、社交链接都需要自然浏览。现在的翻页样式反而制造“定位不准”和“内容被压进一屏”的问题。

### 5. 中文字体和终端字体混用不舒服

全站用 Courier 风格承载中文，中文标题会显得粗糙。终端风应该用在标签、路径、状态、代码化信息上；大标题和正文应该使用更清晰的中文字体栈。

## 三个可选重构方向

### 方向 A：AI-Native Game Lab（推荐）

定位：独立游戏开发者 + AI-native 创作者。

首页像一个“创作实验室入口”，第一屏直接展示你、当前主推游戏、试玩入口和创作宣言。视觉上保留暗色、橙色、木星、终端标签，但主体是游戏作品和创作方法。

优点：

- 最符合你现有身份和 slogans。
- 游戏作品能真正成为证据。
- 博客、Stars、工具链都能自然变成“实验室资产”。
- 不需要推倒技术栈，只是重构页面结构和组件。

缺点：

- 需要补作品描述、GIF 或短视频素材。
- 首页内容策展要更严格，不能所有项目平均展示。

### 方向 B：Playable Portfolio

定位：把个人站做成一个小游戏 / 交互空间。

访客通过键盘/鼠标进入一个“木星空间站”，点击不同模块进入游戏、博客、工具、联系方式。

优点：

- 很有记忆点，适合游戏开发者。
- 能把 Three.js 和终端风用得更合理。

缺点：

- 成本高，移动端和可访问性风险大。
- 如果交互不够顺，会比普通页面更难用。
- 需要更多验证，不适合作为第一轮重构。

### 方向 C：Personal Command Center

定位：开发者控制台 / 个人操作系统。

首屏就是一个真实 dashboard：项目、文章、工具、链接、状态全部像文件浏览器和任务面板一样组织。

优点：

- 和你的工具链、skills、LLM wiki、StarsBoard 很搭。
- 终端风最自然。

缺点：

- 对“游戏开发者作品集”的展示力偏弱。
- 容易继续走向信息密度太高、作品不突出的老问题。

## 推荐方案：AI-Native Game Lab / Jupiter Control Deck

这个方案的核心不是“更酷”，而是重新分配注意力：

1. 第一层：你是谁，你做什么，立即可试玩什么。
2. 第二层：你的代表游戏，用动图/视频/截图证明。
3. 第三层：你的 AI-native 创作方法，解释差异化。
4. 第四层：你的文章、工具和公开资产，展示持续输出。
5. 第五层：联系和社交入口。

视觉上可以继续保留：

- Claude Code Orange
- 深黑背景
- 木星和轨道
- 终端标签、路径、状态文本
- 少量 ASCII texture

但要删除或弱化：

- 全站固定背景木星
- 所有 section 都包大 card
- 强制 PPT scroll snap
- 全站 Courier 中文
- 过多等权卡片

## 新首页结构

### 1. Hero：不是封面，是入口

目标：10 秒内说清楚你是谁。

建议内容：

- `术士木星 / JupiterTheWarlock`
- `AI-native indie game developer`
- 一句中文主张：`用 AI 承接低维劳动，把人类注意力留给玩法、世界观和判断。`
- 两个主 CTA：`Play on itch.io`、`Read the Lab Notes`
- 一个次 CTA：`View Projects`

视觉：

- 左侧文字，右侧木星。
- 木星必须清晰可辨，不能穿过标题。
- 不要 hero console 抢首屏。
- 只保留 1 个“状态条”：`STATUS: prototyping games / collecting indie data / writing AI dev notes`

### 2. Featured Games：作品必须变成主角

首页只放 3 个精选项目，不要 6 个等权卡片。

每个项目包含：

- 大图 / GIF / 视频缩略图
- 游戏名
- 玩法一句话
- 你的角色：design / code / art / AI workflow / jam prototype
- 状态：released / prototype / jam / in progress
- CTA：Play / View on itch.io

建议布局：

- 第一张主推作品占大块。
- 两张次级作品并排或纵向。
- 移动端单列。

当前可选主推：

- `矩形之巢+分形之巢+矩形之墓+茧+天空匣`
- `野食狂想曲 YeShit Rhapsody`
- `咸鱼不想死 The Reluctant Salted Fish`

真正落地前需要你决定哪 1 个最代表现在的你。

### 3. AI-Native Workflow：把 slogan 做成内容

这个 section 是新的核心差异化。

建议结构：

```text
AI handles:
- scaffolding
- repetitive implementation
- variant exploration
- asset/data wrangling

Human keeps:
- taste
- judgment
- game feel
- systems direction
- final creative responsibility
```

视觉可以像一个小型流程图，但不要做成 PPT。用横向 pipeline 或终端日志：

`idea -> prototype -> playtest -> prune -> ship`

这里可以链接到博客文章，比如 AI coding、工具评测、游戏行业观察。

### 4. Project Atlas：完整作品库

这是替代当前 Projects section 的东西。

不再是简单 grid，而是“作品索引”：

- Featured
- Released
- Prototype
- Game Jam
- Tools / Experiments

每张卡片尺寸稳定，图像不溢出，标题可换行，长名字不要压坏布局。

如果项目数量继续变多，可以做一个轻量 filter；如果只有 6 个，先不要做复杂筛选。

### 5. Writing / Notes：把博客变成思想入口

当前站只给 Blog 一个卡片，太弱。你的内容主题里 AI 工具与游戏开发融合占比很高，应该让首页展示 3 篇代表性文章。

建议：

- `AI 工具与游戏开发`
- `游戏行业观察`
- `工具评测`

每篇显示标题、主题标签、简短摘要、阅读入口。第一版可以手写静态数据，不要急着拉博客 API。

### 6. Workshop / Links：站点和工具放到后面

Blog、Stars、GitHub、MakerWorld、Bilibili、Zhihu、Gcores 不应该和核心作品抢首屏。

建议组织成 “Workshop Links”：

- Blog：长文和实验记录
- Stars：工具偏好和开源收藏
- GitHub：代码与项目
- MakerWorld：硬件/3D 打印
- Social：分发渠道

这比“我的站点”更有品牌语义。

### 7. Contact：一句话 + 一个主联系方式

联系方式不要做一堆图标结束。建议：

- 一句话：`如果你想聊 AI-native 游戏开发、原型合作或奇怪玩法实验，可以直接发邮件。`
- 主 CTA：Email
- 次级：GitHub / X / itch.io

## 视觉系统建议

### 保留

- 深黑背景 `#0A0908`
- 橙色主 accent `#DA7756`
- 细边框、轻 glow、终端标签
- 木星作为品牌符号

### 增加

- 一个冷色辅助色，只用于状态和 hover：例如 muted cyan / steel blue。现在全站太橙黑，层次偏单一。
- 中文正文字体：系统 sans / Noto Sans SC。
- 终端字体只用于标签、状态、路径、按钮、代码化文本。
- 大量真实游戏图像、GIF、视频。

### 删除

- 全站 CRT scanline 常驻。可以只在 hero 很轻地使用，否则影响阅读和图片。
- hover 就整卡 glow。作品卡需要更稳，不要每个组件都发光。
- 固定长度 ASCII 横线。
- 全站 card 包 section。

## 木星应该怎么改

木星是好东西，但要从“全站背景”改成“首屏主视觉资产”。

建议：

1. Hero 中木星清晰显示，右侧占 35% 到 45% 宽度。
2. 文字区域和木星区域不重叠。
3. 后续 section 不再显示大木星，只保留很弱的星点或静态纹理。
4. 移动端只显示木星局部，不追求完整球体。
5. 提供 `prefers-reduced-motion` 降级：减少旋转、关闭 ASCII postprocessing。

如果继续用 Three.js，应该让 3D 只服务 hero，不要作为全页面固定 canvas。

## 导航建议

当前导航像“链接集合”，重构后应该是“页面地图”：

- Work
- Method
- Notes
- Workshop
- Contact

外链不要都放 nav。`Blog`、`Stars`、`itch.io` 可以在对应 section 出现。

语言切换移动端只显示：

- `中`
- `EN`

不要占两行。

## 信息架构和数据建议

现在内容散落在：

- `app/[locale]/page.tsx`
- `app/i18n/*.json`
- consensus `profile.json`

建议做一个简单内容层，不要加 CMS：

```text
app/content/profile.ts
app/content/projects.ts
app/content/links.ts
app/content/articles.ts
```

个人身份、社交链接、网站描述以 consensus 为准。项目和文章可以先手写静态数据。以后如果要接 blog feed 再说。

项目数据最少字段：

```ts
{
  title: string;
  slug: string;
  url: string;
  cover: string;
  media?: string;
  status: 'released' | 'prototype' | 'jam';
  roles: string[];
  tags: string[];
  summary: string;
  featured?: boolean;
}
```

## 页面组件建议

第一版只需要这些组件：

- `Hero`
- `FeaturedGames`
- `WorkflowSection`
- `ProjectAtlas`
- `WritingNotes`
- `WorkshopLinks`
- `ContactBand`
- `SiteHeader`

不要先做复杂动画框架、主题系统、CMS、实时 API。

## 落地阶段

### Phase 1：重构首页信息架构

目标：不用新增依赖，先把页面变好看、变清楚。

- 删除全站 scroll snap。
- 拆出首页组件。
- Hero 改为清晰左右构图。
- Featured Games 改为 3 个精选作品。
- 修移动端横向溢出。
- 修字体栈。

验收：

- 390px 无横向滚动。
- 首屏一眼能看出“AI-native 独立游戏开发者”。
- 游戏作品在首屏下方立即出现。

### Phase 2：补作品证据

目标：让作品集不像链接目录。

- 给每个游戏补 summary、roles、tags、status。
- 至少给 3 个精选项目补 GIF 或短视频。
- 每个项目卡片有 Play CTA。

验收：

- 不打开 itch.io，也能理解每个项目大概是什么。
- 首页只有精选，完整作品库在后面。

### Phase 3：做 AI-native 方法论 section

目标：把 slogan 变成个人品牌资产。

- 加 workflow pipeline。
- 加 2 到 3 篇代表性文章入口。
- 加工具链/创作系统说明。

验收：

- 访客能理解你不是泛泛地“用 AI”，而是有创作方法。

### Phase 4：再考虑强互动

目标：如果前三阶段稳定，再考虑更有记忆点的交互。

可选：

- Jupiter 视差。
- 项目 hover 播放 GIF。
- 命令面板式快捷导航。
- “Lab log” terminal 动效。

不要在 Phase 1 做这些。

## 推荐不要做

- 不要把整站做成真正的小游戏。成本高，第一轮不值。
- 不要保留现在的 PPT 翻页作为主交互。
- 不要把所有社交链接、站点链接、作品都放在同一层级。
- 不要让 Three.js 背景贯穿全站。
- 不要继续用全站 monospace 承载中文正文。

## 最小但变革性的第一版

如果只做一轮，我建议范围是：

1. 全站从 scroll-snap section 改成自然滚动 landing page。
2. Hero 变成“左文案 + 右木星 + 2 个 CTA”。
3. Projects 变成 Featured Games，大卡展示 3 个作品。
4. 加一个 AI-Native Workflow section。
5. Links 改成 Workshop Links。
6. 修移动端、字体、内容源。

这已经足够让网站从“暗色终端 demo”变成“有明确人格和作品证据的个人主页”。

## 最终判断

你的个人网站应该保留“术士木星”的怪、暗、技术味，但现在需要把怪味从背景装饰迁移到内容叙事里。

真正应该突出的不是 ASCII 效果，而是：

- 你做了哪些奇怪游戏。
- 你如何用 AI-native 方式做游戏。
- 你为什么持续观察和构建这套工具链。
- 访客下一步可以试玩、阅读、关注或联系你。

当前视觉方向可以保留 30%，信息架构应该重做 80%。
