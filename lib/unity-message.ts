const allowedTypes = new Set(['aaa-sewer-king:ready', 'aaa-sewer-king:running', 'aaa-sewer-king:closed']);

export function isUnityMessage(event: Pick<MessageEvent, 'origin' | 'source' | 'data'>, frameWindow: Window | null | undefined, origin: string): boolean {
  return Boolean(frameWindow && event.origin === origin && event.source === frameWindow
    && event.data?.game === 'aaa-sewer-king' && allowedTypes.has(event.data?.type));
}
