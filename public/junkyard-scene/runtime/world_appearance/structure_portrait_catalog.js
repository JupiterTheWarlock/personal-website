import { visualRuntime } from "../visual_runtime.mjs";

const portrait = visualRuntime.worldPortrait;

function modelCatalog(source) {
  return Object.freeze(Object.fromEntries(Object.entries(source).map(([id, item]) => [
    id,
    Object.freeze({
      name: item.name,
      variants: Object.freeze(item.variants.map((variantId) => Object.freeze([
        variantId,
        item.variantLabels[variantId],
      ]))),
    }),
  ])));
}

export const WORLD_PORTRAIT_CATALOG_VERSION = portrait.catalogVersion;
export const WORLD_MOTION_PRESET_CATALOG = portrait.motionPresets;
export const WORLD_HERO_COMPOSITION_BLUEPRINTS = Object.freeze(
  Object.fromEntries(Object.entries(portrait.heroCompositionBlueprints).map(([id, item]) => [
    id,
    Object.freeze({
      name: item.name,
      desc: item.displayDesc,
      orientation: item.orientation,
      mainTransform: item.mainTransform,
      attachmentTransform: item.attachmentTransform,
      anchorSlots: item.anchorSlots,
      mainModels: item.mainModels,
      attachmentModels: item.attachmentModels,
      anchorModels: item.anchorModels,
    }),
  ])),
);
export const WORLD_MAIN_MODEL_CATALOG = modelCatalog(portrait.mainModels);
export const WORLD_ATTACHMENT_MODEL_CATALOG = modelCatalog(portrait.attachmentModels);
export const WORLD_ANCHOR_MODEL_CATALOG = modelCatalog(portrait.anchorModels);
export const WORLD_ANCHOR_VARIANT_REPEAT = portrait.anchorVariantRepeat;

export function catalogVariantOptions(catalog, modelId) {
  return catalog[modelId]?.variants || [];
}
