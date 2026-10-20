'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { ContentCardData } from '@/app/content/home';

export default function ToolsMenu({ label, items }: { label: string; items: ContentCardData[] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  function show(focusFirst = false) {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + 10, left: Math.max(12, Math.min(rect.left, window.innerWidth - 312)) });
    setOpen(true);
    if (focusFirst) requestAnimationFrame(() => menu.current?.querySelector<HTMLAnchorElement>('a')?.focus());
  }

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('pointerdown', dismiss);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close);
    };
  }, [open]);

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const links = Array.from(menu.current?.querySelectorAll<HTMLAnchorElement>('a') || []);
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === 'Escape') {
      event.preventDefault(); setOpen(false); trigger.current?.focus(); return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      links[event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 :
        (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length]?.focus();
    }
    if (event.key === 'Tab') setOpen(false);
  }

  return <>
    <button ref={trigger} type="button" className={`nav-link tools-trigger${open ? ' is-open' : ''}`}
      aria-haspopup="menu" aria-expanded={open} aria-controls="tools-dropdown"
      onClick={() => open ? setOpen(false) : show()}
      onKeyDown={event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); show(true); }
        if (event.key === 'Escape') setOpen(false);
      }}>
      {label}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    {open && createPortal(
      <div id="tools-dropdown" ref={menu} className="tools-dropdown" role="menu" aria-label={label}
        style={position} onKeyDown={onKey}>
        {items.map(item => <a key={item.id} href={item.url} role="menuitem"
          target={item.url.startsWith('/') ? undefined : '_blank'}
          rel={item.url.startsWith('/') ? undefined : 'noopener noreferrer'} onClick={() => setOpen(false)}>
          <span><strong>{item.title}</strong><small>{item.description}</small></span><span aria-hidden="true">↗</span>
        </a>)}
      </div>, document.body,
    )}
  </>;
}
