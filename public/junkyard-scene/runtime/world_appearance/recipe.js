import {
  WORLD_ANCHOR_MODEL_CATALOG,
  WORLD_ANCHOR_VARIANT_REPEAT,
  WORLD_ATTACHMENT_MODEL_CATALOG,
  WORLD_HERO_COMPOSITION_BLUEPRINTS,
  WORLD_MAIN_MODEL_CATALOG,
  WORLD_MOTION_PRESET_CATALOG,
  WORLD_PORTRAIT_CATALOG_VERSION,
  catalogVariantOptions,
} from "./structure_portrait_catalog.js";
import { visualRuntime } from "../visual_runtime.mjs";

const appearanceConfig = visualRuntime.worldAppearance;

export {
  WORLD_ANCHOR_MODEL_CATALOG,
  WORLD_ANCHOR_VARIANT_REPEAT,
  WORLD_ATTACHMENT_MODEL_CATALOG,
  WORLD_HERO_COMPOSITION_BLUEPRINTS,
  WORLD_MAIN_MODEL_CATALOG,
  WORLD_MOTION_PRESET_CATALOG,
  WORLD_PORTRAIT_CATALOG_VERSION,
};

export const WORLD_HERO_COMPOSITION_OPTIONS = Object.freeze(
  Object.entries(WORLD_HERO_COMPOSITION_BLUEPRINTS).map(([id, value]) => Object.freeze([id, value.name])),
);

export const WORLD_MOTION_TYPES = Object.freeze(
  Object.entries(WORLD_MOTION_PRESET_CATALOG).map(([id, value]) => Object.freeze([id, value.name])),
);

export const WORLD_MATERIAL_TEXTURE_PARAMETER_POLICY = appearanceConfig.materialTextureParameterPolicy;

export const DEFAULT_WORLD_MATERIAL_TEXTURE_PARAMETERS = Object.freeze({
  patternScale: WORLD_MATERIAL_TEXTURE_PARAMETER_POLICY.patternScale.default,
  effectStrength: WORLD_MATERIAL_TEXTURE_PARAMETER_POLICY.effectStrength.default,
  motionSpeed: WORLD_MATERIAL_TEXTURE_PARAMETER_POLICY.motionSpeed.default,
  phaseOffset: WORLD_MATERIAL_TEXTURE_PARAMETER_POLICY.phaseOffset.default,
});

export const WORLD_MATERIAL_TEXTURE_OPTIONS = Object.freeze(
  appearanceConfig.materialTextureOptions.map((item) => Object.freeze([
    item.id,
    item.name,
    item.desc,
  ])),
);

const WORLD_MATERIAL_TEXTURE_DEFAULT_KEYS = Object.freeze(Object.fromEntries(
  appearanceConfig.materialTextureOptions.map((item) => [
    item.id,
    item.developerDefaultsKey,
  ]),
));

let configuredWorldMaterialTextureDefaults = {};

export const SKY_STYLES = Object.freeze(
  appearanceConfig.skyStyles.map((item) => Object.freeze([item.id, item.name])),
);

export const SKY_STYLE_PALETTES = Object.freeze(Object.fromEntries(
  appearanceConfig.skyStyles.map((item) => [item.id, item.palette]),
));

export const SKY_STAR_CONTROL_POLICY = appearanceConfig.skyStarControlPolicy;

export const DEFAULT_CARD_POST_FX = appearanceConfig.defaultCardPostFx;
export const GLOBAL_CARD_POST_FX_STORAGE_KEY = "junkyard.worldAppearance.cardPostFX.v2";

export const DEFAULT_HOME_POST_FX = appearanceConfig.defaultHomePostFx;

const DEFAULT_WORLD_PROFILE = appearanceConfig.defaultWorldProfile;

const DEFAULT_SKY_PROFILE = appearanceConfig.defaultSkyProfile;
const DEFAULT_WORLD_MATERIAL_TEXTURE_PRESET_ID = DEFAULT_WORLD_PROFILE.recipe.materialTexture.presetId;

export function cloneAppearance(value) {
  return JSON.parse(JSON.stringify(value));
}

export function resolveWorldProfile(appearanceState, worldId) {
  return cloneAppearance(
    appearanceState?.worlds?.[worldId]?.schemaVersion
      ? appearanceState.worlds[worldId]
      : DEFAULT_WORLD_PROFILE,
  );
}

export function resolveSkyProfile(appearanceState) {
  return cloneAppearance(
    appearanceState?.sky?.schemaVersion ? appearanceState.sky : DEFAULT_SKY_PROFILE,
  );
}

export function resolveCardSkyProfile(appearanceState) {
  return cloneAppearance(
    appearanceState?.cardSky?.schemaVersion
      ? appearanceState.cardSky
      : resolveSkyProfile(appearanceState),
  );
}

export function resolveHomePostFx(appearanceState) {
  return cloneAppearance(
    appearanceState?.homePostFX?.schemaVersion
      ? { ...DEFAULT_HOME_POST_FX, ...appearanceState.homePostFX }
      : DEFAULT_HOME_POST_FX,
  );
}

function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function normalizeWorldMaterialTextureParameters(value = {}, fallback = DEFAULT_WORLD_MATERIAL_TEXTURE_PARAMETERS) {
  return Object.fromEntries(Object.entries(DEFAULT_WORLD_MATERIAL_TEXTURE_PARAMETERS).map(
    ([field, baseFallback]) => {
      const settings = WORLD_MATERIAL_TEXTURE_PARAMETER_POLICY[field];
      return [field, clamp(value?.[field], settings.minimum, settings.maximum, fallback?.[field] ?? baseFallback)];
    },
  ));
}

export function configureWorldMaterialTextureDefaults(value = {}) {
  configuredWorldMaterialTextureDefaults = Object.fromEntries(
    WORLD_MATERIAL_TEXTURE_OPTIONS.map(([presetId]) => {
      const key = WORLD_MATERIAL_TEXTURE_DEFAULT_KEYS[presetId];
      return [presetId, normalizeWorldMaterialTextureParameters(value?.[key])];
    }),
  );
}

export function resolveWorldMaterialTextureDefaults(presetId = DEFAULT_WORLD_MATERIAL_TEXTURE_PRESET_ID) {
  return cloneAppearance(
    configuredWorldMaterialTextureDefaults[presetId]
      || DEFAULT_WORLD_MATERIAL_TEXTURE_PARAMETERS,
  );
}

export function resolveWorldMaterialTextureParameters(value = {}, presetId = DEFAULT_WORLD_MATERIAL_TEXTURE_PRESET_ID) {
  return normalizeWorldMaterialTextureParameters(
    value,
    resolveWorldMaterialTextureDefaults(presetId),
  );
}

export function readGlobalCardPostFx() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(GLOBAL_CARD_POST_FX_STORAGE_KEY) || "{}");
  } catch {
    stored = {};
  }
  return {
    ...DEFAULT_CARD_POST_FX,
    enabled: stored.enabled !== false,
    scanline: clamp(stored.scanline, 0, 1, DEFAULT_CARD_POST_FX.scanline),
    glow: clamp(stored.glow, 0, 1, DEFAULT_CARD_POST_FX.glow),
    phosphor: clamp(stored.phosphor, 0, 1, DEFAULT_CARD_POST_FX.phosphor),
    vignette: clamp(stored.vignette, 0, 1, DEFAULT_CARD_POST_FX.vignette),
    grain: clamp(stored.grain, 0, 1, DEFAULT_CARD_POST_FX.grain),
    pixelate: stored.pixelate === true,
    pixelSize: Math.round(clamp(stored.pixelSize, 1, 24, DEFAULT_CARD_POST_FX.pixelSize)),
    curvature: clamp(stored.curvature, 0, 1, DEFAULT_CARD_POST_FX.curvature),
    chromaticAberration: clamp(stored.chromaticAberration, 0, 1, DEFAULT_CARD_POST_FX.chromaticAberration),
    jitter: typeof stored.jitter === "boolean" ? stored.jitter : DEFAULT_CARD_POST_FX.jitter,
    jitterIntensity: clamp(stored.jitterIntensity, 0, 1, DEFAULT_CARD_POST_FX.jitterIntensity),
    glitch: typeof stored.glitch === "boolean" ? stored.glitch : DEFAULT_CARD_POST_FX.glitch,
    glitchIntensity: clamp(stored.glitchIntensity, 0, 1, DEFAULT_CARD_POST_FX.glitchIntensity),
  };
}

export function writeGlobalCardPostFx(settings) {
  const normalized = {
    ...readGlobalCardPostFx(),
    ...settings,
    schemaVersion: "junkyard-card-postfx.v1",
  };
  localStorage.setItem(GLOBAL_CARD_POST_FX_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function resolveCardPostFx(profile, globalSettings = null) {
  if (profile?.cardPostFXOverride) {
    return { ...DEFAULT_CARD_POST_FX, ...profile.cardPostFXOverride };
  }
  return globalSettings ? { ...DEFAULT_CARD_POST_FX, ...globalSettings } : readGlobalCardPostFx();
}

export function randomizeSeed(profile) {
  const draft = cloneAppearance(profile);
  draft.appearanceSource = "manual";
  draft.recipe.seed = Math.max(1, Math.floor(Math.random() * 2_147_483_645));
  if ("rotation" in draft.recipe) draft.recipe.rotation = Number((Math.random() * Math.PI * 2 - Math.PI).toFixed(4));
  return draft;
}

function channelHex(value) {
  return Math.max(0, Math.min(255, Math.round(value * 255))).toString(16).padStart(2, "0");
}

function rgbHex(channels) {
  return `#${channels.map(channelHex).join("")}`;
}

function randomBetween(minimum, maximum, random) {
  return minimum + (maximum - minimum) * random();
}

function cosinePalette(size, hueDiff, saturation, random) {
  const c = Array.from({ length: 3 }, () => randomBetween(0.5, 1.5, random) * hueDiff);
  const d = Array.from({ length: 3 }, () => random() * randomBetween(1, 3, random));
  return Array.from({ length: size }, (_, index) => {
    const position = index / size;
    return rgbHex(c.map((frequency, channel) => (
      0.5 + 0.5 * saturation * Math.cos(Math.PI * 2 * (frequency * position + d[channel]))
    )));
  });
}

function hslHex(hue, saturation, lightness) {
  const channel = (offset) => {
    const k = (offset + hue * 12) % 12;
    const amplitude = saturation * Math.min(lightness, 1 - lightness);
    return lightness - amplitude * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return rgbHex([channel(0), channel(8), channel(4)]);
}

export function randomizeWorldAppearance(profile, random = Math.random) {
  const draft = cloneAppearance(profile);
  draft.appearanceSource = "manual";
  draft.recipe.identityColor = hslHex(random(), randomBetween(0.28, 0.52, random), randomBetween(0.42, 0.62, random));
  draft.recipe.factors.identityColor = draft.recipe.identityColor;
  return draft;
}

export function randomizeSkyAppearance(profile, random = Math.random) {
  const draft = cloneAppearance(profile);
  draft.appearanceSource = "manual";
  draft.recipe.seed = Math.max(1, Math.floor(random() * 2_147_483_645));
  if (draft.recipe.style === "classic") {
    const hue = random();
    const accentHue = (hue + randomBetween(0.08, 0.22, random)) % 1;
    draft.recipe.palette = [
      hslHex(hue, 0.38, 0.018),
      hslHex(accentHue, 0.48, 0.12),
      hslHex((hue + 0.82) % 1, 0.5, 0.055),
      hslHex((hue + 0.58) % 1, 0.5, 0.9),
    ];
  } else {
    draft.recipe.palette = cosinePalette(4, randomBetween(0.65, 1, random), 0.72, random);
  }
  return draft;
}

function firstVariantId(catalog, modelId) {
  return catalogVariantOptions(catalog, modelId)[0]?.[0];
}

function replaceRoleModel(draft, role, modelId) {
  const catalog = role === "main"
    ? WORLD_MAIN_MODEL_CATALOG
    : role === "attachment"
      ? WORLD_ATTACHMENT_MODEL_CATALOG
      : WORLD_ANCHOR_MODEL_CATALOG;
  const current = draft.recipe.composition[role];
  if (!current) return draft;
  current.modelId = modelId;
  current.variantId = firstVariantId(catalog, modelId);
  if (role === "anchors") current.repeat = WORLD_ANCHOR_VARIANT_REPEAT[current.variantId];
  return draft;
}

export function applyWorldBlueprintDefaults(profile, blueprintId) {
  const draft = cloneAppearance(profile);
  const effectiveBlueprintId = WORLD_HERO_COMPOSITION_BLUEPRINTS[blueprintId]
    ? blueprintId
    : "embraced-core";
  const blueprint = WORLD_HERO_COMPOSITION_BLUEPRINTS[effectiveBlueprintId];
  const composition = draft.recipe.composition;
  draft.appearanceSource = "manual";
  composition.blueprintId = effectiveBlueprintId;
  if (!blueprint.mainModels.includes(composition.main.modelId)) {
    replaceRoleModel(draft, "main", blueprint.mainModels[0]);
  }
  if (composition.attachment && !blueprint.attachmentModels.includes(composition.attachment.modelId)) {
    replaceRoleModel(draft, "attachment", blueprint.attachmentModels[0]);
  }
  if (composition.anchors && !blueprint.anchorModels.includes(composition.anchors.modelId)) {
    replaceRoleModel(draft, "anchors", blueprint.anchorModels[0]);
  }
  draft.recipe.orientation = cloneAppearance(blueprint.orientation);
  return draft;
}

export function applyWorldRoleModelDefaults(profile, role, modelId) {
  const draft = cloneAppearance(profile);
  const blueprint = WORLD_HERO_COMPOSITION_BLUEPRINTS[draft.recipe.composition.blueprintId];
  const allowed = role === "main"
    ? blueprint.mainModels
    : role === "attachment"
      ? blueprint.attachmentModels
      : blueprint.anchorModels;
  const fallback = allowed[0];
  draft.appearanceSource = "manual";
  return replaceRoleModel(draft, role, allowed.includes(modelId) ? modelId : fallback);
}

export function applyWorldRoleVariant(profile, role, variantId) {
  const draft = cloneAppearance(profile);
  const selection = draft.recipe.composition[role];
  if (!selection) return draft;
  const catalog = role === "main"
    ? WORLD_MAIN_MODEL_CATALOG
    : role === "attachment"
      ? WORLD_ATTACHMENT_MODEL_CATALOG
      : WORLD_ANCHOR_MODEL_CATALOG;
  const allowedVariantIds = catalogVariantOptions(catalog, selection.modelId).map(([id]) => id);
  selection.variantId = allowedVariantIds.includes(variantId) ? variantId : allowedVariantIds[0];
  if (role === "anchors") selection.repeat = WORLD_ANCHOR_VARIANT_REPEAT[selection.variantId];
  draft.appearanceSource = "manual";
  return draft;
}

export function applyMotionPresetDefaults(profile, presetId) {
  const draft = cloneAppearance(profile);
  const effectivePresetId = WORLD_MOTION_PRESET_CATALOG[presetId] ? presetId : "co-rotation";
  const preset = WORLD_MOTION_PRESET_CATALOG[effectivePresetId];
  draft.appearanceSource = "manual";
  draft.recipe.motion = {
    schemaVersion: "junkyard-world-self-motion.v1",
    presetId: effectivePresetId,
    periodSeconds: preset.periodSeconds,
    phase: draft.recipe.motion.phase,
    channels: cloneAppearance(preset.channels),
  };
  draft.recipe.composition.motionPresetId = effectivePresetId;
  return draft;
}

export function applyWorldMaterialTextureDefaults(profile, presetId) {
  const draft = cloneAppearance(profile);
  const effectivePresetId = WORLD_MATERIAL_TEXTURE_OPTIONS.some(([id]) => id === presetId)
    ? presetId
    : DEFAULT_WORLD_MATERIAL_TEXTURE_PRESET_ID;
  draft.appearanceSource = "manual";
  draft.recipe.materialTexture = {
    schemaVersion: "junkyard-world-material-texture.v2",
    presetId: effectivePresetId,
    parameters: resolveWorldMaterialTextureDefaults(effectivePresetId),
  };
  return draft;
}

export function applySkyStyleDefaults(profile, style) {
  const draft = cloneAppearance(profile);
  draft.appearanceSource = "manual";
  draft.recipe.style = style;
  draft.recipe.palette = cloneAppearance(SKY_STYLE_PALETTES[style] || SKY_STYLE_PALETTES.classic);
  draft.recipe.sourceRenderMode = "smooth";
  return draft;
}

export function worldStateOverlay(world = {}, enabled = true) {
  if (!enabled) {
    return {
      pollution: 0,
      apocalypse: 0,
      tierProgress: 0,
      anchorStability: 1,
    };
  }
  const source = world.state || world.visual || {};
  const anchor = String(source.anchorStatus || "anchored");
  return {
    pollution: Math.max(0, Math.min(1, Number(source.pollution || 0) / 100)),
    apocalypse: Math.max(0, Math.min(1, Number(source.apocalypseProgress || 0) / 100)),
    tierProgress: Math.max(0, Math.min(1, (
      Number(source.tier || 0) + Number(source.tierProgress || 0) / 100
    ) / 10)),
    anchorStability: ["broken", "collapsed", "lost"].includes(anchor) ? 0 : anchor === "provisional" ? 0.55 : 1,
  };
}

export function newCardPostFxOverride(profile) {
  return {
    ...DEFAULT_CARD_POST_FX,
    ...(profile?.cardPostFXOverride || {}),
    enabled: true,
  };
}
