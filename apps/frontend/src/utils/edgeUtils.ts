interface Point {
  x: number;
  y: number;
}

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface LabelDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface SplitPathResult {
  path1: string;
  path2: string;
}

const LABEL_PADDING = 6;
const LABEL_FONT_SIZE = 10;
const MIN_LABEL_WIDTH = 40;
const PATH_SAMPLE_STEP = 2;
const LABEL_EXPAND_MARGIN = 4;

const CHAR_WIDTH_NARROW = LABEL_FONT_SIZE * 0.6;
const CHAR_WIDTH_WIDE = LABEL_FONT_SIZE * 1.0;

function isWideChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0x2f800 && code <= 0x2fa1f) ||
    (code >= 0x3000 && code <= 0x303f) ||
    (code >= 0xff00 && code <= 0xffef)
  );
}

function measureTextWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += isWideChar(char) ? CHAR_WIDTH_WIDE : CHAR_WIDTH_NARROW;
  }
  return width;
}

export function calculateLabelDimensions(
  label: string,
  centerX: number,
  centerY: number
): LabelDimensions {
  const labelText = String(label || '');
  const textWidth = measureTextWidth(labelText);
  const width = Math.max(textWidth + LABEL_PADDING * 2, MIN_LABEL_WIDTH);
  const height = LABEL_FONT_SIZE + LABEL_PADDING * 2;

  return {
    width,
    height,
    x: centerX - width / 2,
    y: centerY - height / 2,
  };
}

function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
  );
}

function findPathIntersection(
  path: SVGPathElement,
  rect: Rect
): { start: number; end: number } | null {
  const totalLength = path.getTotalLength();
  let breakStart = -1;
  let breakEnd = -1;

  for (let i = 0; i <= totalLength; i += PATH_SAMPLE_STEP) {
    const point = path.getPointAtLength(i);

    if (isPointInRect(point, rect)) {
      if (breakStart === -1) {
        breakStart = i;
      }
      breakEnd = i;
    }
  }

  if (breakStart === -1 || breakEnd === -1) {
    return null;
  }

  return { start: breakStart, end: breakEnd };
}

function buildPathSegment(path: SVGPathElement, startLength: number, endLength: number): string {
  const startPoint = path.getPointAtLength(startLength);
  const endPoint = path.getPointAtLength(endLength);
  const segments: string[] = [`M ${startPoint.x} ${startPoint.y}`];

  for (let i = startLength + PATH_SAMPLE_STEP; i < endLength; i += PATH_SAMPLE_STEP) {
    const point = path.getPointAtLength(i);
    segments.push(`L ${point.x} ${point.y}`);
  }

  segments.push(`L ${endPoint.x} ${endPoint.y}`);
  return segments.join(' ');
}

export function splitPathAroundLabel(
  pathData: string,
  labelDimensions: LabelDimensions
): SplitPathResult {
  try {
    const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tempPath.setAttribute('d', pathData);
    const totalLength = tempPath.getTotalLength();

    // 扩大 label 区域以确保连接线不会穿过 label
    const labelRect: Rect = {
      left: labelDimensions.x - LABEL_EXPAND_MARGIN,
      right: labelDimensions.x + labelDimensions.width + LABEL_EXPAND_MARGIN,
      top: labelDimensions.y - LABEL_EXPAND_MARGIN,
      bottom: labelDimensions.y + labelDimensions.height + LABEL_EXPAND_MARGIN,
    };

    const intersection = findPathIntersection(tempPath, labelRect);

    if (!intersection) {
      // 如果没有找到交点，可能是因为路径太短或 label 在路径外
      // 尝试使用路径中点附近的区域
      const midLength = totalLength / 2;
      const midPoint = tempPath.getPointAtLength(midLength);

      // 检查中点是否在 label 区域附近
      const labelCenterX = labelDimensions.x + labelDimensions.width / 2;
      const labelCenterY = labelDimensions.y + labelDimensions.height / 2;
      const distToLabel = Math.sqrt(
        Math.pow(midPoint.x - labelCenterX, 2) + Math.pow(midPoint.y - labelCenterY, 2)
      );

      // 如果中点距离 label 中心足够近，使用中点进行分割
      if (distToLabel < 50) {
        const breakStart = Math.max(0, midLength - labelDimensions.width / 2 - LABEL_EXPAND_MARGIN);
        const breakEnd = Math.min(
          totalLength,
          midLength + labelDimensions.width / 2 + LABEL_EXPAND_MARGIN
        );

        const path1 = buildPathSegment(tempPath, 0, breakStart);
        const path2 = buildPathSegment(tempPath, breakEnd, totalLength);
        return { path1, path2 };
      }

      return { path1: pathData, path2: '' };
    }

    const path1 = buildPathSegment(tempPath, 0, intersection.start);
    const path2 = buildPathSegment(tempPath, intersection.end, totalLength);

    return { path1, path2 };
  } catch (error) {
    console.error('Failed to split path:', error);
    return { path1: pathData, path2: '' };
  }
}

export const EDGE_CONSTANTS = {
  LABEL_PADDING,
  LABEL_FONT_SIZE,
  MIN_LABEL_WIDTH,
  PATH_SAMPLE_STEP,
} as const;
