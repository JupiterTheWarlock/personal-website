export type LocaleKey = 'zh-CN' | 'en-US';

export interface ContentCardData {
  title: string;
  description: string;
  image?: string;
  url: string;
}

export const games: ContentCardData[] = [
  {
    title: '你抛不过我你信吗？',
    description: '一款通过锚定陨石来给飞船旋转充能加速的街机游戏。2026 CiGA Game Jam 广州站作品。',
    image: 'https://img.itch.zone/aW1nLzI4MzI5NDU0LnBuZw==/original/8R98el.png',
    url: 'https://ostrich-hermit.itch.io/2026cgj',
  },
  {
    title: '矩形之巢+分形之巢+矩形之墓+茧+天空匣',
    description: '当你走进矩形之巢时，它就不会只是矩形之巢了。',
    image: 'https://img.itch.zone/aW1nLzIwNDMwNDkyLnBuZw==/original/jy5pVb.png',
    url: 'https://jupiter-the-warlock.itch.io/nest-of-rectangles',
  },
  {
    title: '野食狂想曲YeShit Rhapsody',
    description: '东汉末年，局势动荡，战事连连，民不聊生，食不果腹。穷途末路的三人逃到深山中，吃起了屎。',
    image: 'https://img.itch.zone/aW1nLzE3MTI2NTQ1LnBuZw==/original/fos7%2FL.png',
    url: 'https://jupiter-the-warlock.itch.io/yeshit-rhapsody',
  },
  {
    title: '咸鱼不想死The Reluctant Salted Fish',
    description: '2024GGJ活动作品，获得广州攻壳站投票第四',
    image: 'https://img.itch.zone/aW1nLzE0OTM5ODkyLnBuZw==/original/kNZy2N.png',
    url: 'https://jupiter-the-warlock.itch.io/the-reluctant-salted-fish',
  },
  {
    title: 'Single-vector Strike',
    description: 'Escape the Single-vector Strike',
    image: 'https://img.itch.zone/aW1nLzIwMTgxMjU3LnBuZw==/original/pMZsrs.png',
    url: 'https://jupiter-the-warlock.itch.io/single-vector-strike',
  },
  {
    title: '石油之王',
    description: '2025GGJ作品，支持2-4人本地联机游玩（仅支持手柄）',
    image: 'https://img.itch.zone/aW1nLzE5NDYxMjMwLnBuZw==/original/BdTW1G.png',
    url: 'https://jupiter-the-warlock.itch.io/kingofpetroleum',
  },
  {
    title: '诸天尽头的垃圾场',
    description: '使用诸天万界产生的垃圾，供养诸天万界！',
    image: 'https://img.itch.zone/aW1nLzE5MjYzNDU2LnBuZw==/original/xxFdsS.png',
    url: 'https://jupiter-the-warlock.itch.io/thejunkyardoftheend',
  },
];

export const explorations: ContentCardData[] = [
  {
    title: 'godot-game-dev-skill',
    description: 'Portable Godot game development knowledge skill for AI coding agents',
    image: 'https://opengraph.githubassets.com/1/JupiterTheWarlock/godot-game-dev-skill',
    url: 'https://github.com/JupiterTheWarlock/godot-game-dev-skill',
  },
  {
    title: 'game-design-skill',
    description: 'Source-grounded game design methodology distilled from Claude-Code-Game-Studios for Claude Code and Codex.',
    image: 'https://opengraph.githubassets.com/1/JupiterTheWarlock/game-design-skill',
    url: 'https://github.com/JupiterTheWarlock/game-design-skill',
  },
  {
    title: 'llm-wiki-cli',
    description: 'AI-native personal knowledge engine CLI',
    image: 'https://opengraph.githubassets.com/1/JupiterTheWarlock/llm-wiki-cli',
    url: 'https://github.com/JupiterTheWarlock/llm-wiki-cli',
  },
  {
    title: 'jthewl-skills',
    description: '术士木星的个人 Agent Skills Marketplace',
    image: 'https://opengraph.githubassets.com/1/JupiterTheWarlock/jthewl-skills',
    url: 'https://github.com/JupiterTheWarlock/jthewl-skills',
  },
];

export const notes: ContentCardData[] = [
  {
    title: 'AI 原生游戏中的 Cognitive Harness 与 AI Feel Loop',
    description: 'AI 原生游戏的重点不是让 AI 主导游戏，而是在传统游戏运行时之上，构建一套能够进行上下文调度、工具暴露和反馈回填的 Cognitive Harness。AI 不是世界主机，传统游戏运行时才是。',
    url: 'https://blog.jthewl.cc/文章/AI原生游戏_Cognitive_Harness与AI_Feel_Loop',
  },
];

export const avatarUrl = 'https://cfr2cdn.jthewl.cc/头像.jpg';
