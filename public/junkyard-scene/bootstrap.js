import { mountJunkyardSystemView } from './runtime/spatial_maps.js';
import {
  gazeVectorFromClientPoint,
  gazeVectorFromProjectedEye,
  mountVoidJellyfish,
} from './runtime/void_jellyfish.js';
import { appearanceState, developerTuning, projection } from './scene-data.js';

const stage = document.querySelector('#junkyardSystemStage');
const jellyfishSource = document.querySelector('#homeJellyfishSource');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = window.matchMedia('(max-width: 800px)');
const prefersStillScene = () => motionQuery.matches || mobileQuery.matches;

const jellyfish = mountVoidJellyfish(jellyfishSource, {
  variant: 'home-sprite',
  seed: 1,
  showTentacles: false,
  allowBlink: false,
  autoSchedule: false,
  reducedMotion: prefersStillScene(),
});

jellyfish.setState('idle', { force: true });
jellyfish.setMotionTuning(developerTuning.jellyfishMotion);

let jellyfishProjection = null;

function pointJellyfishAt(clientX, clientY) {
  if (!jellyfishProjection?.visible || !jellyfishProjection.eyeRect) return;
  const gaze = jellyfishProjection.gazeBasis
    ? gazeVectorFromProjectedEye(clientX, clientY, jellyfishProjection, innerWidth, innerHeight)
    : gazeVectorFromClientPoint(clientX, clientY, jellyfishProjection.eyeRect, innerWidth, innerHeight);
  jellyfish.lookAt(gaze.x, gaze.y, 1800);
}

const scene = mountJunkyardSystemView(stage, projection, {
  appearanceState,
  stateOverlayEnabled: true,
  developerTuning,
  sceneMode: 'home',
  visible: true,
  reducedMotion: prefersStillScene(),
  homeJellyfishSvg: jellyfish.svg,
  onBeforeRender: (timestamp) => jellyfish.advance(timestamp),
  onAnimationLoopChange: () => {},
  onAnimationFrameChange: () => {},
  onHomeJellyfishProjection: (nextProjection) => {
    jellyfishProjection = nextProjection;
  },
  onSpatialNodeProjection: () => {},
  onContextRef: null,
  onActivate: null,
  onContextMenu: null,
  onRuntimeEvent: () => {},
});

window.__junkyardBackground = Object.freeze({
  snapshot: () => jellyfish.snapshot(),
  projection: () => jellyfishProjection,
});

const onMotionChange = () => {
  jellyfish.setReducedMotion(prefersStillScene());
  scene.setReducedMotion(prefersStillScene());
};
motionQuery.addEventListener('change', onMotionChange);
mobileQuery.addEventListener('change', onMotionChange);
const onVisibilityChange = () => scene.setVisibility(!document.hidden);
document.addEventListener('visibilitychange', onVisibilityChange);
onVisibilityChange();

const onParentPointer = (event) => {
  if (event.origin !== window.location.origin || event.data?.type !== 'junkyard-pointer') return;
  if (event.source !== window.parent || prefersStillScene() || document.hidden) return;
  pointJellyfishAt(Number(event.data.clientX) || 0, Number(event.data.clientY) || 0);
};
window.addEventListener('message', onParentPointer);

window.addEventListener('pagehide', () => {
  motionQuery.removeEventListener('change', onMotionChange);
  mobileQuery.removeEventListener('change', onMotionChange);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('message', onParentPointer);
  delete window.__junkyardBackground;
  scene.dispose();
  jellyfish.destroy();
}, { once: true });
