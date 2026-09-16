const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function clampOverlayLabelAnchor(
  x,
  y,
  labelWidth,
  labelHeight,
  containerWidth,
  containerHeight,
  inset = 6,
) {
  const width = Math.max(1, finite(containerWidth, 1));
  const height = Math.max(1, finite(containerHeight, 1));
  const padding = Math.max(0, finite(inset));
  const halfLabelWidth = Math.max(0, finite(labelWidth)) / 2;
  const fullLabelHeight = Math.max(0, finite(labelHeight));
  const minimumX = padding + halfLabelWidth;
  const maximumX = width - padding - halfLabelWidth;
  const minimumY = padding + fullLabelHeight;
  const maximumY = height - padding;
  return {
    x: minimumX <= maximumX
      ? Math.min(maximumX, Math.max(minimumX, finite(x, width / 2)))
      : width / 2,
    y: minimumY <= maximumY
      ? Math.min(maximumY, Math.max(minimumY, finite(y, height / 2)))
      : height / 2,
  };
}

export function overlayLabelRect(anchor, labelWidth, labelHeight) {
  const width = Math.max(0, finite(labelWidth));
  const height = Math.max(0, finite(labelHeight));
  return {
    left: anchor.x - width / 2,
    right: anchor.x + width / 2,
    top: anchor.y - height,
    bottom: anchor.y,
  };
}

export function overlayLabelRectsOverlap(first, second, gap = 4) {
  const spacing = Math.max(0, finite(gap));
  return !(
    first.right + spacing <= second.left
    || second.right + spacing <= first.left
    || first.bottom + spacing <= second.top
    || second.bottom + spacing <= first.top
  );
}

export function layoutOverlayLabelAnchors(
  candidates,
  containerWidth,
  containerHeight,
  inset = 6,
  gap = 4,
) {
  const placed = [];
  return candidates.map((candidate) => {
    const labelWidth = Math.max(0, finite(candidate.labelWidth));
    const labelHeight = Math.max(0, finite(candidate.labelHeight));
    const base = clampOverlayLabelAnchor(
      candidate.x,
      candidate.y,
      labelWidth,
      labelHeight,
      containerWidth,
      containerHeight,
      inset,
    );
    const step = Math.max(1, labelHeight + Math.max(0, finite(gap)));
    const attempts = [base];
    const maximumSteps = Math.ceil(Math.max(1, finite(containerHeight, 1)) / step) + 1;
    for (let index = 1; index <= maximumSteps; index += 1) {
      attempts.push({ x: base.x, y: base.y + step * index });
      attempts.push({ x: base.x, y: base.y - step * index });
    }
    let anchor = base;
    for (const attempt of attempts) {
      const clamped = clampOverlayLabelAnchor(
        attempt.x,
        attempt.y,
        labelWidth,
        labelHeight,
        containerWidth,
        containerHeight,
        inset,
      );
      const rect = overlayLabelRect(clamped, labelWidth, labelHeight);
      if (!placed.some((existing) => overlayLabelRectsOverlap(existing, rect, gap))) {
        anchor = clamped;
        break;
      }
    }
    placed.push(overlayLabelRect(anchor, labelWidth, labelHeight));
    return { ...candidate, ...anchor };
  });
}
