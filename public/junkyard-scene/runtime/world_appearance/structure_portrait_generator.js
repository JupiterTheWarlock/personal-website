import * as THREE from "../vendor/three.module.min.js";
import {
  WORLD_HERO_COMPOSITION_BLUEPRINTS,
  WORLD_PORTRAIT_CATALOG_VERSION,
} from "./structure_portrait_catalog.js";
import {
  DEFAULT_WORLD_MATERIAL_TEXTURE_PARAMETERS,
  resolveWorldMaterialTextureParameters,
} from "./recipe.js";

export const WORLD_STRUCTURE_ROLE_BUDGET = Object.freeze({
  main: 1,
  attachment: 1,
  anchors: 1,
  repeat: 3,
});

export const WORLD_SURFACE_VALUE_POLICY = Object.freeze({
  primaryFloor: 0.38,
  secondaryFloor: 0.3,
  neutralFloor: 0.24,
  minimumFaceLightness: 0.22,
  maximumFaceLightness: 0.72,
  environmentTint: 0xb8d4df,
  environmentTintMix: 0.025,
});

export const WORLD_SURFACE_LIGHT_BAND_POLICY = Object.freeze({
  schemaVersion: "world-total-light-bands.v5",
  bandCount: 5,
  deepShadowThreshold: 0.2,
  shadowThreshold: 0.32,
  lightThreshold: 0.64,
  highlightThreshold: 0.95,
  deepShadowValue: 0.76,
  shadowValue: 0.88,
  baseValue: 1,
  lightValue: 1.12,
  highlightValue: 1.24,
  lightTintMix: 0.06,
  minimumDiffuseChannel: 0.04,
  minimumIllumination: 0.0001,
  lightTintMinimum: 0.72,
  lightTintMaximum: 1.28,
});

export const WORLD_SURFACE_LIGHT_COHESION_POLICY = Object.freeze({
  schemaVersion: "world-geometric-light-cohesion.v1",
  geometryNormalMix: 0.15,
  minimumGeometryNormalLengthSquared: 1e-20,
});

export const WORLD_SURFACE_NORMAL_POLICY = Object.freeze({
  schemaVersion: "world-component-smooth-normals.v2",
  smoothingGroupAttribute: "worldSmoothingGroup",
  relativePositionWeldTolerance: 0.000001,
  minimumPositionWeldTolerance: 0.0000001,
  relativeTriangleAreaTolerance: 0.000000000001,
  minimumTriangleAreaTolerance: 0.00000000000001,
  minimumClusterCoherence: 0.000001,
  minimumNormalFacing: 0.000001,
  minimumAdjacentFaceDot: -0.5,
  minimumImplicitSmoothAdjacentFaceDot: 0.2,
});

export const WORLD_SURFACE_LIGHT_ROLES = Object.freeze({
  sharedFill: "world-surface-shared-fill",
  home: "world-surface-home",
  card: "world-surface-card",
});

export const WORLD_SURFACE_LIGHT_POLICY = Object.freeze({
  skyColor: 0xc4dcff,
  groundColor: 0x596777,
  intensity: 0.08,
  ambientColor: 0xffffff,
  ambientIntensity: 0.08,
});

export const WORLD_SURFACE_MATERIAL_TEXTURE_POLICY = Object.freeze({
  schemaVersion: "junkyard-world-material-texture.v2",
  renderStyleVersion: "per-world-animated-surface-waves.v5",
  defaultPresetId: "plain-matte",
  presetIds: Object.freeze([
    "plain-matte",
    "contour-stone",
    "brushed-alloy",
    "flowing-veins",
    "crystal-facets",
    "ceramic-rings",
    "molten-cracks",
    "eclipse-cells",
    "storm-vortex",
    "sunburst-shell",
  ]),
});

export const WORLD_SURFACE_MATERIAL_MOTION_POLICY = Object.freeze({
  schemaVersion: "junkyard-world-material-motion.v1",
  speedByPresetId: Object.freeze({
    "plain-matte": 0,
    "contour-stone": 0.32,
    "brushed-alloy": 0.55,
    "flowing-veins": 0.72,
    "crystal-facets": 0.38,
    "ceramic-rings": 0.42,
    "molten-cracks": 0.62,
    "eclipse-cells": 0.48,
    "storm-vortex": 0.58,
    "sunburst-shell": 0.44,
  }),
});

const worldSurfaceLightBandUniforms = {
  uWorldDeepShadowThreshold: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.deepShadowThreshold },
  uWorldShadowThreshold: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.shadowThreshold },
  uWorldLightThreshold: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.lightThreshold },
  uWorldHighlightThreshold: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.highlightThreshold },
  uWorldDeepShadowValue: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.deepShadowValue },
  uWorldShadowValue: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.shadowValue },
  uWorldBaseValue: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.baseValue },
  uWorldLightValue: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.lightValue },
  uWorldHighlightValue: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.highlightValue },
  uWorldLightTintMix: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.lightTintMix },
  uWorldMinimumDiffuseChannel: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.minimumDiffuseChannel },
  uWorldMinimumIllumination: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.minimumIllumination },
  uWorldLightTintMinimum: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.lightTintMinimum },
  uWorldLightTintMaximum: { value: WORLD_SURFACE_LIGHT_BAND_POLICY.lightTintMaximum },
  uWorldGeometryNormalMix: { value: WORLD_SURFACE_LIGHT_COHESION_POLICY.geometryNormalMix },
  uWorldMinimumGeometryNormalLengthSquared: {
    value: WORLD_SURFACE_LIGHT_COHESION_POLICY.minimumGeometryNormalLengthSquared,
  },
};

const lambertCommonAnchor = "#include <common>";
const lambertNormalMapsAnchor = "#include <normal_fragment_maps>";
const lambertOutputAnchor = "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;";
const lightBandUniformDeclarations = `
uniform float uWorldDeepShadowThreshold;
uniform float uWorldShadowThreshold;
uniform float uWorldLightThreshold;
uniform float uWorldHighlightThreshold;
uniform float uWorldDeepShadowValue;
uniform float uWorldShadowValue;
uniform float uWorldBaseValue;
uniform float uWorldLightValue;
uniform float uWorldHighlightValue;
uniform float uWorldLightTintMix;
uniform float uWorldMinimumDiffuseChannel;
uniform float uWorldMinimumIllumination;
uniform float uWorldLightTintMinimum;
uniform float uWorldLightTintMaximum;
uniform float uWorldGeometryNormalMix;
uniform float uWorldMinimumGeometryNormalLengthSquared;`;
const geometricLightCohesionNormal = `
// world-geometric-light-cohesion.v1: component-smooth normals retain their
// gradients, but the final triangle plane is one shared physical reference for
// coplanar or near-coplanar surfaces belonging to different meshes.
vec3 worldGeometryNormalCross = cross(
  dFdx( vViewPosition ),
  dFdy( vViewPosition )
);
float worldGeometryNormalLengthSquared = dot(
  worldGeometryNormalCross,
  worldGeometryNormalCross
);
if ( worldGeometryNormalLengthSquared > uWorldMinimumGeometryNormalLengthSquared ) {
  vec3 worldGeometryNormal = worldGeometryNormalCross
    * inversesqrt( worldGeometryNormalLengthSquared );
  normal = normalize( mix(
    normal,
    worldGeometryNormal,
    uWorldGeometryNormalMix
  ) );
}`;
const aggregateLightBandOutput = `
// world-total-light-bands.v5: quantize aggregate real illumination once into five bands.
vec3 worldPhysicalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
vec3 worldRecoveredIrradiance = PI * worldPhysicalDiffuse
  / max( diffuseColor.rgb, vec3( uWorldMinimumDiffuseChannel ) );
float worldIllumination = dot(
  worldRecoveredIrradiance,
  vec3( 0.2126, 0.7152, 0.0722 )
);
float worldBandValue = worldIllumination < uWorldDeepShadowThreshold
  ? uWorldDeepShadowValue
  : ( worldIllumination < uWorldShadowThreshold
    ? uWorldShadowValue
    : ( worldIllumination < uWorldLightThreshold
      ? uWorldBaseValue
      : ( worldIllumination < uWorldHighlightThreshold
        ? uWorldLightValue
        : uWorldHighlightValue ) ) );
vec3 worldLightTint = worldIllumination > uWorldMinimumIllumination
  ? worldRecoveredIrradiance / worldIllumination
  : vec3( 1.0 );
worldLightTint = clamp(
  worldLightTint,
  vec3( uWorldLightTintMinimum ),
  vec3( uWorldLightTintMaximum )
);
vec3 outgoingLight = diffuseColor.rgb
  * worldBandValue
  * mix( vec3( 1.0 ), worldLightTint, uWorldLightTintMix )
  + totalEmissiveRadiance;`;

function replaceUniqueShaderAnchor(source, anchor, replacement) {
  const fragments = source.split(anchor);
  if (fragments.length !== 2) {
    throw new Error(`Unsupported Three.js Lambert shader anchor: ${anchor}`);
  }
  return fragments.join(replacement);
}

export function installWorldSurfaceLightBands(shader) {
  Object.assign(shader.uniforms, worldSurfaceLightBandUniforms);
  shader.fragmentShader = replaceUniqueShaderAnchor(
    shader.fragmentShader,
    lambertCommonAnchor,
    `${lambertCommonAnchor}${lightBandUniformDeclarations}`,
  );
  shader.fragmentShader = replaceUniqueShaderAnchor(
    shader.fragmentShader,
    lambertNormalMapsAnchor,
    `${lambertNormalMapsAnchor}${geometricLightCohesionNormal}`,
  );
  shader.fragmentShader = replaceUniqueShaderAnchor(
    shader.fragmentShader,
    lambertOutputAnchor,
    aggregateLightBandOutput,
  );
}

// One page-lifetime material is deliberately shared by every world and the
// junkyard. Three.js first accumulates its real lights, then this material maps
// the aggregate illumination to the shared five-step value language.
const sharedWorldSurfaceMaterial = new THREE.MeshLambertMaterial({
  vertexColors: true,
  flatShading: false,
  transparent: false,
  opacity: 1,
  toneMapped: false,
});
sharedWorldSurfaceMaterial.name = "shared-world-surface-lambert";
sharedWorldSurfaceMaterial.onBeforeCompile = installWorldSurfaceLightBands;
sharedWorldSurfaceMaterial.customProgramCacheKey = (
  () => `${WORLD_SURFACE_LIGHT_BAND_POLICY.schemaVersion}:${WORLD_SURFACE_LIGHT_COHESION_POLICY.schemaVersion}`
);
sharedWorldSurfaceMaterial.userData.lightBandPolicy = WORLD_SURFACE_LIGHT_BAND_POLICY.schemaVersion;

const worldMaterialVertexCommon = `
varying vec3 vWorldMaterialObjectPosition;`;
const worldMaterialVertexProjection = `
vWorldMaterialObjectPosition = position;`;
const worldMaterialFragmentPositionCommon = `
uniform float uWorldMaterialPhase;
uniform float uWorldMaterialPatternScale;
uniform float uWorldMaterialEffectStrength;
varying vec3 vWorldMaterialObjectPosition;`;
const worldMaterialNoiseFunctions = `

float worldMaterialHash31( vec3 point ) {
  point = fract( point * 0.1031 );
  point += dot( point, point.yzx + 33.33 );
  return fract( ( point.x + point.y ) * point.z );
}

float worldMaterialValueNoise( vec3 point ) {
  vec3 cell = floor( point );
  vec3 local = fract( point );
  local = local * local * ( 3.0 - 2.0 * local );
  float n000 = worldMaterialHash31( cell + vec3( 0.0, 0.0, 0.0 ) );
  float n100 = worldMaterialHash31( cell + vec3( 1.0, 0.0, 0.0 ) );
  float n010 = worldMaterialHash31( cell + vec3( 0.0, 1.0, 0.0 ) );
  float n110 = worldMaterialHash31( cell + vec3( 1.0, 1.0, 0.0 ) );
  float n001 = worldMaterialHash31( cell + vec3( 0.0, 0.0, 1.0 ) );
  float n101 = worldMaterialHash31( cell + vec3( 1.0, 0.0, 1.0 ) );
  float n011 = worldMaterialHash31( cell + vec3( 0.0, 1.0, 1.0 ) );
  float n111 = worldMaterialHash31( cell + vec3( 1.0, 1.0, 1.0 ) );
  float nx00 = mix( n000, n100, local.x );
  float nx10 = mix( n010, n110, local.x );
  float nx01 = mix( n001, n101, local.x );
  float nx11 = mix( n011, n111, local.x );
  return mix(
    mix( nx00, nx10, local.y ),
    mix( nx01, nx11, local.y ),
    local.z
  );
}

float worldMaterialFbm( vec3 point ) {
  float value = 0.0;
  float weight = 0.56;
  for ( int octave = 0; octave < 3; octave += 1 ) {
    value += worldMaterialValueNoise( point ) * weight;
    point = point * 2.07 + vec3( 1.7, 3.1, 2.3 );
    weight *= 0.5;
  }
  return value;
}`;
const worldMaterialSurfaceHeader = `
// junkyard-world-material-texture.v2: one finite, serializable texture preset
// applies coherently to every role in a world portrait. The junkyard never
// enters this path and retains the original shared matte Lambert surface.
// per-world-animated-surface-waves.v5: bold large-scale dark/light shapes remain
// readable while bounded per-world scale, strength, speed and phase parameters
// customize one shared reduced-motion-aware preset program.`;
const worldMaterialSurfaceColorByPresetId = Object.freeze({
  "plain-matte": `${worldMaterialSurfaceHeader}`,
  "contour-stone": `${worldMaterialSurfaceHeader}
float worldMaterialCoarse = worldMaterialFbm( vWorldMaterialObjectPosition * 1.35 );
vec3 worldMaterialIdentity = diffuseColor.rgb;
// high-contrast-contour-stone
float contourWave = sin(
  vWorldMaterialObjectPosition.y * 5.2
    + vWorldMaterialObjectPosition.x * 0.65
    + worldMaterialCoarse * 3.8
    - uWorldMaterialPhase
);
float contourBand = step( 0.0, contourWave );
float contourRidge = 1.0 - smoothstep( 0.0, 0.18, abs( contourWave ) );
vec3 contourDark = worldMaterialIdentity * 0.28;
vec3 contourBright = mix(
  worldMaterialIdentity,
  vec3( 0.94, 0.77, 0.48 ),
  0.38
) * 1.24;
diffuseColor.rgb = mix( contourDark, contourBright, contourBand )
  + contourRidge * vec3( 0.24, 0.16, 0.06 );`,
  "brushed-alloy": `${worldMaterialSurfaceHeader}
vec3 worldMaterialIdentity = diffuseColor.rgb;
// high-contrast-forged-scale
vec3 forgedPoint = vWorldMaterialObjectPosition * vec3( 3.4, 4.8, 2.7 );
float forgedRow = floor( forgedPoint.y );
float forgedScale = mod(
  floor( forgedPoint.x + mod( forgedRow, 2.0 ) * 0.5 )
    + forgedRow
    + floor( forgedPoint.z ),
  2.0
);
float forgedSeamX = min( fract( forgedPoint.x ), 1.0 - fract( forgedPoint.x ) );
float forgedSeamY = min( fract( forgedPoint.y ), 1.0 - fract( forgedPoint.y ) );
float forgedSeam = 1.0 - smoothstep( 0.025, 0.12, min( forgedSeamX, forgedSeamY ) );
float forgedPulse = 0.82 + 0.18 * sin(
  forgedPoint.y * 1.25 + forgedPoint.x * 0.32 - uWorldMaterialPhase
);
vec3 forgedDark = mix(
  worldMaterialIdentity,
  vec3( 0.055, 0.045, 0.04 ),
  0.72
) * 0.38;
vec3 forgedCopper = mix(
  worldMaterialIdentity,
  vec3( 0.94, 0.36, 0.12 ),
  0.66
) * 1.18;
diffuseColor.rgb = mix( forgedDark, forgedCopper * forgedPulse, forgedScale )
  + forgedSeam * forgedPulse * vec3( 0.42, 0.16, 0.045 );`,
  "flowing-veins": `${worldMaterialSurfaceHeader}
float worldMaterialFine = worldMaterialFbm(
  vWorldMaterialObjectPosition * 4.6
    + vec3(
      uWorldMaterialPhase * 0.18,
      -uWorldMaterialPhase * 0.11,
      uWorldMaterialPhase * 0.14
    )
    + 4.7
);
vec3 worldMaterialIdentity = diffuseColor.rgb;
// high-contrast-flowing-veins
float veinField = sin(
  worldMaterialFine * 10.0
    + vWorldMaterialObjectPosition.x * 2.4
    - vWorldMaterialObjectPosition.y * 1.7
    - uWorldMaterialPhase * 1.35
);
float veinCore = 1.0 - smoothstep( 0.02, 0.14, abs( veinField ) );
float veinHalo = 1.0 - smoothstep( 0.08, 0.42, abs( veinField ) );
vec3 veinDark = worldMaterialIdentity * vec3( 0.18, 0.28, 0.22 );
vec3 veinBright = mix(
  worldMaterialIdentity,
  vec3( 0.42, 1.0, 0.68 ),
  0.68
) * 1.42;
diffuseColor.rgb = mix( veinDark, veinBright * 0.72, veinHalo );
diffuseColor.rgb = mix( diffuseColor.rgb, veinBright, veinCore );`,
  "crystal-facets": `${worldMaterialSurfaceHeader}
float worldMaterialCoarse = worldMaterialFbm(
  vWorldMaterialObjectPosition * 1.35
    + vec3( uWorldMaterialPhase * 0.08, 0.0, -uWorldMaterialPhase * 0.06 )
);
vec3 worldMaterialIdentity = diffuseColor.rgb;
// high-contrast-crystal-facets
float crystalCoordinate = fract(
  dot( vWorldMaterialObjectPosition, vec3( 0.74, 1.16, 0.53 ) ) * 1.45
    + worldMaterialCoarse * 1.6
    + sin( uWorldMaterialPhase + vWorldMaterialObjectPosition.y * 2.2 ) * 0.12
);
float crystalFacet = floor( crystalCoordinate * 4.0 ) / 3.0;
float crystalEdge = 1.0 - smoothstep(
  0.025,
  0.11,
  min( crystalCoordinate, 1.0 - crystalCoordinate )
);
vec3 crystalDark = mix(
  worldMaterialIdentity,
  vec3( 0.08, 0.025, 0.2 ),
  0.56
) * 0.4;
vec3 crystalBright = mix(
  worldMaterialIdentity,
  vec3( 0.68, 0.9, 1.0 ),
  0.7
) * 1.38;
diffuseColor.rgb = mix( crystalDark, crystalBright, crystalFacet )
  + crystalEdge * vec3( 0.32, 0.2, 0.46 );`,
  "ceramic-rings": `${worldMaterialSurfaceHeader}
vec3 worldMaterialIdentity = diffuseColor.rgb;
// high-contrast-ceramic-rings
float ceramicCoordinate = (
  length( vWorldMaterialObjectPosition.xz ) * 5.4
    + vWorldMaterialObjectPosition.y * 1.15
    + atan( vWorldMaterialObjectPosition.z, vWorldMaterialObjectPosition.x ) * 0.38
    - uWorldMaterialPhase
);
float ceramicRing = step( 0.46, fract( ceramicCoordinate ) );
float ceramicSeam = 1.0 - smoothstep(
  0.018,
  0.075,
  abs( fract( ceramicCoordinate + 0.08 ) - 0.5 )
);
vec3 ceramicDark = worldMaterialIdentity * 0.22;
vec3 ceramicBright = mix(
  worldMaterialIdentity,
  vec3( 1.0, 0.88, 0.62 ),
  0.7
) * 1.12;
diffuseColor.rgb = mix( ceramicDark, ceramicBright, ceramicRing )
  + ceramicSeam * vec3( 0.3, 0.13, 0.035 );`,
  "molten-cracks": `${worldMaterialSurfaceHeader}
float worldMaterialCoarse = worldMaterialFbm(
  vWorldMaterialObjectPosition * 1.35
    + vec3(
      uWorldMaterialPhase * 0.13,
      -uWorldMaterialPhase * 0.09,
      uWorldMaterialPhase * 0.07
    )
);
vec3 worldMaterialIdentity = diffuseColor.rgb;
// high-contrast-molten-cracks
vec3 moltenPoint = vWorldMaterialObjectPosition * vec3( 3.7, 4.1, 3.3 );
float moltenField = abs(
  sin( moltenPoint.x + worldMaterialCoarse * 2.4 + uWorldMaterialPhase * 0.7 )
    * sin( moltenPoint.y - worldMaterialCoarse * 2.0 - uWorldMaterialPhase * 0.5 )
    * sin( moltenPoint.z + worldMaterialCoarse * 1.7 + uWorldMaterialPhase * 0.35 )
);
float moltenCore = 1.0 - smoothstep( 0.012, 0.095, moltenField );
float moltenHalo = 1.0 - smoothstep( 0.04, 0.22, moltenField );
vec3 moltenDark = mix(
  worldMaterialIdentity,
  vec3( 0.025, 0.018, 0.022 ),
  0.82
) * 0.32;
vec3 moltenBright = mix(
  worldMaterialIdentity,
  vec3( 1.0, 0.22, 0.025 ),
  0.82
) * 1.34;
diffuseColor.rgb = mix( moltenDark, moltenBright * 0.58, moltenHalo );
diffuseColor.rgb = mix( diffuseColor.rgb, moltenBright, moltenCore );`,
  "eclipse-cells": `${worldMaterialSurfaceHeader}
float worldMaterialCoarse = worldMaterialFbm( vWorldMaterialObjectPosition * 1.35 );
vec3 worldMaterialIdentity = diffuseColor.rgb;
// high-contrast-eclipse-cells
vec3 eclipsePoint = vWorldMaterialObjectPosition * 3.1;
float eclipseA = abs( sin( dot( eclipsePoint, vec3( 1.0, 0.0, 0.58 ) ) ) );
float eclipseB = abs( sin( dot( eclipsePoint, vec3( -0.5, 0.86, 0.58 ) ) ) );
float eclipseC = abs( sin( dot( eclipsePoint, vec3( -0.5, -0.86, 0.58 ) ) ) );
float eclipseEdge = 1.0 - smoothstep(
  0.035,
  0.15,
  min( eclipseA, min( eclipseB, eclipseC ) )
);
float eclipseFill = step( 0.5, fract( worldMaterialCoarse * 3.0 + uWorldMaterialPhase * 0.16 ) );
float eclipsePulse = 0.84 + 0.16 * sin(
  uWorldMaterialPhase * 1.4 + dot( eclipsePoint, vec3( 0.32, 0.48, 0.21 ) )
);
vec3 eclipseDark = mix(
  worldMaterialIdentity,
  vec3( 0.07, 0.018, 0.12 ),
  0.72
) * mix( 0.34, 0.64, eclipseFill );
vec3 eclipseGold = mix(
  worldMaterialIdentity,
  vec3( 1.0, 0.62, 0.08 ),
  0.78
) * 1.22;
diffuseColor.rgb = mix( eclipseDark, eclipseGold * eclipsePulse, eclipseEdge );`,
  "storm-vortex": `${worldMaterialSurfaceHeader}
float worldMaterialCoarse = worldMaterialFbm( vWorldMaterialObjectPosition * 1.35 );
vec3 worldMaterialIdentity = diffuseColor.rgb;
// high-contrast-storm-vortex
float stormAngle = atan(
  vWorldMaterialObjectPosition.z,
  vWorldMaterialObjectPosition.x
);
float stormRadius = length( vWorldMaterialObjectPosition.xz );
float stormWave = sin(
  stormAngle * 5.0
    + stormRadius * 8.4
    + vWorldMaterialObjectPosition.y * 1.4
    + worldMaterialCoarse * 2.2
    + uWorldMaterialPhase * 1.55
);
float stormBand = step( 0.04, stormWave );
float stormEye = 1.0 - smoothstep( 0.0, 0.2, abs( stormWave ) );
vec3 stormDark = mix(
  worldMaterialIdentity,
  vec3( 0.035, 0.038, 0.045 ),
  0.76
) * 0.4;
vec3 stormSilver = mix(
  worldMaterialIdentity,
  vec3( 0.94, 0.88, 0.8 ),
  0.72
) * 1.18;
diffuseColor.rgb = mix( stormDark, stormSilver, stormBand )
  + stormEye * vec3( 0.24, 0.21, 0.18 );`,
  "sunburst-shell": `${worldMaterialSurfaceHeader}
float worldMaterialCoarse = worldMaterialFbm( vWorldMaterialObjectPosition * 1.35 );
vec3 worldMaterialIdentity = diffuseColor.rgb;
// high-contrast-sunburst-shell
float sunburstAngle = atan(
  vWorldMaterialObjectPosition.z,
  vWorldMaterialObjectPosition.x
);
float sunburstWave = sin(
  sunburstAngle * 8.0
    + vWorldMaterialObjectPosition.y * 1.35
    + worldMaterialCoarse * 1.3
    - uWorldMaterialPhase * 1.2
);
float sunburstPanel = step( 0.0, sunburstWave );
float sunburstRib = 1.0 - smoothstep( 0.015, 0.12, abs( sunburstWave ) );
vec3 sunburstRed = mix(
  worldMaterialIdentity,
  vec3( 0.42, 0.015, 0.035 ),
  0.7
) * 0.62;
vec3 sunburstIvory = mix(
  worldMaterialIdentity,
  vec3( 1.0, 0.82, 0.56 ),
  0.72
) * 1.2;
diffuseColor.rgb = mix( sunburstRed, sunburstIvory, sunburstPanel )
  + sunburstRib
    * ( 0.82 + 0.18 * sin( uWorldMaterialPhase + sunburstAngle * 3.0 ) )
    * vec3( 0.3, 0.12, 0.035 );`,
});

const worldMaterialNoisePresetIds = new Set([
  "contour-stone",
  "flowing-veins",
  "crystal-facets",
  "molten-cracks",
  "eclipse-cells",
  "storm-vortex",
  "sunburst-shell",
]);

export function installWorldSurfaceMaterialTexture(shader, presetId, materialUniforms = {}) {
  installWorldSurfaceLightBands(shader);
  const resolvedPresetId = WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.presetIds.includes(presetId)
    ? presetId
    : WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.defaultPresetId;
  const surfaceColor = worldMaterialSurfaceColorByPresetId[resolvedPresetId];
  if (resolvedPresetId === WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.defaultPresetId) {
    shader.fragmentShader = replaceUniqueShaderAnchor(
      shader.fragmentShader,
      "#include <color_fragment>",
      `#include <color_fragment>${surfaceColor}`,
    );
    return;
  }
  shader.uniforms.uWorldMaterialPhase = materialUniforms.phase || { value: 0 };
  shader.uniforms.uWorldMaterialPatternScale = materialUniforms.patternScale || { value: 1 };
  shader.uniforms.uWorldMaterialEffectStrength = materialUniforms.effectStrength || { value: 1 };
  shader.vertexShader = replaceUniqueShaderAnchor(
    shader.vertexShader,
    lambertCommonAnchor,
    `${lambertCommonAnchor}${worldMaterialVertexCommon}`,
  );
  shader.vertexShader = replaceUniqueShaderAnchor(
    shader.vertexShader,
    "#include <begin_vertex>",
    `#include <begin_vertex>${worldMaterialVertexProjection}`,
  );
  shader.fragmentShader = replaceUniqueShaderAnchor(
    shader.fragmentShader,
    lambertCommonAnchor,
    `${lambertCommonAnchor}${worldMaterialFragmentPositionCommon}${
      worldMaterialNoisePresetIds.has(resolvedPresetId) ? worldMaterialNoiseFunctions : ""
    }`,
  );
  shader.fragmentShader = replaceUniqueShaderAnchor(
    shader.fragmentShader,
    "#include <color_fragment>",
    `#include <color_fragment>
vec3 worldMaterialObjectPosition = vWorldMaterialObjectPosition * uWorldMaterialPatternScale;
vec3 worldMaterialBaseColor = diffuseColor.rgb;
${surfaceColor.replaceAll("vWorldMaterialObjectPosition", "worldMaterialObjectPosition")}
diffuseColor.rgb = mix(
  worldMaterialBaseColor,
  diffuseColor.rgb,
  uWorldMaterialEffectStrength
);`,
  );
}

const worldSurfaceMaterialUniforms = new WeakMap();

function createWorldSurfaceMaterial(presetId, parameters = DEFAULT_WORLD_MATERIAL_TEXTURE_PARAMETERS) {
  const normalizedParameters = resolveWorldMaterialTextureParameters(parameters);
  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: false,
    transparent: false,
    opacity: 1,
    toneMapped: false,
  });
  const materialUniforms = {
    phase: { value: normalizedParameters.phaseOffset * Math.PI * 2 },
    patternScale: { value: normalizedParameters.patternScale },
    effectStrength: { value: normalizedParameters.effectStrength },
  };
  worldSurfaceMaterialUniforms.set(material, materialUniforms);
  material.name = `world-surface-${presetId}-lambert`;
  material.onBeforeCompile = (shader) => installWorldSurfaceMaterialTexture(
    shader,
    presetId,
    materialUniforms,
  );
  material.customProgramCacheKey = (
    () => `${WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.schemaVersion}:${WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.renderStyleVersion}:${WORLD_SURFACE_MATERIAL_MOTION_POLICY.schemaVersion}:${presetId}:${WORLD_SURFACE_LIGHT_BAND_POLICY.schemaVersion}:${WORLD_SURFACE_LIGHT_COHESION_POLICY.schemaVersion}`
  );
  material.userData.materialTexturePolicy = WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.schemaVersion;
  material.userData.materialTextureRenderStyle = WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.renderStyleVersion;
  material.userData.materialMotionPolicy = WORLD_SURFACE_MATERIAL_MOTION_POLICY.schemaVersion;
  material.userData.materialTexturePresetId = presetId;
  material.userData.materialTextureParameters = normalizedParameters;
  return material;
}

const worldSurfaceMaterialsByTexturePreset = Object.freeze(Object.fromEntries(
  WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.presetIds.map((presetId) => [
    presetId,
    createWorldSurfaceMaterial(presetId),
  ]),
));

export function worldStructureMaterialForTexture(materialTexture) {
  const presetId = String(
    materialTexture?.presetId || WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.defaultPresetId,
  );
  return worldSurfaceMaterialsByTexturePreset[presetId]
    || worldSurfaceMaterialsByTexturePreset[WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.defaultPresetId];
}

export function createWorldStructureMaterialForTexture(materialTexture) {
  const presetId = String(
    materialTexture?.presetId || WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.defaultPresetId,
  );
  if (!WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.presetIds.includes(presetId)) {
    return worldSurfaceMaterialsByTexturePreset[WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.defaultPresetId];
  }
  if (presetId === WORLD_SURFACE_MATERIAL_TEXTURE_POLICY.defaultPresetId) {
    return worldSurfaceMaterialsByTexturePreset[presetId];
  }
  const material = createWorldSurfaceMaterial(presetId, materialTexture?.parameters);
  material.userData.worldOwnedMaterial = true;
  return material;
}

const sharedEnvironmentTint = new THREE.Color(WORLD_SURFACE_VALUE_POLICY.environmentTint);

function derivedIdentityColor(identityColor, tone = "primary") {
  const policy = WORLD_SURFACE_VALUE_POLICY;
  if (tone === "neutral") {
    return new THREE.Color().setHSL(
      0.54,
      0.1,
      THREE.MathUtils.clamp(
        policy.neutralFloor,
        policy.minimumFaceLightness,
        policy.maximumFaceLightness,
      ),
    ).lerp(sharedEnvironmentTint, policy.environmentTintMix);
  }
  const color = new THREE.Color(identityColor);
  const hsl = {};
  color.getHSL(hsl);
  const lightnessFloor = tone === "secondary" ? policy.secondaryFloor : policy.primaryFloor;
  const sourceLightness = tone === "secondary" ? hsl.l - 0.045 : hsl.l;
  const toneSaturation = tone === "secondary" ? 0.82 : 0.94;
  color.setHSL(
    hsl.h,
    THREE.MathUtils.clamp(hsl.s * toneSaturation, 0.18, 0.62),
    THREE.MathUtils.clamp(
      Math.max(sourceLightness, lightnessFloor),
      policy.minimumFaceLightness,
      policy.maximumFaceLightness,
    ),
  );
  return color.lerp(sharedEnvironmentTint, policy.environmentTintMix);
}

export function createWorldSurfaceFillLights() {
  const policy = WORLD_SURFACE_LIGHT_POLICY;
  return [
    new THREE.HemisphereLight(policy.skyColor, policy.groundColor, policy.intensity),
    new THREE.AmbientLight(policy.ambientColor, policy.ambientIntensity),
  ].map((light) => {
    light.userData.appearanceLightRole = WORLD_SURFACE_LIGHT_ROLES.sharedFill;
    return light;
  });
}

function validateWorldSurfaceGeometry(geometry, requireNonIndexed = false) {
  const positions = geometry.getAttribute("position");
  const groups = geometry.getAttribute(WORLD_SURFACE_NORMAL_POLICY.smoothingGroupAttribute);
  const triangleElementCount = geometry.index ? geometry.index.count : positions?.count;
  if (
    !positions
    || positions.itemSize !== 3
    || !positions.array
    || !Number.isInteger(triangleElementCount)
    || triangleElementCount % 3 !== 0
    || !Array.from(positions.array).every(Number.isFinite)
    || (requireNonIndexed && geometry.index)
  ) {
    throw new Error("World surface geometry must contain finite non-indexed triangle positions.");
  }
  if (geometry.index && (
    !geometry.index.array
    || !Array.from(geometry.index.array).every((value) => (
    Number.isInteger(value) && value >= 0 && value < positions.count
    ))
  )) {
    throw new Error("World surface geometry must contain valid triangle indices.");
  }
  if (groups && (
    groups.itemSize !== 1
    || groups.count !== positions.count
    || !groups.array
    || !Array.from(groups.array).every((value) => (
      Number.isFinite(value) && Number.isInteger(value) && value >= 0
    ))
  )) {
    throw new Error("World surface smoothing groups must be finite non-negative integers.");
  }
  return { positions, groups };
}

function weldWorldSurfacePositions(positions, tolerance) {
  const weldedIds = new Int32Array(positions.count);
  const representatives = [];
  const cells = new Map();
  const toleranceSquared = tolerance * tolerance;
  const cellKey = (x, y, z) => `${x}:${y}:${z}`;
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    const x = positions.getX(vertex);
    const y = positions.getY(vertex);
    const z = positions.getZ(vertex);
    const cellX = Math.floor(x / tolerance);
    const cellY = Math.floor(y / tolerance);
    const cellZ = Math.floor(z / tolerance);
    let closestId = -1;
    let closestDistanceSquared = Infinity;
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetZ = -1; offsetZ <= 1; offsetZ += 1) {
          const candidates = cells.get(cellKey(
            cellX + offsetX,
            cellY + offsetY,
            cellZ + offsetZ,
          )) || [];
          candidates.forEach((candidateId) => {
            const representative = representatives[candidateId];
            const deltaX = x - representative[0];
            const deltaY = y - representative[1];
            const deltaZ = z - representative[2];
            const distanceSquared = deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;
            if (
              distanceSquared <= toleranceSquared
              && (distanceSquared < closestDistanceSquared || (
                distanceSquared === closestDistanceSquared && candidateId < closestId
              ))
            ) {
              closestId = candidateId;
              closestDistanceSquared = distanceSquared;
            }
          });
        }
      }
    }
    if (closestId < 0) {
      closestId = representatives.length;
      representatives.push([x, y, z]);
      const key = cellKey(cellX, cellY, cellZ);
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(closestId);
    }
    weldedIds[vertex] = closestId;
  }
  return weldedIds;
}

export function applyWorldComponentSmoothNormals(geometry) {
  const { positions, groups } = validateWorldSurfaceGeometry(geometry, true);
  const policy = WORLD_SURFACE_NORMAL_POLICY;
  let minimumX = Infinity;
  let minimumY = Infinity;
  let minimumZ = Infinity;
  let maximumX = -Infinity;
  let maximumY = -Infinity;
  let maximumZ = -Infinity;
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    minimumX = Math.min(minimumX, positions.getX(vertex));
    minimumY = Math.min(minimumY, positions.getY(vertex));
    minimumZ = Math.min(minimumZ, positions.getZ(vertex));
    maximumX = Math.max(maximumX, positions.getX(vertex));
    maximumY = Math.max(maximumY, positions.getY(vertex));
    maximumZ = Math.max(maximumZ, positions.getZ(vertex));
  }
  const diagonal = Math.hypot(
    maximumX - minimumX,
    maximumY - minimumY,
    maximumZ - minimumZ,
  );
  if (!Number.isFinite(diagonal) || diagonal <= 0) {
    throw new Error("World surface geometry must have a finite non-zero extent.");
  }
  const positionTolerance = Math.max(
    diagonal * policy.relativePositionWeldTolerance,
    policy.minimumPositionWeldTolerance,
  );
  const triangleAreaTolerance = Math.max(
    diagonal * diagonal * policy.relativeTriangleAreaTolerance,
    policy.minimumTriangleAreaTolerance,
  );
  const weldedIds = weldWorldSurfacePositions(positions, positionTolerance);
  const triangleCount = positions.count / 3;
  const faceCrosses = new Float64Array(triangleCount * 3);
  const faceUnits = new Float64Array(triangleCount * 3);
  const faceCrossLengths = new Float64Array(triangleCount);
  const edges = new Map();
  const edgePairs = [[0, 1], [1, 2], [2, 0]];

  for (let face = 0; face < triangleCount; face += 1) {
    const corner = face * 3;
    const faceGroup = groups ? groups.getX(corner) : 0;
    if (groups && (
      groups.getX(corner + 1) !== faceGroup || groups.getX(corner + 2) !== faceGroup
    )) {
      throw new Error("Every world surface triangle must belong to one smoothing group.");
    }
    const firstX = positions.getX(corner);
    const firstY = positions.getY(corner);
    const firstZ = positions.getZ(corner);
    const firstEdgeX = positions.getX(corner + 1) - firstX;
    const firstEdgeY = positions.getY(corner + 1) - firstY;
    const firstEdgeZ = positions.getZ(corner + 1) - firstZ;
    const secondEdgeX = positions.getX(corner + 2) - firstX;
    const secondEdgeY = positions.getY(corner + 2) - firstY;
    const secondEdgeZ = positions.getZ(corner + 2) - firstZ;
    const crossX = firstEdgeY * secondEdgeZ - firstEdgeZ * secondEdgeY;
    const crossY = firstEdgeZ * secondEdgeX - firstEdgeX * secondEdgeZ;
    const crossZ = firstEdgeX * secondEdgeY - firstEdgeY * secondEdgeX;
    const crossLength = Math.hypot(crossX, crossY, crossZ);
    if (!Number.isFinite(crossLength) || crossLength <= triangleAreaTolerance) {
      throw new Error("World surface geometry must not contain degenerate triangles.");
    }
    if (new Set([
      weldedIds[corner], weldedIds[corner + 1], weldedIds[corner + 2],
    ]).size !== 3) {
      throw new Error("World surface position welding must not collapse a triangle.");
    }
    faceCrosses.set([crossX, crossY, crossZ], face * 3);
    faceUnits.set([
      crossX / crossLength,
      crossY / crossLength,
      crossZ / crossLength,
    ], face * 3);
    faceCrossLengths[face] = crossLength;
    edgePairs.forEach(([firstOffset, secondOffset]) => {
      const firstCorner = corner + firstOffset;
      const secondCorner = corner + secondOffset;
      const firstWelded = weldedIds[firstCorner];
      const secondWelded = weldedIds[secondCorner];
      const minimumWelded = Math.min(firstWelded, secondWelded);
      const maximumWelded = Math.max(firstWelded, secondWelded);
      const key = `${faceGroup}|${minimumWelded}|${maximumWelded}`;
      if (!edges.has(key)) edges.set(key, []);
      edges.get(key).push({
        face,
        corners: firstWelded < secondWelded
          ? [firstCorner, secondCorner]
          : [secondCorner, firstCorner],
      });
    });
  }

  const parents = Int32Array.from({ length: positions.count }, (_, index) => index);
  const ranks = new Uint8Array(positions.count);
  const findRoot = (corner) => {
    let root = corner;
    while (parents[root] !== root) root = parents[root];
    let current = corner;
    while (parents[current] !== current) {
      const next = parents[current];
      parents[current] = root;
      current = next;
    }
    return root;
  };
  const unionCorners = (firstCorner, secondCorner) => {
    let firstRoot = findRoot(firstCorner);
    let secondRoot = findRoot(secondCorner);
    if (firstRoot === secondRoot) return;
    if (ranks[firstRoot] < ranks[secondRoot]) [firstRoot, secondRoot] = [secondRoot, firstRoot];
    parents[secondRoot] = firstRoot;
    if (ranks[firstRoot] === ranks[secondRoot]) ranks[firstRoot] += 1;
  };

  edges.forEach((entries) => {
    if (entries.length > 2) {
      throw new Error("World surface smoothing groups must be manifold along shared edges.");
    }
    if (entries.length !== 2) return;
    const [firstEntry, secondEntry] = entries;
    const firstUnitOffset = firstEntry.face * 3;
    const secondUnitOffset = secondEntry.face * 3;
    const adjacentFaceDot = (
      faceUnits[firstUnitOffset] * faceUnits[secondUnitOffset]
      + faceUnits[firstUnitOffset + 1] * faceUnits[secondUnitOffset + 1]
      + faceUnits[firstUnitOffset + 2] * faceUnits[secondUnitOffset + 2]
    );
    if (adjacentFaceDot < policy.minimumAdjacentFaceDot) {
      throw new Error("World surface smoothing groups must not cross opposing faces.");
    }
    if (
      !groups
      && adjacentFaceDot < policy.minimumImplicitSmoothAdjacentFaceDot
    ) return;
    unionCorners(firstEntry.corners[0], secondEntry.corners[0]);
    unionCorners(firstEntry.corners[1], secondEntry.corners[1]);
  });

  const clusterCrosses = new Float64Array(positions.count * 3);
  const clusterWeights = new Float64Array(positions.count);
  for (let corner = 0; corner < positions.count; corner += 1) {
    const root = findRoot(corner);
    const face = Math.floor(corner / 3);
    const faceOffset = face * 3;
    clusterCrosses[root * 3] += faceCrosses[faceOffset];
    clusterCrosses[root * 3 + 1] += faceCrosses[faceOffset + 1];
    clusterCrosses[root * 3 + 2] += faceCrosses[faceOffset + 2];
    clusterWeights[root] += faceCrossLengths[face];
  }
  const clusterNormals = new Float64Array(positions.count * 3);
  const clusterReady = new Uint8Array(positions.count);
  const outputNormals = new Float32Array(positions.count * 3);
  for (let corner = 0; corner < positions.count; corner += 1) {
    const root = findRoot(corner);
    const rootOffset = root * 3;
    if (!clusterReady[root]) {
      const crossX = clusterCrosses[rootOffset];
      const crossY = clusterCrosses[rootOffset + 1];
      const crossZ = clusterCrosses[rootOffset + 2];
      const crossLength = Math.hypot(crossX, crossY, crossZ);
      const coherence = crossLength / clusterWeights[root];
      if (
        !Number.isFinite(crossLength)
        || !Number.isFinite(coherence)
        || crossLength <= triangleAreaTolerance
        || coherence < policy.minimumClusterCoherence
      ) {
        throw new Error("World surface smoothing groups must produce coherent normals.");
      }
      clusterNormals[rootOffset] = crossX / crossLength;
      clusterNormals[rootOffset + 1] = crossY / crossLength;
      clusterNormals[rootOffset + 2] = crossZ / crossLength;
      clusterReady[root] = 1;
    }
    const faceOffset = Math.floor(corner / 3) * 3;
    const facing = (
      clusterNormals[rootOffset] * faceUnits[faceOffset]
      + clusterNormals[rootOffset + 1] * faceUnits[faceOffset + 1]
      + clusterNormals[rootOffset + 2] * faceUnits[faceOffset + 2]
    );
    if (!Number.isFinite(facing) || facing <= policy.minimumNormalFacing) {
      throw new Error("World surface smoothing normals must face their source triangles.");
    }
    outputNormals[corner * 3] = clusterNormals[rootOffset];
    outputNormals[corner * 3 + 1] = clusterNormals[rootOffset + 1];
    outputNormals[corner * 3 + 2] = clusterNormals[rootOffset + 2];
  }
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(outputNormals, 3));
  geometry.deleteAttribute(policy.smoothingGroupAttribute);
  return geometry;
}

export function projectWorldSurfaceGeometry(source) {
  let geometry = null;
  try {
    validateWorldSurfaceGeometry(source);
    geometry = source.index ? source.toNonIndexed() : source.clone();
  } finally {
    source.dispose();
  }
  try {
    return applyWorldComponentSmoothNormals(geometry);
  } catch (error) {
    if (geometry) geometry.dispose();
    throw error;
  }
}

function separateWorldSurfaceMaterialGroups(source) {
  const positions = source.getAttribute("position");
  if (!positions || source.groups.length < 2) {
    source.dispose();
    throw new Error("World surface creases must map at least two material groups.");
  }
  const assignments = new Int32Array(positions.count).fill(-1);
  source.groups.forEach((group, groupIndex) => {
    const groupEnd = group.start + group.count;
    for (let element = group.start; element < groupEnd; element += 1) {
      const vertex = source.index ? source.index.getX(element) : element;
      if (assignments[vertex] >= 0 && assignments[vertex] !== groupIndex) {
        source.dispose();
        throw new Error("World surface creases require split source vertices.");
      }
      assignments[vertex] = groupIndex;
    }
  });
  source.setAttribute(
    WORLD_SURFACE_NORMAL_POLICY.smoothingGroupAttribute,
    new THREE.BufferAttribute(
      Uint16Array.from(assignments, (assignment) => Math.max(assignment, 0)),
      1,
    ),
  );
  return source;
}

function facetedGeometry(source, identityColor, tone) {
  const geometry = projectWorldSurfaceGeometry(source);
  const normals = geometry.getAttribute("normal");
  const colors = new Float32Array(normals.count * 3);
  const color = derivedIdentityColor(identityColor, tone);
  for (let vertex = 0; vertex < normals.count; vertex += 1) {
    colors[vertex * 3] = color.r;
    colors[vertex * 3 + 1] = color.g;
    colors[vertex * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function addMesh(
  group,
  geometry,
  identityColor,
  semanticKey,
  transform = {},
  material = null,
) {
  const mesh = new THREE.Mesh(
    facetedGeometry(geometry, identityColor, transform.tone || "primary"),
    material || sharedWorldSurfaceMaterial,
  );
  if (transform.position) mesh.position.fromArray(transform.position);
  if (transform.rotation) mesh.rotation.fromArray(transform.rotation);
  if (transform.scale) mesh.scale.fromArray(transform.scale);
  mesh.userData.appearanceLayer = "world-surface";
  mesh.userData.semanticKey = semanticKey;
  group.add(mesh);
  return mesh;
}

function mergeCardBatchGeometry(meshes) {
  const transformed = meshes.map((mesh) => {
    mesh.updateMatrix();
    const geometry = mesh.geometry.index
      ? mesh.geometry.toNonIndexed()
      : mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrix);
    if (mesh.matrix.determinant() < 0) {
      Object.values(geometry.attributes).forEach((attribute) => {
        for (let vertex = 0; vertex < attribute.count; vertex += 3) {
          for (let component = 0; component < attribute.itemSize; component += 1) {
            const second = attribute.array[(vertex + 1) * attribute.itemSize + component];
            const thirdIndex = (vertex + 2) * attribute.itemSize + component;
            attribute.array[(vertex + 1) * attribute.itemSize + component] = attribute.array[thirdIndex];
            attribute.array[thirdIndex] = second;
          }
        }
        attribute.needsUpdate = true;
      });
    }
    return geometry;
  });
  const attributeNames = Object.keys(transformed[0]?.attributes || {});
  const compatible = transformed.length > 1 && transformed.every((geometry) => (
    Object.keys(geometry.attributes).length === attributeNames.length
    && attributeNames.every((name) => {
      const first = transformed[0].getAttribute(name);
      const current = geometry.getAttribute(name);
      return current
        && current.itemSize === first.itemSize
        && current.normalized === first.normalized
        && current.array.constructor === first.array.constructor;
    })
  ));
  if (!compatible) {
    transformed.forEach((geometry) => geometry.dispose());
    return null;
  }
  const merged = new THREE.BufferGeometry();
  attributeNames.forEach((name) => {
    const first = transformed[0].getAttribute(name);
    const length = transformed.reduce(
      (total, geometry) => total + geometry.getAttribute(name).array.length,
      0,
    );
    const values = new first.array.constructor(length);
    let offset = 0;
    transformed.forEach((geometry) => {
      const source = geometry.getAttribute(name).array;
      values.set(source, offset);
      offset += source.length;
    });
    merged.setAttribute(
      name,
      new THREE.BufferAttribute(values, first.itemSize, first.normalized),
    );
  });
  transformed.forEach((geometry) => geometry.dispose());
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

function createCardRenderBatch(role, material) {
  if (!role) return null;
  const sources = role.children.filter((child) => (
    child.isMesh
    && child.userData.appearanceLayer === "world-surface"
  ));
  if (sources.length < 2) return null;
  const geometry = mergeCardBatchGeometry(sources);
  if (!geometry) return null;
  const batch = new THREE.Mesh(geometry, material);
  batch.visible = false;
  batch.userData.appearanceLayer = "world-surface-card-batch";
  batch.userData.semanticKeys = sources.map((source) => source.userData.semanticKey);
  role.add(batch);
  return { batch, sources };
}

function applyWorldStructurePresentation(group, presentation) {
  const next = presentation === "card" ? "card" : "default";
  if (group.userData.activeRenderPresentation === next) return;
  group.userData.activeRenderPresentation = next;
  (group.userData.cardRenderBatches || []).forEach(({ batch, sources }) => {
    const useBatch = next === "card";
    batch.visible = useBatch;
    sources.forEach((source) => { source.visible = !useBatch; });
  });
}

function applyTransform(object, transform) {
  object.position.fromArray(transform.position);
  object.rotation.fromArray(transform.rotation);
  object.scale.fromArray(transform.scale);
}

export function createJunkyardStructureGroup() {
  const group = new THREE.Group();
  const identityColor = "#4f9689";
  group.userData.kind = "appearance-junkyard";
  group.userData.identityColor = identityColor;

  addMesh(group, new THREE.DodecahedronGeometry(0.82, 0), identityColor, "junkyard|main-body", {
    scale: [1.55, 0.68, 1.12],
  });
  addMesh(group, separateWorldSurfaceMaterialGroups(
    new THREE.CylinderGeometry(0.72, 0.84, 0.2, 8),
  ), identityColor, "junkyard|upper-deck", {
    position: [0, 0.32, 0],
    scale: [1.4, 1, 0.82],
  });
  addMesh(group, new THREE.BoxGeometry(1.86, 0.22, 0.42, 3, 1, 1), identityColor, "junkyard|spine", {
    position: [0, -0.04, 0.02],
    rotation: [0, 0.12, -0.08],
  });
  addMesh(group, new THREE.BoxGeometry(0.46, 0.18, 1.52, 1, 1, 3), identityColor, "junkyard|cross-dock", {
    position: [0.1, 0.02, 0],
    rotation: [0.05, -0.08, 0.02],
  });
  return group;
}

function createRealmPlateGeometry() {
  const rim = [
    [-0.96, 0.02, -0.2], [-0.72, 0.1, -0.65], [-0.18, 0.14, -0.9],
    [0.45, 0.08, -0.8], [0.9, -0.01, -0.38], [0.98, -0.04, 0.22],
    [0.55, 0.04, 0.76], [-0.1, 0.12, 0.9], [-0.7, 0.08, 0.7],
    [-0.96, 0.01, 0.28],
  ];
  // The upper and lower fans are semantically separate surfaces. Duplicating
  // their rim vertices lets each fan smooth internally without averaging
  // opposing normals across the plate's real outer crease.
  const positions = [
    -0.22, 0.42, -0.08,
    0.16, -0.34, 0.1,
    ...rim.flat(),
    ...rim.flat(),
  ];
  const indices = [];
  rim.forEach((_, index) => {
    const upperCurrent = index + 2;
    const upperNext = (index + 1) % rim.length + 2;
    const lowerCurrent = index + 2 + rim.length;
    const lowerNext = (index + 1) % rim.length + 2 + rim.length;
    indices.push(0, upperNext, upperCurrent, 1, lowerCurrent, lowerNext);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute(
    WORLD_SURFACE_NORMAL_POLICY.smoothingGroupAttribute,
    new THREE.BufferAttribute(new Uint16Array([
      0, 1,
      ...rim.map(() => 0),
      ...rim.map(() => 1),
    ]), 1),
  );
  geometry.setIndex(indices);
  return geometry;
}

function buildCityMesa(role, color, variantId) {
  const high = variantId === "high-citadel";
  addMesh(role, new THREE.DodecahedronGeometry(0.78, 0), color, "city-mesa|ground", {
    position: [0, -0.2, 0],
    scale: [1.22, 0.38, 0.82],
    tone: "secondary",
  });
  const blocks = high
    ? [[-0.48, 0.08, 0.1, 0.34, 0.56], [0, 0.18, -0.04, 0.4, 0.82], [0.48, 0.04, 0.06, 0.3, 0.5]]
    : [[-0.55, -0.01, 0.04, 0.42, 0.4], [-0.08, 0.04, -0.12, 0.46, 0.48], [0.46, 0, 0.1, 0.38, 0.42]];
  blocks.forEach(([x, y, z, width, height], index) => {
    addMesh(role, new THREE.BoxGeometry(width, height, 0.46, 1, 2, 1), color, `city-mesa|block-${index}`, {
      position: [x, y + height * 0.32, z],
      rotation: [0, index % 2 ? -0.08 : 0.08, 0],
      tone: index === 1 ? "primary" : "secondary",
    });
  });
}

function buildMountainRealm(role, color, variantId) {
  addMesh(role, createRealmPlateGeometry(), color, "mountain-realm|land", {
    position: [0, -0.18, 0],
    scale: [1.02, 0.72, 0.72],
    tone: "secondary",
  });
  const peaks = variantId === "split-peaks"
    ? [[-0.52, 0.2, 0.02, 0.34, 0.94], [0.42, 0.18, -0.08, 0.38, 1.02], [0.02, 0.08, 0.18, 0.24, 0.62]]
    : [[-0.42, 0.12, 0.06, 0.3, 0.78], [0, 0.22, -0.08, 0.4, 1.08], [0.48, 0.1, 0.04, 0.28, 0.7]];
  peaks.forEach(([x, y, z, radius, height], index) => {
    addMesh(role, separateWorldSurfaceMaterialGroups(
      new THREE.ConeGeometry(radius, height, 5),
    ), color, `mountain-realm|peak-${index}`, {
      position: [x, y, z],
      rotation: [0.02 * index, index * 0.18, index % 2 ? 0.08 : -0.06],
      tone: index === 1 ? "primary" : "secondary",
    });
  });
}

function buildFloatingArchipelago(role, color, variantId) {
  const islands = variantId === "ascending-isles"
    ? [[-0.62, -0.28, 0.08, 0.62], [-0.02, -0.02, -0.05, 0.76], [0.62, 0.26, 0.04, 0.54]]
    : [[-0.48, -0.16, 0.08, 0.76], [0.48, 0.18, -0.08, 0.72], [0, 0.02, 0.12, 0.4]];
  islands.forEach(([x, y, z, scale], index) => {
    addMesh(role, new THREE.DodecahedronGeometry(0.64, 0), color, `floating-archipelago|island-${index}`, {
      position: [x, y, z],
      rotation: [0.12 * index, -0.18 * index, index % 2 ? 0.12 : -0.08],
      scale: [scale * 1.18, scale * 0.58, scale],
      tone: index === 1 ? "primary" : "secondary",
    });
  });
  addMesh(role, new THREE.BoxGeometry(1.26, 0.12, 0.2, 3, 1, 1), color, "floating-archipelago|relation-bridge", {
    position: [0, 0.01, 0],
    rotation: [0, 0, variantId === "ascending-isles" ? 0.42 : 0.3],
    tone: "neutral",
  });
}

function buildWorldTreeDomain(role, color, variantId) {
  const spire = variantId === "spire-canopy";
  addMesh(role, new THREE.DodecahedronGeometry(0.66, 0), color, "world-tree|ground", {
    position: [0, -0.44, 0],
    scale: [1.12, 0.28, 0.78],
    tone: "secondary",
  });
  addMesh(role, separateWorldSurfaceMaterialGroups(
    new THREE.CylinderGeometry(0.16, 0.28, spire ? 1.34 : 1.08, 6),
  ), color, "world-tree|trunk", {
    position: [0, 0.08, 0],
    rotation: [0.03, 0, -0.05],
    tone: "neutral",
  });
  [[-0.34, 0.38, 0.02, -0.56], [0.34, 0.42, -0.02, 0.56]].forEach(([x, y, z, tilt], index) => {
    addMesh(role, new THREE.BoxGeometry(0.58, 0.14, 0.16, 2, 1, 1), color, `world-tree|branch-${index}`, {
      position: [x, y, z],
      rotation: [0, 0, tilt],
      tone: "neutral",
    });
  });
  const crowns = spire
    ? [[0, 0.78, 0, 0.58], [-0.32, 0.56, 0.02, 0.4], [0.34, 0.58, -0.02, 0.4]]
    : [[-0.42, 0.56, 0.02, 0.52], [0.42, 0.58, -0.02, 0.52], [0, 0.72, 0, 0.48]];
  crowns.forEach(([x, y, z, scale], index) => {
    addMesh(role, new THREE.DodecahedronGeometry(scale, 0), color, `world-tree|canopy-${index}`, {
      position: [x, y, z],
      scale: [1.1, spire ? 1.12 : 0.76, 0.88],
      tone: index === 2 ? "primary" : "secondary",
    });
  });
}

function buildStellarCradle(role, color, variantId) {
  const split = variantId === "split-vault";
  addMesh(role, new THREE.IcosahedronGeometry(split ? 0.46 : 0.52, 1), color, "stellar-cradle|core", {
    position: [0, split ? 0.02 : 0.12, 0],
    scale: split ? [1.18, 0.86, 0.9] : [1, 1, 1],
  });
  const cradleRotations = split ? [-0.72, 0.72] : [-0.58, 0.58];
  cradleRotations.forEach((tilt, index) => {
    addMesh(role, new THREE.BoxGeometry(0.28, 1.18, 0.34, 1, 3, 1), color, `stellar-cradle|support-${index}`, {
      position: [index ? 0.54 : -0.54, -0.04, 0],
      rotation: [0, index ? -0.12 : 0.12, tilt],
      tone: "secondary",
    });
  });
  addMesh(role, new THREE.BoxGeometry(1.12, 0.2, 0.42, 3, 1, 1), color, "stellar-cradle|base", {
    position: [0, -0.5, 0],
    tone: "neutral",
  });
}

function buildRailCitadel(role, color, variantId) {
  const segmented = variantId === "segmented-line";
  const segments = segmented
    ? [[-0.68, -0.06, 0.04, 0.5], [0, 0.08, -0.04, 0.62], [0.68, -0.02, 0.02, 0.5]]
    : [[-0.62, 0, 0.02, 0.62], [0, 0.04, -0.02, 0.68], [0.62, 0, 0.02, 0.62]];
  segments.forEach(([x, y, z, width], index) => {
    addMesh(role, new THREE.BoxGeometry(width, index === 1 ? 0.62 : 0.46, 0.64, 2, 2, 1), color, `rail-citadel|segment-${index}`, {
      position: [x, y, z],
      rotation: [0, index % 2 ? 0 : index ? -0.08 : 0.08, 0],
      tone: index === 1 ? "primary" : "secondary",
    });
  });
  addMesh(role, new THREE.BoxGeometry(1.48, 0.14, 0.24, 4, 1, 1), color, "rail-citadel|spine", {
    position: [0, -0.26, 0.06],
    tone: "neutral",
  });
  addMesh(role, separateWorldSurfaceMaterialGroups(
    new THREE.ConeGeometry(0.22, segmented ? 0.62 : 0.48, 5),
  ), color, "rail-citadel|citadel", {
    position: [0, 0.55, -0.02],
  });
}

const MAIN_MODEL_BUILDERS = Object.freeze({
  "city-mesa": buildCityMesa,
  "mountain-realm": buildMountainRealm,
  "floating-archipelago": buildFloatingArchipelago,
  "world-tree-domain": buildWorldTreeDomain,
  "stellar-cradle": buildStellarCradle,
  "rail-citadel": buildRailCitadel,
});

function buildMainRole(recipe, blueprint) {
  const role = new THREE.Group();
  const selection = recipe.composition.main;
  role.userData.structureRole = "main";
  role.userData.modelId = selection.modelId;
  role.userData.variantId = selection.variantId;
  MAIN_MODEL_BUILDERS[selection.modelId](role, recipe.identityColor, selection.variantId);
  applyTransform(role, blueprint.mainTransform);
  return role;
}

function buildAttachmentRole(recipe, blueprint) {
  const selection = recipe.composition.attachment;
  if (!selection) return null;
  const role = new THREE.Group();
  role.userData.structureRole = "attachment";
  role.userData.factorId = selection.factorId;
  role.userData.modelId = selection.modelId;
  role.userData.variantId = selection.variantId;
  const color = recipe.identityColor;
  if (selection.modelId === "orbital-rail") {
    addMesh(role, new THREE.TorusGeometry(0.92, 0.105, 5, 20), color, "attachment|orbital-rail-a", {
      rotation: [Math.PI / 2.35, -0.18, 0.22],
      scale: [1, 0.78, 1],
      tone: "secondary",
    });
    if (selection.variantId === "crossing-loop") {
      addMesh(role, new THREE.TorusGeometry(0.98, 0.075, 5, 20), color, "attachment|orbital-rail-b", {
        rotation: [-Math.PI / 2.7, 0.36, -0.42],
        scale: [0.88, 1, 0.82],
        tone: "neutral",
      });
    }
  } else if (selection.modelId === "bridge-spine") {
    const raised = selection.variantId === "raised-span";
    addMesh(role, new THREE.BoxGeometry(1.72, 0.2, 0.34, 4, 1, 1), color, "attachment|bridge-span", {
      position: [0, raised ? 0.28 : -0.02, 0.02],
      rotation: [0, 0.06, raised ? 0.08 : -0.08],
      tone: "neutral",
    });
    [-0.62, 0.62].forEach((x, index) => {
      addMesh(role, separateWorldSurfaceMaterialGroups(
        new THREE.CylinderGeometry(0.1, 0.14, raised ? 0.62 : 0.42, 5),
      ), color, `attachment|bridge-pier-${index}`, {
        position: [x, raised ? -0.02 : -0.22, 0.02],
        tone: "secondary",
      });
    });
  } else if (selection.modelId === "containment-shell") {
    const high = selection.variantId === "high-shell";
    [-0.42, 0.42].forEach((yaw, index) => {
      addMesh(role, new THREE.TorusGeometry(0.88, 0.13, 5, 16, Math.PI * 1.08), color, `attachment|shell-${index}`, {
        position: [0, high ? 0.18 : 0, 0],
        rotation: [Math.PI / 2, yaw + (index ? Math.PI : 0), index ? -0.18 : 0.18],
        scale: [1, 0.86, 1],
        tone: "secondary",
      });
    });
  } else if (selection.modelId === "crown-arches") {
    const gate = selection.variantId === "gate-crown";
    const offsets = gate ? [-0.34, 0.34] : [-0.46, 0, 0.46];
    offsets.forEach((x, index) => {
      addMesh(role, new THREE.TorusGeometry(gate ? 0.56 : 0.48, 0.105, 5, 14, Math.PI), color, `attachment|crown-${index}`, {
        position: [x, gate ? 0.28 : 0.34, 0],
        rotation: [0, gate ? 0.14 * (index ? -1 : 1) : 0, 0],
        scale: [0.82, 1, 0.76],
        tone: index === 1 ? "neutral" : "secondary",
      });
    });
  } else {
    const forked = selection.variantId === "forked-roots";
    const roots = forked
      ? [[-0.42, -0.44, -0.08, -0.56], [0.42, -0.44, 0.08, 0.56], [0, -0.5, 0, 0]]
      : [[-0.48, -0.42, 0, -0.46], [0.48, -0.42, 0, 0.46], [0, -0.5, 0.12, Math.PI / 2]];
    roots.forEach(([x, y, z, tilt], index) => {
      addMesh(role, new THREE.BoxGeometry(0.94, 0.16, 0.22, 2, 1, 1), color, `attachment|root-${index}`, {
        position: [x, y, z],
        rotation: [0, index === 2 ? 0.3 : 0, tilt],
        tone: index === 2 ? "neutral" : "secondary",
      });
    });
  }
  applyTransform(role, blueprint.attachmentTransform);
  return role;
}

function addAnchorItem(role, selection, color, position, index) {
  const item = new THREE.Group();
  item.position.fromArray(position);
  item.userData.kind = "world-anchor-item";
  item.userData.anchorIndex = index;
  item.userData.modelId = selection.modelId;
  role.add(item);
  const baseRotation = [index * 0.22, -index * 0.3, index % 2 ? 0.18 : -0.18];
  if (selection.modelId === "crystal-beacons") {
    addMesh(item, new THREE.OctahedronGeometry(0.23, 0), color, `anchors|crystal-${index}`, {
      rotation: baseRotation,
      scale: [0.58, selection.variantId === "fractured-triad" ? 1.48 : 1.24, 0.72],
      tone: "secondary",
    });
  } else if (selection.modelId === "satellite-pair") {
    addMesh(item, new THREE.DodecahedronGeometry(index === 0 ? 0.2 : 0.16, 0), color, `anchors|satellite-${index}`, {
      rotation: baseRotation,
      tone: "secondary",
    });
  } else if (selection.modelId === "tower-sentinels") {
    addMesh(item, separateWorldSurfaceMaterialGroups(
      new THREE.CylinderGeometry(0.11, 0.16, 0.42, 5),
    ), color, `anchors|tower-${index}`, {
      rotation: [0, index * 0.3, index % 2 ? 0.08 : -0.08],
      tone: "secondary",
    });
    addMesh(item, separateWorldSurfaceMaterialGroups(
      new THREE.ConeGeometry(0.15, 0.24, 5),
    ), color, `anchors|tower-cap-${index}`, {
      position: [0, 0.3, 0],
      tone: "primary",
    });
  } else if (selection.modelId === "debris-gates") {
    addMesh(item, new THREE.TetrahedronGeometry(0.25, 0), color, `anchors|debris-${index}`, {
      rotation: baseRotation,
      scale: [0.72, 1.34, 0.66],
      tone: index % 2 ? "neutral" : "secondary",
    });
  } else {
    addMesh(item, new THREE.IcosahedronGeometry(index === 0 ? 0.22 : 0.15, 0), color, `anchors|light-${index}`, {
      scale: [1, 0.94, 0.88],
      tone: index === 0 ? "primary" : "secondary",
    });
  }
  return item;
}

function buildAnchorRole(recipe, blueprint) {
  const selection = recipe.composition.anchors;
  if (!selection) return null;
  const role = new THREE.Group();
  role.userData.structureRole = "anchors";
  role.userData.factorId = selection.factorId;
  role.userData.modelId = selection.modelId;
  role.userData.variantId = selection.variantId;
  role.userData.anchorItems = [];
  const slots = selection.variantId === "high-moon"
    ? [blueprint.anchorSlots[2]]
    : blueprint.anchorSlots.slice(0, Math.min(WORLD_STRUCTURE_ROLE_BUDGET.repeat, selection.repeat));
  slots.forEach((position, index) => {
    role.userData.anchorItems.push(
      addAnchorItem(role, selection, recipe.identityColor, position, index),
    );
  });
  return role;
}

function compileMotionNodes(recipe, attachment, anchors) {
  const anchorItems = anchors?.userData.anchorItems || [];
  const targets = {
    attachment: attachment ? [attachment] : [],
    anchors: anchors ? [anchors] : [],
    "anchor-items": anchorItems,
  };
  return recipe.motion.channels.flatMap((channel) => (
    targets[channel.target] || []
  ).map((node) => ({
    node,
    target: channel.target,
    mode: channel.mode,
    axis: new THREE.Vector3(...channel.axis).normalize(),
    cyclesPerPeriod: channel.cyclesPerPeriod,
    phaseOffset: channel.phaseOffset,
    baseQuaternion: node.quaternion.clone(),
  })));
}

function stableMotionRadius(group) {
  const content = group.userData.content;
  const period = Math.max(1, Number(group.userData.recipe?.motion?.periodSeconds || 1));
  let maximumRadius = 0;
  for (let step = 0; step < 48; step += 1) {
    updateWorldStructureGroup(group, period * step / 48, { frozen: false });
    group.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(content);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    maximumRadius = Math.max(maximumRadius, sphere.center.length() + sphere.radius);
  }
  updateWorldStructureGroup(group, 0, { frozen: true });
  return Math.max(0.7, maximumRadius + 0.08);
}

export function createWorldStructureGroup(profile, world = {}, options = {}) {
  const recipe = profile.recipe;
  const composition = recipe.composition;
  if (composition.catalogVersion !== WORLD_PORTRAIT_CATALOG_VERSION) {
    throw new Error("Unsupported world portrait catalog version.");
  }
  const blueprint = WORLD_HERO_COMPOSITION_BLUEPRINTS[composition.blueprintId];
  if (!blueprint) throw new Error("Unsupported world portrait blueprint.");

  const group = new THREE.Group();
  group.userData.kind = "appearance-world";
  group.userData.recipe = recipe;

  const content = new THREE.Group();
  content.userData.kind = "world-structure-content";
  content.rotation.fromArray(recipe.orientation);
  const heroAssembly = new THREE.Group();
  heroAssembly.userData.kind = "world-hero-assembly";
  heroAssembly.userData.blueprintId = composition.blueprintId;
  const main = buildMainRole(recipe, blueprint);
  const attachment = buildAttachmentRole(recipe, blueprint);
  const anchors = buildAnchorRole(recipe, blueprint);
  heroAssembly.add(main);
  if (attachment) heroAssembly.add(attachment);
  content.add(heroAssembly);
  if (anchors) content.add(anchors);
  group.add(content);

  const surfaceMaterial = createWorldStructureMaterialForTexture(recipe.materialTexture);
  content.traverse((object) => {
    if (object.isMesh && object.userData.appearanceLayer === "world-surface") {
      object.material = surfaceMaterial;
    }
  });

  const cardRenderBatches = [
    createCardRenderBatch(main, surfaceMaterial),
    createCardRenderBatch(attachment, surfaceMaterial),
    ...(anchors?.userData.anchorItems || []).map(
      (anchorItem) => createCardRenderBatch(anchorItem, surfaceMaterial),
    ),
  ].filter(Boolean);

  const auxiliaryRoles = [attachment, anchors].filter(Boolean);
  group.userData.content = content;
  group.userData.heroAssembly = heroAssembly;
  group.userData.mainRole = main;
  group.userData.attachmentRole = attachment;
  group.userData.anchorRole = anchors;
  group.userData.anchorItems = anchors?.userData.anchorItems || [];
  group.userData.auxiliaryRoles = auxiliaryRoles;
  group.userData.structureRoles = {
    main: "main",
    attachment: attachment ? "attachment" : null,
    anchors: anchors ? "anchors" : null,
  };
  group.userData.identityColor = recipe.identityColor;
  group.userData.materialTexture = recipe.materialTexture;
  group.userData.surfaceMaterial = surfaceMaterial;
  group.userData.cardRenderBatches = cardRenderBatches;
  group.userData.activeRenderPresentation = null;
  group.userData.motionRecipe = recipe.motion;
  group.userData.baseContentPosition = content.position.clone();
  group.userData.baseHeroScale = heroAssembly.scale.clone();
  group.userData.baseMainScale = main.scale.clone();
  group.userData.motionNodes = compileMotionNodes(recipe, attachment, anchors);
  updateWorldStructureGroup(group, 0, { frozen: true });
  group.userData.stablePortraitRadius = stableMotionRadius(group);
  return group;
}

const motionQuaternion = new THREE.Quaternion();

export function updateWorldStructureGroup(group, elapsed, options = {}) {
  const content = group.userData.content;
  const heroAssembly = group.userData.heroAssembly;
  const main = group.userData.mainRole;
  const recipe = group.userData.recipe;
  if (!content || !heroAssembly || !recipe) return;
  applyWorldStructurePresentation(group, options.presentation);
  const motion = recipe.motion;
  content.position.copy(group.userData.baseContentPosition);
  content.rotation.fromArray(recipe.orientation);
  heroAssembly.scale.copy(group.userData.baseHeroScale);
  if (main) main.scale.copy(group.userData.baseMainScale);
  const activeElapsed = options.frozen ? 0 : Math.max(0, Number(elapsed) || 0);
  const surfaceMaterial = group.userData.surfaceMaterial;
  const materialUniforms = worldSurfaceMaterialUniforms.get(surfaceMaterial);
  if (materialUniforms) {
    const presetId = surfaceMaterial.userData.materialTexturePresetId;
    const parameters = surfaceMaterial.userData.materialTextureParameters;
    const speed = (WORLD_SURFACE_MATERIAL_MOTION_POLICY.speedByPresetId[presetId] || 0)
      * parameters.motionSpeed;
    materialUniforms.phase.value = activeElapsed * speed + parameters.phaseOffset * Math.PI * 2;
  }
  const cyclePhase = motion.phase + activeElapsed / motion.periodSeconds * Math.PI * 2;
  for (const entry of group.userData.motionNodes || []) {
    const angle = cyclePhase * entry.cyclesPerPeriod + entry.phaseOffset;
    motionQuaternion.setFromAxisAngle(entry.axis, angle);
    entry.node.quaternion.copy(entry.baseQuaternion).multiply(motionQuaternion);
  }
}

export function disposeWorldStructureGroup(group) {
  group?.traverse?.((object) => object.geometry?.dispose?.());
  if (group?.userData?.surfaceMaterial?.userData?.worldOwnedMaterial) {
    group.userData.surfaceMaterial.dispose();
  }
}

export function sharedWorldStructureMaterial() {
  return sharedWorldSurfaceMaterial;
}
