import * as THREE from "../vendor/three.module.min.js";
import { SKY_STAR_CONTROL_POLICY } from "./recipe.js";
import { HOME_SCENE_ENVELOPE_POLICY } from "./home_scene_policy.js";

export const CLASSIC_VECTOR_STAR_POLICY = Object.freeze({
  schemaVersion: "junkyard-classic-vector-stars.v1",
  materialKind: "analytic-sdf-disc",
  minimumCssDiameter: 1.9,
  specialMinimumCssDiameter: 2.8,
});

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

const SKY_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT_SHADER = `
  precision highp float;
  uniform vec3 palette[4];
  uniform float seed;
  uniform float pixelMode;
  uniform vec2 sourceResolution;
  uniform float starDensity;
  uniform float starSize;
  uniform float starOpacity;
  uniform float nebulaIntensity;
  uniform float dustIntensity;
  uniform float specialStarDensity;
  uniform float noiseScale;
  uniform float octaveCount;
  uniform float poleFade;
  uniform float contrast;
  varying vec2 vUv;

  const float TAU = 6.28318530718;
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21) + seed * 0.000019);
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float hash31(vec3 p) {
    p = fract(p * 0.1031 + seed * 0.000011);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i+vec3(1,0,0)), f.x), mix(hash31(i+vec3(0,1,0)), hash31(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i+vec3(0,0,1)), hash31(i+vec3(1,0,1)), f.x), mix(hash31(i+vec3(0,1,1)), hash31(i+vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }
  float fbm(vec3 p) {
    float value = 0.0;
    float weight = 0.55;
    for (int i=0; i<8; i++) {
      if (float(i) >= octaveCount) break;
      value += noise3(p) * weight;
      p = p * 2.02 + vec3(3.7, 8.1, 5.3);
      weight *= 0.49;
    }
    return value;
  }
  void main() {
    vec2 uv = vUv;
    if (pixelMode > 0.5) uv = (floor(uv * sourceResolution) + 0.5) / sourceResolution;
    float angle = uv.x * TAU;
    vec3 periodic = vec3(cos(angle), sin(angle), (uv.y - 0.5) * 2.0);
    float largeNoise = fbm(periodic * noiseScale);
    float smallNoise = fbm(periodic * noiseScale * 3.2 + vec3(11.0, 4.0, 7.0));
    float nebula = smoothstep(0.48, 0.79, largeNoise + smallNoise * 0.23) * nebulaIntensity;
    float dust = smoothstep(0.63, 0.9, smallNoise) * dustIntensity;
    vec3 color = mix(palette[0], palette[1], clamp(largeNoise * 0.58, 0.0, 1.0));
    color = mix(color, palette[2], nebula * 0.72);
    color += palette[3] * dust * 0.18;

    vec2 starGrid = vec2(360.0, 180.0);
    vec2 starCell = floor(uv * starGrid);
    starCell.x = mod(starCell.x, starGrid.x);
    vec2 local = fract(uv * starGrid) - 0.5;
    float starRandom = hash21(starCell);
    float starGate = step(1.0 - starDensity * 0.095, starRandom);
    vec2 starOffset = vec2(hash21(starCell + 13.1), hash21(starCell + 71.7)) - 0.5;
    float starRadius = length(local - starOffset * 0.62);
    float starOuter = min(0.625, 0.055 + starSize * 1.425);
    float star = starGate * smoothstep(pixelMode > 0.5 ? max(0.18, starOuter) : starOuter, 0.015, starRadius);
    float specialGate = step(1.0 - specialStarDensity * 0.008, hash21(starCell + 191.3));
    float flare = specialGate * (
      smoothstep(0.46, 0.02, abs(local.x - starOffset.x * 0.25)) *
      smoothstep(0.08, 0.0, abs(local.y - starOffset.y * 0.25)) +
      smoothstep(0.46, 0.02, abs(local.y - starOffset.y * 0.25)) *
      smoothstep(0.08, 0.0, abs(local.x - starOffset.x * 0.25))
    );
    color += vec3(0.72, 0.82, 1.0) * star * (0.58 + starRandom * 0.75) * starOpacity;
    color += mix(palette[3], vec3(1.0), 0.68) * flare * 0.82;
    float poleMask = smoothstep(0.0, poleFade, uv.y) * smoothstep(0.0, poleFade, 1.0 - uv.y);
    color = mix(palette[0], color, poleMask);
    color = (color - 0.5) * contrast + 0.5;
    if (pixelMode > 0.5) color = floor(color * 32.0) / 32.0;
    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;

function skyUniforms(profile) {
  const recipe = profile.recipe;
  return {
    palette: { value: recipe.palette.map((color) => new THREE.Color(color)) },
    seed: { value: recipe.seed },
    pixelMode: { value: recipe.sourceRenderMode === "pixel" ? 1 : 0 },
    sourceResolution: { value: new THREE.Vector2(...recipe.sourceResolution) },
    starDensity: { value: recipe.starDensity },
    starSize: { value: recipe.starSize },
    starOpacity: { value: recipe.starOpacity },
    nebulaIntensity: { value: recipe.nebulaIntensity },
    dustIntensity: { value: recipe.dustIntensity },
    specialStarDensity: { value: recipe.specialStarDensity },
    noiseScale: { value: recipe.noiseScale },
    octaveCount: { value: recipe.octaves },
    poleFade: { value: recipe.poleFade },
    contrast: { value: recipe.contrast },
  };
}

function seededRandom(seed) {
  let state = Math.max(1, Math.floor(Number(seed) || 1) % 2_147_483_647);
  return () => {
    state = state * 16807 % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
}

function spherePoints(count, radiusMinimum, radiusMaximum, random) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = radiusMinimum + random() * (radiusMaximum - radiusMinimum);
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi);
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function createVectorStarPoints(geometry, options = {}) {
  const uniforms = {
    starColor: { value: new THREE.Color(options.color ?? 0xffffff) },
    starOpacity: {
      value: clamp(
        Number(options.opacity) || 0,
        0,
        SKY_STAR_CONTROL_POLICY.starOpacity.maximum,
      ),
    },
    starSize: { value: Math.max(0.001, Number(options.size) || 0.001) },
    pointScale: { value: 1 },
    minimumPointDiameter: {
      value: Math.max(
        1,
        Number(options.minimumCssDiameter)
          || CLASSIC_VECTOR_STAR_POLICY.minimumCssDiameter,
      ),
    },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      precision highp float;
      uniform float starSize;
      uniform float pointScale;
      uniform float minimumPointDiameter;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(
          minimumPointDiameter,
          starSize * pointScale / max(0.001, -viewPosition.z)
        );
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec3 starColor;
      uniform float starOpacity;
      void main() {
        float radius = length(gl_PointCoord - vec2(0.5));
        float antialiasWidth = max(fwidth(radius) * 1.15, 0.012);
        float disc = 1.0 - smoothstep(0.5 - antialiasWidth, 0.5, radius);
        float core = 1.0 - smoothstep(
          0.22 - antialiasWidth,
          0.22 + antialiasWidth,
          radius
        );
        float alpha = disc * min(starOpacity, 1.0);
        float intensity = max(1.0, starOpacity);
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(
          mix(starColor * 0.84, starColor, core) * intensity,
          alpha
        );
      }
    `,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    extensions: { derivatives: true },
  });
  material.userData.kind = CLASSIC_VECTOR_STAR_POLICY.materialKind;
  material.userData.schemaVersion = CLASSIC_VECTOR_STAR_POLICY.schemaVersion;
  const drawingBufferSize = new THREE.Vector2();
  const points = new THREE.Points(geometry, material);
  points.onBeforeRender = (renderer) => {
    renderer.getDrawingBufferSize(drawingBufferSize);
    uniforms.pointScale.value = drawingBufferSize.y * 0.5;
    uniforms.minimumPointDiameter.value = (
      Math.max(
        1,
        Number(options.minimumCssDiameter)
          || CLASSIC_VECTOR_STAR_POLICY.minimumCssDiameter,
      )
      * renderer.getPixelRatio()
    );
  };
  return points;
}

function createClassicSky(profile) {
  const recipe = profile.recipe;
  const group = new THREE.Group();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(HOME_SCENE_ENVELOPE_POLICY.skyRadius, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        bottomColor: { value: new THREE.Color(recipe.palette[0]) },
        topColor: { value: new THREE.Color(recipe.palette[1]) },
        horizonColor: { value: new THREE.Color(recipe.palette[2]) },
      },
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform vec3 bottomColor;
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        varying vec3 vDirection;
        void main() {
          float y = normalize(vDirection).y;
          float height = y * 0.5 + 0.5;
          float horizon = pow(max(0.0, 1.0 - abs(y)), 5.0);
          gl_FragColor = vec4(mix(bottomColor, topColor, height) + horizonColor * horizon, 1.0);
        }
      `,
    }),
  );
  group.add(sky);
  const random = seededRandom(recipe.seed);
  const starCount = Math.max(40, Math.round(recipe.starDensity * 1_666.6667));
  const specialCount = Math.max(0, Math.round(starCount * recipe.specialStarDensity * 0.12));
  const stars = createVectorStarPoints(
    spherePoints(
      starCount,
      HOME_SCENE_ENVELOPE_POLICY.classicStarRadiusMinimum,
      HOME_SCENE_ENVELOPE_POLICY.classicStarRadiusMaximum,
      random,
    ),
    {
      color: new THREE.Color(recipe.palette[3]),
      size: recipe.starSize,
      opacity: recipe.starOpacity,
      minimumCssDiameter: CLASSIC_VECTOR_STAR_POLICY.minimumCssDiameter,
    },
  );
  group.add(stars);
  if (specialCount) {
    group.add(createVectorStarPoints(
      spherePoints(
        specialCount,
        HOME_SCENE_ENVELOPE_POLICY.classicStarRadiusMinimum,
        HOME_SCENE_ENVELOPE_POLICY.classicStarRadiusMaximum,
        random,
      ),
      {
        color: 0xffffff,
        size: Math.min(
          SKY_STAR_CONTROL_POLICY.starSize.maximum,
          recipe.starSize * 2.25,
        ),
        opacity: Math.min(
          SKY_STAR_CONTROL_POLICY.starOpacity.maximum,
          recipe.starOpacity + 0.12,
        ),
        minimumCssDiameter: CLASSIC_VECTOR_STAR_POLICY.specialMinimumCssDiameter,
      },
    ));
  }
  group.userData.kind = "appearance-sky";
  group.userData.skyStyle = "classic";
  group.userData.appearanceProfile = profile;
  group.userData.skyRenderTarget = null;
  group.renderOrder = -10;
  return group;
}

export function createSkyAppearanceObject(profile) {
  if (profile.recipe.style === "classic") return createClassicSky(profile);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(profile.recipe.palette[0]),
    side: THREE.BackSide,
    depthWrite: false,
  });
  const object = new THREE.Mesh(
    new THREE.SphereGeometry(HOME_SCENE_ENVELOPE_POLICY.skyRadius, 48, 32),
    material,
  );
  object.userData.kind = "appearance-sky";
  object.userData.skyStyle = "generated-equirect";
  object.userData.appearanceProfile = profile;
  object.userData.skyRenderTarget = null;
  object.renderOrder = -10;
  return object;
}

export function renderSkyEquirectTexture(renderer, skyObject) {
  if (skyObject.userData.skyStyle !== "generated-equirect") return null;
  const profile = skyObject.userData.appearanceProfile;
  const [requestedWidth, requestedHeight] = profile.recipe.sourceResolution;
  const maxTextureSize = renderer.capabilities.maxTextureSize || 2048;
  const width = Math.max(256, Math.min(requestedWidth, maxTextureSize));
  const height = Math.max(128, Math.min(requestedHeight, Math.floor(width / 2)));
  const replacedTarget = skyObject.userData.skyRenderTarget;
  const replacedMap = skyObject.material.map;
  const replacedColor = skyObject.material.color.clone();
  const replacedNeedsUpdate = skyObject.material.needsUpdate;
  let target = null;
  let material = null;
  let geometry = null;
  let previousTarget = null;
  let previousTargetKnown = false;
  let renderingTarget = false;
  let committed = false;
  try {
    target = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: profile.recipe.sourceRenderMode === "pixel" ? THREE.NearestFilter : THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
    target.texture.colorSpace = THREE.SRGBColorSpace;
    target.texture.wrapS = THREE.RepeatWrapping;
    target.texture.wrapT = THREE.ClampToEdgeWrapping;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    material = new THREE.ShaderMaterial({
      uniforms: skyUniforms(profile),
      vertexShader: SKY_VERTEX_SHADER,
      fragmentShader: SKY_FRAGMENT_SHADER,
      depthWrite: false,
      depthTest: false,
    });
    geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));
    previousTarget = renderer.getRenderTarget();
    previousTargetKnown = true;
    renderer.setRenderTarget(target);
    renderingTarget = true;
    renderer.render(scene, camera);
    renderer.setRenderTarget(previousTarget);
    renderingTarget = false;

    skyObject.userData.skyRenderTarget = target;
    skyObject.material.map = target.texture;
    skyObject.material.color.set(0xffffff);
    skyObject.material.needsUpdate = true;
    committed = true;
    replacedTarget?.dispose?.();
    return target;
  } finally {
    if (renderingTarget && previousTargetKnown) {
      try {
        renderer.setRenderTarget(previousTarget);
      } catch {
        // Preserve the original rendering failure; setup cleanup owns renderer.
      }
    }
    try {
      geometry?.dispose?.();
    } catch {
      // Preserve the original setup or rendering failure.
    }
    try {
      material?.dispose?.();
    } catch {
      // Preserve the original setup or rendering failure.
    }
    if (!committed) {
      if (skyObject.userData.skyRenderTarget === target) {
        skyObject.userData.skyRenderTarget = replacedTarget;
      }
      if (skyObject.material.map === target?.texture) skyObject.material.map = replacedMap;
      skyObject.material.color.copy(replacedColor);
      skyObject.material.needsUpdate = replacedNeedsUpdate;
      try {
        target?.dispose?.();
      } catch {
        // Caller cleanup still owns the renderer and sky object.
      }
    }
  }
}

export function disposeSkyAppearanceObject(skyObject) {
  if (!skyObject) return;
  const disposalErrors = [];
  const release = (callback) => {
    try {
      callback();
    } catch (error) {
      disposalErrors.push(error);
    }
  };
  const target = skyObject.userData.skyRenderTarget;
  skyObject.userData.skyRenderTarget = null;
  release(() => target?.dispose?.());
  skyObject.traverse((object) => {
    release(() => object.geometry?.dispose?.());
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => release(() => material.dispose?.()));
    } else release(() => object.material?.dispose?.());
  });
  if (disposalErrors.length) {
    throw new AggregateError(disposalErrors, "appearance-sky-dispose-failed");
  }
}
