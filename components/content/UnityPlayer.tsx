'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Messages } from '@/app/i18n/messages';
import { useBackgroundSuspension } from './SceneProvider';
import { isUnityMessage } from '@/lib/unity-message';

export default function UnityPlayer({ copy, runtimePath = '/games/aaa-sewer-king/play/' }: { copy: Messages['sewerKing']; runtimePath?: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'running'>('loading');
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const setBackgroundSuspended = useBackgroundSuspension();
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const launch = useRef<HTMLButtonElement>(null);

  const closeGame = useCallback(() => {
    if (document.fullscreenElement === stage.current) void document.exitFullscreen().catch(() => {});
    // Destroy the Unity document before restoring the background's WebGL context.
    flushSync(() => setOpen(false));
    setBackgroundSuspended(false);
    launch.current?.focus();
  }, [setBackgroundSuspended]);

  useEffect(() => () => setBackgroundSuspended(false), [setBackgroundSuspended]);

  useEffect(() => {
    if (!open) return;
    stage.current?.scrollIntoView({ block: 'start' });
    const receive = (event: MessageEvent) => {
      if (!isUnityMessage(event, frame.current?.contentWindow, window.location.origin)) return;
      if (event.data.type === 'aaa-sewer-king:ready') setStatus('ready');
      if (event.data.type === 'aaa-sewer-king:running') setStatus('running');
      if (event.data.type === 'aaa-sewer-king:closed') closeGame();
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [open, closeGame]);

  useEffect(() => {
    const update = () => setFullscreen(Boolean(stage.current && document.fullscreenElement === stage.current));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  function startGame() {
    // Commit the removal first; an iframe begins loading as soon as it is inserted.
    flushSync(() => setBackgroundSuspended(true));
    setStatus('loading');
    setFullscreenError(false);
    setOpen(true);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
      setFullscreenError(false);
    } catch { setFullscreenError(true); }
  }

  return (
    <section className="unity-player" aria-label={copy.play}>
      {!open ? (
        <div className="game-launch" key="launch">
          <button className="game-button game-button--primary" ref={launch} onClick={startGame}>{copy.play}</button>
          <a className="game-link" href={runtimePath}>{copy.openStandalone} ↗</a>
          <p>{copy.downloadNote}</p>
        </div>
      ) : (
        <div className="game-stage" key="runtime" ref={stage} data-game-stage>
          <div className="game-toolbar">
            <span className="game-status" role="status" aria-live="polite">{copy[status]}</span>
            <a className="game-link" href={runtimePath}>{copy.openStandalone} ↗</a>
            <button className="game-button" onClick={toggleFullscreen}>{fullscreen ? copy.exitFullscreen : copy.fullscreen}</button>
            <button className="game-button" onClick={closeGame}>{copy.close}</button>
          </div>
          {fullscreenError && <p className="game-inline-message" role="status">{copy.fullscreenUnavailable}</p>}
          <iframe
            ref={frame}
            src={runtimePath}
            title={copy.frameTitle}
            className="game-frame"
            data-unity-game="aaa-sewer-king"
            allow="autoplay; fullscreen; gamepad"
            allowFullScreen
          />
        </div>
      )}
    </section>
  );
}
