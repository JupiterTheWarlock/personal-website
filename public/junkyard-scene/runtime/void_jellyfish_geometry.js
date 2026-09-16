export const VOID_JELLYFISH_GEOMETRY = Object.freeze({
  viewBox: "0 0 240 350",
  bodyPath: "M120 16 C84 72 48 128 48 184 C48 239 79 270 120 270 C161 270 192 239 192 184 C192 128 156 72 120 16 Z",
  bodyBounds: Object.freeze({ left: 48, right: 192, top: 16, bottom: 270 }),
  eyePath: "M70 184 C83 158 102 148 120 148 C138 148 157 158 170 184 C157 210 138 220 120 220 C102 220 83 210 70 184 Z",
  iris: Object.freeze({ cx: 120, cy: 184, radius: 25 }),
  pupil: Object.freeze({ cx: 120, cy: 184, radius: 17 }),
  asset: Object.freeze({
    bodyPath: "M12 2.01 C8.94 6.77 5.88 11.53 5.88 16.29 C5.88 20.965 8.515 23.6 12 23.6 C15.485 23.6 18.12 20.965 18.12 16.29 C18.12 11.53 15.06 6.77 12 2.01 Z",
    eyePath: "M7.75 16.29 C8.855 14.08 10.47 13.23 12 13.23 C13.53 13.23 15.145 14.08 16.25 16.29 C15.145 18.5 13.53 19.35 12 19.35 C10.47 19.35 8.855 18.5 7.75 16.29 Z",
    iris: Object.freeze({ cx: 12, cy: 16.29, radius: 2.125 }),
    pupil: Object.freeze({ cx: 12, cy: 16.29, radius: 1.445 }),
  }),
});

export function voidJellyfishAssetGlyph() {
  const geometry = VOID_JELLYFISH_GEOMETRY.asset;
  return `<path fill="var(--asset-icon-fill)" d="${geometry.bodyPath}"></path><path d="${geometry.eyePath}"></path><circle cx="${geometry.iris.cx}" cy="${geometry.iris.cy}" r="${geometry.iris.radius}" fill="var(--asset-icon-stroke)"></circle><circle cx="${geometry.pupil.cx}" cy="${geometry.pupil.cy}" r="${geometry.pupil.radius}" fill="var(--asset-icon-fill)"></circle>`;
}
