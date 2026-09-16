import * as THREE from "./vendor/three.module.min.js";
import { createCanvasDataProbe } from "./canvas_data_probe.mjs";
import {
  appearanceSceneSignatureFor,
  createAppearanceScene,
  disposeAppearanceScene,
  prepareSkyForRenderer,
  reconcileAppearanceScene,
  renderAppearanceForeground,
  renderAppearanceSky,
  updateAppearanceScene,
} from "./world_appearance/scene_runtime.js";
import {
  applyScreenPostFx,
  createScreenPostScene,
  disposeScreenPostScene,
} from "./world_appearance/post_fx.js";
import { resolveHomePostFx } from "./world_appearance/recipe.js";
import {
  createHomeJellyfishSkySphereOverlay,
} from "./world_appearance/void_jellyfish_sprite.js";
import {
  constrainHomeCameraState,
  HOME_CAMERA_LIMIT_POLICY,
} from "./world_appearance/home_camera.js";
import { HOME_SCENE_ENVELOPE_POLICY } from "./world_appearance/home_scene_policy.js";
import { layoutOverlayLabelAnchors } from "./overlay_label_layout.mjs";

const SCHEMA_VERSION = "junkyard-spatial-map.v1";
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const SYSTEM_ORDER_MODES = new Set(["tier-asc", "tier-desc", "acquired"]);
const HOME_JELLYFISH_ATTACHMENT = Object.freeze({
  target: "home-skybox",
  relation: "skybox-surface-overlay",
});
const HOME_POST_FX_RENDER_TARGET_POLICY = Object.freeze({
  schemaVersion: "home-postfx-render-target.v1",
  samples: 4,
});
const junkyardSystemRuntime = {
  schemaVersion: "junkyard-system-frontend-runtime.v1",
  startedAt: performance.now(),
  orderMode: "tier-asc",
  camera: {
    position: [7.6, 6.4, 9.8],
    target: [0, 0, 0],
  },
  worlds: new Map(),
  homeJellyfish: {
    attachment: HOME_JELLYFISH_ATTACHMENT.relation,
    target: HOME_JELLYFISH_ATTACHMENT.target,
    position: [0, 0, 0],
    visible: false,
    active: false,
    renderMode: "three-sky-vector-geometry",
    depthTest: true,
    vectorReady: false,
    rasterTexture: false,
    tentacleCount: 8,
    tentacleTimeScale: 1 / 3,
    irisLight: false,
  },
  mountSequence: 0,
  motionElapsedSeconds: 0,
};

export function readJunkyardSystemRuntime() {
  return {
    schemaVersion: junkyardSystemRuntime.schemaVersion,
    orderMode: junkyardSystemRuntime.orderMode,
    camera: {
      position: [...junkyardSystemRuntime.camera.position],
      target: [...junkyardSystemRuntime.camera.target],
    },
    worlds: Object.fromEntries(
      [...junkyardSystemRuntime.worlds.entries()].map(([worldId, state]) => [
        worldId,
        {
          ...state,
          position: [...state.position],
        },
      ]),
    ),
    homeJellyfish: {
      ...junkyardSystemRuntime.homeJellyfish,
      position: [...junkyardSystemRuntime.homeJellyfish.position],
    },
    motionElapsedSeconds: junkyardSystemRuntime.motionElapsedSeconds,
  };
}

export function setJunkyardSystemOrderMode(orderMode) {
  if (SYSTEM_ORDER_MODES.has(orderMode)) {
    junkyardSystemRuntime.orderMode = orderMode;
  }
  return junkyardSystemRuntime.orderMode;
}

function stableHue(value = "") {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 360;
}

function colorFor(value, saturation = 0.48, lightness = 0.52) {
  return new THREE.Color().setHSL(stableHue(value) / 360, saturation, lightness);
}

function playerSpatialKindLabel(value) {
  return {
    sandbox: "地点",
    location: "地点",
    scene: "现场",
    world: "世界",
    junkyard: "垃圾场",
    body: "当前身体",
    character: "人物",
    actor: "人物",
  }[String(value || "")] || "地点";
}

function playerSpatialStateLabel(value) {
  return {
    current: "当前位置",
    active: "可行动",
    present: "在场",
    known: "已知",
    "known-dangerous": "危险",
    "known-guarded": "有守卫",
    "known-uncertain": "情况不明",
    "known-contested": "正在争夺",
    "known-obstructed": "路线受阻",
    "known-locked": "已经封锁",
    "known-threatened": "受到威胁",
    "known-closing": "即将关闭",
  }[String(value || "")] || "状态已确认";
}

function makeMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0.18,
    emissive: options.emissive ?? color,
    emissiveIntensity: options.emissiveIntensity ?? 0.04,
  });
}

function publicRef(ref = {}) {
  const result = {
    scope: String(ref.scope || ""),
    id: String(ref.id || ""),
  };
  if (ref.worldId) result.worldId = String(ref.worldId);
  return result;
}

function markPickable(object, node, pickables) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.userData.spatialNode = node;
    pickables.push(child);
  });
}

function addJunkyardAnchor(root, node, pickables) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.72, 1),
    makeMaterial(0xd7a64c, { roughness: 0.44, metalness: 0.55, emissiveIntensity: 0.18 }),
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.08, 0.055, 12, 64),
    makeMaterial(0x7bb7a1, { roughness: 0.4, metalness: 0.6, emissiveIntensity: 0.22 }),
  );
  ring.rotation.x = Math.PI / 2.4;
  group.add(core, ring);
  root.add(group);
  markPickable(group, node, pickables);
  return group;
}

function addWorldPlanet(root, node, position, pickables) {
  const group = new THREE.Group();
  const color = colorFor(node.ref?.id || node.ref?.name);
  const radius = 0.56 + Math.min(0.34, Number(node.visual?.tier || 0) * 0.07);
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 28, 18),
    makeMaterial(color, { roughness: 0.64, metalness: 0.1, emissiveIntensity: 0.1 }),
  );
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.08, 24, 14),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    }),
  );
  group.add(planet, atmosphere);
  if (node.visual?.isBaseWorld) {
    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.5, 0.045, 10, 52),
      makeMaterial(0xf2bd58, { emissiveIntensity: 0.3 }),
    );
    baseRing.rotation.x = Math.PI / 2.2;
    group.add(baseRing);
  }
  if (node.visual?.hasBody) {
    const beacon = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.42, 12),
      makeMaterial(0xffffff, { emissiveIntensity: 0.35 }),
    );
    beacon.position.y = radius + 0.34;
    group.add(beacon);
  }
  group.position.copy(position);
  root.add(group);
  markPickable(group, node, pickables);
  return group;
}

function addSandbox(root, node, position, pickables) {
  const group = new THREE.Group();
  const color = node.state === "current"
    ? new THREE.Color(0xf2bd58)
    : colorFor(node.ref?.id || node.ref?.name, 0.42, 0.5);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.58, 0.18, 24),
    makeMaterial(0x182229, { metalness: 0.45 }),
  );
  const marker = new THREE.Mesh(
    new THREE.DodecahedronGeometry(node.state === "current" ? 0.48 : 0.38, 0),
    makeMaterial(color, { roughness: 0.58, emissiveIntensity: node.state === "current" ? 0.2 : 0.08 }),
  );
  marker.position.y = 0.48;
  group.add(base, marker);
  group.position.copy(position);
  root.add(group);
  markPickable(group, node, pickables);
  return group;
}

function fallback(container, message) {
  container.replaceChildren();
  const view = document.createElement("div");
  view.className = "spatial-map-fallback";
  const title = document.createElement("b");
  title.textContent = "空间图暂时无法绘制";
  const desc = document.createElement("p");
  desc.textContent = message;
  view.append(title, desc);
  container.append(view);
}

function nodePositions(projection, tuning = {}) {
  const positions = new Map();
  const nodes = projection.nodes || [];
  if (projection.scope === "junkyard") {
    positions.set("junkyard", new THREE.Vector3(0, 0, 0));
    const worlds = nodes.filter((node) => node.ref?.scope === "world");
    worlds.forEach((node, index) => {
      const angle = (index / Math.max(1, worlds.length)) * Math.PI * 2 - Math.PI / 2;
      const radius = 2.5 + (index % 2) * 0.65;
      positions.set(node.ref.id, new THREE.Vector3(
        Math.cos(angle) * radius,
        ((index % 3) - 1) * 0.34,
        Math.sin(angle) * radius,
      ));
    });
    return positions;
  }
  nodes.forEach((node, index) => {
    const x = Number(node.visual?.x);
    const z = Number(node.visual?.z);
    if (Number.isFinite(x) && Number.isFinite(z)) {
      positions.set(node.ref.id, new THREE.Vector3(x, 0, z));
      return;
    }
    const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
    const radius = index === 0 ? 0 : (Number(tuning.nodeRadius) || 2.35);
    positions.set(node.ref.id, new THREE.Vector3(
      index === 0 ? 0 : Math.cos(angle) * radius,
      0,
      index === 0 ? 0 : Math.sin(angle) * radius,
    ));
  });
  return positions;
}

export function mountSpatialMap(container, projection, options = {}) {
  if (!container) return () => {};
  if (projection?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(projection.nodes)) {
    fallback(container, "当前还没有可查看的已知路线。");
    return () => {};
  }
  container.replaceChildren();
  const canvas = document.createElement("canvas");
  canvas.className = "spatial-map-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const labels = document.createElement("div");
  labels.className = "spatial-map-labels";
  labels.setAttribute("aria-hidden", "true");
  container.append(canvas, labels);
  const dataProbe = createCanvasDataProbe(document, container, { className: "spatial-map-tooltip" });

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
  } catch {
    fallback(container, "浏览器没有可用的 WebGL。旁边的文字列表仍可使用。");
    return () => {};
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = projection.scope === "junkyard"
    ? new THREE.Color(0x06080e)
    : new THREE.Color(0x0c1216);
  scene.fog = new THREE.Fog(scene.background, 9, 24);
  const tuning = options.developerTuning || {};
  const camera = projection.scope === "junkyard"
    ? new THREE.PerspectiveCamera(42, 1, 0.1, 50)
    : new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 40);
  camera.position.set(
    Number.isFinite(Number(tuning.cameraX)) ? Number(tuning.cameraX) : projection.scope === "junkyard" ? 6.8 : 6.5,
    Number.isFinite(Number(tuning.cameraY)) ? Number(tuning.cameraY) : projection.scope === "junkyard" ? 6.1 : 7.6,
    Number.isFinite(Number(tuning.cameraZ)) ? Number(tuning.cameraZ) : projection.scope === "junkyard" ? 8.4 : 7.8,
  );
  camera.lookAt(Number(tuning.targetX) || 0, Number(tuning.targetY) || 0, Number(tuning.targetZ) || 0);
  scene.add(new THREE.HemisphereLight(0xb8d7ff, 0x131a22, 1.45));
  const keyLight = new THREE.DirectionalLight(0xffd47a, 2.25);
  keyLight.position.set(5, 9, 4);
  scene.add(keyLight);

  const root = new THREE.Group();
  scene.add(root);
  if (projection.scope !== "junkyard") {
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(Number(tuning.platformRadius) || 4.4, (Number(tuning.platformRadius) || 4.4) + 0.25, 0.22, 56),
      makeMaterial(0x172127, { roughness: 0.92, metalness: 0.22, emissiveIntensity: 0 }),
    );
    platform.position.y = -0.18;
    root.add(platform);
    const grid = new THREE.GridHelper(Number(tuning.gridSize) || 8, 10, 0x65747d, 0x2b353b);
    grid.position.y = -0.05;
    grid.material.opacity = 0.22;
    grid.material.transparent = true;
    root.add(grid);
  }

  const positions = nodePositions(projection, tuning);
  const objectsById = new Map();
  const pickables = [];
  const labelEntries = [];
  const addLabel = (object, node, height) => {
    const label = document.createElement("span");
    label.className = `spatial-map-label is-${node.ref?.kind || node.ref?.scope || "node"}`;
    label.textContent = node.ref?.name || "未命名";
    labels.append(label);
    labelEntries.push({ object, label, height });
  };

  for (const node of projection.nodes) {
    if (!node?.ref?.id) continue;
    const position = positions.get(node.ref.id) || new THREE.Vector3();
    let object;
    if (node.ref.scope === "junkyard") {
      object = addJunkyardAnchor(root, node, pickables);
      addLabel(object, node, 1.15);
    } else if (node.ref.scope === "world") {
      object = addWorldPlanet(root, node, position, pickables);
      addLabel(object, node, 1.16);
    } else {
      object = addSandbox(root, node, position, pickables);
      addLabel(object, node, 1.12);
    }
    objectsById.set(node.ref.id, object);
    object.scale.setScalar(Number(tuning.nodeScale) || 1);
  }

  const lineMaterial = new THREE.LineBasicMaterial({
    color: projection.scope === "junkyard" ? 0x655c8e : 0x52686f,
    transparent: true,
    opacity: 0.7,
  });
  for (const link of projection.links || []) {
    const source = positions.get(link.sourceRef?.id);
    const target = positions.get(link.targetRef?.id);
    if (!source || !target) continue;
    const geometry = new THREE.BufferGeometry().setFromPoints([
      source.clone().setY(0.12),
      target.clone().setY(0.12),
    ]);
    root.add(new THREE.Line(geometry, lineMaterial));
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);
  let hovered = null;
  let disposed = false;
  let frameId = 0;
  const temp = new THREE.Vector3();

  const requestRender = () => {
    if (!frameId && !disposed) frameId = requestAnimationFrame(render);
  };
  const render = () => {
    frameId = 0;
    if (disposed) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const pixelRatio = renderer.getPixelRatio();
    if (
      canvas.width !== Math.floor(width * pixelRatio)
      || canvas.height !== Math.floor(height * pixelRatio)
    ) {
      renderer.setSize(width, height, false);
    }
    let safeRect = {};
    try {
      safeRect = JSON.parse(container.dataset.pageSceneSafeRect || "{}");
    } catch {
      safeRect = {};
    }
    const hostRect = container.getBoundingClientRect();
    let frame = { x: 0, y: 0, width, height };
    if (safeRect.width && safeRect.height && hostRect.width && hostRect.height) {
      const left = Math.min(width, Math.max(0, safeRect.x - hostRect.left));
      const top = Math.min(height, Math.max(0, safeRect.y - hostRect.top));
      const right = Math.min(width, Math.max(left, safeRect.x + safeRect.width - hostRect.left));
      const bottom = Math.min(height, Math.max(top, safeRect.y + safeRect.height - hostRect.top));
      frame = { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
    }
    if (camera.isPerspectiveCamera) camera.aspect = frame.width / Math.max(1, frame.height);
    else {
      const halfHeight = Number(tuning.cameraHalfHeight) || 4;
      camera.left = -halfHeight * (frame.width / Math.max(1, frame.height));
      camera.right = halfHeight * (frame.width / Math.max(1, frame.height));
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
    }
    camera.updateProjectionMatrix();
    const scaleX = frame.width / width;
    const scaleY = frame.height / height;
    const translateX = (frame.x + frame.width * 0.5) * 2 / width - 1;
    const translateY = 1 - (frame.y + frame.height * 0.5) * 2 / height;
    const elements = camera.projectionMatrix.elements;
    for (let column = 0; column < 4; column += 1) {
      const row = column * 4;
      elements[row] = scaleX * elements[row] + translateX * elements[row + 3];
      elements[row + 1] = scaleY * elements[row + 1] + translateY * elements[row + 3];
    }
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    scene.updateMatrixWorld(true);
    const projectedLabels = [];
    for (const entry of labelEntries) {
      entry.object.getWorldPosition(temp);
      temp.y += entry.height;
      temp.project(camera);
      entry.label.hidden = Math.abs(temp.z) > 1;
      if (!entry.label.hidden) {
        projectedLabels.push({
          entry,
          x: (temp.x * 0.5 + 0.5) * width,
          y: (temp.y * -0.5 + 0.5) * height,
          labelWidth: entry.label.offsetWidth,
          labelHeight: entry.label.offsetHeight,
        });
      }
    }
    for (const result of layoutOverlayLabelAnchors(projectedLabels, width, height)) {
      result.entry.label.style.transform = `translate(-50%, -100%) translate(${result.x}px, ${result.y}px)`;
    }
    let occlusionRects = [];
    try {
      occlusionRects = JSON.parse(container.dataset.pageSceneOcclusionRects || "[]");
    } catch {
      occlusionRects = [];
    }
    if (Array.isArray(occlusionRects) && occlusionRects.length) {
      for (const entry of labelEntries) {
        if (entry.label.hidden) continue;
        const labelRect = entry.label.getBoundingClientRect();
        entry.label.hidden = occlusionRects.some((rect) => (
          labelRect.right > rect.x
          && labelRect.left < rect.x + rect.width
          && labelRect.bottom > rect.y
          && labelRect.top < rect.y + rect.height
        ));
      }
    }
    renderer.render(scene, camera);
  };

  const nodeFromPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(pickables, false)[0]?.object?.userData?.spatialNode || null;
  };
  const showTooltip = (event, node) => {
    if (!node) {
      dataProbe.hide();
      canvas.style.cursor = "";
      return;
    }
    dataProbe.show([
      ["small", playerSpatialKindLabel(node.ref?.kind || node.ref?.scope)],
      ["b", node.ref?.name || "未命名"],
      ["p", node.desc || "暂无更多公开说明。"],
      ["span", playerSpatialStateLabel(node.state)],
    ], event.clientX, event.clientY);
    canvas.style.cursor = event.ctrlKey ? "copy" : "pointer";
  };
  const onPointerMove = (event) => {
    const next = nodeFromPointer(event);
    if (hovered !== next) {
      hovered = next;
      requestRender();
    }
    showTooltip(event, next);
  };
  const onPointerLeave = () => {
    hovered = null;
    dataProbe.hide();
    canvas.style.cursor = "";
  };
  const onClick = (event) => {
    const node = nodeFromPointer(event);
    if (!node) return;
    if (event.ctrlKey) {
      event.preventDefault();
      options.onContextRef?.(publicRef(node.ref));
      return;
    }
    options.onActivate?.(node);
  };
  const preventBrowserMenu = (event) => {
    if (event.ctrlKey) event.preventDefault();
  };
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("click", onClick);
  canvas.addEventListener("contextmenu", preventBrowserMenu);
  canvas.addEventListener("webglcontextrestored", requestRender);
  const resizeObserver = new ResizeObserver(requestRender);
  resizeObserver.observe(container);
  requestRender();

  return () => {
    disposed = true;
    if (frameId) cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    canvas.removeEventListener("click", onClick);
    canvas.removeEventListener("contextmenu", preventBrowserMenu);
    canvas.removeEventListener("webglcontextrestored", requestRender);
    scene.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach((entry) => entry.dispose?.());
      else object.material?.dispose?.();
    });
    renderer.dispose();
    container.replaceChildren();
  };
}

// Visual mechanisms adapted from the local Cultivagent Dyson prototype:
// procedural planet surfaces, orbit tracks, and a BackSide sky sphere.
const PLANET_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLANET_FRAGMENT_SHADER = `
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform vec3 pollutionColor;
  uniform float seed;
  uniform float pollution;
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(seed, seed * 0.71, seed * 1.37));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }
  float fbm(vec3 p) {
    float value = 0.0;
    float weight = 0.55;
    for (int i = 0; i < 4; i++) {
      value += noise(p) * weight;
      p = p * 2.03 + vec3(7.1, 3.7, 5.9);
      weight *= 0.5;
    }
    return value;
  }
  void main() {
    vec3 p = normalize(vPosition);
    float continents = smoothstep(0.35, 0.72, fbm(p * 4.2 + vec3(time * 0.012, 0.0, 0.0)));
    float bands = 0.5 + 0.5 * sin((p.y + fbm(p * 7.0) * 0.22) * 18.0 + seed * 9.0);
    vec3 surface = mix(colorA, colorB, continents * 0.8 + bands * 0.2);
    surface = mix(surface, pollutionColor, clamp(pollution, 0.0, 1.0) * (0.2 + fbm(p * 9.0) * 0.42));
    vec3 lightDir = normalize(vec3(0.65, 0.85, 0.4));
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
    gl_FragColor = vec4(surface * (0.3 + diffuse * 0.88) + surface * rim * 0.22, 1.0);
  }
`;

function scalarSeed(value = "") {
  return (stableHue(value) + 1) / 361;
}

function addSystemSky(scene, seedText) {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(HOME_SCENE_ENVELOPE_POLICY.skyRadius, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x10162b) },
        bottomColor: { value: new THREE.Color(0x020307) },
      },
      vertexShader: `
        varying vec3 vWorld;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorld;
        void main() {
          float h = normalize(vWorld).y * 0.5 + 0.5;
          float glow = pow(max(0.0, 1.0 - abs(normalize(vWorld).y)), 5.0);
          gl_FragColor = vec4(mix(bottomColor, topColor, h) + vec3(0.05, 0.025, 0.09) * glow, 1.0);
        }
      `,
    }),
  );
  scene.add(sky);

  let randomState = Math.max(1, Math.floor(scalarSeed(seedText) * 2147483646));
  const random = () => {
    randomState = (randomState * 16807) % 2147483647;
    return (randomState - 1) / 2147483646;
  };
  const starCount = 900;
  const positions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    const radius = 28 + random() * 7;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi);
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xc7d8ff,
      size: 0.065,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
  ));
}

function addSystemJunkyard(root, node, pickables) {
  const group = new THREE.Group();
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x10191d,
    emissive: 0x68d7be,
    emissiveIntensity: 0.65,
    roughness: 0.35,
    metalness: 0.55,
  });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.76, 1), coreMaterial);
  core.scale.set(1.45, 0.72, 1.15);
  group.add(core);
  for (let index = 0; index < 3; index += 1) {
    const shard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28 + index * 0.06, 0),
      new THREE.MeshStandardMaterial({
        color: index === 1 ? 0xd7a64c : 0x355f62,
        emissive: index === 1 ? 0xd7a64c : 0x2a8f82,
        emissiveIntensity: 0.36,
        roughness: 0.5,
        metalness: 0.45,
      }),
    );
    const angle = index * Math.PI * 2 / 3;
    shard.position.set(Math.cos(angle) * 1.05, (index - 1) * 0.23, Math.sin(angle) * 0.82);
    shard.rotation.set(angle, angle * 0.7, angle * 0.3);
    group.add(shard);
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.035, 10, 90),
    new THREE.MeshBasicMaterial({ color: 0x68d7be, transparent: true, opacity: 0.68 }),
  );
  ring.rotation.x = Math.PI / 2.6;
  group.add(ring);
  root.add(group);
  markPickable(group, node, pickables);
  return group;
}

function addSystemWorld(root, node, rank, worldCount, pickables, timeUniforms) {
  const group = new THREE.Group();
  const hue = stableHue(node.ref?.id || node.ref?.name) / 360;
  const colorA = new THREE.Color().setHSL(hue, 0.54, 0.2);
  const colorB = new THREE.Color().setHSL((hue + 0.13) % 1, 0.62, 0.58);
  const timeUniform = { value: 0 };
  timeUniforms.push(timeUniform);
  const tier = Number(node.visual?.tier || 0);
  const radius = 0.34 + Math.min(0.28, tier * 0.045);
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 42, 28),
    new THREE.ShaderMaterial({
      uniforms: {
        colorA: { value: colorA },
        colorB: { value: colorB },
        pollutionColor: { value: new THREE.Color(0x6b3f53) },
        seed: { value: scalarSeed(node.ref?.id || node.ref?.name) },
        pollution: { value: Number(node.visual?.pollution || 0) / 100 },
        time: timeUniform,
      },
      vertexShader: PLANET_VERTEX_SHADER,
      fragmentShader: PLANET_FRAGMENT_SHADER,
    }),
  );
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.075, 30, 20),
    new THREE.MeshBasicMaterial({
      color: colorB,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  group.add(planet, atmosphere);
  root.add(group);
  markPickable(group, node, pickables);

  const orbitRadius = 2.25 + rank * 1.16;
  const worldSeed = scalarSeed(node.ref?.id || node.ref?.name);
  const phase = worldSeed * Math.PI * 2;
  const inclination = (worldSeed * 2 - 1) * 0.18;
  group.userData.orbit = {
    radius: orbitRadius,
    phase,
    inclination,
    speed: 0.055 / Math.sqrt(Math.max(1, rank + 1)),
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
  root.add(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(trackPoints),
    new THREE.LineBasicMaterial({
      color: 0x4b5e72,
      transparent: true,
      opacity: Math.max(0.16, 0.38 - worldCount * 0.012),
    }),
  ));
  return group;
}

function orderedSystemWorlds(projection, orderMode) {
  const worlds = projection.nodes.filter((node) => node?.ref?.scope === "world");
  if (orderMode === "acquired") return worlds;
  const direction = orderMode === "tier-desc" ? -1 : 1;
  return worlds
    .map((node, index) => ({ node, index }))
    .sort((left, right) => {
      const leftOrder = Number(left.node.visual?.tier || 0) * 101
        + Number(left.node.visual?.tierProgress || 0);
      const rightOrder = Number(right.node.visual?.tier || 0) * 101
        + Number(right.node.visual?.tierProgress || 0);
      return (leftOrder - rightOrder) * direction || left.index - right.index;
    })
    .map(({ node }) => node);
}

function mountLegacyJunkyardSystem(container, projection, options = {}) {
  if (!container) return () => {};
  if (projection?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(projection.nodes)) {
    fallback(container, "当前还没有可查看的世界。");
    return () => {};
  }
  const runtimeHandle = Object.freeze({ read: readJunkyardSystemRuntime });
  const runtimeMountId = `${Math.round(junkyardSystemRuntime.startedAt)}:${++junkyardSystemRuntime.mountSequence}`;
  Object.defineProperty(container, "junkyardSystemRuntime", {
    configurable: true,
    value: runtimeHandle,
  });
  container.dataset.junkyardSystemRuntimeMount = runtimeMountId;
  container.replaceChildren();
  const canvas = document.createElement("canvas");
  canvas.className = "junkyard-system-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const labels = document.createElement("div");
  labels.className = "spatial-map-labels system-labels";
  labels.setAttribute("aria-hidden", "true");
  container.append(canvas, labels);
  const dataProbe = createCanvasDataProbe(document, container, { className: "spatial-map-tooltip system-tooltip" });

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch {
    fallback(container, "浏览器没有可用的 WebGL。左侧世界列表仍可使用。");
    return () => {};
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020307);
  addSystemSky(scene, projection.sourceRevision || projection.nodes.length);
  const developerCamera = options.developerTuning?.camera || {};
  const camera = new THREE.PerspectiveCamera(
    Number(developerCamera.fov) || 44,
    1,
    Number(developerCamera.near) || HOME_CAMERA_LIMIT_POLICY.nearClip,
    Number(developerCamera.far) || HOME_CAMERA_LIMIT_POLICY.farClip,
  );
  const cameraTarget = new THREE.Vector3(
    Number(developerCamera.targetX) || 0,
    Number(developerCamera.targetY) || 0,
    Number(developerCamera.targetZ) || 0,
  );
  camera.position.set(
    Number.isFinite(Number(developerCamera.positionX)) ? Number(developerCamera.positionX) : junkyardSystemRuntime.camera.position[0],
    Number.isFinite(Number(developerCamera.positionY)) ? Number(developerCamera.positionY) : junkyardSystemRuntime.camera.position[1],
    Number.isFinite(Number(developerCamera.positionZ)) ? Number(developerCamera.positionZ) : junkyardSystemRuntime.camera.position[2],
  );
  junkyardSystemRuntime.camera.position = camera.position.toArray();
  junkyardSystemRuntime.camera.target = cameraTarget.toArray();
  camera.lookAt(cameraTarget);
  scene.add(new THREE.HemisphereLight(0x9fc8ff, 0x06080e, 0.88));
  const coreLight = new THREE.PointLight(0x8fffe7, 4.8, 26, 1.3);
  coreLight.position.set(0, 0.5, 0);
  scene.add(coreLight);

  const root = new THREE.Group();
  scene.add(root);
  const pickables = [];
  const timeUniforms = [];
  const labelsToProject = [];
  const addLabel = (object, node, height) => {
    const label = document.createElement("span");
    label.className = `spatial-map-label is-${node.ref?.scope || "node"}`;
    label.textContent = node.ref?.name || "未命名";
    labels.append(label);
    labelsToProject.push({ object, node, label, height });
  };
  const junkyardNode = projection.nodes.find((node) => node?.ref?.scope === "junkyard") || {
    ref: { scope: "junkyard", id: "junkyard", name: "垃圾场" },
    state: "base",
  };
  const junkyardObject = addSystemJunkyard(root, junkyardNode, pickables);
  addLabel(junkyardObject, junkyardNode, 1.22);
  const worlds = orderedSystemWorlds(projection, junkyardSystemRuntime.orderMode);
  const visibleWorldIds = new Set(worlds.map((node) => String(node.ref?.id || "")));
  for (const worldId of junkyardSystemRuntime.worlds.keys()) {
    if (!visibleWorldIds.has(worldId)) junkyardSystemRuntime.worlds.delete(worldId);
  }
  const orbitObjects = worlds.map((node, index) => {
    const object = addSystemWorld(root, node, index, worlds.length, pickables, timeUniforms);
    addLabel(object, node, 0.78);
    return object;
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);
  const temp = new THREE.Vector3();
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  let hovered = null;
  let disposed = false;
  let renderRequested = false;
  let lastRuntimeObservationAt = -Infinity;
  const publishRuntimeObservation = (timestamp = performance.now(), force = false) => {
    if (!force && timestamp - lastRuntimeObservationAt < 250) return;
    lastRuntimeObservationAt = timestamp;
    container.dataset.junkyardSystemRuntime = JSON.stringify(readJunkyardSystemRuntime());
  };

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const pixelRatio = renderer.getPixelRatio();
    if (
      canvas.width !== Math.floor(width * pixelRatio)
      || canvas.height !== Math.floor(height * pixelRatio)
    ) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    return { width, height };
  };
  const render = (timestamp = performance.now()) => {
    if (disposed) return;
    const { width, height } = resize();
    const elapsed = reducedMotion
      ? 0
      : (timestamp - junkyardSystemRuntime.startedAt) / 1000;
    junkyardObject.rotation.y = elapsed * 0.07;
    orbitObjects.forEach((object, index) => {
      const orbit = object.userData.orbit;
      const angle = orbit.phase + elapsed * orbit.speed;
      object.position.set(
        Math.cos(angle) * orbit.radius,
        Math.sin(angle * 2 + orbit.phase) * orbit.inclination,
        Math.sin(angle) * orbit.radius,
      );
      object.rotation.y = elapsed * 0.12 + orbit.phase;
      const worldId = String(worlds[index]?.ref?.id || "");
      if (worldId) {
        junkyardSystemRuntime.worlds.set(worldId, {
          angle,
          orbitRadius: orbit.radius,
          speed: orbit.speed,
          position: object.position.toArray(),
        });
      }
    });
    timeUniforms.forEach((uniform) => { uniform.value = elapsed; });
    scene.updateMatrixWorld(true);
    const projectedLabels = [];
    for (const entry of labelsToProject) {
      entry.object.getWorldPosition(temp);
      temp.y += entry.height;
      temp.project(camera);
      entry.label.hidden = Math.abs(temp.z) > 1;
      if (!entry.label.hidden) {
        projectedLabels.push({
          entry,
          x: (temp.x * 0.5 + 0.5) * width,
          y: (temp.y * -0.5 + 0.5) * height,
          labelWidth: entry.label.offsetWidth,
          labelHeight: entry.label.offsetHeight,
        });
      }
    }
    for (const result of layoutOverlayLabelAnchors(projectedLabels, width, height)) {
      result.entry.label.style.transform = `translate(-50%, -100%) translate(${result.x}px, ${result.y}px)`;
    }
    renderer.render(scene, camera);
    publishRuntimeObservation(timestamp);
    renderRequested = false;
  };
  const requestRender = () => {
    if (!reducedMotion || renderRequested) return;
    renderRequested = true;
    requestAnimationFrame(render);
  };
  const saveCameraRuntime = () => {
    junkyardSystemRuntime.camera.position = camera.position.toArray();
    junkyardSystemRuntime.camera.target = cameraTarget.toArray();
    publishRuntimeObservation(performance.now(), true);
  };
  const control = {
    pointerId: null,
    button: -1,
    startX: 0,
    startY: 0,
    startPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    startOffset: new THREE.Vector3(),
    dragged: false,
    suppressClick: false,
    suppressContextMenu: false,
  };
  const minCameraRadius = HOME_CAMERA_LIMIT_POLICY.minimumOrbitRadius;
  const maxCameraRadius = HOME_CAMERA_LIMIT_POLICY.maximumOrbitRadius;
  const applyCameraLook = (requestedOffset = null) => {
    constrainHomeCameraState(camera.position, cameraTarget, requestedOffset);
    camera.lookAt(cameraTarget);
    camera.updateMatrixWorld(true);
    saveCameraRuntime();
    requestRender();
  };
  const onControlStart = (event) => {
    if (![0, 1, 2].includes(event.button)) return;
    event.preventDefault();
    control.pointerId = event.pointerId;
    control.button = event.button;
    control.startX = event.clientX;
    control.startY = event.clientY;
    control.startPosition.copy(camera.position);
    control.startTarget.copy(cameraTarget);
    control.startOffset.copy(camera.position).sub(cameraTarget);
    control.dragged = false;
    control.suppressContextMenu = false;
    dataProbe.hide();
    canvas.setPointerCapture?.(event.pointerId);
  };
  const onControlMove = (event) => {
    if (control.pointerId !== event.pointerId) return false;
    const deltaX = event.clientX - control.startX;
    const deltaY = event.clientY - control.startY;
    control.dragged ||= Math.hypot(deltaX, deltaY) > 3;
    if (control.button === 0) {
      const spherical = new THREE.Spherical().setFromVector3(control.startOffset);
      spherical.theta -= deltaX * 0.006;
      spherical.phi = clamp(spherical.phi - deltaY * 0.006, 0.12, Math.PI - 0.12);
      spherical.makeSafe();
      cameraTarget.copy(control.startTarget);
      camera.position.copy(cameraTarget).add(
        new THREE.Vector3().setFromSpherical(spherical),
      );
    } else if (control.button === 1) {
      const startRadius = control.startOffset.length();
      const radius = clamp(startRadius * Math.exp(deltaY * 0.01), minCameraRadius, maxCameraRadius);
      cameraTarget.copy(control.startTarget);
      camera.position.copy(cameraTarget).add(
        control.startOffset.clone().setLength(radius),
      );
    } else {
      camera.position.copy(control.startPosition);
      cameraTarget.copy(control.startTarget);
      camera.lookAt(cameraTarget);
      camera.updateMatrixWorld(true);
      const distance = control.startOffset.length();
      const panScale = distance * 0.0017;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      cameraTarget
        .addScaledVector(right, -deltaX * panScale)
        .addScaledVector(up, deltaY * panScale);
      camera.position.copy(cameraTarget).add(control.startOffset);
      applyCameraLook(control.startOffset);
      return true;
    }
    applyCameraLook();
    return true;
  };
  const onControlEnd = (event) => {
    if (control.pointerId !== event.pointerId) return;
    control.suppressClick = control.button === 0 && control.dragged;
    control.suppressContextMenu = control.button === 2 && control.dragged;
    canvas.releasePointerCapture?.(event.pointerId);
    control.pointerId = null;
    control.button = -1;
  };
  const onWheel = (event) => {
    event.preventDefault();
    const offset = camera.position.clone().sub(cameraTarget);
    const radius = clamp(
      offset.length() * Math.exp(event.deltaY * 0.001),
      minCameraRadius,
      maxCameraRadius,
    );
    camera.position.copy(cameraTarget).add(offset.setLength(radius));
    applyCameraLook();
  };
  const nodeFromPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(pickables, false)[0]?.object?.userData?.spatialNode || null;
  };
  const showTooltip = (event, node) => {
    if (!node) {
      dataProbe.hide();
      canvas.style.cursor = "";
      return;
    }
    dataProbe.show([
      ["small", node.ref?.scope === "world"
        ? `位阶 ${node.visual?.tier ?? "?"} · 培养 ${node.visual?.tierProgress ?? 0}%`
        : "垃圾场"],
      ["b", node.ref?.name || "未命名"],
      ["p", node.desc || "暂无更多公开说明。"],
    ], event.clientX, event.clientY);
    canvas.style.cursor = event.ctrlKey ? "copy" : "pointer";
  };
  const onPointerMove = (event) => {
    if (onControlMove(event)) {
      hovered = null;
      canvas.style.cursor = control.button === 2 ? "move" : control.button === 1 ? "ns-resize" : "grabbing";
      return;
    }
    hovered = nodeFromPointer(event);
    showTooltip(event, hovered);
  };
  const onPointerLeave = () => {
    hovered = null;
    dataProbe.hide();
    canvas.style.cursor = "";
  };
  const onClick = (event) => {
    if (control.suppressClick) {
      control.suppressClick = false;
      return;
    }
    const node = nodeFromPointer(event);
    if (!node) return;
    if (event.ctrlKey) {
      event.preventDefault();
      options.onContextRef?.(publicRef(node.ref));
    } else if (node.ref?.scope === "world") {
      options.onActivate?.(node);
    }
  };
  const onContextMenu = (event) => {
    event.preventDefault();
    if (control.suppressContextMenu) {
      control.suppressContextMenu = false;
      return;
    }
    const node = nodeFromPointer(event);
    if (node?.ref?.scope === "world" || node?.ref?.scope === "junkyard") {
      options.onContextMenu?.(node, event.clientX, event.clientY);
    }
  };
  canvas.addEventListener("pointerdown", onControlStart);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onControlEnd);
  canvas.addEventListener("pointercancel", onControlEnd);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("click", onClick);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onContextMenu);
  const resizeObserver = new ResizeObserver(() => render());
  resizeObserver.observe(container);
  renderer.setAnimationLoop(reducedMotion ? null : render);
  render();

  return () => {
    disposed = true;
    renderer.setAnimationLoop(null);
    resizeObserver.disconnect();
    canvas.removeEventListener("pointerdown", onControlStart);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onControlEnd);
    canvas.removeEventListener("pointercancel", onControlEnd);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    canvas.removeEventListener("click", onClick);
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("contextmenu", onContextMenu);
    scene.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
      else object.material?.dispose?.();
    });
    renderer.dispose();
    if (container.junkyardSystemRuntime === runtimeHandle) {
      delete container.junkyardSystemRuntime;
    }
    if (container.dataset.junkyardSystemRuntimeMount === runtimeMountId) {
      delete container.dataset.junkyardSystemRuntimeMount;
      delete container.dataset.junkyardSystemRuntime;
    }
    container.replaceChildren();
  };
}

export function mountJunkyardSystemView(container, projection, options = {}) {
  if (!container) throw new TypeError("junkyard-system-requires-container");
  if (projection?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(projection.nodes)) {
    throw new TypeError("junkyard-system-requires-public-projection");
  }
  let runtimeHandle = null;
  const runtimeMountId = `${Math.round(junkyardSystemRuntime.startedAt)}:${++junkyardSystemRuntime.mountSequence}`;
  container.replaceChildren();
  const canvas = document.createElement("canvas");
  canvas.className = "junkyard-system-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const labels = document.createElement("div");
  labels.className = "spatial-map-labels system-labels";
  labels.setAttribute("aria-hidden", "true");
  container.append(canvas, labels);
  const dataProbe = createCanvasDataProbe(document, container, { className: "spatial-map-tooltip system-tooltip" });

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch (error) {
    container.replaceChildren();
    throw new Error("junkyard-system-webgl-unavailable", { cause: error });
  }
  const setupReleases = [];
  setupReleases.push(() => renderer.dispose());
  setupReleases.push(() => renderer.forceContextLoss?.());
  setupReleases.push(() => renderer.setAnimationLoop(null));
  try {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  let currentProjection = projection;
  let currentOptions = {
    ...options,
    developerTuning: JSON.parse(JSON.stringify(options.developerTuning || {})),
  };
  const sceneMode = () => currentOptions.sceneMode === "knowledge" ? "knowledge" : "home";
  canvas.classList.toggle("is-knowledge-mode", sceneMode() === "knowledge");
  labels.classList.toggle("is-knowledge-mode", sceneMode() === "knowledge");
  let runtime = createAppearanceScene(currentProjection, currentOptions.appearanceState, {
    orderMode: junkyardSystemRuntime.orderMode,
    stateOverlayEnabled: currentOptions.stateOverlayEnabled,
    developerTuning: currentOptions.developerTuning,
  });
  setupReleases.push(() => disposeAppearanceScene(runtime));
  container.dataset.homeSceneEnvelope = HOME_SCENE_ENVELOPE_POLICY.schemaVersion;
  container.dataset.homeSkyRadius = String(HOME_SCENE_ENVELOPE_POLICY.skyRadius);
  container.dataset.homeCameraPanLimit = String(HOME_CAMERA_LIMIT_POLICY.maximumPanRadius);
  container.dataset.homeEnvironmentDust = runtime.environmentDust?.userData?.schemaVersion || "";
  container.dataset.homeEnvironmentDustCount = String(
    runtime.environmentDust?.userData?.particleCount || 0,
  );
  container.dataset.homeEnvironmentDustClouds = String(
    runtime.environmentDust?.userData?.cloudCount || 0,
  );
  prepareSkyForRenderer(runtime, renderer);
  let homePostFx = resolveHomePostFx(currentOptions.appearanceState);
  const homeTarget = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
  });
  setupReleases.push(() => homeTarget.dispose());
  homeTarget.samples = HOME_POST_FX_RENDER_TARGET_POLICY.samples;
  homeTarget.texture.colorSpace = THREE.SRGBColorSpace;
  container.dataset.homePostFxSamples = String(homeTarget.samples);
  const homePost = createScreenPostScene();
  setupReleases.push(() => disposeScreenPostScene(homePost));
  const initialCameraTuning = currentOptions.developerTuning?.camera || {};
  const initialKnowledgeCamera = currentOptions.developerTuning?.knowledgeCamera || {};
  const camera = new THREE.PerspectiveCamera(
    sceneMode() === "knowledge"
      ? Number(initialKnowledgeCamera.fov) || 46
      : Number(initialCameraTuning.fov) || 44,
    1,
    Number(initialCameraTuning.near) || HOME_CAMERA_LIMIT_POLICY.nearClip,
    Number(initialCameraTuning.far) || HOME_CAMERA_LIMIT_POLICY.farClip,
  );
  const cameraTarget = new THREE.Vector3(
    Number(initialCameraTuning.targetX) || 0,
    Number(initialCameraTuning.targetY) || 0,
    Number(initialCameraTuning.targetZ) || 0,
  );
  if (sceneMode() === "knowledge") {
    camera.up.set(0, 0, -1);
    cameraTarget.set(0, Number(initialKnowledgeCamera.targetY) || 0, 0);
    camera.position.set(0, Number(initialKnowledgeCamera.height) || 15.5, 0);
  } else {
    camera.position.set(
      Number.isFinite(Number(initialCameraTuning.positionX)) ? Number(initialCameraTuning.positionX) : junkyardSystemRuntime.camera.position[0],
      Number.isFinite(Number(initialCameraTuning.positionY)) ? Number(initialCameraTuning.positionY) : junkyardSystemRuntime.camera.position[1],
      Number.isFinite(Number(initialCameraTuning.positionZ)) ? Number(initialCameraTuning.positionZ) : junkyardSystemRuntime.camera.position[2],
    );
    constrainHomeCameraState(camera.position, cameraTarget);
    junkyardSystemRuntime.camera.position = camera.position.toArray();
    junkyardSystemRuntime.camera.target = cameraTarget.toArray();
  }
  camera.lookAt(cameraTarget);
  runtimeHandle = Object.freeze({
    read: () => ({
      ...readJunkyardSystemRuntime(),
      sceneMode: currentOptions.sceneMode === "knowledge" ? "knowledge" : "home",
      camera: {
        position: camera.position.toArray(),
        target: cameraTarget.toArray(),
      },
    }),
  });
  Object.defineProperty(container, "junkyardSystemRuntime", {
    configurable: true,
    value: runtimeHandle,
  });
  container.dataset.junkyardSystemRuntimeMount = runtimeMountId;
  container.dataset.homeCameraFov = String(camera.fov);
  container.dataset.junkyardSceneMode = sceneMode();
  let requestTextureRender = () => {};
  const jellyfishPolicy = () => {
    const tuning = currentOptions.developerTuning?.jellyfish || {};
    return {
      anchorU: Number.isFinite(Number(tuning.anchorU)) ? Number(tuning.anchorU) : 0.81254,
      anchorV: Number(tuning.anchorV) || 0.57485,
      bodyWidthRatio: Number(tuning.bodyWidthRatio) || 0.048,
      irisKeyLightIntensity: Number.isFinite(Number(tuning.keyLight)) ? Number(tuning.keyLight) : 1.7,
      irisFillLightIntensity: Number.isFinite(Number(tuning.fillLight)) ? Number(tuning.fillLight) : 8,
    };
  };
  let homeJellyfishSkySphere = currentOptions.homeJellyfishSvg
    ? createHomeJellyfishSkySphereOverlay(currentOptions.homeJellyfishSvg, {
      onGeometryUpdate: () => requestTextureRender(),
      policy: jellyfishPolicy(),
    })
    : null;
  if (homeJellyfishSkySphere) {
    setupReleases.push(() => homeJellyfishSkySphere.dispose());
    homeJellyfishSkySphere.attachToSky(runtime.sky);
    runtime.scene.add(
      homeJellyfishSkySphere.irisKeyLight,
      homeJellyfishSkySphere.irisFillLight,
    );
    homeJellyfishSkySphere.setLightTarget(runtime.junkyard);
    container.dataset.homeJellyfishRenderer = homeJellyfishSkySphere.policy.renderMode;
    container.dataset.homeJellyfishDepthTest = "true";
    container.dataset.homeJellyfishTentacleCount = String(
      homeJellyfishSkySphere.policy.tentacleCount,
    );
    container.dataset.homeJellyfishTentacleTimeScale = String(
      homeJellyfishSkySphere.motionPolicy.timeScale,
    );
    container.dataset.homeJellyfishIrisLight = "true";
    container.dataset.homeJellyfishSkyAttached = "true";
    container.dataset.homeJellyfishTentacleRoot = "eye-center";
    container.dataset.homeJellyfishBlink = "disabled";
    container.dataset.homeJellyfishRasterTexture = "false";
  }
  const labelsToProject = [];
  const addLabel = (object, node, height) => {
    const label = document.createElement("span");
    label.className = `spatial-map-label is-${node.ref?.scope || "node"}`;
    label.textContent = node.ref?.name || "未命名";
    labels.append(label);
    labelsToProject.push({ object, node, label, height });
  };
  const rebuildLabels = () => {
    labels.replaceChildren();
    labelsToProject.length = 0;
    const junkyardNode = currentProjection.nodes.find((node) => node?.ref?.scope === "junkyard") || {
      ref: { scope: "junkyard", id: "junkyard", name: "垃圾场" },
      state: "base",
    };
    addLabel(runtime.junkyard, junkyardNode, 1.22);
    for (const entry of runtime.worlds.values()) addLabel(entry.group, entry.node, 0.78);
  };
  rebuildLabels();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);
  const temp = new THREE.Vector3();
  const anchorTemp = new THREE.Vector3();
  const junkyardProjected = new THREE.Vector3();
  let reducedMotion = Boolean(currentOptions.reducedMotion);
  let visible = currentOptions.visible !== false;
  let contextLost = false;
  homeJellyfishSkySphere?.setReducedMotion(reducedMotion);
  let disposed = false;
  let renderRequested = 0;
  let animationLoopActive = false;
  let renderInProgress = false;
  let setupComplete = false;
  let fatalReported = false;
  let currentSceneViewport = currentOptions.sceneViewport || null;
  let activeSafeFrame = null;
  let motionElapsedSeconds = Math.max(0, Number(junkyardSystemRuntime.motionElapsedSeconds) || 0);
  let lastMotionTimestamp = null;
  let lastRuntimeObservationAt = -Infinity;
  const publishRuntimeObservation = (timestamp = performance.now(), force = false) => {
    if (!force && timestamp - lastRuntimeObservationAt < 250) return;
    lastRuntimeObservationAt = timestamp;
    container.dataset.junkyardSystemRuntime = JSON.stringify(readJunkyardSystemRuntime());
  };
  const resolveSafeFrame = (width, height) => {
    const containerRect = container.getBoundingClientRect();
    const source = currentSceneViewport?.safeRect;
    if (!source?.width || !source?.height || !containerRect.width || !containerRect.height) {
      return { x: 0, y: 0, width, height };
    }
    const left = clamp(source.x - containerRect.left, 0, width);
    const top = clamp(source.y - containerRect.top, 0, height);
    const right = clamp(source.x + source.width - containerRect.left, left, width);
    const bottom = clamp(source.y + source.height - containerRect.top, top, height);
    const margin = Math.min(14, (right - left) * 0.04, (bottom - top) * 0.04);
    return {
      x: left + margin,
      y: top + margin,
      width: Math.max(1, right - left - margin * 2),
      height: Math.max(1, bottom - top - margin * 2),
    };
  };
  const applyProjectionFrame = (width, height, frame = null) => {
    const target = frame || { x: 0, y: 0, width, height };
    camera.clearViewOffset?.();
    camera.zoom = 1;
    camera.aspect = target.width / Math.max(1, target.height);
    camera.updateProjectionMatrix();
    if (frame) {
      const scaleX = target.width / Math.max(1, width);
      const scaleY = target.height / Math.max(1, height);
      const translateX = (target.x + target.width * 0.5) * 2 / Math.max(1, width) - 1;
      const translateY = 1 - (target.y + target.height * 0.5) * 2 / Math.max(1, height);
      const elements = camera.projectionMatrix.elements;
      for (let column = 0; column < 4; column += 1) {
        const row = column * 4;
        elements[row] = scaleX * elements[row] + translateX * elements[row + 3];
        elements[row + 1] = scaleY * elements[row + 1] + translateY * elements[row + 3];
      }
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    }
    camera.updateMatrixWorld(true);
  };
  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const pixelRatio = renderer.getPixelRatio();
    if (
      canvas.width !== Math.floor(width * pixelRatio)
      || canvas.height !== Math.floor(height * pixelRatio)
    ) {
      renderer.setSize(width, height, false);
    }
    activeSafeFrame = resolveSafeFrame(width, height);
    applyProjectionFrame(width, height, activeSafeFrame);
    container.dataset.pageSceneSafeFrame = JSON.stringify(activeSafeFrame);
    return { width, height };
  };
  const renderFrame = (timestamp = performance.now()) => {
    if (disposed || contextLost || !visible) return;
    currentOptions.onBeforeRender?.(timestamp);
    const { width, height } = resize();
    if (!reducedMotion) {
      if (lastMotionTimestamp !== null) {
        motionElapsedSeconds += Math.max(0, timestamp - lastMotionTimestamp) / 1000;
      }
      lastMotionTimestamp = timestamp;
      junkyardSystemRuntime.motionElapsedSeconds = motionElapsedSeconds;
    } else {
      lastMotionTimestamp = null;
    }
    updateAppearanceScene(runtime, motionElapsedSeconds, camera);
    const visibleWorldIds = new Set(runtime.worlds.keys());
    for (const worldId of junkyardSystemRuntime.worlds.keys()) {
      if (!visibleWorldIds.has(worldId)) junkyardSystemRuntime.worlds.delete(worldId);
    }
    for (const [worldId, entry] of runtime.worlds) {
      junkyardSystemRuntime.worlds.set(worldId, {
        angle: entry.angle,
        orbitRadius: entry.orbit.radius,
        speed: entry.orbit.speed,
        position: entry.group.position.toArray(),
      });
    }
    camera.updateMatrixWorld(true);
    const projectedLabels = [];
    const projectedAnchors = [];
    const containerRect = container.getBoundingClientRect();
    for (const entry of labelsToProject) {
      entry.object.getWorldPosition(anchorTemp);
      anchorTemp.project(camera);
      const anchorVisible = Math.abs(anchorTemp.z) <= 1
        && Math.abs(anchorTemp.x) <= 1
        && Math.abs(anchorTemp.y) <= 1;
      projectedAnchors.push({
        scope: String(entry.node?.ref?.scope || ""),
        id: String(entry.node?.ref?.id || ""),
        name: String(entry.node?.ref?.name || ""),
        x: (anchorTemp.x * 0.5 + 0.5) * width,
        y: (anchorTemp.y * -0.5 + 0.5) * height,
        clientX: containerRect.left + (anchorTemp.x * 0.5 + 0.5) * width,
        clientY: containerRect.top + (anchorTemp.y * -0.5 + 0.5) * height,
        visible: anchorVisible,
      });
      entry.object.getWorldPosition(temp);
      temp.y += entry.height;
      temp.project(camera);
      entry.label.hidden = Math.abs(temp.z) > 1 || Math.abs(temp.x) > 1 || Math.abs(temp.y) > 1;
      if (!entry.label.hidden) {
        const projectedX = (temp.x * 0.5 + 0.5) * width;
        const projectedY = (temp.y * -0.5 + 0.5) * height;
        entry.label.style.transform = `translate(-50%, -100%) translate(${projectedX}px, ${projectedY}px)`;
        const labelRect = entry.label.getBoundingClientRect();
        const exposed = currentSceneViewport?.exposedRect;
        const outsideExposed = exposed && (
          labelRect.left < exposed.x
          || labelRect.top < exposed.y
          || labelRect.right > exposed.x + exposed.width
          || labelRect.bottom > exposed.y + exposed.height
        );
        const overlapsOcclusion = currentSceneViewport?.persistentOcclusionRects?.some((rect) => (
          labelRect.right > rect.x
          && labelRect.left < rect.x + rect.width
          && labelRect.bottom > rect.y
          && labelRect.top < rect.y + rect.height
        ));
        entry.label.hidden = Boolean(outsideExposed || overlapsOcclusion);
        if (!entry.label.hidden) {
        projectedLabels.push({
          entry,
          x: projectedX,
          y: projectedY,
          labelWidth: entry.label.offsetWidth,
          labelHeight: entry.label.offsetHeight,
        });
        }
      }
    }
    for (const result of layoutOverlayLabelAnchors(projectedLabels, width, height)) {
      result.entry.label.style.transform = `translate(-50%, -100%) translate(${result.x}px, ${result.y}px)`;
    }
    currentOptions.onSpatialNodeProjection?.({
      sceneMode: sceneMode(),
      width,
      height,
      anchors: projectedAnchors,
      camera2d: sceneMode() === "knowledge" ? {
        kind: "top-down",
        targetX: cameraTarget.x,
        targetZ: cameraTarget.z,
        height: camera.position.distanceTo(cameraTarget),
        baselineHeight: Number(currentOptions.developerTuning?.knowledgeCamera?.height) || 15.5,
        fov: camera.fov,
        pixelsPerWorld: activeSafeFrame.height / Math.max(
          0.001,
          2 * camera.position.distanceTo(cameraTarget) * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5),
        ),
        frame: {
          left: containerRect.left + activeSafeFrame.x,
          top: containerRect.top + activeSafeFrame.y,
          width: activeSafeFrame.width,
          height: activeSafeFrame.height,
        },
      } : null,
    });
    if (homeJellyfishSkySphere) {
      homeJellyfishSkySphere.updateAttachment();
      homeJellyfishSkySphere.update(timestamp);
      runtime.junkyard.getWorldPosition(junkyardProjected);
      junkyardProjected.project(camera);
      const junkyardCenter = {
        x: containerRect.left + (junkyardProjected.x * 0.5 + 0.5) * width,
        y: containerRect.top + (junkyardProjected.y * -0.5 + 0.5) * height,
      };
      const projection = homeJellyfishSkySphere.projection(camera, {
        left: containerRect.left,
        top: containerRect.top,
        width,
        height,
      });
      const {
        screenRect,
        eyeRect,
        eyeCenter,
        gazeBasis,
        inViewport,
      } = projection;
      junkyardSystemRuntime.homeJellyfish = {
        attachment: HOME_JELLYFISH_ATTACHMENT.relation,
        target: HOME_JELLYFISH_ATTACHMENT.target,
        position: [...projection.worldPosition],
        visible: inViewport,
        active: true,
        renderMode: homeJellyfishSkySphere.policy.renderMode,
        depthTest: true,
        vectorReady: homeJellyfishSkySphere.ready,
        rasterTexture: false,
        tentacleCount: homeJellyfishSkySphere.policy.tentacleCount,
        tentacleTimeScale: homeJellyfishSkySphere.motionPolicy.timeScale,
        irisLight: true,
      };
      container.dataset.homeJellyfishWorldPosition = (
        junkyardSystemRuntime.homeJellyfish.position.join(",")
      );
      container.dataset.homeJellyfishInViewport = String(inViewport);
      container.dataset.homeJellyfishActive = "true";
      container.dataset.homeJellyfishAttachment = HOME_JELLYFISH_ATTACHMENT.relation;
      container.dataset.homeJellyfishVectorReady = String(homeJellyfishSkySphere.ready);
      container.dataset.homeJellyfishJunkyardCenter = JSON.stringify(junkyardCenter);
      container.dataset.homeJellyfishScreenRect = JSON.stringify(screenRect);
      container.dataset.homeJellyfishEyeRect = JSON.stringify(eyeRect);
      container.dataset.homeJellyfishEyeCenter = JSON.stringify(eyeCenter);
      container.dataset.homeJellyfishGazeBasis = JSON.stringify(gazeBasis);
      currentOptions.onHomeJellyfishProjection?.({
        x: eyeRect.left + eyeRect.width * 0.5 - containerRect.left,
        y: eyeRect.top + eyeRect.height * 0.5 - containerRect.top,
        screenRect,
        eyeRect,
        eyeCenter,
        gazeBasis,
        junkyardCenter,
        visible: inViewport,
        inViewport,
        worldPosition: [...junkyardSystemRuntime.homeJellyfish.position],
        renderMode: homeJellyfishSkySphere.policy.renderMode,
        depthTest: true,
        active: true,
        attachment: HOME_JELLYFISH_ATTACHMENT.relation,
        target: HOME_JELLYFISH_ATTACHMENT.target,
        vectorReady: homeJellyfishSkySphere.ready,
        rasterTexture: false,
        tentacleCount: homeJellyfishSkySphere.policy.tentacleCount,
        irisLight: true,
      });
    }
    if (homePostFx.enabled) {
      homeTarget.setSize(canvas.width, canvas.height);
      renderer.setRenderTarget(homeTarget);
      if (homePostFx.processSky === false) {
        const clearColor = renderer.getClearColor(new THREE.Color()).clone();
        const clearAlpha = renderer.getClearAlpha();
        renderer.setClearColor(0x000000, 0);
        renderer.clear(true, true, true);
        renderAppearanceForeground(runtime, (scene) => renderer.render(scene, camera));
        renderer.setClearColor(clearColor, clearAlpha);
      } else {
        renderer.clear();
        applyProjectionFrame(width, height, activeSafeFrame);
        renderAppearanceSky(runtime, (scene) => renderer.render(scene, camera));
        applyProjectionFrame(width, height, activeSafeFrame);
        const autoClear = renderer.autoClear;
        renderer.autoClear = false;
        renderAppearanceForeground(runtime, (scene) => renderer.render(scene, camera));
        renderer.autoClear = autoClear;
      }
      applyScreenPostFx(
        homePost.uniforms,
        homePostFx,
        motionElapsedSeconds,
        0,
        canvas.width,
        canvas.height,
        homeTarget.texture,
      );
      renderer.setRenderTarget(null);
      if (homePostFx.processSky === false) {
        applyProjectionFrame(width, height, activeSafeFrame);
        renderAppearanceSky(runtime, (scene) => renderer.render(scene, camera));
        applyProjectionFrame(width, height, activeSafeFrame);
        const autoClear = renderer.autoClear;
        renderer.autoClear = false;
        renderer.render(homePost.scene, homePost.camera);
        renderer.autoClear = autoClear;
      } else {
        renderer.render(homePost.scene, homePost.camera);
      }
    } else {
      renderer.setRenderTarget(null);
      renderer.clear();
      applyProjectionFrame(width, height, activeSafeFrame);
      renderAppearanceSky(runtime, (scene) => renderer.render(scene, camera));
      applyProjectionFrame(width, height, activeSafeFrame);
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderAppearanceForeground(runtime, (scene) => renderer.render(scene, camera));
      renderer.autoClear = autoClear;
    }
    publishRuntimeObservation(timestamp);
  };
  const stopRenderScheduling = () => {
    if (animationLoopActive) {
      animationLoopActive = false;
      renderer.setAnimationLoop(null);
      currentOptions.onAnimationLoopChange?.(false);
    }
    if (renderRequested) {
      cancelAnimationFrame(renderRequested);
      renderRequested = 0;
      currentOptions.onAnimationFrameChange?.(false);
    }
  };
  const safeRender = (timestamp = performance.now()) => {
    if (disposed || fatalReported || renderInProgress) return;
    renderInProgress = true;
    try {
      renderFrame(timestamp);
    } catch (error) {
      if (!setupComplete) throw error;
      fatalReported = true;
      stopRenderScheduling();
      const reason = String(error?.message || "render-failed").slice(0, 80);
      try {
        currentOptions.onRuntimeEvent?.("fatal-error", reason);
      } catch {
        // Scheduling is already stopped even if the host callback is hostile.
      }
    } finally {
      renderInProgress = false;
    }
  };
  const requestRender = () => {
    if (
      disposed
      || fatalReported
      || renderInProgress
      || contextLost
      || !visible
      || animationLoopActive
      || renderRequested
    ) return;
    currentOptions.onAnimationFrameChange?.(true);
    renderRequested = requestAnimationFrame((timestamp) => {
      renderRequested = 0;
      currentOptions.onAnimationFrameChange?.(false);
      safeRender(timestamp);
    });
  };
  requestTextureRender = requestRender;
  const syncAnimationLoop = () => {
    const shouldRun = !disposed && !fatalReported && !contextLost && visible && !reducedMotion;
    if (shouldRun === animationLoopActive) {
      if (!shouldRun) requestRender();
      return;
    }
    animationLoopActive = shouldRun;
    lastMotionTimestamp = null;
    renderer.setAnimationLoop(shouldRun ? safeRender : null);
    currentOptions.onAnimationLoopChange?.(shouldRun);
    if (!shouldRun) requestRender();
  };
  const saveCameraRuntime = () => {
    if (sceneMode() === "knowledge") return;
    junkyardSystemRuntime.camera.position = camera.position.toArray();
    junkyardSystemRuntime.camera.target = cameraTarget.toArray();
    publishRuntimeObservation(performance.now(), true);
  };
  const control = {
    pointerId: null,
    button: -1,
    startX: 0,
    startY: 0,
    startPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    startOffset: new THREE.Vector3(),
    dragged: false,
    suppressClick: false,
    suppressContextMenu: false,
  };
  const clearControl = () => {
    control.pointerId = null;
    control.button = -1;
    control.dragged = false;
  };
  const cancelInteraction = () => {
    const pointerId = control.pointerId;
    try {
      if (
        pointerId !== null
        && (!canvas.hasPointerCapture || canvas.hasPointerCapture(pointerId))
      ) canvas.releasePointerCapture?.(pointerId);
    } catch {
      // Pointer capture may already have been revoked by navigation or blur.
    } finally {
      clearControl();
      dataProbe.hide();
      canvas.style.cursor = "";
    }
  };
  const minCameraRadius = HOME_CAMERA_LIMIT_POLICY.minimumOrbitRadius;
  const maxCameraRadius = HOME_CAMERA_LIMIT_POLICY.maximumOrbitRadius;
  const applyCameraLook = (requestedOffset = null) => {
    constrainHomeCameraState(camera.position, cameraTarget, requestedOffset);
    camera.lookAt(cameraTarget);
    camera.updateMatrixWorld(true);
    saveCameraRuntime();
    requestRender();
  };
  const applyKnowledgeCameraLook = (requestedHeight = camera.position.y - cameraTarget.y) => {
    const maximumPanRadius = HOME_CAMERA_LIMIT_POLICY.maximumPanRadius;
    const planarRadius = Math.hypot(cameraTarget.x, cameraTarget.z);
    if (!Number.isFinite(planarRadius)) {
      cameraTarget.x = 0;
      cameraTarget.z = 0;
    } else if (planarRadius > maximumPanRadius) {
      const ratio = maximumPanRadius / planarRadius;
      cameraTarget.x *= ratio;
      cameraTarget.z *= ratio;
    }
    const height = clamp(Number(requestedHeight) || 15.5, 6, 40);
    camera.position.set(cameraTarget.x, cameraTarget.y + height, cameraTarget.z);
    camera.lookAt(cameraTarget);
    camera.updateMatrixWorld(true);
    requestRender();
  };
  const onControlStart = (event) => {
    if (sceneMode() === "knowledge") return;
    if (![0, 1, 2].includes(event.button)) return;
    event.preventDefault();
    control.pointerId = event.pointerId;
    control.button = event.button;
    control.startX = event.clientX;
    control.startY = event.clientY;
    control.startPosition.copy(camera.position);
    control.startTarget.copy(cameraTarget);
    control.startOffset.copy(camera.position).sub(cameraTarget);
    control.dragged = false;
    control.suppressContextMenu = false;
    dataProbe.hide();
    try {
      canvas.setPointerCapture?.(event.pointerId);
    } catch {
      clearControl();
    }
  };
  const onControlMove = (event) => {
    if (control.pointerId !== event.pointerId) return false;
    const deltaX = event.clientX - control.startX;
    const deltaY = event.clientY - control.startY;
    control.dragged ||= Math.hypot(deltaX, deltaY) > 3;
    if (control.button === 0) {
      const spherical = new THREE.Spherical().setFromVector3(control.startOffset);
      spherical.theta -= deltaX * 0.006;
      spherical.phi = clamp(spherical.phi - deltaY * 0.006, 0.12, Math.PI - 0.12);
      spherical.makeSafe();
      cameraTarget.copy(control.startTarget);
      camera.position.copy(cameraTarget).add(new THREE.Vector3().setFromSpherical(spherical));
    } else if (control.button === 1) {
      const radius = clamp(
        control.startOffset.length() * Math.exp(deltaY * 0.01),
        minCameraRadius,
        maxCameraRadius,
      );
      cameraTarget.copy(control.startTarget);
      camera.position.copy(cameraTarget).add(control.startOffset.clone().setLength(radius));
    } else {
      camera.position.copy(control.startPosition);
      cameraTarget.copy(control.startTarget);
      camera.lookAt(cameraTarget);
      camera.updateMatrixWorld(true);
      const panScale = control.startOffset.length() * 0.0017;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      cameraTarget.addScaledVector(right, -deltaX * panScale).addScaledVector(up, deltaY * panScale);
      camera.position.copy(cameraTarget).add(control.startOffset);
      applyCameraLook(control.startOffset);
      return true;
    }
    applyCameraLook();
    return true;
  };
  const onControlEnd = (event) => {
    if (control.pointerId !== event.pointerId) return;
    try {
      control.suppressClick = control.button === 0 && control.dragged;
      control.suppressContextMenu = control.button === 2 && control.dragged;
    } finally {
      cancelInteraction();
    }
  };
  const onControlCancel = (event) => {
    if (control.pointerId === event.pointerId) cancelInteraction();
  };
  const onWindowBlur = () => cancelInteraction();
  const onLostPointerCapture = (event) => {
    if (control.pointerId === event.pointerId) clearControl();
  };
  const onWheel = (event) => {
    if (sceneMode() === "knowledge") return;
    event.preventDefault();
    const offset = camera.position.clone().sub(cameraTarget);
    const radius = clamp(offset.length() * Math.exp(event.deltaY * 0.001), minCameraRadius, maxCameraRadius);
    camera.position.copy(cameraTarget).add(offset.setLength(radius));
    applyCameraLook();
  };
  const handleKnowledgeCameraInput = (input = {}) => {
    if (sceneMode() !== "knowledge") return false;
    const type = String(input.type || "");
    const pointerId = input.pointerId ?? "knowledge-camera";
    if (type === "camera-pan-start") {
      control.pointerId = pointerId;
      control.button = 2;
      control.startX = Number(input.clientX) || 0;
      control.startY = Number(input.clientY) || 0;
      control.startPosition.copy(camera.position);
      control.startTarget.copy(cameraTarget);
      control.startOffset.copy(camera.position).sub(cameraTarget);
      control.dragged = false;
      return true;
    }
    if (type === "camera-pan-move") {
      if (control.pointerId !== pointerId || control.button !== 2) return false;
      const deltaX = (Number(input.clientX) || 0) - control.startX;
      const deltaY = (Number(input.clientY) || 0) - control.startY;
      const frameHeight = Math.max(1, Number(activeSafeFrame?.height) || container.clientHeight || 1);
      const height = Math.max(0.001, control.startOffset.length());
      const worldPerPixel = 2 * height * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) / frameHeight;
      control.dragged ||= Math.hypot(deltaX, deltaY) > 3;
      cameraTarget.copy(control.startTarget);
      cameraTarget.x -= deltaX * worldPerPixel;
      cameraTarget.z -= deltaY * worldPerPixel;
      applyKnowledgeCameraLook(height);
      return true;
    }
    if (type === "camera-pan-end" || type === "camera-pan-cancel") {
      if (control.pointerId !== pointerId) return false;
      clearControl();
      return true;
    }
    if (type === "camera-zoom") {
      const height = camera.position.distanceTo(cameraTarget);
      const factor = Number(input.factor);
      const nextHeight = Number.isFinite(factor) && factor > 0
        ? height * factor
        : height * Math.exp((Number(input.deltaY) || 0) * 0.001);
      applyKnowledgeCameraLook(nextHeight);
      return true;
    }
    if (type === "camera-reset") {
      const nextCamera = currentOptions.developerTuning?.knowledgeCamera || {};
      cameraTarget.set(0, Number(nextCamera.targetY) || 0, 0);
      applyKnowledgeCameraLook(Number(nextCamera.height) || 15.5);
      return true;
    }
    return false;
  };
  const nodeFromPointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(runtime.pickables, false)[0]?.object?.userData?.spatialNode || null;
  };
  const showTooltip = (event, node) => {
    if (!node) {
      dataProbe.hide();
      canvas.style.cursor = "";
      return;
    }
    dataProbe.show([
      ["small", node.ref?.scope === "world"
        ? `位阶 ${node.visual?.tier ?? "?"} · 培养 ${node.visual?.tierProgress ?? 0}%`
        : "垃圾场"],
      ["b", node.ref?.name || "未命名"],
      ["p", node.desc || "暂无更多公开说明。"],
    ], event.clientX, event.clientY);
    canvas.style.cursor = event.ctrlKey ? "copy" : "pointer";
  };
  const onPointerMove = (event) => {
    if (onControlMove(event)) {
      canvas.style.cursor = control.button === 2 ? "move" : control.button === 1 ? "ns-resize" : "grabbing";
      return;
    }
    showTooltip(event, nodeFromPointer(event));
  };
  const onPointerLeave = () => {
    dataProbe.hide();
    canvas.style.cursor = "";
  };
  const onClick = (event) => {
    if (sceneMode() === "knowledge") return;
    if (control.suppressClick) {
      control.suppressClick = false;
      return;
    }
    const node = nodeFromPointer(event);
    if (!node) return;
    if (event.ctrlKey) {
      event.preventDefault();
      currentOptions.onContextRef?.(publicRef(node.ref));
    } else if (node.ref?.scope === "world") {
      currentOptions.onActivate?.(node);
    }
  };
  const onContextMenu = (event) => {
    if (sceneMode() === "knowledge") {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    if (control.suppressContextMenu) {
      control.suppressContextMenu = false;
      return;
    }
    const node = nodeFromPointer(event);
    if (node?.ref?.scope === "world" || node?.ref?.scope === "junkyard") {
      currentOptions.onContextMenu?.(node, event.clientX, event.clientY);
    }
  };
  const onContextLost = (event) => {
    event.preventDefault();
    if (disposed || contextLost) return;
    contextLost = true;
    cancelInteraction();
    syncAnimationLoop();
    currentOptions.onRuntimeEvent?.("context-lost", "context-lost");
  };
  const onContextRestored = () => {
    if (disposed || !contextLost) return;
    currentOptions.onRuntimeEvent?.("context-restored", "context-restored");
  };
  canvas.addEventListener("pointerdown", onControlStart);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onControlEnd);
  canvas.addEventListener("pointercancel", onControlCancel);
  canvas.addEventListener("lostpointercapture", onLostPointerCapture);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("click", onClick);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onContextMenu);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  window.addEventListener("blur", onWindowBlur);
  setupReleases.push(() => {
    canvas.removeEventListener("pointerdown", onControlStart);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onControlEnd);
    canvas.removeEventListener("pointercancel", onControlCancel);
    canvas.removeEventListener("lostpointercapture", onLostPointerCapture);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    canvas.removeEventListener("click", onClick);
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("contextmenu", onContextMenu);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    window.removeEventListener("blur", onWindowBlur);
  });
  setupReleases.push(() => stopRenderScheduling());
  syncAnimationLoop();
  renderInProgress = true;
  try {
    renderFrame();
  } finally {
    renderInProgress = false;
  }

  const controller = {
    update(nextProjection, nextOptions = {}) {
      if (disposed) return;
      if (nextProjection?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(nextProjection.nodes)) {
        throw new TypeError("junkyard-system-requires-public-projection");
      }
      const mergedOptions = {
        ...currentOptions,
        ...nextOptions,
        developerTuning: JSON.parse(JSON.stringify(nextOptions.developerTuning ?? currentOptions.developerTuning ?? {})),
      };
      const previousCameraTuning = JSON.stringify(currentOptions.developerTuning?.camera || {});
      const nextCameraTuning = JSON.stringify(mergedOptions.developerTuning?.camera || {});
      const previousKnowledgeCamera = JSON.stringify(currentOptions.developerTuning?.knowledgeCamera || {});
      const nextKnowledgeCamera = JSON.stringify(mergedOptions.developerTuning?.knowledgeCamera || {});
      const previousSceneMode = sceneMode();
      const previousJellyfishTuning = JSON.stringify(currentOptions.developerTuning?.jellyfish || {});
      const nextJellyfishTuning = JSON.stringify(mergedOptions.developerTuning?.jellyfish || {});
      const nextSignature = appearanceSceneSignatureFor(nextProjection, mergedOptions.appearanceState, {
        orderMode: junkyardSystemRuntime.orderMode,
        stateOverlayEnabled: mergedOptions.stateOverlayEnabled,
        developerTuning: mergedOptions.developerTuning,
      });
      currentProjection = nextProjection;
      currentOptions = mergedOptions;
      if (
        previousSceneMode !== sceneMode()
        || previousCameraTuning !== nextCameraTuning
        || previousKnowledgeCamera !== nextKnowledgeCamera
      ) {
        if (sceneMode() === "knowledge") {
          const nextCamera = currentOptions.developerTuning?.knowledgeCamera || {};
          camera.up.set(0, 0, -1);
          camera.fov = Number(nextCamera.fov) || 46;
          camera.near = HOME_CAMERA_LIMIT_POLICY.nearClip;
          camera.far = HOME_CAMERA_LIMIT_POLICY.farClip;
          cameraTarget.set(0, Number(nextCamera.targetY) || 0, 0);
          camera.position.set(0, Number(nextCamera.height) || 15.5, 0);
        } else {
          const nextCamera = currentOptions.developerTuning?.camera || {};
          camera.up.set(0, 1, 0);
          camera.fov = Number(nextCamera.fov) || 44;
          camera.near = Number(nextCamera.near) || HOME_CAMERA_LIMIT_POLICY.nearClip;
          camera.far = Number(nextCamera.far) || HOME_CAMERA_LIMIT_POLICY.farClip;
          cameraTarget.set(Number(nextCamera.targetX) || 0, Number(nextCamera.targetY) || 0, Number(nextCamera.targetZ) || 0);
          camera.position.set(
            Number.isFinite(Number(nextCamera.positionX)) ? Number(nextCamera.positionX) : 7.6,
            Number.isFinite(Number(nextCamera.positionY)) ? Number(nextCamera.positionY) : 6.4,
            Number.isFinite(Number(nextCamera.positionZ)) ? Number(nextCamera.positionZ) : 9.8,
          );
          constrainHomeCameraState(camera.position, cameraTarget);
          junkyardSystemRuntime.camera.position = camera.position.toArray();
          junkyardSystemRuntime.camera.target = cameraTarget.toArray();
        }
        camera.lookAt(cameraTarget);
        camera.updateProjectionMatrix();
      }
      canvas.classList.toggle("is-knowledge-mode", sceneMode() === "knowledge");
      labels.classList.toggle("is-knowledge-mode", sceneMode() === "knowledge");
      container.dataset.junkyardSceneMode = sceneMode();
      container.dataset.homeCameraFov = String(camera.fov);
      homePostFx = resolveHomePostFx(currentOptions.appearanceState);
      if (runtime.signature !== nextSignature) {
        homeJellyfishSkySphere?.overlay.removeFromParent();
        homeJellyfishSkySphere?.irisKeyLight.removeFromParent();
        homeJellyfishSkySphere?.irisFillLight.removeFromParent();
        runtime = reconcileAppearanceScene(runtime, currentProjection, currentOptions.appearanceState, {
          orderMode: junkyardSystemRuntime.orderMode,
          stateOverlayEnabled: currentOptions.stateOverlayEnabled,
          developerTuning: currentOptions.developerTuning,
        });
        prepareSkyForRenderer(runtime, renderer);
        if (homeJellyfishSkySphere) {
          homeJellyfishSkySphere.attachToSky(runtime.sky);
          runtime.scene.add(
            homeJellyfishSkySphere.irisKeyLight,
            homeJellyfishSkySphere.irisFillLight,
          );
          homeJellyfishSkySphere.setLightTarget(runtime.junkyard);
        }
        rebuildLabels();
      }
      if (homeJellyfishSkySphere && previousJellyfishTuning !== nextJellyfishTuning) {
        homeJellyfishSkySphere.overlay.removeFromParent();
        homeJellyfishSkySphere.irisKeyLight.removeFromParent();
        homeJellyfishSkySphere.irisFillLight.removeFromParent();
        homeJellyfishSkySphere.dispose();
        homeJellyfishSkySphere = createHomeJellyfishSkySphereOverlay(currentOptions.homeJellyfishSvg, {
          onGeometryUpdate: () => requestTextureRender(),
          policy: jellyfishPolicy(),
        });
        homeJellyfishSkySphere.attachToSky(runtime.sky);
        runtime.scene.add(homeJellyfishSkySphere.irisKeyLight, homeJellyfishSkySphere.irisFillLight);
        homeJellyfishSkySphere.setLightTarget(runtime.junkyard);
        homeJellyfishSkySphere.setReducedMotion(reducedMotion);
      }
      requestRender();
    },
    resize(viewport) {
      if (disposed) return;
      if (viewport) {
        currentSceneViewport = viewport;
        currentOptions.sceneViewport = viewport;
        container.dataset.pageSceneExposedRect = JSON.stringify(viewport.exposedRect || {});
        container.dataset.pageSceneOcclusionCount = String(viewport.persistentOcclusionRects?.length || 0);
      }
      resize();
      requestRender();
    },
    setVisibility(nextVisible) {
      if (disposed) return;
      visible = Boolean(nextVisible);
      if (!visible) {
        lastMotionTimestamp = null;
        cancelInteraction();
      }
      syncAnimationLoop();
    },
    setReducedMotion(nextReducedMotion) {
      if (disposed) return;
      reducedMotion = Boolean(nextReducedMotion);
      homeJellyfishSkySphere?.setReducedMotion(reducedMotion);
      lastMotionTimestamp = null;
      syncAnimationLoop();
    },
    cancelInput() {
      if (!disposed) cancelInteraction();
    },
    handleInput(input) {
      return disposed ? false : handleKnowledgeCameraInput(input);
    },
    readResourceCounts() {
      return Object.freeze({
        connectedCanvases: canvas.isConnected ? 1 : 0,
        liveRenderers: disposed ? 0 : 1,
        liveWebGLContexts: disposed ? 0 : 1,
        liveRenderTargets: disposed ? 0 : 1 + (runtime.sky.userData.skyRenderTarget ? 1 : 0),
        liveInputBindings: disposed ? 0 : 12,
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const disposalErrors = [];
      const release = (callback) => {
        try {
          callback();
        } catch (error) {
          disposalErrors.push(error);
        }
      };
      release(stopRenderScheduling);
      release(cancelInteraction);
      release(() => canvas.removeEventListener("pointerdown", onControlStart));
      release(() => canvas.removeEventListener("pointermove", onPointerMove));
      release(() => canvas.removeEventListener("pointerup", onControlEnd));
      release(() => canvas.removeEventListener("pointercancel", onControlCancel));
      release(() => canvas.removeEventListener("lostpointercapture", onLostPointerCapture));
      release(() => canvas.removeEventListener("pointerleave", onPointerLeave));
      release(() => canvas.removeEventListener("click", onClick));
      release(() => canvas.removeEventListener("wheel", onWheel));
      release(() => canvas.removeEventListener("contextmenu", onContextMenu));
      release(() => canvas.removeEventListener("webglcontextlost", onContextLost));
      release(() => canvas.removeEventListener("webglcontextrestored", onContextRestored));
      release(() => window.removeEventListener("blur", onWindowBlur));
      release(() => runtime.sky.userData.skyRenderTarget?.dispose?.());
      runtime.sky.userData.skyRenderTarget = null;
      release(() => {
        if (!runtime.sky.material) return;
        runtime.sky.material.map = null;
        runtime.sky.material.color.set(runtime.sky.userData.appearanceProfile.recipe.palette[0]);
        runtime.sky.material.needsUpdate = true;
      });
      release(() => homeTarget.dispose());
      release(() => disposeScreenPostScene(homePost));
      release(() => homeJellyfishSkySphere?.dispose());
      release(() => disposeAppearanceScene(runtime));
      release(() => renderer.forceContextLoss?.());
      release(() => renderer.dispose());
      release(() => {
        if (container.junkyardSystemRuntime === runtimeHandle) delete container.junkyardSystemRuntime;
        if (container.dataset.junkyardSystemRuntimeMount === runtimeMountId) {
          delete container.dataset.junkyardSystemRuntimeMount;
          delete container.dataset.junkyardSystemRuntime;
        }
      });
      release(() => container.replaceChildren());
      junkyardSystemRuntime.homeJellyfish.active = false;
      junkyardSystemRuntime.homeJellyfish.visible = false;
      if (disposalErrors.length) {
        throw new AggregateError(disposalErrors, "junkyard-system-dispose-failed");
      }
    },
  };
  setupComplete = true;
  setupReleases.length = 0;
  return Object.freeze(controller);
  } catch (error) {
    const cleanupErrors = [];
    [...setupReleases].reverse().forEach((release) => {
      try {
        release();
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    });
    try {
      if (container.junkyardSystemRuntime === runtimeHandle) delete container.junkyardSystemRuntime;
      delete container.dataset.junkyardSystemRuntimeMount;
      delete container.dataset.junkyardSystemRuntime;
      container.replaceChildren();
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
    if (cleanupErrors.length) {
      throw new AggregateError([error, ...cleanupErrors], "junkyard-system-mount-cleanup-failed");
    }
    throw error;
  }
}

export function mountJunkyardSystem(container, projection, options = {}) {
  try {
    const controller = mountJunkyardSystemView(container, projection, options);
    const dispose = () => controller.dispose();
    dispose.update = (nextProjection, nextOptions) => controller.update(nextProjection, nextOptions);
    dispose.resize = (viewport) => controller.resize(viewport);
    dispose.setVisibility = (visible) => controller.setVisibility(visible);
    dispose.setReducedMotion = (reduced) => controller.setReducedMotion(reduced);
    return dispose;
  } catch (error) {
    if (container) fallback(container, error?.message === "junkyard-system-webgl-unavailable"
      ? "浏览器没有可用的 WebGL。左侧世界列表仍可使用。"
      : "当前没有可查看的世界地图。");
    return () => {};
  }
}
