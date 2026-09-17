'use client';

import { useEffect } from 'react';

const MODE_CLASSES = ['business-card-mode', 'scene-only-mode'] as const;

export function usePresentationModeCycle() {
  useEffect(() => {
    let mode = 0;

    const applyMode = () => {
      document.body.classList.remove(...MODE_CLASSES);
      if (mode === 1) document.body.classList.add('business-card-mode');
      if (mode === 2) document.body.classList.add('scene-only-mode');
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== 'Backquote'
        || !event.altKey
        || event.ctrlKey
        || event.metaKey
        || event.shiftKey
        || event.repeat
      ) return;

      event.preventDefault();
      mode = (mode + 1) % 3;
      applyMode();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove(...MODE_CLASSES);
    };
  }, []);
}
