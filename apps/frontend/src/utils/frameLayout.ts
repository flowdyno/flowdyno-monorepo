import type { Node, FrameNode } from '../types/canvas';

const LABEL_HEIGHT = 30;

interface FrameSize {
  width: number;
  height: number;
}

interface FrameLayoutResult {
  width: number;
  height: number;
  childPositions: Map<string, { x: number; y: number }>;
}

export function calculateFrameSize(
  frame: FrameNode,
  childNodes: Node[],
  overrides?: { padding?: number; gap?: number; layout?: string }
): FrameSize {
  const hasVisibleLabel = frame.showLabel !== false && frame.label;
  const labelOffset = hasVisibleLabel ? LABEL_HEIGHT : 0;

  if (childNodes.length === 0) {
    return { width: frame.width || 300, height: (frame.height || 200) + labelOffset };
  }

  const padding = overrides?.padding ?? frame.padding ?? 24;
  const gap = overrides?.gap ?? frame.gap ?? 12;
  const layout = overrides?.layout ?? frame.layout ?? 'flex-row';

  let newWidth = 0;
  let bodyHeight = 0;

  if (layout === 'flex-row') {
    const totalWidth = childNodes.reduce((sum, n) => sum + (n.width || 85), 0);
    const totalGap = gap * (childNodes.length - 1);
    newWidth = totalWidth + totalGap + padding * 2;

    const maxHeight = Math.max(...childNodes.map((n) => n.height || 100));
    bodyHeight = maxHeight + padding * 2;
  } else if (layout === 'flex-col') {
    const totalHeight = childNodes.reduce((sum, n) => sum + (n.height || 100), 0);
    const totalGap = gap * (childNodes.length - 1);
    bodyHeight = totalHeight + totalGap + padding * 2;

    const maxWidth = Math.max(...childNodes.map((n) => n.width || 85));
    newWidth = maxWidth + padding * 2;
  } else if (layout === 'grid') {
    const gridCols = frame.gridCols || 2;
    const gridRows = Math.ceil(childNodes.length / gridCols);
    const maxChildWidth = Math.max(...childNodes.map((n) => n.width || 85));
    const maxChildHeight = Math.max(...childNodes.map((n) => n.height || 100));

    newWidth = maxChildWidth * gridCols + gap * (gridCols - 1) + padding * 2;
    bodyHeight = maxChildHeight * gridRows + gap * (gridRows - 1) + padding * 2;
  } else {
    let minLeft = Infinity;
    let maxRight = 0;
    let maxBottom = 0;

    childNodes.forEach((child) => {
      const childWidth = child.width || 85;
      const childHeight = child.height || 100;
      const right = child.position.x + childWidth;
      const bottom = child.position.y + childHeight;

      minLeft = Math.min(minLeft, child.position.x);
      maxRight = Math.max(maxRight, right);
      maxBottom = Math.max(maxBottom, bottom);
    });

    const minTotalHeight = maxBottom + padding;
    const contentWidth = maxRight - minLeft;
    const minWidth = contentWidth + padding * 2;

    return {
      width: Math.max(frame.width || 300, minWidth),
      height: Math.max((frame.height || 200) + labelOffset, minTotalHeight),
    };
  }

  return { width: newWidth, height: bodyHeight + labelOffset };
}

export function calculateFrameLayout(frame: FrameNode, childNodes: Node[]): FrameLayoutResult {
  const hasVisibleLabel = frame.showLabel !== false && frame.label;
  const labelOffset = hasVisibleLabel ? LABEL_HEIGHT : 0;

  const padding = frame.padding ?? 24;
  const gap = frame.gap ?? 12;
  const layout = frame.layout || 'flex-row';

  const childPositions = new Map<string, { x: number; y: number }>();

  if (childNodes.length === 0) {
    return { width: 300, height: 200 + labelOffset, childPositions };
  }

  let frameWidth = 0;
  let frameBodyHeight = 0;

  if (layout === 'flex-row') {
    let currentX = padding;
    let maxHeight = 0;

    childNodes.forEach((child, index) => {
      const childWidth = child.width || 85;
      const childHeight = child.height || 100;
      childPositions.set(child.id, { x: currentX, y: padding + labelOffset });
      currentX += childWidth + (index < childNodes.length - 1 ? gap : 0);
      maxHeight = Math.max(maxHeight, childHeight);
    });

    frameWidth = currentX + padding;
    frameBodyHeight = maxHeight + padding * 2;
  } else if (layout === 'flex-col') {
    let currentY = padding + labelOffset;
    let maxWidth = 0;

    childNodes.forEach((child, index) => {
      const childWidth = child.width || 85;
      const childHeight = child.height || 100;
      childPositions.set(child.id, { x: padding, y: currentY });
      currentY += childHeight + (index < childNodes.length - 1 ? gap : 0);
      maxWidth = Math.max(maxWidth, childWidth);
    });

    frameWidth = maxWidth + padding * 2;
    frameBodyHeight = currentY + padding - labelOffset;
  } else if (layout === 'grid') {
    const gridCols = frame.gridCols || 2;
    let currentX = padding;
    let currentY = padding + labelOffset;
    let rowMaxHeight = 0;
    let maxRowWidth = 0;

    childNodes.forEach((child, index) => {
      const childWidth = child.width || 85;
      const childHeight = child.height || 100;
      const col = index % gridCols;

      if (col === 0 && index > 0) {
        currentX = padding;
        currentY += rowMaxHeight + gap;
        rowMaxHeight = 0;
      }

      childPositions.set(child.id, { x: currentX, y: currentY });
      currentX += childWidth + gap;
      rowMaxHeight = Math.max(rowMaxHeight, childHeight);
      maxRowWidth = Math.max(maxRowWidth, currentX - padding);
    });

    frameWidth = maxRowWidth + padding;
    frameBodyHeight = currentY + rowMaxHeight + padding - labelOffset;
  }

  return {
    width: frameWidth,
    height: frameBodyHeight + labelOffset,
    childPositions,
  };
}
