export const CANVAS_DATA_PROBE_POLICY = Object.freeze({
  viewportPadding: 10,
  cursorGapX: 14,
  cursorGapY: 14,
  minimumTop: 10,
});

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(value, Math.max(minimum, maximum)));
}

export function calculateCanvasDataProbePosition(containerRect = {}, probeRect = {}, point = {}, policy = {}) {
  const resolved = { ...CANVAS_DATA_PROBE_POLICY, ...policy };
  const localX = Number(point.clientX || 0) - Number(containerRect.left || 0) + resolved.cursorGapX;
  const localY = Number(point.clientY || 0) - Number(containerRect.top || 0) + resolved.cursorGapY;
  return {
    left: clamp(localX, resolved.viewportPadding, Number(containerRect.width || 0) - Number(probeRect.width || 0) - resolved.viewportPadding),
    top: clamp(localY, resolved.minimumTop, Number(containerRect.height || 0) - Number(probeRect.height || 0) - resolved.viewportPadding),
  };
}

export function createCanvasDataProbe(documentObject, container, { className = "", policy = {} } = {}) {
  if (!documentObject?.createElement || !container?.append) throw new TypeError("CanvasDataProbe 需要真实 DOM。");
  const element = documentObject.createElement("div");
  element.className = `canvas-data-probe ${className}`.trim();
  element.setAttribute("role", "status");
  element.hidden = true;
  container.append(element);

  function position(clientX, clientY) {
    if (element.hidden) return;
    const next = calculateCanvasDataProbePosition(
      container.getBoundingClientRect(),
      element.getBoundingClientRect(),
      { clientX, clientY },
      policy,
    );
    element.style.left = `${next.left}px`;
    element.style.top = `${next.top}px`;
  }

  return Object.freeze({
    element,
    show(rows = [], clientX = 0, clientY = 0) {
      element.replaceChildren();
      rows.forEach(([tag, text]) => {
        if (text == null || text === "") return;
        const child = documentObject.createElement(["small", "b", "p", "span"].includes(tag) ? tag : "span");
        child.textContent = String(text);
        element.append(child);
      });
      element.hidden = false;
      position(clientX, clientY);
    },
    hide() {
      element.hidden = true;
    },
    position,
    dispose() {
      element.remove();
    },
  });
}
