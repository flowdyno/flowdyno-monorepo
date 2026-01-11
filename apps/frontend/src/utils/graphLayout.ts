import type { Node, Connection, ConnectionPoint, FrameNode } from '../types/canvas';

// 当前已有的布局规则如下：
// 1. 节点最小距离规则
// 节点之间保持最小距离：
// - 水平方向 dx >= NODE_W + 20 (140px)
// - 垂直方向 dy >= NODE_H + 20 (100px)
// 2. 连接方向规则 (checkDirectionRule)
// - fromAnchor='right'  → 目标节点必须在源节点右边 (toPos.x > fromPos.x)
// - fromAnchor='left'   → 目标节点必须在源节点左边 (toPos.x < fromPos.x)
// - fromAnchor='bottom' → 目标节点必须在源节点下方 (toPos.y > fromPos.y)
// - fromAnchor='top'    → 目标节点必须在源节点上方 (toPos.y < fromPos.y)
// 3. 连线不穿过节点规则 (nodeIntersectsSegment)
// 新节点不能被已有连线穿过，新连线也不能穿过已有节点
// 4. 连线不交叉规则 (segmentsIntersect)
// 新节点产生的连线不能与已有连线相交
// 5. 节点不能落在 Frame 内部规则 (isInsideAnyFrame)
// 普通节点不能落在任何 Frame 的矩形区域内
// 6. Frame 内部节点与外部节点对齐

// ============ 可调参数 ============
const NODE_W = 120; // 节点宽度
const NODE_H = 80; // 节点高度
const GAP = 250; // 节点之间的基础间距
const SIBLING_GAP = 160; // 同级节点之间的间距（水平）
const STAGGER_OFFSET = 40; // 错位偏移量
const CENTER_X = 600; // 画布中心 X
const CENTER_Y = 400; // 画布中心 Y
const DEFAULT_CHILD_WIDTH = 85; // 子节点默认宽度
const DEFAULT_CHILD_HEIGHT = 100; // 子节点默认高度
const LABEL_HEIGHT = 30; // Frame label 高度
// =================================

interface Pos {
  x: number;
  y: number;
}
interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface Edge {
  from: string;
  to: string;
  fromAnchor: ConnectionPoint;
  toAnchor: ConnectionPoint;
}

export function smartGraphLayout(
  nodes: Node[],
  connections: Connection[],
  _diagramType?: 'architecture' | 'flowchart' | 'roadmap'
): Node[] {
  if (nodes.length === 0) return nodes;

  // 1. 先处理 Frame 子节点的位置和 Frame 尺寸
  const { processedNodes, childNodeIds } = processFrameChildren(nodes);

  // 2. 筛选出顶层节点（非子节点）用于布局
  const topLevelNodes = processedNodes.filter((n) => !childNodeIds.has(n.id));

  if (topLevelNodes.length === 0) return processedNodes;
  if (topLevelNodes.length === 1 && childNodeIds.size === 0) {
    return [{ ...processedNodes[0], position: { x: CENTER_X, y: CENTER_Y } }];
  }

  // 3. 收集 childId -> frameId 的映射
  const childToFrame = new Map<string, string>();
  processedNodes.forEach((node) => {
    if (node.type === 'frame') {
      const frame = node as FrameNode;
      (frame.children || []).forEach((childId) => {
        childToFrame.set(childId, frame.id);
      });
    }
  });

  // 4. 对顶层节点进行图布局，将子节点的连接转换为与 Frame 的连接
  const edges: Edge[] = connections
    .filter((c) => c.from !== c.to)
    .map((c) => {
      const fromFrame = childToFrame.get(c.from);
      const toFrame = childToFrame.get(c.to);
      const actualFrom = fromFrame || c.from;
      const actualTo = toFrame || c.to;
      if (actualFrom === actualTo) return null;
      if (
        !topLevelNodes.some((n) => n.id === actualFrom) ||
        !topLevelNodes.some((n) => n.id === actualTo)
      ) {
        return null;
      }
      return {
        from: actualFrom,
        to: actualTo,
        fromAnchor: c.fromAnchor || 'bottom',
        toAnchor: c.toAnchor || 'top',
      };
    })
    .filter((e): e is Edge => e !== null);

  const nodeEdges = new Map<string, Edge[]>();
  topLevelNodes.forEach((n) => nodeEdges.set(n.id, []));
  edges.forEach((e) => {
    nodeEdges.get(e.from)?.push(e);
    nodeEdges.get(e.to)?.push(e);
  });

  const degrees = topLevelNodes.map((n) => ({ id: n.id, deg: nodeEdges.get(n.id)!.length }));
  degrees.sort((a, b) => b.deg - a.deg);
  const maxDeg = degrees[0]?.deg || 0;
  const coreNodes = degrees.filter((d) => d.deg === maxDeg).map((d) => d.id);

  const positions = new Map<string, Pos>();
  const placed = new Set<string>();

  // 5. 收集 Frame 边界信息（用于检测非 Frame 节点是否落在 Frame 区域内）
  const frameBounds: { id: string; width: number; height: number }[] = [];
  topLevelNodes.forEach((n) => {
    if (n.type === 'frame') {
      const fw = n.width || 200;
      const fh = n.height || 150;
      console.log('[frameBounds] Frame', n.id, {
        width: fw,
        height: fh,
        originalWidth: n.width,
        originalHeight: n.height,
      });
      frameBounds.push({
        id: n.id,
        width: fw,
        height: fh,
      });
    }
  });

  const nodeMap = new Map(topLevelNodes.map((n) => [n.id, n]));

  placeCoreGroup(coreNodes, edges, positions, placed, frameBounds, nodeMap);

  const success = placeRemaining(
    topLevelNodes,
    edges,
    nodeEdges,
    positions,
    placed,
    0,
    frameBounds,
    nodeMap
  );

  if (!success) {
    console.log('[Layout] 回溯失败，使用简单布局');
    simpleLayout(topLevelNodes, edges, positions, frameBounds);
  }

  centerGraph(positions);

  // 6. 调整外部节点位置，使其与 Frame 内连接的子节点对齐
  alignExternalNodesToFrameChildren(
    processedNodes,
    connections,
    positions,
    childToFrame,
    edges,
    frameBounds
  );

  // 7. 只更新顶层节点的位置，子节点位置已经在 processFrameChildren 中计算好了
  return processedNodes.map((node) => {
    if (childNodeIds.has(node.id)) {
      return node; // 子节点保持已计算的位置
    }
    return {
      ...node,
      position: positions.get(node.id) || node.position || { x: CENTER_X, y: CENTER_Y },
    };
  });
}

/**
 * 处理 Frame 的子节点位置和 Frame 尺寸
 */
function processFrameChildren(nodes: Node[]): {
  processedNodes: Node[];
  childNodeIds: Set<string>;
} {
  const childNodeIds = new Set<string>();
  const nodeMap = new Map<string, Node>();

  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    if (node.type === 'frame') {
      const frame = node as FrameNode;
      (frame.children || []).forEach((childId) => childNodeIds.add(childId));
    }
  });

  const processedNodes = nodes.map((node) => {
    if (node.type !== 'frame') return node;

    const frame = node as FrameNode;
    const children = frame.children || [];
    if (children.length === 0) return frame;

    const padding = frame.padding ?? 24;
    const gap = frame.gap ?? 12;
    const layout = frame.layout || 'flex-row';
    const hasVisibleLabel = frame.showLabel !== false && frame.label;
    const labelOffset = hasVisibleLabel ? LABEL_HEIGHT : 0;

    // 获取子节点
    const childNodes = children.map((id) => nodeMap.get(id)).filter((n): n is Node => !!n);
    if (childNodes.length === 0) return frame;

    // 计算子节点位置和 Frame 尺寸
    let frameWidth = 0;
    let frameBodyHeight = 0; // Frame 主体高度（不含 label）
    const childPositions = new Map<string, { x: number; y: number }>();

    if (layout === 'flex-row') {
      let currentX = padding;
      let maxHeight = 0;

      childNodes.forEach((child, index) => {
        const childWidth = child.width || DEFAULT_CHILD_WIDTH;
        const childHeight = child.height || DEFAULT_CHILD_HEIGHT;

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
        const childWidth = child.width || DEFAULT_CHILD_WIDTH;
        const childHeight = child.height || DEFAULT_CHILD_HEIGHT;

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
        const childWidth = child.width || DEFAULT_CHILD_WIDTH;
        const childHeight = child.height || DEFAULT_CHILD_HEIGHT;
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

    // Frame 总高度 = 主体高度 + label 高度
    const frameHeight = frameBodyHeight + labelOffset;

    return {
      ...frame,
      width: Math.max(frame.width || 0, frameWidth),
      height: Math.max(frame.height || 0, frameHeight),
      _childPositions: childPositions, // 临时存储子节点位置
    } as Node;
  });

  // 更新子节点位置
  const finalNodes = processedNodes.map((node) => {
    if (!childNodeIds.has(node.id)) return node;

    // 找到父 Frame
    const parentFrame = processedNodes.find(
      (n) => n.type === 'frame' && (n as any).children?.includes(node.id)
    ) as (FrameNode & { _childPositions?: Map<string, { x: number; y: number }> }) | undefined;

    if (parentFrame && parentFrame._childPositions) {
      const childPos = parentFrame._childPositions.get(node.id);
      if (childPos) {
        return { ...node, position: childPos };
      }
    }

    return node;
  });

  // 清理临时属性
  return {
    processedNodes: finalNodes.map((node) => {
      if ((node as any)._childPositions) {
        const { _childPositions, ...rest } = node as any;
        return rest as Node;
      }
      return node;
    }),
    childNodeIds,
  };
}

function placeCoreGroup(
  coreNodes: string[],
  edges: Edge[],
  positions: Map<string, Pos>,
  placed: Set<string>,
  frameBounds?: { id: string; width: number; height: number }[],
  nodeMap?: Map<string, Node>
) {
  console.log('[placeCoreGroup]', { coreNodes, frameBoundsCount: frameBounds?.length });

  if (coreNodes.length === 1) {
    positions.set(coreNodes[0], { x: CENTER_X, y: CENTER_Y });
    placed.add(coreNodes[0]);
    return;
  }

  const coreEdges = edges.filter((e) => coreNodes.includes(e.from) && coreNodes.includes(e.to));

  for (let i = 0; i < coreNodes.length; i++) {
    const nodeId = coreNodes[i];
    const relevantEdge = coreEdges.find((e) => e.from === nodeId || e.to === nodeId);
    let pos: Pos;

    const currentNodeData = nodeMap?.get(nodeId);
    const currentFrameData = frameBounds?.find((f) => f.id === nodeId);
    const currentW = currentFrameData?.width || currentNodeData?.width || NODE_W;
    const currentH = currentFrameData?.height || currentNodeData?.height || NODE_H;

    if (i === 0) {
      pos = { x: CENTER_X, y: CENTER_Y };
    } else if (relevantEdge) {
      const otherId = relevantEdge.from === nodeId ? relevantEdge.to : relevantEdge.from;
      const otherPos = positions.get(otherId);
      if (otherPos) {
        const otherNodeData = nodeMap?.get(otherId);
        const otherFrameData = frameBounds?.find((f) => f.id === otherId);
        const otherW = otherFrameData?.width || otherNodeData?.width || NODE_W;
        const otherH = otherFrameData?.height || otherNodeData?.height || NODE_H;

        const anchor =
          relevantEdge.from === nodeId ? relevantEdge.fromAnchor : relevantEdge.toAnchor;
        pos = getOffsetPos(
          otherPos,
          anchor,
          relevantEdge.from !== nodeId,
          { w: otherW, h: otherH },
          { w: currentW, h: currentH }
        );
      } else {
        pos = { x: CENTER_X + i * GAP, y: CENTER_Y };
      }
    } else {
      pos = { x: CENTER_X + i * GAP, y: CENTER_Y };
    }

    if (frameBounds && nodeMap) {
      let finalPos = pos;
      let attempts = 0;
      while (attempts < 20) {
        let collision = false;
        for (const frame of frameBounds) {
          if (frame.id === nodeId) continue;
          const framePos = positions.get(frame.id);
          if (!framePos) continue;

          const gap = 20;

          const nodeLeft = finalPos.x - gap;
          const nodeRight = finalPos.x + currentW + gap;
          const nodeTop = finalPos.y - gap;
          const nodeBottom = finalPos.y + currentH + gap;

          const frameLeft = framePos.x;
          const frameRight = framePos.x + frame.width;
          const frameTop = framePos.y;
          const frameBottom = framePos.y + frame.height;

          const overlapsX = nodeRight > frameLeft && nodeLeft < frameRight;
          const overlapsY = nodeBottom > frameTop && nodeTop < frameBottom;

          if (overlapsX && overlapsY) {
            collision = true;
            finalPos = { x: framePos.x + frame.width + gap, y: finalPos.y };
            break;
          }
        }
        if (!collision) break;
        attempts++;
      }
      pos = finalPos;
    }

    console.log('[placeCoreGroup] placed', nodeId, pos);
    positions.set(nodeId, pos);
    placed.add(nodeId);
  }
}

function getOffsetPos(
  basePos: Pos,
  anchor: ConnectionPoint,
  isIncoming: boolean,
  baseNodeSize?: { w: number; h: number },
  targetNodeSize?: { w: number; h: number }
): Pos {
  const dir = isIncoming ? -1 : 1;
  const baseW = baseNodeSize?.w || NODE_W;
  const baseH = baseNodeSize?.h || NODE_H;
  const targetW = targetNodeSize?.w || NODE_W;
  const targetH = targetNodeSize?.h || NODE_H;
  const gap = 30;

  switch (anchor) {
    case 'bottom':
      return { x: basePos.x, y: basePos.y + (baseH + targetH + gap) * dir };
    case 'top':
      return { x: basePos.x, y: basePos.y - (baseH + targetH + gap) * dir };
    case 'right':
      return { x: basePos.x + (baseW + targetW + gap) * dir, y: basePos.y };
    case 'left':
      return { x: basePos.x - (baseW + targetW + gap) * dir, y: basePos.y };
    default:
      return { x: basePos.x, y: basePos.y + (baseH + targetH + gap) };
  }
}

function placeRemaining(
  nodes: Node[],
  edges: Edge[],
  nodeEdges: Map<string, Edge[]>,
  positions: Map<string, Pos>,
  placed: Set<string>,
  depth: number,
  frameBounds: { id: string; width: number; height: number }[],
  nodeMap?: Map<string, Node>
): boolean {
  if (placed.size >= nodes.length) return true;
  if (depth > 200) return false;

  const nMap = nodeMap || new Map(nodes.map((n) => [n.id, n]));

  const nextNode = findNextNode(nodes, nodeEdges, placed);
  const nextNodeData = nodes.find((n) => n.id === nextNode);
  const isNextFrame = nextNodeData?.type === 'frame';

  if (!nextNode) {
    const unplaced = nodes.find((n) => !placed.has(n.id));
    if (unplaced) {
      const pos = findFreePosition(positions);
      positions.set(unplaced.id, pos);
      placed.add(unplaced.id);
      return placeRemaining(
        nodes,
        edges,
        nodeEdges,
        positions,
        placed,
        depth + 1,
        frameBounds,
        nMap
      );
    }
    return true;
  }

  const candidates = getCandidatePositions(nextNode, nodeEdges.get(nextNode)!, positions, placed);

  for (const pos of candidates) {
    positions.set(nextNode, pos);

    const rulesOk = checkAllRules(positions, edges, nextNode, frameBounds, isNextFrame, nMap);
    const insideFrame = isInsideAnyFrame(nextNode, pos, positions, frameBounds, isNextFrame, nMap);

    console.log('[placeRemaining] trying', {
      nodeId: nextNode,
      pos,
      isNextFrame,
      rulesOk,
      insideFrame,
      frameBoundsCount: frameBounds.length,
      placedFrames: Array.from(positions.keys()).filter((id) =>
        frameBounds.some((f) => f.id === id)
      ),
    });

    if (rulesOk && !insideFrame) {
      placed.add(nextNode);
      if (
        placeRemaining(nodes, edges, nodeEdges, positions, placed, depth + 1, frameBounds, nMap)
      ) {
        return true;
      }
      placed.delete(nextNode);
    }

    positions.delete(nextNode);
  }

  return false;
}

function findNextNode(
  nodes: Node[],
  nodeEdges: Map<string, Edge[]>,
  placed: Set<string>
): string | null {
  let best: string | null = null;
  let bestScore = -1;

  for (const node of nodes) {
    if (placed.has(node.id)) continue;
    const edges = nodeEdges.get(node.id)!;
    const connectedToPlaced = edges.filter((e) => placed.has(e.from) || placed.has(e.to)).length;
    if (connectedToPlaced > bestScore) {
      bestScore = connectedToPlaced;
      best = node.id;
    }
  }

  return best;
}

function getCandidatePositions(
  nodeId: string,
  edges: Edge[],
  positions: Map<string, Pos>,
  placed: Set<string>
): Pos[] {
  const candidates: Pos[] = [];
  const anchorGroups = new Map<
    string,
    { anchor: ConnectionPoint; pos: Pos; isOutgoing: boolean }[]
  >();

  for (const edge of edges) {
    const isOutgoing = edge.from === nodeId;
    const otherId = isOutgoing ? edge.to : edge.from;
    if (!placed.has(otherId)) continue;

    const otherPos = positions.get(otherId)!;
    const fromAnchor = edge.fromAnchor;
    const key = `${otherId}-${fromAnchor}-${isOutgoing}`;

    if (!anchorGroups.has(key)) anchorGroups.set(key, []);
    anchorGroups.get(key)!.push({ anchor: fromAnchor, pos: otherPos, isOutgoing });
  }

  for (const [, group] of anchorGroups) {
    const { anchor: fromAnchor, pos: basePos, isOutgoing } = group[0];
    const count = group.length;

    for (let i = 0; i < count; i++) {
      const spreadOffset = (i - (count - 1) / 2) * SIBLING_GAP;
      const staggerOffset = count > 1 ? (i % 2 === 1 ? STAGGER_OFFSET : 0) : 0;
      let idealPos: Pos;

      switch (fromAnchor) {
        case 'bottom':
          idealPos = {
            x: basePos.x + spreadOffset,
            y:
              basePos.y + (isOutgoing ? -GAP : GAP) + (isOutgoing ? -staggerOffset : staggerOffset),
          };
          break;
        case 'top':
          idealPos = {
            x: basePos.x + spreadOffset,
            y:
              basePos.y + (isOutgoing ? GAP : -GAP) + (isOutgoing ? staggerOffset : -staggerOffset),
          };
          break;
        case 'right':
          idealPos = {
            x: basePos.x + (isOutgoing ? -GAP : GAP),
            y: basePos.y + spreadOffset,
          };
          break;
        case 'left':
          idealPos = {
            x: basePos.x + (isOutgoing ? GAP : -GAP),
            y: basePos.y + spreadOffset,
          };
          break;
        default:
          idealPos = { x: basePos.x, y: basePos.y + GAP };
      }
      candidates.push(idealPos);
    }
  }

  if (candidates.length === 0) {
    candidates.push(findFreePosition(positions));
  }

  const expanded: Pos[] = [];
  for (const c of candidates) {
    expanded.push(c);
    for (const dx of [-0.3, 0.3, -0.6, 0.6]) {
      for (const dy of [-0.3, 0.3, -0.6, 0.6, 0]) {
        expanded.push({ x: c.x + GAP * dx, y: c.y + GAP * dy });
      }
    }
  }

  return expanded;
}

function findFreePosition(positions: Map<string, Pos>): Pos {
  const minDist = GAP;
  for (let r = 0; r < 10; r++) {
    for (let angle = 0; angle < 8; angle++) {
      const a = (angle / 8) * Math.PI * 2;
      const pos = {
        x: CENTER_X + Math.cos(a) * r * minDist,
        y: CENTER_Y + Math.sin(a) * r * minDist,
      };
      let ok = true;
      for (const [, p] of positions) {
        if (Math.abs(pos.x - p.x) < minDist && Math.abs(pos.y - p.y) < minDist) {
          ok = false;
          break;
        }
      }
      if (ok) return pos;
    }
  }
  return { x: CENTER_X, y: CENTER_Y };
}

function isInsideAnyFrame(
  nodeId: string,
  nodePos: Pos,
  positions: Map<string, Pos>,
  frameBounds: { id: string; width: number; height: number }[],
  isNodeFrame: boolean,
  nodeMap?: Map<string, Node>
): boolean {
  if (isNodeFrame) return false;

  const movingNode = nodeMap?.get(nodeId);
  const nodeW = movingNode?.width || NODE_W;
  const nodeH = movingNode?.height || NODE_H;

  for (const frame of frameBounds) {
    if (frame.id === nodeId) continue;
    const framePos = positions.get(frame.id);
    if (!framePos) continue;

    const frameLeft = framePos.x;
    const frameRight = framePos.x + frame.width;
    const frameTop = framePos.y;
    const frameBottom = framePos.y + frame.height;

    const nodeLeft = nodePos.x;
    const nodeRight = nodePos.x + nodeW;
    const nodeTop = nodePos.y;
    const nodeBottom = nodePos.y + nodeH;

    const overlapsX = nodeRight > frameLeft && nodeLeft < frameRight;
    const overlapsY = nodeBottom > frameTop && nodeTop < frameBottom;
    if (overlapsX && overlapsY) {
      return true;
    }
  }
  return false;
}

function checkAllRules(
  positions: Map<string, Pos>,
  edges: Edge[],
  newNodeId: string,
  frameBounds?: { id: string; width: number; height: number }[],
  _isNewNodeFrame?: boolean,
  nodeMap?: Map<string, Node>
): boolean {
  const newPos = positions.get(newNodeId)!;
  const GAP = 20;

  const movingNode = nodeMap?.get(newNodeId);
  const movingW = movingNode?.width || NODE_W;
  const movingH = movingNode?.height || NODE_H;

  const frameIdSet = new Set(frameBounds?.map((f) => f.id) || []);

  for (const [id, pos] of positions) {
    if (id === newNodeId) continue;
    if (frameIdSet.has(id)) continue;

    const otherNode = nodeMap?.get(id);
    const otherW = otherNode?.width || NODE_W;
    const otherH = otherNode?.height || NODE_H;

    const nodeLeft = newPos.x - GAP;
    const nodeRight = newPos.x + movingW + GAP;
    const nodeTop = newPos.y - GAP;
    const nodeBottom = newPos.y + movingH + GAP;

    const otherLeft = pos.x;
    const otherRight = pos.x + otherW;
    const otherTop = pos.y;
    const otherBottom = pos.y + otherH;

    const overlapsX = nodeRight > otherLeft && nodeLeft < otherRight;
    const overlapsY = nodeBottom > otherTop && nodeTop < otherBottom;
    if (overlapsX && overlapsY) return false;
  }

  if (frameBounds) {
    for (const frame of frameBounds) {
      if (frame.id === newNodeId) continue;
      const framePos = positions.get(frame.id);
      if (!framePos) continue;

      const nodeLeft = newPos.x - GAP;
      const nodeRight = newPos.x + movingW + GAP;
      const nodeTop = newPos.y - GAP;
      const nodeBottom = newPos.y + movingH + GAP;

      const frameLeft = framePos.x;
      const frameRight = framePos.x + frame.width;
      const frameTop = framePos.y;
      const frameBottom = framePos.y + frame.height;

      const overlapsX = nodeRight > frameLeft && nodeLeft < frameRight;
      const overlapsY = nodeBottom > frameTop && nodeTop < frameBottom;

      console.log('[checkAllRules Frame collision]', {
        nodeId: newNodeId,
        frameId: frame.id,
        newPos,
        framePos,
        frameW: frame.width,
        frameH: frame.height,
        movingW,
        movingH,
        nodeRect: { left: nodeLeft, right: nodeRight, top: nodeTop, bottom: nodeBottom },
        frameRect: { left: frameLeft, right: frameRight, top: frameTop, bottom: frameBottom },
        overlapsX,
        overlapsY,
        wouldCollide: overlapsX && overlapsY,
      });
      if (overlapsX && overlapsY) return false;
    }
  }

  for (const edge of edges) {
    const fromPos = positions.get(edge.from);
    const toPos = positions.get(edge.to);
    if (!fromPos || !toPos) continue;

    if (edge.from !== newNodeId && edge.to !== newNodeId) {
      const segments = getEdgeSegments(fromPos, toPos, edge.fromAnchor, edge.toAnchor);
      for (const seg of segments) {
        const nodeW = movingW;
        const nodeH = movingH;
        if (nodeIntersectsSegmentWithSize(newPos, seg, nodeW, nodeH)) return false;
      }
    }

    if (edge.from === newNodeId || edge.to === newNodeId) {
      if (!checkDirectionRule(edge, fromPos, toPos)) return false;
    }
  }

  const relevantEdges = edges.filter((e) => e.from === newNodeId || e.to === newNodeId);
  for (const edge of relevantEdges) {
    const fromPos = positions.get(edge.from);
    const toPos = positions.get(edge.to);
    if (!fromPos || !toPos) continue;

    const newSegments = getEdgeSegments(fromPos, toPos, edge.fromAnchor, edge.toAnchor);

    for (const [nodeId, nodePos] of positions) {
      if (nodeId === edge.from || nodeId === edge.to) continue;
      const otherNode = nodeMap?.get(nodeId);
      const otherW = otherNode?.width || NODE_W;
      const otherH = otherNode?.height || NODE_H;
      for (const seg of newSegments) {
        if (nodeIntersectsSegmentWithSize(nodePos, seg, otherW, otherH)) return false;
      }
    }

    for (const otherEdge of edges) {
      if (otherEdge === edge) continue;
      const otherFromPos = positions.get(otherEdge.from);
      const otherToPos = positions.get(otherEdge.to);
      if (!otherFromPos || !otherToPos) continue;

      const otherSegments = getEdgeSegments(
        otherFromPos,
        otherToPos,
        otherEdge.fromAnchor,
        otherEdge.toAnchor
      );
      if (segmentsIntersect(newSegments, otherSegments)) return false;
    }
  }

  return true;
}

function checkDirectionRule(edge: Edge, fromPos: Pos, toPos: Pos): boolean {
  switch (edge.fromAnchor) {
    case 'right':
      return toPos.x > fromPos.x;
    case 'left':
      return toPos.x < fromPos.x;
    case 'bottom':
      return toPos.y > fromPos.y;
    case 'top':
      return toPos.y < fromPos.y;
    default:
      return true;
  }
}

function getEdgeSegments(
  fromPos: Pos,
  toPos: Pos,
  fromAnchor: ConnectionPoint,
  toAnchor: ConnectionPoint
): Segment[] {
  const segments: Segment[] = [];
  const hw = NODE_W / 2;
  const hh = NODE_H / 2;
  const OFFSET = 20;

  let sx = fromPos.x,
    sy = fromPos.y;
  let ex = toPos.x,
    ey = toPos.y;

  switch (fromAnchor) {
    case 'top':
      sy -= hh;
      break;
    case 'bottom':
      sy += hh;
      break;
    case 'left':
      sx -= hw;
      break;
    case 'right':
      sx += hw;
      break;
  }
  switch (toAnchor) {
    case 'top':
      ey -= hh;
      break;
    case 'bottom':
      ey += hh;
      break;
    case 'left':
      ex -= hw;
      break;
    case 'right':
      ex += hw;
      break;
  }

  const isFromVertical = fromAnchor === 'top' || fromAnchor === 'bottom';
  const isToVertical = toAnchor === 'top' || toAnchor === 'bottom';

  if (isFromVertical && isToVertical) {
    const sy2 = fromAnchor === 'bottom' ? sy + OFFSET : sy - OFFSET;
    const ey2 = toAnchor === 'top' ? ey - OFFSET : ey + OFFSET;
    const midY = (sy2 + ey2) / 2;
    segments.push({ x1: sx, y1: sy, x2: sx, y2: sy2 });
    segments.push({ x1: sx, y1: sy2, x2: sx, y2: midY });
    segments.push({ x1: sx, y1: midY, x2: ex, y2: midY });
    segments.push({ x1: ex, y1: midY, x2: ex, y2: ey2 });
    segments.push({ x1: ex, y1: ey2, x2: ex, y2: ey });
  } else if (!isFromVertical && !isToVertical) {
    const sx2 = fromAnchor === 'right' ? sx + OFFSET : sx - OFFSET;
    const ex2 = toAnchor === 'left' ? ex - OFFSET : ex + OFFSET;
    const midX = (sx2 + ex2) / 2;
    segments.push({ x1: sx, y1: sy, x2: sx2, y2: sy });
    segments.push({ x1: sx2, y1: sy, x2: midX, y2: sy });
    segments.push({ x1: midX, y1: sy, x2: midX, y2: ey });
    segments.push({ x1: midX, y1: ey, x2: ex2, y2: ey });
    segments.push({ x1: ex2, y1: ey, x2: ex, y2: ey });
  } else if (isFromVertical) {
    const sy2 = fromAnchor === 'bottom' ? sy + OFFSET : sy - OFFSET;
    segments.push({ x1: sx, y1: sy, x2: sx, y2: sy2 });
    segments.push({ x1: sx, y1: sy2, x2: sx, y2: ey });
    segments.push({ x1: sx, y1: ey, x2: ex, y2: ey });
  } else {
    const sx2 = fromAnchor === 'right' ? sx + OFFSET : sx - OFFSET;
    segments.push({ x1: sx, y1: sy, x2: sx2, y2: sy });
    segments.push({ x1: sx2, y1: sy, x2: ex, y2: sy });
    segments.push({ x1: ex, y1: sy, x2: ex, y2: ey });
  }

  return segments;
}

function segmentsIntersect(segs1: Segment[], segs2: Segment[]): boolean {
  for (const s1 of segs1) {
    for (const s2 of segs2) {
      if (lineSegmentsIntersect(s1, s2)) return true;
    }
  }
  return false;
}

function lineSegmentsIntersect(s1: Segment, s2: Segment): boolean {
  const d1x = s1.x2 - s1.x1,
    d1y = s1.y2 - s1.y1;
  const d2x = s2.x2 - s2.x1,
    d2y = s2.y2 - s2.y1;

  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 0.0001) return false;

  const dx = s2.x1 - s1.x1,
    dy = s2.y1 - s1.y1;
  const t1 = (dx * d2y - dy * d2x) / cross;
  const t2 = (dx * d1y - dy * d1x) / cross;

  return t1 > 0.01 && t1 < 0.99 && t2 > 0.01 && t2 < 0.99;
}

function calcSubtreeWidth(
  nodeId: string,
  nodeEdges: Map<string, Edge[]>,
  visited: Set<string>
): number {
  if (visited.has(nodeId)) return 0;
  visited.add(nodeId);

  const edges = nodeEdges.get(nodeId) || [];
  let childCount = 0;
  let totalWidth = 0;

  for (const edge of edges) {
    const childId = edge.from === nodeId ? edge.to : edge.from;
    if (!visited.has(childId)) {
      childCount++;
      totalWidth += calcSubtreeWidth(childId, nodeEdges, new Set(visited));
    }
  }

  return Math.max(1, childCount, totalWidth);
}

function simpleLayout(
  nodes: Node[],
  edges: Edge[],
  positions: Map<string, Pos>,
  frameBounds: { id: string; width: number; height: number }[] = []
) {
  positions.clear();

  const nodeEdges = new Map<string, Edge[]>();
  nodes.forEach((n) => nodeEdges.set(n.id, []));
  edges.forEach((e) => {
    nodeEdges.get(e.from)?.push(e);
    nodeEdges.get(e.to)?.push(e);
  });

  const nodeTypeMap = new Map<string, string>();
  nodes.forEach((n) => nodeTypeMap.set(n.id, n.type || ''));

  const degrees = nodes.map((n) => ({ id: n.id, deg: nodeEdges.get(n.id)?.length || 0 }));
  degrees.sort((a, b) => b.deg - a.deg);

  if (degrees.length === 0) return;

  const centerNode = degrees[0].id;
  positions.set(centerNode, { x: CENTER_X, y: CENTER_Y });

  const placed = new Set<string>([centerNode]);
  const queue: string[] = [centerNode];

  while (queue.length > 0 && placed.size < nodes.length) {
    const currentId = queue.shift()!;
    const currentPos = positions.get(currentId)!;
    const currentEdges = nodeEdges.get(currentId) || [];

    const directionSlots = new Map<string, Array<{ nodeId: string; edge: Edge }>>();
    directionSlots.set('right', []);
    directionSlots.set('left', []);
    directionSlots.set('bottom', []);
    directionSlots.set('top', []);

    for (const edge of currentEdges) {
      const isOutgoing = edge.from === currentId;
      const otherId = isOutgoing ? edge.to : edge.from;
      if (placed.has(otherId)) continue;

      let targetDir: string;
      if (isOutgoing) {
        targetDir = edge.fromAnchor;
      } else {
        switch (edge.fromAnchor) {
          case 'right':
            targetDir = 'left';
            break;
          case 'left':
            targetDir = 'right';
            break;
          case 'bottom':
            targetDir = 'top';
            break;
          case 'top':
            targetDir = 'bottom';
            break;
          default:
            targetDir = 'top';
        }
      }

      directionSlots.get(targetDir)!.push({ nodeId: otherId, edge });
    }

    for (const [dir, nodeItems] of directionSlots) {
      if (nodeItems.length === 0) continue;

      const subtreeWidths = nodeItems.map((item) =>
        calcSubtreeWidth(item.nodeId, nodeEdges, new Set(placed))
      );
      const totalWidth = subtreeWidths.reduce((a, b) => a + b, 0);

      let currentOffset = -((totalWidth - 1) / 2) * SIBLING_GAP;

      for (let i = 0; i < nodeItems.length; i++) {
        const { nodeId } = nodeItems[i];
        if (placed.has(nodeId)) continue;

        const width = subtreeWidths[i];
        const centerOfSubtree = currentOffset + ((width - 1) / 2) * SIBLING_GAP;
        currentOffset += width * SIBLING_GAP;

        const staggerOffset = nodeItems.length > 1 ? (i % 2 === 1 ? STAGGER_OFFSET : 0) : 0;
        let pos: Pos;

        switch (dir) {
          case 'right':
            pos = { x: currentPos.x + GAP, y: currentPos.y + centerOfSubtree };
            break;
          case 'left':
            pos = { x: currentPos.x - GAP, y: currentPos.y + centerOfSubtree };
            break;
          case 'bottom':
            pos = { x: currentPos.x + centerOfSubtree, y: currentPos.y + GAP + staggerOffset };
            break;
          case 'top':
            pos = { x: currentPos.x + centerOfSubtree, y: currentPos.y - GAP - staggerOffset };
            break;
          default:
            pos = { x: currentPos.x + GAP, y: currentPos.y };
        }

        const isNodeFrame = nodeTypeMap.get(nodeId) === 'frame';
        pos = avoidCollision(pos, positions, dir);
        pos = avoidFrameCollision(nodeId, pos, positions, frameBounds, isNodeFrame, dir);
        positions.set(nodeId, pos);
        placed.add(nodeId);
        queue.push(nodeId);
      }
    }
  }

  for (const node of nodes) {
    if (!placed.has(node.id)) {
      const pos = findFreePosition(positions);
      positions.set(node.id, pos);
      placed.add(node.id);
    }
  }
}

function avoidFrameCollision(
  nodeId: string,
  pos: Pos,
  positions: Map<string, Pos>,
  frameBounds: { id: string; width: number; height: number }[],
  isNodeFrame: boolean,
  preferDir: string
): Pos {
  if (isNodeFrame) return pos;

  for (let attempt = 0; attempt < 20; attempt++) {
    if (!isInsideAnyFrame(nodeId, pos, positions, frameBounds, false)) {
      return pos;
    }
    const shift = 50;
    switch (preferDir) {
      case 'right':
        pos = { x: pos.x + shift, y: pos.y };
        break;
      case 'left':
        pos = { x: pos.x - shift, y: pos.y };
        break;
      case 'bottom':
        pos = { x: pos.x, y: pos.y + shift };
        break;
      case 'top':
        pos = { x: pos.x, y: pos.y - shift };
        break;
      default:
        pos = { x: pos.x + shift, y: pos.y };
    }
  }
  return pos;
}

function avoidCollision(pos: Pos, positions: Map<string, Pos>, preferDir: string): Pos {
  const minDistX = NODE_W + 30;
  const minDistY = NODE_H + 30;

  for (let attempt = 0; attempt < 20; attempt++) {
    let collision = false;
    for (const [, existingPos] of positions) {
      if (
        Math.abs(pos.x - existingPos.x) < minDistX &&
        Math.abs(pos.y - existingPos.y) < minDistY
      ) {
        collision = true;
        break;
      }
    }
    if (!collision) return pos;

    const offset = (attempt + 1) * GAP * 0.5;
    switch (preferDir) {
      case 'right':
      case 'left':
        pos = { x: pos.x, y: pos.y + (attempt % 2 === 0 ? offset : -offset) };
        break;
      default:
        pos = { x: pos.x + (attempt % 2 === 0 ? offset : -offset), y: pos.y };
    }
  }
  return pos;
}

/**
 * 规则6: Frame 内部节点连接到外部节点时，尽量让外部节点与子节点对齐
 * - 上下连接时，外部节点的 x 坐标与子节点对齐
 * - 左右连接时，外部节点的 y 坐标与子节点对齐
 */
function alignExternalNodesToFrameChildren(
  nodes: Node[],
  connections: Connection[],
  positions: Map<string, Pos>,
  childToFrame: Map<string, string>,
  edges: Edge[],
  frameBounds: { id: string; width: number; height: number }[]
): void {
  console.log('[AlignRule6] Start', {
    connectionsCount: connections.length,
    childToFrameSize: childToFrame.size,
    childToFrameEntries: Array.from(childToFrame.entries()),
  });

  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  for (const conn of connections) {
    console.log('[AlignRule6] Checking connection', {
      from: conn.from,
      to: conn.to,
      fromInFrame: childToFrame.has(conn.from),
      toInFrame: childToFrame.has(conn.to),
    });
    const fromFrame = childToFrame.get(conn.from);
    const toFrame = childToFrame.get(conn.to);

    const fromIsChild = !!fromFrame;
    const toIsChild = !!toFrame;

    if ((fromIsChild && !toIsChild) || (!fromIsChild && toIsChild)) {
      const childId = fromIsChild ? conn.from : conn.to;
      const externalId = fromIsChild ? conn.to : conn.from;
      const frameId = fromIsChild ? fromFrame! : toFrame!;

      const frameNode = nodeMap.get(frameId);
      const externalPos = positions.get(externalId);
      const framePos = positions.get(frameId);

      if (!frameNode || !externalPos || !framePos) continue;
      if (frameNode.type !== 'frame') continue;

      const frame = frameNode as FrameNode;
      const childPositions = (
        frame as unknown as { _childPositions?: Map<string, { x: number; y: number }> }
      )._childPositions;
      if (!childPositions) continue;

      const childRelPos = childPositions.get(childId);
      if (!childRelPos) continue;

      const childNode = nodeMap.get(childId);
      const childW = childNode?.width || DEFAULT_CHILD_WIDTH;
      const childH = childNode?.height || DEFAULT_CHILD_HEIGHT;

      const externalNode = nodeMap.get(externalId);
      const extW = externalNode?.width || NODE_W;
      const extH = externalNode?.height || NODE_H;

      const frameW = frame.width || 200;
      const frameH = frame.height || 150;
      const childAbsX = framePos.x - frameW / 2 + childRelPos.x + childW / 2;
      const childAbsY = framePos.y - frameH / 2 + childRelPos.y + childH / 2;

      const fromAnchor = conn.fromAnchor || 'bottom';
      const toAnchor = conn.toAnchor || 'top';

      let newPos: Pos;
      const EXTERNAL_GAP = 50;

      if (fromIsChild) {
        if (fromAnchor === 'bottom') {
          newPos = {
            x: childAbsX,
            y: framePos.y + frameH / 2 + EXTERNAL_GAP + extH / 2,
          };
        } else if (fromAnchor === 'top') {
          newPos = {
            x: childAbsX,
            y: framePos.y - frameH / 2 - EXTERNAL_GAP - extH / 2,
          };
        } else if (fromAnchor === 'right') {
          newPos = {
            x: framePos.x + frameW / 2 + EXTERNAL_GAP + extW / 2,
            y: childAbsY,
          };
        } else if (fromAnchor === 'left') {
          newPos = {
            x: framePos.x - frameW / 2 - EXTERNAL_GAP - extW / 2,
            y: childAbsY,
          };
        } else {
          continue;
        }
      } else {
        if (toAnchor === 'top') {
          newPos = {
            x: childAbsX,
            y: framePos.y + frameH / 2 + EXTERNAL_GAP + extH / 2,
          };
        } else if (toAnchor === 'bottom') {
          newPos = {
            x: childAbsX,
            y: framePos.y - frameH / 2 - EXTERNAL_GAP - extH / 2,
          };
        } else if (toAnchor === 'left') {
          newPos = {
            x: framePos.x + frameW / 2 + EXTERNAL_GAP + extW / 2,
            y: childAbsY,
          };
        } else if (toAnchor === 'right') {
          newPos = {
            x: framePos.x - frameW / 2 - EXTERNAL_GAP - extW / 2,
            y: childAbsY,
          };
        } else {
          continue;
        }
      }

      console.log('[AlignRule6]', {
        childId,
        externalId,
        fromIsChild,
        fromAnchor,
        toAnchor,
        childAbsX,
        childAbsY,
        oldPos: externalPos,
        newPos,
      });

      if (!wouldViolateRules(newPos, externalId, positions, edges, frameBounds, nodeMap)) {
        positions.set(externalId, newPos);
        console.log('[AlignRule6] Applied alignment for', externalId);
      } else {
        console.log('[AlignRule6] Would violate rules, skipped', externalId);
      }
    }
  }
}

function wouldViolateRules(
  newPos: Pos,
  nodeId: string,
  positions: Map<string, Pos>,
  edges: Edge[],
  frameBounds: { id: string; width: number; height: number }[],
  nodeMap?: Map<string, Node>
): boolean {
  const GAP = 20;

  const movingNode = nodeMap?.get(nodeId);
  const movingW = movingNode?.width || NODE_W;
  const movingH = movingNode?.height || NODE_H;

  for (const [id, pos] of positions) {
    if (id === nodeId) continue;

    const otherNode = nodeMap?.get(id);
    const otherW = otherNode?.width || NODE_W;
    const otherH = otherNode?.height || NODE_H;

    const minDistX = (movingW + otherW) / 2 + GAP;
    const minDistY = (movingH + otherH) / 2 + GAP;

    const dx = Math.abs(newPos.x - pos.x);
    const dy = Math.abs(newPos.y - pos.y);
    if (dx < minDistX && dy < minDistY) {
      console.log('[wouldViolate] collision with node', id, {
        dx,
        dy,
        minDistX,
        minDistY,
        movingW,
        movingH,
        otherW,
        otherH,
      });
      return true;
    }
  }

  for (const frame of frameBounds) {
    if (frame.id === nodeId) continue;
    const framePos = positions.get(frame.id);
    if (!framePos) continue;

    const minDistX = (movingW + frame.width) / 2 + GAP;
    const minDistY = (movingH + frame.height) / 2 + GAP;

    const dx = Math.abs(newPos.x - framePos.x);
    const dy = Math.abs(newPos.y - framePos.y);
    if (dx < minDistX && dy < minDistY) {
      console.log('[wouldViolate] collision with frame', frame.id, { dx, dy, minDistX, minDistY });
      return true;
    }
  }

  if (isInsideAnyFrame(nodeId, newPos, positions, frameBounds, false)) {
    return true;
  }

  const tempPositions = new Map(positions);
  tempPositions.set(nodeId, newPos);

  for (const edge of edges) {
    if (edge.from !== nodeId && edge.to !== nodeId) continue;

    const fromPos = tempPositions.get(edge.from);
    const toPos = tempPositions.get(edge.to);
    if (!fromPos || !toPos) continue;

    if (!checkDirectionRule(edge, fromPos, toPos)) return true;

    const segments = getEdgeSegments(fromPos, toPos, edge.fromAnchor, edge.toAnchor);
    for (const [id, pos] of tempPositions) {
      if (id === edge.from || id === edge.to) continue;

      const otherNode = nodeMap?.get(id);
      const otherW = otherNode?.width || NODE_W;
      const otherH = otherNode?.height || NODE_H;

      for (const seg of segments) {
        if (nodeIntersectsSegmentWithSize(pos, seg, otherW, otherH)) {
          console.log('[wouldViolate] edge intersects node', id);
          return true;
        }
      }
    }
  }

  return false;
}

function nodeIntersectsSegmentWithSize(
  nodePos: Pos,
  seg: Segment,
  nodeW: number,
  nodeH: number
): boolean {
  const hw = nodeW / 2 + 15;
  const hh = nodeH / 2 + 15;

  const left = nodePos.x - hw;
  const right = nodePos.x + hw;
  const top = nodePos.y - hh;
  const bottom = nodePos.y + hh;

  const minX = Math.min(seg.x1, seg.x2);
  const maxX = Math.max(seg.x1, seg.x2);
  const minY = Math.min(seg.y1, seg.y2);
  const maxY = Math.max(seg.y1, seg.y2);

  if (right < minX || left > maxX || bottom < minY || top > maxY) return false;

  const isHoriz = Math.abs(seg.y1 - seg.y2) < 1;
  const isVert = Math.abs(seg.x1 - seg.x2) < 1;

  if (isHoriz) {
    return seg.y1 > top && seg.y1 < bottom && maxX > left && minX < right;
  }
  if (isVert) {
    return seg.x1 > left && seg.x1 < right && maxY > top && minY < bottom;
  }

  return true;
}

function centerGraph(positions: Map<string, Pos>) {
  if (positions.size === 0) return;
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  positions.forEach((p) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });
  const ox = CENTER_X - (minX + maxX) / 2;
  const oy = CENTER_Y - (minY + maxY) / 2;
  positions.forEach((p) => {
    p.x += ox;
    p.y += oy;
  });
}
