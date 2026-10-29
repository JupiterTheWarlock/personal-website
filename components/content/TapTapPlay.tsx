import type { Messages } from '@/app/i18n/messages';

// The WebGL runtime is retired; the released build lives on TapTap.
export const TAP_TAP_URL = 'https://www.taptap.cn/app/978232';

export default function TapTapPlay({ copy }: { copy: Messages['sewerKing'] }) {
  return (
    <section className="unity-player" aria-label={copy.play}>
      <div className="game-launch">
        <a className="game-button game-button--primary" href={TAP_TAP_URL} target="_blank" rel="noopener noreferrer">
          {copy.play} ↗
        </a>
        <p>{copy.downloadNote}</p>
      </div>
    </section>
  );
}
