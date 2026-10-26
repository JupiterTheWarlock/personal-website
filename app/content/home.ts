export interface ContentCardData {
  id: string;
  title: string;
  description: string;
  image?: string;
  imageFit?: 'contain';
  url: string;
}

const pixelCosmosStudio: ContentCardData = {
  id: 'pixel-cosmos-studio',
  title: 'Pixel Cosmos Studio',
  description: '生成像素与体素星球、动态云层和星空天空盒，并导出游戏可用素材。',
  image: 'https://img.itch.zone/aW1nLzMwMzk5NDE4LnBuZw==/original/Wxb%2BpQ.png',
  imageFit: 'contain',
  url: 'https://jupiter-the-warlock.itch.io/pixel-cosmos-studio',
};

export const games: ContentCardData[] = [
  {
    id: 'aaa-sewer-king',
    title: 'AAA下水道清理大王',
    description: '弹珠清污，收工升级，再下一口井。',
    // Approved promotional illustration from the game's 0.3.6 handoff.
    image: '/images/games/aaa-sewer-king-promo-zh-CN.jpg',
    imageFit: 'contain',
    url: 'https://games.jupiterthewarlock.com/aaa-sewer-king/',
  },
  {
    id: 'orbital-throw',
    title: '你抛不过我你信吗？',
    description: '一款通过锚定陨石来给飞船旋转充能加速的街机游戏。2026 CiGA Game Jam 广州站作品。',
    image: 'https://img.itch.zone/aW1nLzI4MzI5NDU0LnBuZw==/original/8R98el.png',
    url: 'https://ostrich-hermit.itch.io/2026cgj',
  },
  {
    id: 'nest-of-rectangles',
    title: '矩形之巢+分形之巢+矩形之墓+茧+天空匣',
    description: '当你走进矩形之巢时，它就不会只是矩形之巢了。',
    image: 'https://img.itch.zone/aW1nLzIwNDMwNDkyLnBuZw==/original/jy5pVb.png',
    url: 'https://jupiter-the-warlock.itch.io/nest-of-rectangles',
  },
  {
    id: 'yeshit-rhapsody',
    title: '野食狂想曲YeShit Rhapsody',
    description: '东汉末年，局势动荡，战事连连，民不聊生，食不果腹。穷途末路的三人逃到深山中，吃起了屎。',
    image: 'https://img.itch.zone/aW1nLzE3MTI2NTQ1LnBuZw==/original/fos7%2FL.png',
    url: 'https://jupiter-the-warlock.itch.io/yeshit-rhapsody',
  },
  {
    id: 'reluctant-salted-fish',
    title: '咸鱼不想死The Reluctant Salted Fish',
    description: '2024GGJ活动作品，获得广州攻壳站投票第四',
    image: 'https://img.itch.zone/aW1nLzE0OTM5ODkyLnBuZw==/original/kNZy2N.png',
    url: 'https://jupiter-the-warlock.itch.io/the-reluctant-salted-fish',
  },
  {
    id: 'single-vector-strike',
    title: 'Single-vector Strike',
    description: 'Escape the Single-vector Strike',
    image: 'https://img.itch.zone/aW1nLzIwMTgxMjU3LnBuZw==/original/pMZsrs.png',
    url: 'https://jupiter-the-warlock.itch.io/single-vector-strike',
  },
  {
    id: 'king-of-petroleum',
    title: '石油之王',
    description: '2025GGJ作品，支持2-4人本地联机游玩（仅支持手柄）',
    image: 'https://img.itch.zone/aW1nLzE5NDYxMjMwLnBuZw==/original/BdTW1G.png',
    url: 'https://jupiter-the-warlock.itch.io/kingofpetroleum',
  },
];

export const tools: ContentCardData[] = [
  {
    id: 'art-inspiration',
    title: '73 种 2D 美术风格图鉴',
    description: '把 Tim Ruswick 的美术风格视频整理成图鉴，按图选风格，复制中文提示词。',
    image: 'https://artstyles.jupiterthewarlock.com/media/social/index.jpg',
    imageFit: 'contain',
    url: 'https://artstyles.jupiterthewarlock.com/',
  },
  {
    id: 'spotlight-gamejam-2026',
    title: '聚光灯2026gamejam 排行榜',
    description: '查看本届作品的热度、关注与评分，按类型、开发方式和平台筛选。数据缓存在自己的浏览器。',
    url: 'https://spotlight.jupiterthewarlock.com',
  },
  {
    id: 'game-art-style',
    title: '美术风格图鉴',
    description: '按风格浏览游戏画面，查看并复制美术与场景提示词。',
    url: '/gameartstyle/',
  },
  pixelCosmosStudio,
];

export const explorations: ContentCardData[] = [
  {
    id: 'godot-game-dev-skill',
    title: 'godot-game-dev-skill',
    description: 'Portable Godot game development knowledge skill for AI coding agents',
    image: 'https://opengraph.githubassets.com/1/JupiterTheWarlock/godot-game-dev-skill',
    url: 'https://github.com/JupiterTheWarlock/godot-game-dev-skill',
  },
  {
    id: 'game-design-skill',
    title: 'game-design-skill',
    description: 'Source-grounded game design methodology distilled from Claude-Code-Game-Studios for Claude Code and Codex.',
    image: 'https://opengraph.githubassets.com/1/JupiterTheWarlock/game-design-skill',
    url: 'https://github.com/JupiterTheWarlock/game-design-skill',
  },
  {
    id: 'llm-wiki-cli',
    title: 'llm-wiki-cli',
    description: 'AI-native personal knowledge engine CLI',
    image: 'https://opengraph.githubassets.com/1/JupiterTheWarlock/llm-wiki-cli',
    url: 'https://github.com/JupiterTheWarlock/llm-wiki-cli',
  },
  {
    id: 'jthewl-skills',
    title: 'jthewl-skills',
    description: '术士木星的个人 Agent Skills Marketplace',
    image: 'https://opengraph.githubassets.com/1/JupiterTheWarlock/jthewl-skills',
    url: 'https://github.com/JupiterTheWarlock/jthewl-skills',
  },
];

export const notes: ContentCardData[] = [
  {
    id: 'ai-game-music',
    title: '用AI零基础做出像《小丑牌》一样的游戏配乐',
    description: '我一直很羡慕那些一听就能认出来的游戏音乐。画面都不用出现，前几个音一响，玩过的人就知道是哪款游戏',
    // Original X article cover: https://pbs.twimg.com/media/HSeS6FubEAAjNTO?format=jpg&name=orig
    image: '/images/notes/ai-game-music.jpg',
    url: 'https://x.com/JupiterTheWL/status/2100813911104872633?s=20',
  },
  {
    id: 'ai-native-game',
    title: 'AI 原生游戏不是让 AI 接管世界',
    description: '我现在越来越觉得，很多关于 AI 原生游戏的讨论，一开始就把问题想偏了。',
    // Original X article cover: https://pbs.twimg.com/media/HKT7r0vbIAAymdg?format=jpg&name=orig
    image: '/images/notes/ai-native-game.jpg',
    url: 'https://x.com/JupiterTheWL/status/2064052795721085254?s=20',
  },
];

export const avatarUrl = 'https://cfr2cdn.jthewl.cc/头像.jpg';
