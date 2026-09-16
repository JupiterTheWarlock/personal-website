import * as THREE from "../vendor/three.module.min.js";
import { VOID_JELLYFISH_GEOMETRY } from "../void_jellyfish_geometry.js";
import { HOME_SCENE_ENVELOPE_POLICY } from "./home_scene_policy.js";
import { WORLD_SURFACE_LIGHT_ROLES } from "./structure_portrait_generator.js";

export const HOME_JELLYFISH_SKY_SPHERE_POLICY = Object.freeze({
  schemaVersion: "home-void-jellyfish-sky-vector-geometry.v10",
  sourceWidth: 240,
  sourceHeight: 350,
  textureWidth: 1400,
  textureHeight: 700,
  refreshFps: 24,
  tentacleCount: 8,
  skyRadius: HOME_SCENE_ENVELOPE_POLICY.jellyfishSkyRadius,
  anchorU: 0.81254,
  anchorV: 0.57485,
  bodyWidthRatio: 0.048,
  alphaTest: 0.008,
  irisLightColor: 0xffbd62,
  irisKeyLightIntensity: 1.7,
  irisFillLightIntensity: 8,
  irisFillLightDistance: 52,
  irisLightRadius: 14,
  attachment: "skybox-surface-overlay",
  disableBlink: true,
  sourceGazeTravelX: 14.6,
  sourceGazeTravelY: 10.2,
  bodyCurveSegments: 32,
  tentacleCurveSegments: 192,
  tentacleCapSegments: 16,
  tentacleTailTaperStart: 0.68,
  tentacleTailWidthRatio: 0.22,
  renderMode: "three-sky-vector-geometry",
  materialKind: "vector-mesh-sdf",
});

export const HOME_JELLYFISH_TENTACLE_MOTION_POLICY = Object.freeze({
  schemaVersion: "home-void-jellyfish-segmented-drift.v6",
  motionRecipe: "independent-layered-drift",
  reducedMotionPose: "static-paired-base",
  sectionCount: 6,
  amplitudeRatio: 0.052,
  sectionPhaseStride: 1.43,
  rootPairGapDegrees: 14,
  rootPairLockRatio: 0.20,
  rootPairReleaseRatio: 0.88,
  timeScale: 1 / 3,
  temporalFrequencies: Object.freeze([0.43, 0.19, 0.73]),
  temporalWeights: Object.freeze([0.54, 0.29, 0.17]),
});

const TENTACLE_SPECS = Object.freeze([
  Object.freeze({ angle: -168, length: 1.05, curl: -0.88, phase: 0.31, width: 1.08 }),
  Object.freeze({ angle: -124, length: 0.96, curl: 0.76, phase: 1.73, width: 0.94 }),
  Object.freeze({ angle: -82, length: 1.08, curl: -0.68, phase: 3.11, width: 1.12 }),
  Object.freeze({ angle: -36, length: 1.00, curl: 0.84, phase: 4.67, width: 0.88 }),
  Object.freeze({ angle: 12, length: 1.10, curl: -0.78, phase: 6.29, width: 1.18 }),
  Object.freeze({ angle: 56, length: 0.98, curl: 0.72, phase: 8.03, width: 0.96 }),
  Object.freeze({ angle: 101, length: 1.02, curl: -0.82, phase: 9.71, width: 1.14 }),
  Object.freeze({ angle: 148, length: 1.06, curl: 0.70, phase: 11.47, width: 0.90 }),
]);

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const wrapUnit = (value) => ((value % 1) + 1) % 1;

function layeredDrift(time, phase) {
  const frequencies = HOME_JELLYFISH_TENTACLE_MOTION_POLICY.temporalFrequencies;
  const weights = HOME_JELLYFISH_TENTACLE_MOTION_POLICY.temporalWeights;
  const scaledTime = time * HOME_JELLYFISH_TENTACLE_MOTION_POLICY.timeScale;
  return (
    Math.sin(scaledTime * frequencies[0] + phase) * weights[0]
    + Math.sin(scaledTime * frequencies[1] + phase * 1.71) * weights[1]
    + Math.sin(scaledTime * frequencies[2] + phase * 0.63) * weights[2]
  );
}

function cubicPoint(start, controlA, controlB, end, t) {
  const inverse = 1 - t;
  const inverseSquared = inverse * inverse;
  const tSquared = t * t;
  return [
    inverseSquared * inverse * start[0]
      + 3 * inverseSquared * t * controlA[0]
      + 3 * inverse * tSquared * controlB[0]
      + tSquared * t * end[0],
    inverseSquared * inverse * start[1]
      + 3 * inverseSquared * t * controlA[1]
      + 3 * inverse * tSquared * controlB[1]
      + tSquared * t * end[1],
  ];
}

function cubicTangent(start, controlA, controlB, end, t) {
  const inverse = 1 - t;
  return [
    3 * inverse * inverse * (controlA[0] - start[0])
      + 6 * inverse * t * (controlB[0] - controlA[0])
      + 3 * t * t * (end[0] - controlB[0]),
    3 * inverse * inverse * (controlA[1] - start[1])
      + 6 * inverse * t * (controlB[1] - controlA[1])
      + 3 * t * t * (end[1] - controlB[1]),
  ];
}

function tentacleReach(spec, width, height) {
  const angle = THREE.MathUtils.degToRad(spec.angle);
  const horizontalReach = width * 0.285 * spec.length;
  const verticalReach = height * (Math.sin(angle) > 0 ? 0.36 : 0.49) * spec.length;
  return {
    angle,
    deltaX: Math.cos(angle) * horizontalReach,
    deltaY: Math.sin(angle) * verticalReach,
  };
}

export function homeJellyfishSkyAnchorDirection(
  uValue = HOME_JELLYFISH_SKY_SPHERE_POLICY.anchorU,
  vValue = HOME_JELLYFISH_SKY_SPHERE_POLICY.anchorV,
) {
  const u = wrapUnit(Number(uValue) || 0);
  const v = clamp(Number(vValue) || 0, 0, 1);
  const phi = u * Math.PI * 2;
  const theta = v * Math.PI;
  return [
    -Math.cos(phi) * Math.sin(theta),
    Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
  ];
}

export function homeJellyfishSkyLayout(
  widthValue,
  heightValue,
  elapsed = 0,
  reducedMotion = false,
  policy = HOME_JELLYFISH_SKY_SPHERE_POLICY,
) {
  const width = Math.max(1, Number(widthValue) || 1);
  const height = Math.max(1, Number(heightValue) || 1);
  const eyeCenter = [
    width * wrapUnit(policy.anchorU),
    height * clamp(policy.anchorV, 0, 1),
  ];
  const headWidth = width * policy.bodyWidthRatio;
  const headHeight = headWidth * policy.sourceHeight / policy.sourceWidth;
  const sourceEyeCenter = [120 / policy.sourceWidth, 184.5 / policy.sourceHeight];
  const headRect = {
    left: eyeCenter[0] - headWidth * sourceEyeCenter[0],
    top: eyeCenter[1] - headHeight * sourceEyeCenter[1],
    width: headWidth,
    height: headHeight,
  };
  const eyeRect = {
    left: headRect.left + headRect.width * 66 / policy.sourceWidth,
    top: headRect.top + headRect.height * 144 / policy.sourceHeight,
    width: headRect.width * 108 / policy.sourceWidth,
    height: headRect.height * 81 / policy.sourceHeight,
  };
  const motionTime = reducedMotion ? 0 : Math.max(0, Number(elapsed) || 0);
  const minimumDimension = Math.min(width, height);
  const motionAmplitude = minimumDimension
    * HOME_JELLYFISH_TENTACLE_MOTION_POLICY.amplitudeRatio
    * (reducedMotion ? 0 : 1);
  const tentacles = TENTACLE_SPECS.map((spec, index) => {
    const { angle, deltaX, deltaY } = tentacleReach(spec, width, height);
    const endX = eyeCenter[0] + deltaX;
    const endY = eyeCenter[1] + deltaY;
    const magnitude = Math.max(1, Math.hypot(deltaX, deltaY));
    const pairIndex = index % 2 === 0 ? index + 1 : index - 1;
    const pairReach = tentacleReach(TENTACLE_SPECS[pairIndex], width, height);
    const endpointDirection = Math.atan2(deltaY, deltaX);
    const pairDirection = Math.atan2(pairReach.deltaY, pairReach.deltaX);
    const pairCenterDirection = Math.atan2(
      Math.sin(endpointDirection) + Math.sin(pairDirection),
      Math.cos(endpointDirection) + Math.cos(pairDirection),
    );
    const pairHalfGap = THREE.MathUtils.degToRad(
      HOME_JELLYFISH_TENTACLE_MOTION_POLICY.rootPairGapDegrees / 2,
    );
    const launchDirection = pairCenterDirection + (index % 2 === 0 ? -pairHalfGap : pairHalfGap);
    const launchDeltaX = Math.cos(launchDirection) * magnitude;
    const launchDeltaY = Math.sin(launchDirection) * magnitude;
    const normalX = -deltaY / magnitude;
    const normalY = deltaX / magnitude;
    const arc = minimumDimension * 0.105 * spec.curl;
    const staticControlA = [
      eyeCenter[0] + deltaX * 0.24 + normalX * arc,
      eyeCenter[1] + deltaY * 0.24 + normalY * arc,
    ];
    const staticControlB = [
      eyeCenter[0] + deltaX * 0.72 - normalX * arc * 0.48,
      eyeCenter[1] + deltaY * 0.72 - normalY * arc * 0.48,
    ];
    const staticEnd = [endX, endY];
    const sectionCount = HOME_JELLYFISH_TENTACLE_MOTION_POLICY.sectionCount;
    const points = Array.from({ length: sectionCount + 1 }, (_, sectionIndex) => {
      if (sectionIndex === 0) return [...eyeCenter];
      const t = sectionIndex / sectionCount;
      const curvedBase = cubicPoint(
        eyeCenter,
        staticControlA,
        staticControlB,
        staticEnd,
        t,
      );
      const curvedTangent = cubicTangent(
        eyeCenter,
        staticControlA,
        staticControlB,
        staticEnd,
        t,
      );
      // Launch as four ordered pairs, then fan out toward eight endpoint sectors.
      const pairRelease = THREE.MathUtils.smoothstep(
        t,
        HOME_JELLYFISH_TENTACLE_MOTION_POLICY.rootPairLockRatio,
        HOME_JELLYFISH_TENTACLE_MOTION_POLICY.rootPairReleaseRatio,
      );
      const pairedBase = [
        eyeCenter[0] + launchDeltaX * t,
        eyeCenter[1] + launchDeltaY * t,
      ];
      const base = [
        THREE.MathUtils.lerp(pairedBase[0], curvedBase[0], pairRelease),
        THREE.MathUtils.lerp(pairedBase[1], curvedBase[1], pairRelease),
      ];
      const tangent = [
        THREE.MathUtils.lerp(launchDeltaX, curvedTangent[0], pairRelease),
        THREE.MathUtils.lerp(launchDeltaY, curvedTangent[1], pairRelease),
      ];
      const tangentMagnitude = Math.max(1, Math.hypot(tangent[0], tangent[1]));
      const tangentX = tangent[0] / tangentMagnitude;
      const tangentY = tangent[1] / tangentMagnitude;
      const sectionNormalX = -tangentY;
      const sectionNormalY = tangentX;
      const phase = spec.phase
        + sectionIndex * HOME_JELLYFISH_TENTACLE_MOTION_POLICY.sectionPhaseStride;
      const normalDrift = layeredDrift(motionTime, phase);
      const tangentDrift = layeredDrift(motionTime, phase + 4.19);
      const normalEnvelope = 0.58 + t * 0.78;
      const tangentEnvelope = 0.20 + t * 0.28;
      return [
        base[0]
          + sectionNormalX * normalDrift * motionAmplitude * normalEnvelope
          + tangentX * tangentDrift * motionAmplitude * tangentEnvelope,
        base[1]
          + sectionNormalY * normalDrift * motionAmplitude * normalEnvelope
          + tangentY * tangentDrift * motionAmplitude * tangentEnvelope,
      ];
    });
    const baseWidth = clamp(minimumDimension * 0.0115 * spec.width, 6, 13);
    return {
      root: [...eyeCenter],
      points,
      controlA: [...points[Math.max(1, Math.round(sectionCount * 0.33))]],
      controlB: [...points[Math.max(2, Math.round(sectionCount * 0.67))]],
      end: [...points[points.length - 1]],
      angle: spec.angle,
      width: baseWidth,
      index,
    };
  });
  return {
    width,
    height,
    eyeCenter,
    headRect,
    eyeRect,
    tentacles,
    tentacleCount: tentacles.length,
  };
}

export function homeJellyfishTentacleTailProfile(
  progressValue,
  policy = HOME_JELLYFISH_SKY_SPHERE_POLICY,
) {
  const progress = THREE.MathUtils.clamp(Number(progressValue) || 0, 0, 1);
  const segmentCount = Math.max(2, Math.round(Number(policy.tentacleCurveSegments) || 72));
  const capSegments = THREE.MathUtils.clamp(
    Math.round(Number(policy.tentacleCapSegments) || 6),
    1,
    segmentCount - 1,
  );
  const bodyEnd = (segmentCount - capSegments) / segmentCount;
  const taperStart = THREE.MathUtils.clamp(
    Number(policy.tentacleTailTaperStart) || 0,
    0,
    bodyEnd,
  );
  const tailWidthRatio = THREE.MathUtils.clamp(
    Number(policy.tentacleTailWidthRatio) || 0.22,
    0.05,
    0.8,
  );

  if (progress <= bodyEnd) {
    const taper = THREE.MathUtils.smoothstep(progress, taperStart, bodyEnd);
    return {
      phase: "body",
      bodyEnd,
      curveProgress: progress / bodyEnd,
      widthRatio: 1 - (1 - tailWidthRatio) * taper,
      capAdvanceRatio: 0,
    };
  }

  const capProgress = THREE.MathUtils.clamp((progress - bodyEnd) / (1 - bodyEnd), 0, 1);
  const capAngle = capProgress * Math.PI * 0.5;
  return {
    phase: "cap",
    bodyEnd,
    curveProgress: 1,
    widthRatio: capProgress >= 1 ? 0 : tailWidthRatio * Math.cos(capAngle),
    capAdvanceRatio: tailWidthRatio * Math.sin(capAngle),
  };
}

const SOURCE_EYE_CENTER = Object.freeze([120, 184.5]);

function sourcePointToSky(
  sourceX,
  sourceY,
  policy,
  radius,
  target = new THREE.Vector3(),
) {
  const bodyHeightRatio = (
    policy.bodyWidthRatio
    * policy.textureWidth / policy.textureHeight
    * policy.sourceHeight / policy.sourceWidth
  );
  const u = (
    policy.anchorU
    + (sourceX - SOURCE_EYE_CENTER[0]) / policy.sourceWidth * policy.bodyWidthRatio
  );
  const v = (
    policy.anchorV
    + (sourceY - SOURCE_EYE_CENTER[1]) / policy.sourceHeight * bodyHeightRatio
  );
  target.set(...homeJellyfishSkyAnchorDirection(u, v)).multiplyScalar(radius);
  return target;
}

function layoutPointToSky(point, layout, radius, target = new THREE.Vector3()) {
  const x = Number(point?.x ?? point?.[0]) || 0;
  const y = Number(point?.y ?? point?.[1]) || 0;
  target
    .set(...homeJellyfishSkyAnchorDirection(
      x / layout.width,
      y / layout.height,
    ))
    .multiplyScalar(radius);
  return target;
}

function scaledSourcePoint(x, y, scale, center = SOURCE_EYE_CENTER) {
  return [
    center[0] + (x - center[0]) * scale,
    center[1] + (y - center[1]) * scale,
  ];
}

function bodyShape(scale = 1) {
  const point = (x, y) => scaledSourcePoint(x, y, scale);
  const shape = new THREE.Shape();
  shape.moveTo(...point(120, 16));
  shape.bezierCurveTo(...point(84, 72), ...point(48, 128), ...point(48, 184));
  shape.bezierCurveTo(...point(48, 239), ...point(79, 270), ...point(120, 270));
  shape.bezierCurveTo(...point(161, 270), ...point(192, 239), ...point(192, 184));
  shape.bezierCurveTo(...point(192, 128), ...point(156, 72), ...point(120, 16));
  return shape;
}

function eyeShape(scale = 1) {
  const point = (x, y) => scaledSourcePoint(x, y, scale);
  const shape = new THREE.Shape();
  shape.moveTo(...point(70, 184));
  shape.bezierCurveTo(...point(83, 158), ...point(102, 148), ...point(120, 148));
  shape.bezierCurveTo(...point(138, 148), ...point(157, 158), ...point(170, 184));
  shape.bezierCurveTo(...point(157, 210), ...point(138, 220), ...point(120, 220));
  shape.bezierCurveTo(...point(102, 220), ...point(83, 210), ...point(70, 184));
  return shape;
}

function circleShape(centerX, centerY, radius) {
  const shape = new THREE.Shape();
  shape.absarc(centerX, centerY, radius, 0, Math.PI * 2, false);
  return shape;
}

function warpShapeGeometry(shape, policy, radius, curveSegments, uvBounds = null) {
  const geometry = new THREE.ShapeGeometry(shape, curveSegments);
  const position = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  const target = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    const sourceX = position.getX(index);
    const sourceY = position.getY(index);
    sourcePointToSky(sourceX, sourceY, policy, radius, target);
    position.setXYZ(index, target.x, target.y, target.z);
    if (uv && uvBounds) {
      uv.setXY(
        index,
        (sourceX - uvBounds.left) / uvBounds.width,
        (sourceY - uvBounds.top) / uvBounds.height,
      );
    }
  }
  position.needsUpdate = true;
  if (uv && uvBounds) uv.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
}

function createWarpedCircleGeometry(policy, radius, sourceRadius, segments = 64) {
  const vertexCount = segments + 2;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices = [];
  for (let index = 0; index < segments; index += 1) {
    indices.push(0, index + 1, index + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.userData.policy = policy;
  geometry.userData.skyRadius = radius;
  geometry.userData.sourceRadius = sourceRadius;
  geometry.userData.segments = segments;
  return geometry;
}

function updateWarpedCircleGeometry(geometry, centerX, centerY) {
  const {
    policy,
    skyRadius,
    sourceRadius,
    segments,
  } = geometry.userData;
  const position = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  const target = new THREE.Vector3();
  sourcePointToSky(centerX, centerY, policy, skyRadius, target);
  position.setXYZ(0, target.x, target.y, target.z);
  uv.setXY(0, 0.5, 0.5);
  for (let index = 0; index <= segments; index += 1) {
    const angle = index / segments * Math.PI * 2;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    sourcePointToSky(
      centerX + cosine * sourceRadius,
      centerY + sine * sourceRadius,
      policy,
      skyRadius,
      target,
    );
    position.setXYZ(index + 1, target.x, target.y, target.z);
    uv.setXY(index + 1, cosine * 0.5 + 0.5, sine * 0.5 + 0.5);
  }
  position.needsUpdate = true;
  uv.needsUpdate = true;
  geometry.computeBoundingSphere();
}

function vectorMaterial(color) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 1,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

function createCoronaMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      void main() {
        float radius = length(vUv - vec2(0.5)) * 2.0;
        float fade = 1.0 - smoothstep(0.08, 1.0, radius);
        float alpha = fade * fade * 0.42;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(vec3(1.0, 0.63, 0.24), alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function createTentacleMaterial() {
  const material = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float across;
      attribute float along;
      varying float vAcross;
      varying float vAlong;
      void main() {
        vAcross = across;
        vAlong = along;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying float vAcross;
      varying float vAlong;
      void main() {
        float distanceAcross = abs(vAcross);
        float antialiasWidth = max(fwidth(distanceAcross) * 1.2, 0.003);
        float edge = 1.0 - smoothstep(
          1.0 - antialiasWidth,
          1.0,
          distanceAcross
        );
        float mainBand = 1.0 - smoothstep(
          0.57 - antialiasWidth,
          0.57 + antialiasWidth,
          distanceAcross
        );
        float coreBand = 1.0 - smoothstep(
          0.31 - antialiasWidth,
          0.31 + antialiasWidth,
          distanceAcross
        );
        float highlight = 1.0 - smoothstep(
          0.025,
          0.075 + antialiasWidth,
          abs(vAcross + 0.075)
        );
        vec3 purple = vec3(0.396, 0.286, 0.620);
        vec3 core = vec3(0.071, 0.051, 0.169);
        vec3 color = mix(purple, core, coreBand);
        float tipHighlight = 1.0 - smoothstep(0.92, 1.0, vAlong);
        color = mix(
          color,
          vec3(0.655, 0.537, 0.855),
          highlight * tipHighlight * 0.34
        );
        float terminalAa = max(fwidth(vAlong) * 1.2, 0.001);
        float terminalEdge = 1.0 - smoothstep(1.0 - terminalAa, 1.0, vAlong);
        float alpha = mix(0.18, 1.0, mainBand) * edge * terminalEdge;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    extensions: { derivatives: true },
  });
  material.userData.kind = HOME_JELLYFISH_SKY_SPHERE_POLICY.materialKind;
  return material;
}

function createTentacleRibbonGeometry(segmentCount) {
  const rowCount = segmentCount + 1;
  const positions = new Float32Array(rowCount * 2 * 3);
  const across = new Float32Array(rowCount * 2);
  const along = new Float32Array(rowCount * 2);
  const indices = [];
  for (let row = 0; row < rowCount; row += 1) {
    const offset = row * 2;
    across[offset] = -1;
    across[offset + 1] = 1;
    along[offset] = row / segmentCount;
    along[offset + 1] = row / segmentCount;
    if (row < segmentCount) {
      indices.push(offset, offset + 2, offset + 1);
      indices.push(offset + 1, offset + 2, offset + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setAttribute("across", new THREE.BufferAttribute(across, 1));
  geometry.setAttribute("along", new THREE.BufferAttribute(along, 1));
  geometry.setIndex(indices);
  geometry.userData.segmentCount = segmentCount;
  geometry.userData.centers = Array.from(
    { length: rowCount },
    () => new THREE.Vector3(),
  );
  return geometry;
}

function updateTentacleRibbonGeometry(geometry, tentacle, layout, policy) {
  const segmentCount = geometry.userData.segmentCount;
  const capSegmentCount = THREE.MathUtils.clamp(
    Math.round(Number(policy.tentacleCapSegments) || 6),
    1,
    segmentCount - 1,
  );
  const bodySegmentCount = segmentCount - capSegmentCount;
  const centers = geometry.userData.centers;
  const curve = new THREE.CatmullRomCurve3(
    tentacle.points.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    false,
    "catmullrom",
    0.5,
  );
  const sourcePoint = new THREE.Vector3();
  const radius = policy.skyRadius - 0.08;
  const baseHalfWidth = (
    tentacle.width
    * Math.PI * radius / layout.height
    * 1.28
  );
  for (let row = 0; row <= bodySegmentCount; row += 1) {
    curve.getPoint(row / bodySegmentCount, sourcePoint);
    layoutPointToSky(sourcePoint, layout, radius, centers[row]);
  }
  const tailCenter = centers[bodySegmentCount];
  const tailTangent = new THREE.Vector3()
    .subVectors(tailCenter, centers[bodySegmentCount - 1])
    .normalize();
  for (let row = bodySegmentCount + 1; row <= segmentCount; row += 1) {
    const tailProfile = homeJellyfishTentacleTailProfile(row / segmentCount, policy);
    centers[row]
      .copy(tailCenter)
      .addScaledVector(tailTangent, baseHalfWidth * tailProfile.capAdvanceRatio)
      .normalize()
      .multiplyScalar(radius);
  }
  const position = geometry.getAttribute("position");
  const tangent = new THREE.Vector3();
  const radial = new THREE.Vector3();
  const side = new THREE.Vector3();
  const left = new THREE.Vector3();
  const right = new THREE.Vector3();
  for (let row = 0; row <= segmentCount; row += 1) {
    const previous = centers[Math.max(0, row - 1)];
    const following = centers[Math.min(segmentCount, row + 1)];
    tangent.subVectors(following, previous).normalize();
    radial.copy(centers[row]).normalize();
    side.crossVectors(radial, tangent).normalize();
    const tailProfile = homeJellyfishTentacleTailProfile(row / segmentCount, policy);
    const halfWidth = baseHalfWidth * tailProfile.widthRatio;
    left.copy(centers[row]).addScaledVector(side, halfWidth);
    right.copy(centers[row]).addScaledVector(side, -halfWidth);
    position.setXYZ(row * 2, left.x, left.y, left.z);
    position.setXYZ(row * 2 + 1, right.x, right.y, right.z);
  }
  position.needsUpdate = true;
}

function irisSourceOffset(sourceSvg, policy) {
  const transform = sourceSvg
    .querySelector('[data-part="iris"]')
    ?.getAttribute("transform") || "";
  const match = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)/.exec(transform);
  return {
    x: clamp(Number(match?.[1]) || 0, -policy.sourceGazeTravelX, policy.sourceGazeTravelX),
    y: clamp(Number(match?.[2]) || 0, -policy.sourceGazeTravelY, policy.sourceGazeTravelY),
  };
}

export function createHomeJellyfishSkySphereOverlay(sourceSvg, options = {}) {
  if (!sourceSvg) throw new Error("Home Void Jellyfish sky sphere requires an SVG source.");
  const policy = {
    ...HOME_JELLYFISH_SKY_SPHERE_POLICY,
    ...(options.policy || {}),
  };
  const view = sourceSvg.ownerDocument?.defaultView || globalThis;
  const radii = {
    tentacle: policy.skyRadius - 0.08,
    corona: policy.skyRadius - 0.12,
    bodyOutline: policy.skyRadius - 0.18,
    body: policy.skyRadius - 0.22,
    eyeOutline: policy.skyRadius - 0.26,
    eye: policy.skyRadius - 0.30,
    iris: policy.skyRadius - 0.34,
    pupil: policy.skyRadius - 0.38,
  };
  const overlay = new THREE.Group();
  overlay.name = "home-void-jellyfish-sky-vector-geometry";
  overlay.renderOrder = -8;
  overlay.userData.kind = "home-void-jellyfish-sky-vector-geometry";
  overlay.userData.schemaVersion = policy.schemaVersion;
  overlay.userData.depthTest = true;
  overlay.userData.attachment = policy.attachment;
  overlay.userData.tentacleCount = policy.tentacleCount;
  overlay.userData.disableBlink = policy.disableBlink;
  overlay.userData.materialKind = policy.materialKind;
  overlay.userData.rasterTexture = false;
  overlay.userData.tentacleTimeScale =
    HOME_JELLYFISH_TENTACLE_MOTION_POLICY.timeScale;

  const tentacleMaterial = createTentacleMaterial();
  const tentacleMeshes = TENTACLE_SPECS.map((_, index) => {
    const geometry = createTentacleRibbonGeometry(policy.tentacleCurveSegments);
    const mesh = new THREE.Mesh(geometry, tentacleMaterial);
    mesh.name = `home-void-jellyfish-vector-tentacle-${index}`;
    mesh.renderOrder = -8;
    mesh.frustumCulled = false;
    overlay.add(mesh);
    return mesh;
  });
  const coronaBounds = {
    left: SOURCE_EYE_CENTER[0] - 82,
    top: SOURCE_EYE_CENTER[1] - 82,
    width: 164,
    height: 164,
  };
  const corona = new THREE.Mesh(
    warpShapeGeometry(
      circleShape(...SOURCE_EYE_CENTER, 82),
      policy,
      radii.corona,
      policy.bodyCurveSegments,
      coronaBounds,
    ),
    createCoronaMaterial(),
  );
  corona.name = "home-void-jellyfish-vector-corona";
  corona.renderOrder = -7;
  overlay.add(corona);

  const bodyOutline = new THREE.Mesh(
    warpShapeGeometry(
      bodyShape(1.06),
      policy,
      radii.bodyOutline,
      policy.bodyCurveSegments,
    ),
    vectorMaterial(0x65499e),
  );
  bodyOutline.name = "home-void-jellyfish-vector-body-outline";
  bodyOutline.renderOrder = -6;
  overlay.add(bodyOutline);
  const body = new THREE.Mesh(
    warpShapeGeometry(
      bodyShape(),
      policy,
      radii.body,
      policy.bodyCurveSegments,
    ),
    vectorMaterial(0x120d2b),
  );
  body.name = "home-void-jellyfish-vector-body";
  body.renderOrder = -5;
  overlay.add(body);
  const eyeOutline = new THREE.Mesh(
    warpShapeGeometry(
      eyeShape(1.045),
      policy,
      radii.eyeOutline,
      policy.bodyCurveSegments,
    ),
    vectorMaterial(0x65499e),
  );
  eyeOutline.name = "home-void-jellyfish-vector-eye-outline";
  eyeOutline.renderOrder = -4;
  overlay.add(eyeOutline);
  const eye = new THREE.Mesh(
    warpShapeGeometry(
      eyeShape(),
      policy,
      radii.eye,
      policy.bodyCurveSegments,
    ),
    vectorMaterial(0xfff5dc),
  );
  eye.name = "home-void-jellyfish-vector-eye";
  eye.renderOrder = -3;
  overlay.add(eye);

  const irisGeometry = createWarpedCircleGeometry(
    policy,
    radii.iris,
    VOID_JELLYFISH_GEOMETRY.iris.radius,
  );
  const iris = new THREE.Mesh(irisGeometry, vectorMaterial(0xf0a90e));
  iris.name = "home-void-jellyfish-vector-iris";
  iris.renderOrder = -2;
  overlay.add(iris);
  const pupilGeometry = createWarpedCircleGeometry(
    policy,
    radii.pupil,
    VOID_JELLYFISH_GEOMETRY.pupil.radius,
  );
  const pupil = new THREE.Mesh(pupilGeometry, vectorMaterial(0x100b25));
  pupil.name = "home-void-jellyfish-vector-pupil";
  pupil.renderOrder = -1;
  overlay.add(pupil);

  const irisKeyLight = new THREE.DirectionalLight(
    policy.irisLightColor,
    policy.irisKeyLightIntensity,
  );
  irisKeyLight.name = "home-void-jellyfish-iris-key-light";
  irisKeyLight.userData.appearanceLightRole = WORLD_SURFACE_LIGHT_ROLES.home;
  const irisFillLight = new THREE.PointLight(
    policy.irisLightColor,
    policy.irisFillLightIntensity,
    policy.irisFillLightDistance,
    1.35,
  );
  irisFillLight.name = "home-void-jellyfish-iris-fill-light";
  irisFillLight.userData.appearanceLightRole = WORLD_SURFACE_LIGHT_ROLES.home;

  const refreshInterval = 1000 / Math.max(1, policy.refreshFps);
  const anchorDirection = new THREE.Vector3(...homeJellyfishSkyAnchorDirection(
    policy.anchorU,
    policy.anchorV,
  ));
  const anchorLocal = anchorDirection.clone().multiplyScalar(policy.skyRadius);
  const lightLocal = anchorDirection.clone().multiplyScalar(policy.irisLightRadius);
  const tempWorld = new THREE.Vector3();
  const projected = new THREE.Vector3();
  let lastRefreshAt = -Infinity;
  let ready = true;
  let disposed = false;
  let reducedMotion = false;
  let skyObject = null;
  let lastIrisX = Number.NaN;
  let lastIrisY = Number.NaN;

  const update = (timestamp = performance.now(), force = false) => {
    if (disposed) return false;
    if (!force && timestamp - lastRefreshAt < refreshInterval) return false;
    lastRefreshAt = timestamp;
    const elapsed = reducedMotion ? 0 : timestamp / 1000;
    const layout = homeJellyfishSkyLayout(
      policy.textureWidth,
      policy.textureHeight,
      elapsed,
      reducedMotion,
      policy,
    );
    tentacleMeshes.forEach((mesh, index) => {
      updateTentacleRibbonGeometry(
        mesh.geometry,
        layout.tentacles[index],
        layout,
        policy,
      );
    });
    const gaze = irisSourceOffset(sourceSvg, policy);
    if (force || gaze.x !== lastIrisX || gaze.y !== lastIrisY) {
      updateWarpedCircleGeometry(
        irisGeometry,
        SOURCE_EYE_CENTER[0] + gaze.x,
        SOURCE_EYE_CENTER[1] + gaze.y,
      );
      updateWarpedCircleGeometry(
        pupilGeometry,
        SOURCE_EYE_CENTER[0] + gaze.x,
        SOURCE_EYE_CENTER[1] + gaze.y,
      );
      lastIrisX = gaze.x;
      lastIrisY = gaze.y;
    }
    ready = true;
    options.onGeometryUpdate?.();
    return true;
  };

  const attachToSky = (nextSkyObject) => {
    if (!nextSkyObject || skyObject === nextSkyObject) return false;
    skyObject = nextSkyObject;
    skyObject.add(overlay);
    return true;
  };

  const worldPointFromUv = (
    uValue,
    vValue,
    target,
    radius = policy.skyRadius,
  ) => {
    const direction = homeJellyfishSkyAnchorDirection(uValue, vValue);
    target.set(...direction).multiplyScalar(radius);
    if (skyObject) skyObject.localToWorld(target);
    return target;
  };

  const updateAttachment = () => {
    if (!skyObject) return;
    skyObject.updateWorldMatrix(true, false);
    tempWorld.copy(lightLocal);
    skyObject.localToWorld(tempWorld);
    irisKeyLight.position.copy(tempWorld);
    irisFillLight.position.copy(tempWorld);
  };

  const projection = (camera, viewportRect = {}) => {
    const left = Number(viewportRect.left) || 0;
    const top = Number(viewportRect.top) || 0;
    const width = Math.max(1, Number(viewportRect.width) || 1);
    const height = Math.max(1, Number(viewportRect.height) || 1);
    const layout = homeJellyfishSkyLayout(
      policy.textureWidth,
      policy.textureHeight,
      0,
      true,
      policy,
    );
    const uHalf = layout.eyeRect.width / policy.textureWidth * 0.5;
    const vHalf = layout.eyeRect.height / policy.textureHeight * 0.5;
    const gazeU = layout.headRect.width / policy.textureWidth
      * policy.sourceGazeTravelX / policy.sourceWidth;
    const gazeV = layout.headRect.height / policy.textureHeight
      * policy.sourceGazeTravelY / policy.sourceHeight;
    const projectUv = ([u, v], radius = radii.eye) => {
      worldPointFromUv(u, v, projected, radius);
      projected.project(camera);
      return {
        x: left + (projected.x * 0.5 + 0.5) * width,
        y: top + (projected.y * -0.5 + 0.5) * height,
        z: projected.z,
      };
    };
    const center = projectUv([policy.anchorU, policy.anchorV], radii.iris);
    const right = projectUv([policy.anchorU + gazeU, policy.anchorV], radii.iris);
    const down = projectUv([policy.anchorU, policy.anchorV + gazeV], radii.iris);
    const corners = [
      [policy.anchorU - uHalf, policy.anchorV - vHalf],
      [policy.anchorU + uHalf, policy.anchorV - vHalf],
      [policy.anchorU + uHalf, policy.anchorV + vHalf],
      [policy.anchorU - uHalf, policy.anchorV + vHalf],
    ].map((point) => projectUv(point, radii.eye));
    const eyeRect = {
      left: Math.min(...corners.map((point) => point.x)),
      top: Math.min(...corners.map((point) => point.y)),
      width: Math.max(...corners.map((point) => point.x))
        - Math.min(...corners.map((point) => point.x)),
      height: Math.max(...corners.map((point) => point.y))
        - Math.min(...corners.map((point) => point.y)),
    };
    const inViewport = (
      center.z >= -1
      && center.z <= 1
      && eyeRect.left + eyeRect.width >= left
      && eyeRect.left <= left + width
      && eyeRect.top + eyeRect.height >= top
      && eyeRect.top <= top + height
    );
    tempWorld.copy(anchorLocal);
    if (skyObject) skyObject.localToWorld(tempWorld);
    return {
      screenRect: { left, top, width, height },
      eyeRect,
      eyeCenter: { x: center.x, y: center.y },
      gazeBasis: {
        right: { x: right.x - center.x, y: right.y - center.y },
        down: { x: down.x - center.x, y: down.y - center.y },
      },
      inViewport,
      visible: inViewport,
      worldPosition: tempWorld.toArray(),
    };
  };
  update(view.performance?.now?.() ?? performance.now(), true);

  return {
    overlay,
    irisKeyLight,
    irisFillLight,
    policy,
    motionPolicy: HOME_JELLYFISH_TENTACLE_MOTION_POLICY,
    attachToSky,
    update,
    updateAttachment,
    projection,
    setReducedMotion(value) {
      const next = Boolean(value);
      if (next === reducedMotion) return;
      reducedMotion = next;
      update(view.performance?.now?.() ?? performance.now(), true);
    },
    setLightTarget(target) {
      irisKeyLight.target = target;
    },
    get ready() {
      return ready;
    },
    dispose() {
      disposed = true;
      overlay.removeFromParent();
      irisKeyLight.removeFromParent();
      irisFillLight.removeFromParent();
      const geometries = new Set();
      const materials = new Set();
      overlay.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => materials.add(material));
        } else if (object.material) {
          materials.add(object.material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      irisKeyLight.dispose?.();
      irisFillLight.dispose?.();
    },
  };
}
