import * as THREE from "../vendor/three.module.min.js";
import {
  createJunkyardStructureGroup,
  createWorldSurfaceFillLights,
  createWorldStructureGroup,
  disposeWorldStructureGroup,
  updateWorldStructureGroup,
  WORLD_SURFACE_LIGHT_ROLES,
} from "./structure_portrait_generator.js";
import { resolveSkyProfile, resolveWorldProfile } from "./recipe.js";
import { createSkyAppearanceObject, disposeSkyAppearanceObject, renderSkyEquirectTexture } from "./sky_generator.js";
import {
  createHomeEnvironmentDust,
  disposeHomeEnvironmentDust,
  updateHomeEnvironmentDust,
} from "./environment_dust.js";

const SYSTEM_ORDER_MODES = new Set(["tier-asc", "tier-desc", "acquired"]);
const appearanceClock = {
  startedAt: performance.now(),
};

const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function normalizeDeveloperSceneTuning(value = {}) {
  return Object.freeze({
    rootX: finite(value.rootX, 0), rootY: finite(value.rootY, 0), rootZ: finite(value.rootZ, 0),
    rootScale: finite(value.rootScale, 1),
    junkyardX: finite(value.junkyardX, 0), junkyardY: finite(value.junkyardY, 0), junkyardZ: finite(value.junkyardZ, 0),
    junkyardScaleX: finite(value.junkyardScaleX, 1), junkyardScaleY: finite(value.junkyardScaleY, 1), junkyardScaleZ: finite(value.junkyardScaleZ, 1),
    junkyardRotationSpeed: finite(value.junkyardRotationSpeed, 0.07),
    worldBaseSize: finite(value.worldBaseSize, 0.35),
    worldTierGrowth: finite(value.worldTierGrowth, 0.048),
    worldMaximumGrowth: finite(value.worldMaximumGrowth, 0.3),
    orbitBaseRadius: finite(value.orbitBaseRadius, 2.25),
    orbitSpacing: finite(value.orbitSpacing, 1.16),
    orbitInclination: finite(value.orbitInclination, 0.18),
    orbitSpeed: finite(value.orbitSpeed, 0.055),
  });
}

let activeRuntime = null;

function scalarSeed(value = "") {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((Math.abs(hash) % 100000) + 1) / 100001;
}

function markSpatialMeshes(object, node, pickables) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.userData.spatialNode = node;
    pickables.push(child);
  });
}

function addJunkyard(root, node, pickables) {
  const group = createJunkyardStructureGroup();
  root.add(group);
  markSpatialMeshes(group, node, pickables);
  return group;
}

function orderedWorlds(projection, orderMode) {
  const worlds = (projection.nodes || []).filter((node) => node?.ref?.scope === "world");
  if (orderMode === "acquired") return worlds;
  const direction = orderMode === "tier-desc" ? -1 : 1;
  return worlds
    .map((node, index) => ({ node, index }))
    .sort((left, right) => {
      const leftOrder = Number(left.node.visual?.tier || 0) * 101 + Number(left.node.visual?.tierProgress || 0);
      const rightOrder = Number(right.node.visual?.tier || 0) * 101 + Number(right.node.visual?.tierProgress || 0);
      return (leftOrder - rightOrder) * direction || left.index - right.index;
    })
    .map(({ node }) => node);
}

function signatureFor(projection, appearanceState, options) {
  const stateFingerprint = (projection.nodes || [])
    .filter((node) => node?.ref?.scope === "world")
    .map((node) => [
      node.ref.id,
      node.visual?.tier,
      node.visual?.tierProgress,
      node.visual?.pollution,
      node.visual?.apocalypseProgress,
      node.visual?.anchorStatus,
    ]);
  return JSON.stringify([
    projection.sourceRevision,
    appearanceState?.revision || 0,
    options.orderMode,
    options.stateOverlayEnabled !== false,
    options.developerTuning,
    stateFingerprint,
  ]);
}

function disposeScene(runtime) {
  if (!runtime) return;
  if (runtime.disposed) {
    if (runtime.disposalFailure) throw runtime.disposalFailure;
    return;
  }
  runtime.disposed = true;
  const disposalErrors = [];
  const release = (callback) => {
    try {
      callback();
    } catch (error) {
      disposalErrors.push(error);
    }
  };
  for (const entry of runtime.worlds?.values?.() || []) {
    if (entry.group) release(() => disposeWorldStructureGroup(entry.group));
  }
  if (runtime.junkyard) release(() => disposeWorldStructureGroup(runtime.junkyard));
  if (runtime.environmentDust) release(() => disposeHomeEnvironmentDust(runtime.environmentDust));
  if (runtime.sky) release(() => disposeSkyAppearanceObject(runtime.sky));
  (runtime.root?.children || [])
    .filter((object) => object.userData.kind === "appearance-orbit")
    .forEach((rootObject) => rootObject.traverse((object) => {
      release(() => object.geometry?.dispose?.());
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => release(() => material.dispose?.()));
      } else release(() => object.material?.dispose?.());
    }));
  if (disposalErrors.length) {
    runtime.disposalFailure = new AggregateError(disposalErrors, "appearance-scene-dispose-failed");
    throw runtime.disposalFailure;
  }
}

function buildRuntime(projection, appearanceState, options, signature) {
  const setupReleases = [];
  try {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020307);
  const sky = createSkyAppearanceObject(resolveSkyProfile(appearanceState));
  setupReleases.push(() => disposeSkyAppearanceObject(sky));
  scene.add(sky);
  scene.add(...createWorldSurfaceFillLights());
  const cardPortraitCoreLight = new THREE.PointLight(0x8fffe7, 3.8, 24, 1.25);
  cardPortraitCoreLight.position.set(-3.8, 1.8, 3.6);
  cardPortraitCoreLight.userData.appearanceLightRole = WORLD_SURFACE_LIGHT_ROLES.card;
  cardPortraitCoreLight.visible = false;
  scene.add(cardPortraitCoreLight);
  const cardPortraitLight = new THREE.PointLight(0xffb53b, 5.2, 24, 1.25);
  cardPortraitLight.position.set(3.6, 2.2, 3.2);
  cardPortraitLight.userData.appearanceLightRole = WORLD_SURFACE_LIGHT_ROLES.card;
  cardPortraitLight.visible = false;
  scene.add(cardPortraitLight);
  const root = new THREE.Group();
  root.userData.kind = "appearance-system-root";
  scene.add(root);
  root.position.set(options.developerTuning.rootX, options.developerTuning.rootY, options.developerTuning.rootZ);
  root.scale.setScalar(options.developerTuning.rootScale);
  const environmentDust = createHomeEnvironmentDust();
  setupReleases.push(() => disposeHomeEnvironmentDust(environmentDust));
  root.add(environmentDust);
  const pickables = [];
  const junkyardNode = (projection.nodes || []).find((node) => node?.ref?.scope === "junkyard") || {
    ref: { scope: "junkyard", id: "junkyard", name: "垃圾场" },
    state: "base",
  };
  const junkyard = addJunkyard(root, junkyardNode, pickables);
  junkyard.position.set(options.developerTuning.junkyardX, options.developerTuning.junkyardY, options.developerTuning.junkyardZ);
  junkyard.scale.set(
    options.developerTuning.junkyardScaleX,
    options.developerTuning.junkyardScaleY,
    options.developerTuning.junkyardScaleZ,
  );
  setupReleases.push(() => disposeWorldStructureGroup(junkyard));
  const worlds = new Map();
  const ordered = orderedWorlds(projection, options.orderMode);
  ordered.forEach((node, rank) => {
    const worldId = String(node.ref?.id || "");
    const profile = resolveWorldProfile(appearanceState, worldId);
    const group = createWorldStructureGroup(profile, node, {
      stateOverlayEnabled: options.stateOverlayEnabled,
    });
    setupReleases.push(() => disposeWorldStructureGroup(group));
    const tier = Number(node.visual?.tier || 0) + Number(node.visual?.tierProgress || 0) / 100;
    const radius = options.developerTuning.worldBaseSize
      + Math.min(options.developerTuning.worldMaximumGrowth, tier * options.developerTuning.worldTierGrowth);
    group.scale.setScalar(radius);
    group.userData.worldId = worldId;
    group.userData.spatialNode = node;
    root.add(group);
    markSpatialMeshes(group, node, pickables);
    const orbitRadius = options.developerTuning.orbitBaseRadius + rank * options.developerTuning.orbitSpacing;
    const worldSeed = scalarSeed(worldId);
    const phase = worldSeed * Math.PI * 2;
    const inclination = (worldSeed * 2 - 1) * options.developerTuning.orbitInclination;
    const orbit = {
      radius: orbitRadius,
      phase,
      inclination,
      speed: options.developerTuning.orbitSpeed / Math.sqrt(Math.max(1, rank + 1)),
    };
    const trackPoints = [];
    for (let step = 0; step < 128; step += 1) {
      const angle = step / 128 * Math.PI * 2;
      trackPoints.push(new THREE.Vector3(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle * 2 + phase) * inclination,
        Math.sin(angle) * orbitRadius,
      ));
    }
    const trackGeometry = new THREE.BufferGeometry().setFromPoints(trackPoints);
    const trackMaterial = new THREE.LineBasicMaterial({
        color: 0x4b5e72,
        transparent: true,
        opacity: Math.max(0.16, 0.38 - ordered.length * 0.012),
      });
    setupReleases.push(() => trackGeometry.dispose());
    setupReleases.push(() => trackMaterial.dispose());
    const track = new THREE.LineLoop(trackGeometry, trackMaterial);
    track.userData.kind = "appearance-orbit";
    root.add(track);
    worlds.set(worldId, { node, group, orbit, radius, track, angle: phase });
  });
  const runtime = {
    schemaVersion: "junkyard-appearance-scene-runtime.v1",
    signature,
    scene,
    sky,
    root,
    environmentDust,
    junkyard,
    cardPortraitCoreLight,
    cardPortraitLight,
    worlds,
    pickables,
    orderMode: options.orderMode,
    stateOverlayEnabled: options.stateOverlayEnabled !== false,
    developerTuning: options.developerTuning,
    disposed: false,
    disposalFailure: null,
  };
  setupReleases.length = 0;
  return runtime;
  } catch (error) {
    const cleanupErrors = [];
    [...setupReleases].reverse().forEach((release) => {
      try {
        release();
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    });
    if (cleanupErrors.length) {
      throw new AggregateError([error, ...cleanupErrors], "appearance-scene-build-cleanup-failed");
    }
    throw error;
  }
}

function normalizeSceneOptions(options = {}) {
  const orderMode = SYSTEM_ORDER_MODES.has(options.orderMode) ? options.orderMode : "tier-asc";
  return {
    orderMode,
    stateOverlayEnabled: options.stateOverlayEnabled !== false,
    developerTuning: normalizeDeveloperSceneTuning(options.developerTuning?.scene),
  };
}

export function appearanceSceneSignatureFor(projection, appearanceState, options = {}) {
  const normalizedOptions = normalizeSceneOptions(options);
  return signatureFor(projection, appearanceState, normalizedOptions);
}

export function createAppearanceScene(projection, appearanceState, options = {}) {
  const normalizedOptions = normalizeSceneOptions(options);
  const signature = signatureFor(projection, appearanceState, normalizedOptions);
  return buildRuntime(projection, appearanceState, normalizedOptions, signature);
}

export function reconcileAppearanceScene(runtime, projection, appearanceState, options = {}) {
  const normalizedOptions = normalizeSceneOptions(options);
  const signature = signatureFor(projection, appearanceState, normalizedOptions);
  if (runtime?.signature === signature && !runtime.disposed) return runtime;
  const nextRuntime = buildRuntime(projection, appearanceState, normalizedOptions, signature);
  try {
    disposeScene(runtime);
  } catch (error) {
    try {
      disposeScene(nextRuntime);
    } catch (nextError) {
      throw new AggregateError([error, nextError], "appearance-scene-reconcile-cleanup-failed");
    }
    throw error;
  }
  return nextRuntime;
}

export function disposeAppearanceScene(runtime) {
  disposeScene(runtime);
}

export function ensureAppearanceScene(projection, appearanceState, options = {}) {
  activeRuntime = reconcileAppearanceScene(activeRuntime, projection, appearanceState, options);
  return activeRuntime;
}

export function readAppearanceScene() {
  return activeRuntime;
}

export function appearanceElapsed(timestamp = performance.now(), reducedMotion = false) {
  return reducedMotion ? 0 : Math.max(0, timestamp - appearanceClock.startedAt) / 1000;
}

export function updateAppearanceScene(runtime, elapsed, camera) {
  runtime.junkyard.rotation.y = elapsed * runtime.developerTuning.junkyardRotationSpeed;
  updateHomeEnvironmentDust(runtime.environmentDust, elapsed);
  for (const entry of runtime.worlds.values()) {
    const orbit = entry.orbit;
    const angle = orbit.phase + elapsed * orbit.speed;
    entry.angle = angle;
    entry.group.position.set(
      Math.cos(angle) * orbit.radius,
      Math.sin(angle * 2 + orbit.phase) * orbit.inclination,
      Math.sin(angle) * orbit.radius,
    );
    entry.elapsed = elapsed;
    updateWorldStructureGroup(entry.group, elapsed);
  }
  runtime.scene.updateMatrixWorld(true);
}

export function prepareSkyForRenderer(runtime, renderer) {
  return renderSkyEquirectTexture(renderer, runtime.sky);
}

export function renderAppearanceSky(runtime, render) {
  const rootVisible = runtime.root.visible;
  const skyVisible = runtime.sky.visible;
  runtime.root.visible = false;
  runtime.sky.visible = true;
  runtime.scene.updateMatrixWorld(true);
  try {
    render(runtime.scene);
  } finally {
    runtime.root.visible = rootVisible;
    runtime.sky.visible = skyVisible;
    runtime.scene.updateMatrixWorld(true);
  }
}

export function renderAppearanceForeground(runtime, render) {
  const skyVisible = runtime.sky.visible;
  const background = runtime.scene.background;
  runtime.sky.visible = false;
  runtime.scene.background = null;
  runtime.scene.updateMatrixWorld(true);
  try {
    render(runtime.scene);
  } finally {
    runtime.sky.visible = skyVisible;
    runtime.scene.background = background;
    runtime.scene.updateMatrixWorld(true);
  }
}

export function renderWorldPortrait(
  runtime,
  renderer,
  camera,
  worldId,
  elapsed,
  render,
  framing = {},
  portraitOptions = {},
) {
  const target = runtime.worlds.get(worldId);
  if (!target) return false;
  if (portraitOptions.persistent === true) {
    if (!runtime.persistentPortraitState) {
      runtime.sky.visible = false;
      runtime.scene.background = null;
      runtime.junkyard.visible = false;
      runtime.scene.traverse((object) => {
        if (!object.isLight) return;
        const role = object.userData.appearanceLightRole;
        object.visible = role === WORLD_SURFACE_LIGHT_ROLES.sharedFill
          || role === WORLD_SURFACE_LIGHT_ROLES.card;
      });
      runtime.root.children.forEach((child) => { child.visible = false; });
      runtime.scene.updateMatrixWorld(true);
      runtime.scene.matrixWorldAutoUpdate = false;
      runtime.persistentPortraitState = { activeTarget: null };
    }
    const previousTarget = runtime.persistentPortraitState.activeTarget;
    if (previousTarget && previousTarget !== target) previousTarget.group.visible = false;
    target.group.visible = true;
    updateWorldStructureGroup(target.group, elapsed, {
      frozen: portraitOptions.frozen !== false,
      presentation: portraitOptions.presentation,
    });
    const distance = Math.max(0.1, camera.position.length());
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance;
    const visibleWidth = visibleHeight * camera.aspect;
    const portraitScale = THREE.MathUtils.clamp(Number(framing.scale) || 1, 0.75, 2);
    const offsetX = THREE.MathUtils.clamp(Number(framing.offsetX) || 0, -0.4, 0.4);
    const offsetY = THREE.MathUtils.clamp(Number(framing.offsetY) || 0, -0.4, 0.4);
    target.group.position.set(visibleWidth * offsetX, visibleHeight * offsetY, 0);
    const portraitDiameter = Math.min(visibleHeight, visibleWidth) * 0.76 * portraitScale;
    const stableRadius = Math.max(0.1, Number(target.group.userData.stablePortraitRadius || 1));
    target.group.scale.setScalar(portraitDiameter / (stableRadius * 2));
    target.group.updateMatrixWorld(true);
    render(renderer, runtime.scene, camera);
    runtime.persistentPortraitState.activeTarget = target;
    return true;
  }
  const skyVisible = runtime.sky.visible;
  const background = runtime.scene.background;
  const junkyardVisible = runtime.junkyard.visible;
  const childVisibility = runtime.root.children.map((child) => child.visible);
  const position = target.group.position.clone();
  const quaternion = target.group.quaternion.clone();
  const scale = target.group.scale.clone();
  const lightVisibility = [];
  runtime.scene.traverse((object) => {
    if (object.isLight) lightVisibility.push([object, object.visible]);
  });
  const content = target.group.userData.content;
  const heroAssembly = target.group.userData.heroAssembly;
  const mainRole = target.group.userData.mainRole;
  const contentPosition = content?.position.clone();
  const contentQuaternion = content?.quaternion.clone();
  const heroAssemblyScale = heroAssembly?.scale.clone();
  const mainScale = mainRole?.scale.clone();
  const motionNodeQuaternions = (target.group.userData.motionNodes || []).map(
    (entry) => entry.node.quaternion.clone(),
  );
  try {
    runtime.sky.visible = false;
    runtime.scene.background = null;
    runtime.junkyard.visible = false;
    lightVisibility.forEach(([light]) => {
      const role = light.userData.appearanceLightRole;
      light.visible = role === WORLD_SURFACE_LIGHT_ROLES.sharedFill
        || role === WORLD_SURFACE_LIGHT_ROLES.card;
    });
    runtime.root.children.forEach((child) => { child.visible = child === target.group; });
    updateWorldStructureGroup(target.group, elapsed, {
      frozen: portraitOptions.frozen !== false,
      presentation: portraitOptions.presentation,
    });
    const distance = Math.max(0.1, camera.position.length());
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance;
    const visibleWidth = visibleHeight * camera.aspect;
    const portraitScale = THREE.MathUtils.clamp(Number(framing.scale) || 1, 0.75, 2);
    const offsetX = THREE.MathUtils.clamp(Number(framing.offsetX) || 0, -0.4, 0.4);
    const offsetY = THREE.MathUtils.clamp(Number(framing.offsetY) || 0, -0.4, 0.4);
    target.group.position.set(visibleWidth * offsetX, visibleHeight * offsetY, 0);
    const portraitDiameter = Math.min(visibleHeight, visibleWidth) * 0.76 * portraitScale;
    const stableRadius = Math.max(0.1, Number(target.group.userData.stablePortraitRadius || 1));
    target.group.scale.setScalar(portraitDiameter / (stableRadius * 2));
    runtime.scene.updateMatrixWorld(true);
    render(renderer, runtime.scene, camera);
  } finally {
    runtime.sky.visible = skyVisible;
    runtime.scene.background = background;
    runtime.junkyard.visible = junkyardVisible;
    lightVisibility.forEach(([light, visible]) => { light.visible = visible; });
    runtime.root.children.forEach((child, index) => { child.visible = childVisibility[index]; });
    target.group.position.copy(position);
    target.group.quaternion.copy(quaternion);
    target.group.scale.copy(scale);
    if (content && contentPosition && contentQuaternion) {
      content.position.copy(contentPosition);
      content.quaternion.copy(contentQuaternion);
    }
    if (heroAssembly && heroAssemblyScale) heroAssembly.scale.copy(heroAssemblyScale);
    if (mainRole && mainScale) mainRole.scale.copy(mainScale);
    (target.group.userData.motionNodes || []).forEach((entry, index) => {
      if (motionNodeQuaternions[index]) entry.node.quaternion.copy(motionNodeQuaternions[index]);
    });
    runtime.scene.updateMatrixWorld(true);
  }
  return true;
}

export function destroyAppearanceScene() {
  if (activeRuntime) disposeScene(activeRuntime);
  activeRuntime = null;
}
