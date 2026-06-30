'use client';

/* eslint-disable @next/next/no-img-element */
import AsciiBackground from '@/components/three/AsciiBackground';
import SocialLinks from './SocialLinks';

interface SiteLink {
  name: string;
  url: string;
  description: string;
  ascii: string;
}

interface ProjectLink {
  name: string;
  url: string;
  cover: string;
}

interface HomeContentProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    intro: string;
    description: string;
    skills: string[];
    contact: string;
    social_title: string;
    sites_title: string;
    projects_title: string;
    sites: SiteLink[];
    projects: ProjectLink[];
    visit: string;
  };
}

const socialDestinations = [
  { label: 'GitHub', href: 'https://github.com/JupiterTheWarlock', meta: 'code' },
  { label: 'X', href: 'https://x.com/JupiterTheWL', meta: 'notes' },
  { label: 'itch.io', href: 'https://jupiter-the-warlock.itch.io/', meta: 'games' },
  { label: 'MakerWorld', href: 'https://makerworld.com.cn/zh/@JtheWL', meta: 'prints' },
];

export default function HomeContent({ locale, translations: t }: HomeContentProps) {
  const isZh = locale === 'zh-CN';

  const featuredCopy = isZh
    ? [
        {
          status: 'released',
          roles: ['design', 'code', 'weird systems'],
          summary: '一组关于几何、嵌套空间和失控增殖的小游戏。它们不追求体面，更像把一个怪规则推到尽头。',
        },
        {
          status: 'released',
          roles: ['design', 'prototype', 'jam energy'],
          summary: '一个带脏脏幽默感的轻量实验，保留了 Game Jam 的粗粝和直接。',
        },
        {
          status: 'released',
          roles: ['design', 'narrative', 'game feel'],
          summary: '咸鱼当然不想死。它把荒诞角色、低成本表达和可玩的求生小循环放在一起。',
        },
      ]
    : [
        {
          status: 'released',
          roles: ['design', 'code', 'weird systems'],
          summary: 'A set of small games about geometry, nested spaces, and rules pushed until they start behaving strangely.',
        },
        {
          status: 'released',
          roles: ['design', 'prototype', 'jam energy'],
          summary: 'A rough little experiment with dirty humor and the direct texture of a game jam build.',
        },
        {
          status: 'released',
          roles: ['design', 'narrative', 'game feel'],
          summary: 'A salted fish would rather stay alive. This one mixes absurd characters with a tiny survival loop.',
        },
      ];

  const projects = t.projects.map((project, index) => ({
    ...project,
    status: featuredCopy[index]?.status ?? 'released',
    roles: featuredCopy[index]?.roles ?? ['game dev'],
    summary:
      featuredCopy[index]?.summary ??
      (isZh ? '一个还在继续打磨的独立游戏实验。点进去可以直接试玩或看更多截图。' : 'An indie game experiment still being shaped. Open it for playable builds and more screenshots.'),
  }));

  const featuredProjects = projects.slice(0, 3);

  const notes = isZh
    ? [
        { title: 'AI 原生游戏不是让 AI 接管世界', meta: 'ai-native games', summary: '我更关心游戏运行时怎样调用 AI：什么时候给上下文，给多少权限，结果怎么回填。' },
        { title: 'Cognitive Harness 与 AI Feel Loop', meta: 'method notes', summary: '模型是能力边界，Harness 才是设计对象。AI 要进入玩法，必须先进入清晰的系统边界。' },
        { title: '工具、自动化与个人工作台', meta: 'tooling', summary: 'Claude Code、Cursor、MCP、自托管、知识库，以及那些自动构建自动化工作流的工作流。' },
      ]
    : [
        { title: 'AI-native games are not about AI hosting the world', meta: 'ai-native games', summary: 'I care about how a runtime calls AI: when to pass context, what tools to allow, and how results return to play.' },
        { title: 'Cognitive Harness and the AI Feel Loop', meta: 'method notes', summary: 'The model defines capability; the harness is the design object. AI needs boundaries before it can become game feel.' },
        { title: 'Tools, automation, and my personal workbench', meta: 'tooling', summary: 'Claude Code, Cursor, MCP, self-hosting, knowledge bases, and workflows that automate workflow-building workflows.' },
      ];

  const methodPanels = isZh
    ? [
        {
          title: 'Game Runtime',
          items: ['规则与状态', '触发时机', '结果验证', '反馈回填'],
        },
        {
          title: 'Cognitive Harness',
          items: ['上下文切片', '工具权限', '结构化输出', '边界控制'],
        },
      ]
    : [
        {
          title: 'Game Runtime',
          items: ['rules and state', 'trigger timing', 'result validation', 'feedback commit'],
        },
        {
          title: 'Cognitive Harness',
          items: ['context slices', 'tool permissions', 'structured output', 'boundary control'],
        },
      ];

  const workflowSteps = ['runtime trigger', 'context injection', 'agent operation', 'feedback commit', 'game feel'];

  return (
    <div className="home-shell">
      <section id="home" className="lab-hero">
        <div className="hero-copy">
          <p className="eyebrow">JUPITER_THE_WARLOCK / AI-NATIVE GAME LAB</p>
          <h1>{t.title}</h1>
          <p className="hero-subtitle">{t.subtitle}</p>
          <p className="hero-slogan">{t.intro}</p>
          <p className="hero-lede">
            {isZh
              ? '我是不务正业的游戏开发者术士木星。这里放我做的小游戏、写的 AI 原生游戏思考，以及自托管、上下文工程、自动化和个人工作台。'
              : 'I am JupiterTheWarlock, an unruly indie game developer. This is where I keep my games, AI-native game notes, self-hosting experiments, context engineering, automation, and personal workbench.'}
          </p>
          <div className="hero-actions" aria-label={isZh ? '主要操作' : 'Primary actions'}>
            <a className="button-primary" href="https://jupiter-the-warlock.itch.io/" target="_blank" rel="noopener noreferrer">
              {isZh ? '试玩作品' : 'Play Games'}
            </a>
            <a className="button-secondary" href="https://blog.jthewl.cc" target="_blank" rel="noopener noreferrer">
              {isZh ? '读实验记录' : 'Read Notes'}
            </a>
          </div>
          <div className="hero-status" aria-label="current status">
            <span>STATUS</span>
            <strong>{isZh ? 'C# / Unity｜高频 Game Jam中｜独立开发 / 自托管 / 上下文工程 / 自动化' : 'C# / Unity | frequent Game Jams | indie dev / self-hosting / context engineering / automation'}</strong>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <AsciiBackground className="hero-jupiter" asciiEnabled={true} />
          <div className="planet-caption">
            <span>JUPITER_VIEW</span>
            <strong>control deck online</strong>
          </div>
        </div>
      </section>

      <section id="work" className="lab-section">
        <div className="section-heading">
          <p className="eyebrow">FEATURED_GAMES</p>
          <h2>{isZh ? '我最近做的游戏。' : 'Recent games from my workbench.'}</h2>
          <p>
            {isZh
              ? '有些是 Jam 里长出来的，有些是把一个怪规则一路推到底的原型。它们未必体面，但都很像我。'
              : 'Some came out of jams; some are prototypes that push one strange rule to the end. They are not always polished, but they are unmistakably mine.'}
          </p>
        </div>

        <div className="featured-grid">
          {featuredProjects.map((project, index) => (
            <a
              key={project.name}
              className={`game-card ${index === 0 ? 'game-card-featured' : ''}`}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="media-frame">
                <img src={project.cover} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
              </span>
              <span className="game-card-body">
                <span className="card-meta">{project.status}</span>
                <strong>{project.name}</strong>
                <span>{project.summary}</span>
                <span className="tag-row">
                  {project.roles.map((role) => (
                    <span key={role}>{role}</span>
                  ))}
                </span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section id="method" className="lab-section method-section">
        <div className="section-heading">
          <p className="eyebrow">METHOD</p>
          <h2>{isZh ? 'AI 不是世界主机。' : 'AI is not the world host.'}</h2>
          <p>
            {isZh
              ? '我关心的不是“让 AI 生成一切”，而是传统游戏运行时如何在正确时机、以正确边界调用 AI。模型是能力边界，Harness 才是设计对象。'
              : 'I am less interested in “AI generates everything” than in how a traditional game runtime calls AI at the right moment, with the right boundaries. The model defines capability; the harness is the design object.'}
          </p>
        </div>

        <div className="method-grid">
          {methodPanels.map((panel, index) => (
            <div key={panel.title} className={`method-panel ${index === 1 ? 'method-panel-accent' : ''}`}>
              <h3>{panel.title}</h3>
              <ul>
                {panel.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pipeline" aria-label="workflow">
          {workflowSteps.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>
      </section>

      <section id="atlas" className="lab-section">
        <div className="section-heading">
          <p className="eyebrow">PROJECT_ATLAS</p>
          <h2>{isZh ? '更多小游戏和原型。' : 'More small games and prototypes.'}</h2>
        </div>

        <div className="atlas-grid">
          {projects.map((project) => (
            <a key={project.name} className="atlas-card" href={project.url} target="_blank" rel="noopener noreferrer">
              <img src={project.cover} alt="" loading="lazy" />
              <span>
                <strong>{project.name}</strong>
                <small>{project.status}</small>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section id="notes" className="lab-section">
        <div className="section-heading">
          <p className="eyebrow">LAB_NOTES</p>
          <h2>{isZh ? '一些暴论和方法论。' : 'Hot takes and working methods.'}</h2>
          <p>
            {isZh
              ? '我写 AI 工具、游戏开发、行业观察，也写自己踩坑后的判断。多数东西还在试，但我会尽量把判断写清楚。'
              : 'I write about AI tools, game development, industry notes, and judgments after stepping into a few holes myself. Most things are still experiments, but I try to make the reasoning legible.'}
          </p>
        </div>

        <div className="notes-list">
          {notes.map((note) => (
            <a key={note.title} className="note-row" href="https://blog.jthewl.cc" target="_blank" rel="noopener noreferrer">
              <span>{note.meta}</span>
              <strong>{note.title}</strong>
              <p>{note.summary}</p>
            </a>
          ))}
        </div>
      </section>

      <section id="workshop" className="lab-section">
        <div className="section-heading">
          <p className="eyebrow">WORKSHOP_LINKS</p>
          <h2>{isZh ? '我正在捣鼓的东西。' : 'Things I am currently tinkering with.'}</h2>
        </div>

        <div className="link-grid">
          {t.sites.map((site) => (
            <a key={site.name} className="link-card" href={site.url} target="_blank" rel="noopener noreferrer">
              <span className="link-ascii">{site.ascii}</span>
              <strong>{site.name}</strong>
              <span>{site.description}</span>
            </a>
          ))}
          {socialDestinations.map((link) => (
            <a key={link.label} className="link-card" href={link.href} target="_blank" rel="noopener noreferrer">
              <span className="card-meta">{link.meta}</span>
              <strong>{link.label}</strong>
              <span>{link.href.replace('https://', '')}</span>
            </a>
          ))}
        </div>
      </section>

      <section id="contact" className="lab-section contact-band">
        <div>
          <p className="eyebrow">{t.social_title.toUpperCase()}</p>
          <h2>{isZh ? '如果你也在做游戏、AI 工具、Agent、上下文工程，或者只是想聊一个离谱玩法，可以直接来找我。' : 'If you are building games, AI tools, agents, context engineering systems, or just want to talk about an absurd mechanic, reach out.'}</h2>
          <a className="button-primary" href="mailto:jupiterthewarlock679@gmail.com">
            jupiterthewarlock679@gmail.com
          </a>
        </div>
        <SocialLinks />
      </section>
    </div>
  );
}
