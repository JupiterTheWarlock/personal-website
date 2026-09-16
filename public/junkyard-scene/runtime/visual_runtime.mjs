const SUPPORTED_VISUAL_RUNTIME_SCHEMAS = new Set([
  "junkyard.visual-runtime-config.v1",
  "junkyard.compiled-visual-runtime.v1",
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

async function loadVisualRuntime() {
  if (typeof window !== "undefined") {
    const response = await fetch(new URL("./visual-runtime.json", import.meta.url), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`视觉运行配置加载失败：${response.status}`);
    const payload = await response.json();
    return payload.visualRuntime || payload;
  }
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(
    await readFile(
      new URL("../config/presentation/visual_runtime.json", import.meta.url),
      "utf8",
    ),
  );
}

const loadedVisualRuntime = await loadVisualRuntime();
if (
  !loadedVisualRuntime
  || typeof loadedVisualRuntime !== "object"
  || !SUPPORTED_VISUAL_RUNTIME_SCHEMAS.has(loadedVisualRuntime.schemaVersion)
) {
  throw new Error("视觉运行配置版本不受支持。");
}

export const visualRuntime = deepFreeze(loadedVisualRuntime);
