import * as THREE from "../vendor/three.module.min.js";

export const HOME_ENVIRONMENT_DUST_POLICY = Object.freeze({
  schemaVersion: "junkyard-home-environment-dust.v1",
  materialKind: "analytic-soft-gray-points",
  seed: 18473,
  moteCount: 152,
  cloudCount: 4,
  motesPerCloud: 52,
  radialMinimum: 3.4,
  radialMaximum: 19.5,
  minimumCssDiameter: 1.2,
  maximumCssDiameter: 5.5,
  driftDistance: 0.075,
  driftSpeed: 0.055,
  rotationSpeed: 0.003,
});

function seededRandom(seed) {
  let state = Math.max(1, Math.floor(Number(seed) || 1) % 2_147_483_647);
  return () => {
    state = state * 16807 % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
}

function centeredRandom(random) {
  return random() + random() + random() - 1.5;
}

function pushParticle(attributes, position, size, opacity, phase, color) {
  attributes.positions.push(...position);
  attributes.sizes.push(size);
  attributes.opacities.push(opacity);
  attributes.phases.push(phase);
  attributes.colors.push(color.r, color.g, color.b);
}

function createDustGeometry(policy) {
  const random = seededRandom(policy.seed);
  const attributes = {
    positions: [],
    sizes: [],
    opacities: [],
    phases: [],
    colors: [],
  };
  const moteColorA = new THREE.Color(0x4b5659);
  const moteColorB = new THREE.Color(0x737a7a);
  const cloudColorA = new THREE.Color(0x414a4d);
  const cloudColorB = new THREE.Color(0x687173);

  for (let index = 0; index < policy.moteCount; index += 1) {
    const radius = policy.radialMinimum
      + random() * (policy.radialMaximum - policy.radialMinimum);
    const theta = random() * Math.PI * 2;
    const y = centeredRandom(random) * 7.5;
    const color = moteColorA.clone().lerp(moteColorB, random());
    pushParticle(
      attributes,
      [Math.cos(theta) * radius, y, Math.sin(theta) * radius],
      0.025 + random() * 0.035,
      0.025 + random() * 0.05,
      random() * Math.PI * 2,
      color,
    );
  }

  for (let cloudIndex = 0; cloudIndex < policy.cloudCount; cloudIndex += 1) {
    const theta = random() * Math.PI * 2;
    const radius = 7 + random() * 8;
    const center = new THREE.Vector3(
      Math.cos(theta) * radius,
      centeredRandom(random) * 4,
      Math.sin(theta) * radius,
    );
    const spread = 1.8 + random() * 2.8;
    for (let index = 0; index < policy.motesPerCloud; index += 1) {
      const color = cloudColorA.clone().lerp(cloudColorB, random());
      pushParticle(
        attributes,
        [
          center.x + centeredRandom(random) * spread * 1.5,
          center.y + centeredRandom(random) * spread * 0.58,
          center.z + centeredRandom(random) * spread,
        ],
        0.12 + random() * 0.16,
        0.008 + random() * 0.022,
        random() * Math.PI * 2,
        color,
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(attributes.positions, 3),
  );
  geometry.setAttribute(
    "dustSize",
    new THREE.Float32BufferAttribute(attributes.sizes, 1),
  );
  geometry.setAttribute(
    "dustOpacity",
    new THREE.Float32BufferAttribute(attributes.opacities, 1),
  );
  geometry.setAttribute(
    "dustPhase",
    new THREE.Float32BufferAttribute(attributes.phases, 1),
  );
  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(attributes.colors, 3),
  );
  geometry.computeBoundingSphere();
  return geometry;
}

function createDustMaterial(policy) {
  const uniforms = {
    time: { value: 0 },
    pointScale: { value: 1 },
    minimumPointDiameter: { value: policy.minimumCssDiameter },
    maximumPointDiameter: { value: policy.maximumCssDiameter },
    driftDistance: { value: policy.driftDistance },
    driftSpeed: { value: policy.driftSpeed },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      precision highp float;
      attribute float dustSize;
      attribute float dustOpacity;
      attribute float dustPhase;
      attribute vec3 color;
      uniform float time;
      uniform float pointScale;
      uniform float minimumPointDiameter;
      uniform float maximumPointDiameter;
      uniform float driftDistance;
      uniform float driftSpeed;
      varying float vOpacity;
      varying vec3 vColor;
      void main() {
        vec3 pointPosition = position;
        float driftTime = time * driftSpeed;
        pointPosition.x += sin(driftTime + dustPhase) * driftDistance;
        pointPosition.y += cos(driftTime * 0.73 + dustPhase * 1.37) * driftDistance;
        vec4 viewPosition = modelViewMatrix * vec4(pointPosition, 1.0);
        gl_PointSize = clamp(
          dustSize * pointScale / max(0.75, -viewPosition.z),
          minimumPointDiameter,
          maximumPointDiameter
        );
        gl_Position = projectionMatrix * viewPosition;
        vOpacity = dustOpacity;
        vColor = color;
      }
    `,
    fragmentShader: `
      precision highp float;
      varying float vOpacity;
      varying vec3 vColor;
      void main() {
        float radius = length(gl_PointCoord - vec2(0.5));
        float antialiasWidth = max(fwidth(radius) * 1.15, 0.012);
        float edge = 1.0 - smoothstep(0.5 - antialiasWidth, 0.5, radius);
        float haze = pow(max(0.0, 1.0 - radius * 2.0), 1.6);
        float alpha = edge * haze * vOpacity;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.NormalBlending,
  });
  material.userData.kind = policy.materialKind;
  material.userData.schemaVersion = policy.schemaVersion;
  return material;
}

export function createHomeEnvironmentDust(options = {}) {
  const policy = { ...HOME_ENVIRONMENT_DUST_POLICY, ...(options.policy || {}) };
  const material = createDustMaterial(policy);
  const points = new THREE.Points(createDustGeometry(policy), material);
  points.name = "home-environment-dust-points";
  points.renderOrder = -2;
  const drawingBufferSize = new THREE.Vector2();
  points.onBeforeRender = (renderer) => {
    renderer.getDrawingBufferSize(drawingBufferSize);
    material.uniforms.pointScale.value = drawingBufferSize.y * 0.5;
    material.uniforms.minimumPointDiameter.value = (
      policy.minimumCssDiameter * renderer.getPixelRatio()
    );
    material.uniforms.maximumPointDiameter.value = (
      policy.maximumCssDiameter * renderer.getPixelRatio()
    );
  };

  const group = new THREE.Group();
  group.name = "home-environment-dust";
  group.userData.kind = "home-environment-dust";
  group.userData.schemaVersion = policy.schemaVersion;
  group.userData.materialKind = policy.materialKind;
  group.userData.particleCount = policy.moteCount
    + policy.cloudCount * policy.motesPerCloud;
  group.userData.cloudCount = policy.cloudCount;
  group.userData.policy = policy;
  group.add(points);
  return group;
}

export function updateHomeEnvironmentDust(group, elapsed = 0) {
  if (!group) return;
  const policy = group.userData.policy || HOME_ENVIRONMENT_DUST_POLICY;
  const points = group.children.find((child) => child.isPoints);
  if (points?.material?.uniforms?.time) {
    points.material.uniforms.time.value = Math.max(0, Number(elapsed) || 0);
  }
  group.rotation.y = Math.max(0, Number(elapsed) || 0) * policy.rotationSpeed;
}

export function disposeHomeEnvironmentDust(group) {
  group?.traverse?.((object) => {
    object.geometry?.dispose?.();
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
    else object.material?.dispose?.();
  });
}
