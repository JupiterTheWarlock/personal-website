'use client';

/* eslint-disable @next/next/no-img-element */
import AsciiBackground from '@/components/three/AsciiBackground';
import SocialLinks from './SocialLinks';

interface ProjectLink {
  name: string;
  url: string;
  cover: string;
}

interface HomeContentProps {
  locale: string;
  translations: {
    title: string;
    projects: ProjectLink[];
  };
}

// Match editorial copy by URL rather than position: locale lists can have different orders.
const selectedGames = [
  {
    url: 'https://ostrich-hermit.itch.io/2026cgj',
    title: { zh: '你抛不过我你信吗？', en: '你抛不过我你信吗？' },
    context: { zh: '2026 CiGA Game Jam · 与鸵鸟居士合作', en: '2026 CiGA Game Jam · with Ostrich Hermit' },
    summary: {
      zh: '锚定陨石，让飞船旋转蓄力，再把自己甩出去。一款围绕旋转与加速展开的街机游戏。',
      en: 'Anchor to an asteroid, spin to build speed, then fling your ship into space. An arcade game built around rotation and acceleration.',
    },
  },
  {
    url: 'https://jupiter-the-warlock.itch.io/nest-of-rectangles',
    title: { zh: '矩形之巢与其他几何实验', en: 'Nest of Rectangles & other experiments' },
    context: { zh: '几何小游戏合集', en: 'A collection of geometric games' },
    summary: {
      zh: '从矩形之巢到天空匣，一组围绕几何、嵌套空间和增殖规则展开的小游戏。',
      en: 'From Nest of Rectangles to Skybox: small games exploring geometry, nested spaces, and rules of multiplication.',
    },
  },
];

export default function HomeContent({ locale, translations: t }: HomeContentProps) {
  const isZh = locale === 'zh-CN';
  const lang = isZh ? 'zh' : 'en';
  const featuredProjects = selectedGames.flatMap((copy) => {
    const project = t.projects.find((item) => item.url === copy.url);
    return project ? [{ ...project, ...copy }] : [];
  });
  const otherProjects = t.projects.filter((project) => !selectedGames.some((item) => item.url === project.url));

  return (
    <div className="home-shell">
      <section id="home" className="lab-hero">
        <div className="hero-copy">
          <p className="eyebrow">JUPITER THE WARLOCK</p>
          <h1>{t.title}</h1>
          <p className="hero-subtitle">{isZh ? '独立游戏开发者' : 'Indie game developer'}</p>
          <p className="hero-lede">
            {isZh
              ? '做小游戏，参加 Game Jam，也探索 AI 能怎样参与玩法。这里放我的作品和开发中的思考。'
              : 'I make small games, take part in game jams, and explore how AI can become part of play. Here are my games and notes along the way.'}
          </p>
          <div className="hero-actions" aria-label={isZh ? '主要操作' : 'Primary actions'}>
            <a className="button-primary" href="#work">{isZh ? '看看我的游戏 ↓' : 'Explore my games ↓'}</a>
            <a className="button-secondary" href="https://blog.jthewl.cc" target="_blank" rel="noopener noreferrer">
              {isZh ? '读博客 ↗' : 'Read my blog ↗'}
            </a>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <AsciiBackground className="hero-jupiter" asciiEnabled={true} />
          <div className="planet-caption"><span>JUPITER / 木星</span></div>
        </div>
      </section>

      <section id="work" className="lab-section">
        <div className="section-heading">
          <p className="eyebrow">01 / GAMES</p>
          <h2>{isZh ? '从这两款开始' : 'Start with these two'}</h2>
          <p>{isZh ? '一个关于把自己甩出去，一个关于空间里的几何规则。' : 'One about flinging yourself through space. The other about the rules inside it.'}</p>
        </div>
        <div className="featured-grid">
          {featuredProjects.map((project, index) => (
            <a key={project.url} className="game-card" href={project.url} target="_blank" rel="noopener noreferrer">
              <span className="media-frame"><img src={project.cover} alt="" loading={index === 0 ? 'eager' : 'lazy'} /></span>
              <span className="game-card-body">
                <span className="card-meta">{project.context[lang]}</span>
                <strong>{project.title[lang]}</strong>
                <span>{project.summary[lang]}</span>
                <span className="game-action">{isZh ? '去 itch.io 试玩 ↗' : 'Play on itch.io ↗'}</span>
              </span>
            </a>
          ))}
        </div>
        <details className="other-games">
          <summary>{isZh ? `其他游戏与原型（${otherProjects.length}）` : `More games & prototypes (${otherProjects.length})`}</summary>
          <div className="atlas-grid">
            {otherProjects.map((project) => (
              <a key={project.url} className="atlas-card" href={project.url} target="_blank" rel="noopener noreferrer">
                <img src={project.cover} alt="" loading="lazy" />
                <span><strong>{project.name}</strong><small>{isZh ? '查看游戏 ↗' : 'View game ↗'}</small></span>
              </a>
            ))}
          </div>
        </details>
      </section>

      <section id="exploring" className="lab-section exploring-section">
        <div className="section-heading">
          <p className="eyebrow">02 / EXPLORING</p>
          <h2>{isZh ? '游戏之外，也在折腾这些' : 'Beyond the games'}</h2>
        </div>
        <div className="exploring-copy">
          <p>{isZh
            ? '我在探索 AI 参与玩法的方式：游戏什么时候调用它，它能改变什么，以及结果怎样回到游戏里。这些问题还在尝试中，我把思考写在博客里。'
            : 'I am exploring how AI can take part in play: when a game calls it, what it can change, and how the result returns to the game. These are open questions; I write about them on my blog.'}</p>
          <p>{isZh
            ? '也会捣鼓自托管和自动化，给自己的开发流程做一些工具。'
            : 'I also tinker with self-hosting and automation, making tools for my own development workflow.'}</p>
        </div>
      </section>

      <section id="notes" className="lab-section">
        <div className="section-heading">
          <p className="eyebrow">03 / NOTES</p>
          <h2>{isZh ? '写下来的思考' : 'Notes along the way'}</h2>
        </div>
        <a className="note-row" href="https://blog.jthewl.cc/文章/AI原生游戏_Cognitive_Harness与AI_Feel_Loop" target="_blank" rel="noopener noreferrer">
          <span>{isZh ? 'AI 与游戏' : 'AI & games · Chinese'}</span>
          <strong>{isZh ? 'AI 原生游戏中的 Cognitive Harness 与 AI Feel Loop' : 'Cognitive Harness & AI Feel Loop in AI-native games'}</strong>
          <p>{isZh ? '不让 AI 接管整个世界，而是讨论如何把它接入游戏循环：给什么信息、允许什么操作、如何验证结果。' : 'Rather than handing the world to AI, how do we connect it to a game loop: what information to give it, which actions to allow, and how to validate the result?'}</p>
          <span className="note-action">{isZh ? '阅读全文 ↗' : 'Read the essay ↗'}</span>
        </a>
      </section>

      <section id="contact" className="lab-section contact-band">
        <div>
          <p className="eyebrow">04 / SAY HELLO</p>
          <h2>{isZh ? '来聊聊' : 'Say hello'}</h2>
          <p className="contact-copy">{isZh ? '想聊游戏、交流开发经验，或者一起参加 Game Jam，欢迎联系我。' : 'Want to talk games, swap development notes, or team up for a game jam? Get in touch.'}</p>
          <a className="contact-email" href="mailto:jupiterthewarlock679@gmail.com">jupiterthewarlock679@gmail.com ↗</a>
          <div className="personal-links">
            <a href="https://stars.jthewl.cc" target="_blank" rel="noopener noreferrer">{isZh ? '我收藏的开源项目 ↗' : 'My open-source bookmarks ↗'}</a>
          </div>
        </div>
        <SocialLinks />
      </section>
    </div>
  );
}
