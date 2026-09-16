'use client';

import { useEffect, useRef } from 'react';

export default function JunkyardLegacyBackground() {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      frameRef.current?.contentWindow?.postMessage({
        type: 'junkyard-pointer',
        clientX: event.clientX,
        clientY: event.clientY,
      }, window.location.origin);
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => document.removeEventListener('pointermove', onPointerMove);
  }, []);

  return (
    <iframe
      ref={frameRef}
      className="junkyard-legacy-background"
      src="/junkyard-scene/index.html"
      title="诸天尽头垃圾场场景"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
