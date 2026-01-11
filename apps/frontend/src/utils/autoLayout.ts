import ELK from 'elkjs/lib/elk.bundled.js';
import type { Node, Connection, FrameNode } from '../types/canvas';

export interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeSpacing?: number;
  rankSpacing?: number;
  align?: 'UL' | 'UR' | 'DL' | 'DR';
}

const DEFAULT_NODE_WIDTH = 90;
const DEFAULT_NODE_HEIGHT = 90;
const DEFAULT_FRAME_PADDING = 24;
const DEFAULT_FRAME_GAP = 12;

const elk = new ELK();

/**
 * 计算 Frame 的尺寸和子节点位置
 */
function calculateFrameLayout(
  frameNode: FrameNode,
  childNodes: Node[]
): { width: number; height: number; childPositions: Map<string, { x: number; y: number }> } {
  const padding = frameNode.padding ?? DEFAULT_FRAME_PADDING;
  const gap = frameNode.gap ?? DEFAULT_FRAME_GAP;
  const layout = frameNode.layout || 'flex-row';

  // 检查 Frame 是否显示 label（showLabel 默认为 true 且有 label 内容）
  const hasVisibleLabel = (frameNode as any).showLabel !== false && (frameNode as any).label;
  const labelOffset = hasVisibleLabel ? 30 : 0;

  const childPositions = new Map<string, { x: number; y: number }>();

  if (childNodes.length === 0) {
    // 返回总高度（包含 label）
    return { width: 300, height: 200 + labelOffset, childPositions };
  }

  let totalWidth = padding * 2;
  let bodyHeight = padding * 2; // Frame 主体高度（不含 label）

  if (layout === 'flex-row') {
    let maxHeight = 0;
    let currentX = padding;

    childNodes.forEach((child, index) => {
      const childWidth = child.width || DEFAULT_NODE_WIDTH;
      const childHeight = child.height || DEFAULT_NODE_HEIGHT;

      // y 坐标需要加上 labelOffset
      childPositions.set(child.id, { x: currentX, y: padding + labelOffset });
      currentX += childWidth + (index < childNodes.length - 1 ? gap : 0);
      maxHeight = Math.max(maxHeight, childHeight);
    });

    totalWidth = currentX + padding;
    bodyHeight = maxHeight + padding * 2;
  } else if (layout === 'flex-col') {
    let maxWidth = 0;
    let currentY = padding + labelOffset;

    childNodes.forEach((child, index) => {
      const childWidth = child.width || DEFAULT_NODE_WIDTH;
      const childHeight = child.height || DEFAULT_NODE_HEIGHT;

      childPositions.set(child.id, { x: padding, y: currentY });
      currentY += childHeight + (index < childNodes.length - 1 ? gap : 0);
      maxWidth = Math.max(maxWidth, childWidth);
    });

    totalWidth = maxWidth + padding * 2;
    // currentY 已经包含了 labelOffset，所以直接 currentY + padding 就是总高度
    // 返回总高度（包含 label）
    return { width: totalWidth, height: currentY + padding, childPositions };
  } else if (layout === 'grid') {
    const cols = frameNode.gridCols || 2;
    let currentX = padding;
    let currentY = padding + labelOffset;
    let rowMaxHeight = 0;
    let maxRowWidth = 0;

    childNodes.forEach((child, index) => {
      const childWidth = child.width || DEFAULT_NODE_WIDTH;
      const childHeight = child.height || DEFAULT_NODE_HEIGHT;
      const col = index % cols;

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

    totalWidth = maxRowWidth + padding;
    // currentY 已经包含了 labelOffset，所以直接 currentY + rowMaxHeight + padding 就是总高度
    // 返回总高度（包含 label）
    return { width: totalWidth, height: currentY + rowMaxHeight + padding, childPositions };
  }

  // flex-row 的情况：返回总高度（包含 label）
  return { width: totalWidth, height: bodyHeight + labelOffset, childPositions };
}

/**
 * 最小化边交叉的布局算法（Sugiyama-style）
 */
function minimizeCrossingsLayout(
  nodes: Node[],
  connections: Connection[],
  nodeSpacing: number,
  rankSpacing: number
): Node[] {
  if (nodes.length === 0) return nodes;

  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // 构建邻接表
  const outEdges = new Map<string, string[]>();
  const inEdges = new Map<string, string[]>();
  nodes.forEach((n) => {
    outEdges.set(n.id, []);
    inEdges.set(n.id, []);
  });

  connections.forEach((conn) => {
    if (nodeMap.has(conn.from) && nodeMap.has(conn.to)) {
      outEdges.get(conn.from)!.push(conn.to);
      inEdges.get(conn.to)!.push(conn.from);
    }
  });

  // 1. 分层：拓扑排序
  const layers: string[][] = [];
  const nodeLayer = new Map<string, number>();
  const inDegree = new Map<string, number>();
  nodes.forEach((n) => inDegree.set(n.id, inEdges.get(n.id)!.length));

  const queue: string[] = [];
  nodes.forEach((n) => {
    if (inDegree.get(n.id) === 0) queue.push(n.id);
  });

  while (queue.length > 0) {
    const layer: string[] = [...queue];
    queue.length = 0;
    layers.push(layer);

    layer.forEach((id) => {
      nodeLayer.set(id, layers.length - 1);
      outEdges.get(id)!.forEach((targetId) => {
        const deg = inDegree.get(targetId)! - 1;
        inDegree.set(targetId, deg);
        if (deg === 0) queue.push(targetId);
      });
    });
  }

  // 处理有环的情况
  nodes.forEach((n) => {
    if (!nodeLayer.has(n.id)) {
      const lastLayer = layers[layers.length - 1] || [];
      lastLayer.push(n.id);
      if (layers.length === 0) layers.push(lastLayer);
      nodeLayer.set(n.id, layers.length - 1);
    }
  });

  // 2. 层内排序：使用重心法减少交叉
  for (let iter = 0; iter < 4; iter++) {
    // 向下扫描
    for (let i = 1; i < layers.length; i++) {
      sortLayerByBarycenter(layers[i], layers[i - 1], inEdges);
    }
    // 向上扫描
    for (let i = layers.length - 2; i >= 0; i--) {
      sortLayerByBarycenter(layers[i], layers[i + 1], outEdges);
    }
  }

  // 3. 分配坐标
  const positions = new Map<string, { x: number; y: number }>();

  layers.forEach((layer, layerIndex) => {
    const layerWidth = (layer.length - 1) * nodeSpacing;
    const startX = 400 - layerWidth / 2;
    const y = 100 + layerIndex * rankSpacing;

    layer.forEach((nodeId, posIndex) => {
      positions.set(nodeId, { x: startX + posIndex * nodeSpacing, y });
    });
  });

  return nodes.map((node) => {
    const pos = positions.get(node.id);
    if (pos) {
      return { ...node, position: pos };
    }
    return node;
  });
}

function sortLayerByBarycenter(
  layer: string[],
  adjacentLayer: string[],
  edgeMap: Map<string, string[]>
): void {
  const positionInAdjacent = new Map<string, number>();
  adjacentLayer.forEach((id, idx) => positionInAdjacent.set(id, idx));

  const barycenters = new Map<string, number>();

  layer.forEach((nodeId) => {
    const neighbors = edgeMap.get(nodeId) || [];
    const relevantNeighbors = neighbors.filter((n) => positionInAdjacent.has(n));

    if (relevantNeighbors.length > 0) {
      const sum = relevantNeighbors.reduce((acc, n) => acc + positionInAdjacent.get(n)!, 0);
      barycenters.set(nodeId, sum / relevantNeighbors.length);
    } else {
      barycenters.set(nodeId, layer.indexOf(nodeId));
    }
  });

  layer.sort((a, b) => barycenters.get(a)! - barycenters.get(b)!);
}

/**
 * 使用 ELK 算法自动布局节点（正确处理 Frame 和子节点）
 */
export async function autoLayoutNodesAsync(
  nodes: Node[],
  connections: Connection[],
  options: LayoutOptions = {}
): Promise<Node[]> {
  const { direction = 'TB', nodeSpacing = 150, rankSpacing = 250 } = options;

  // 收集所有子节点 ID
  const childNodeIds = new Set<string>();
  const frameNodes: FrameNode[] = [];

  nodes.forEach((node) => {
    if (node.type === 'frame') {
      const frameNode = node as FrameNode;
      frameNodes.push(frameNode);
      (frameNode.children || []).forEach((childId) => childNodeIds.add(childId));
    }
  });

  // 筛选出顶层节点
  const topLevelNodes = nodes.filter((n) => !childNodeIds.has(n.id));

  // 预计算所有 Frame 的尺寸和子节点位置
  const frameLayouts = new Map<
    string,
    { width: number; height: number; childPositions: Map<string, { x: number; y: number }> }
  >();

  frameNodes.forEach((frame) => {
    const children = (frame.children || [])
      .map((id) => nodes.find((n) => n.id === id))
      .filter((n): n is Node => n !== undefined);
    frameLayouts.set(frame.id, calculateFrameLayout(frame, children));
  });

  // 构建 ELK 图
  const elkDirection =
    direction === 'LR' ? 'RIGHT' : direction === 'RL' ? 'LEFT' : direction === 'BT' ? 'UP' : 'DOWN';

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': elkDirection,
      'elk.spacing.nodeNode': String(nodeSpacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(rankSpacing),
      'elk.layered.spacing.edgeNodeBetweenLayers': '50',
      'elk.layered.spacing.edgeEdgeBetweenLayers': '30',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
      'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.separateConnectedComponents': 'false',
    },
    children: topLevelNodes.map((node) => {
      let width = node.width || DEFAULT_NODE_WIDTH;
      let height = node.height || DEFAULT_NODE_HEIGHT;

      if (node.type === 'frame') {
        const layout = frameLayouts.get(node.id);
        if (layout) {
          width = layout.width;
          height = layout.height;
        }
      }

      return { id: node.id, width, height };
    }),
    edges: [] as Array<{ id: string; sources: string[]; targets: string[] }>,
  };

  // 添加边（去除双向连接，只保留一条）
  const topLevelNodeIds = new Set(topLevelNodes.map((n) => n.id));
  const addedEdges = new Set<string>();

  connections.forEach((conn, index) => {
    let fromId = conn.from;
    let toId = conn.to;

    if (!topLevelNodeIds.has(fromId)) {
      const parentFrame = frameNodes.find((f) => f.children?.includes(fromId));
      if (parentFrame) fromId = parentFrame.id;
      else return;
    }
    if (!topLevelNodeIds.has(toId)) {
      const parentFrame = frameNodes.find((f) => f.children?.includes(toId));
      if (parentFrame) toId = parentFrame.id;
      else return;
    }

    if (fromId === toId) return;

    const edgeKey = [fromId, toId].sort().join('-');
    if (addedEdges.has(edgeKey)) return;
    addedEdges.add(edgeKey);

    elkGraph.edges.push({
      id: `e${index}`,
      sources: [fromId],
      targets: [toId],
    });
  });

  console.log('[ELK Layout] Input:', {
    nodes: elkGraph.children?.length,
    edges: elkGraph.edges.length,
    direction: elkDirection,
  });

  try {
    const layoutedGraph = await elk.layout(elkGraph);

    // 应用布局
    let layoutedNodes = nodes.map((node) => {
      if (childNodeIds.has(node.id)) {
        const parentFrame = frameNodes.find((f) => f.children?.includes(node.id));
        if (parentFrame) {
          const layout = frameLayouts.get(parentFrame.id);
          const childPos = layout?.childPositions.get(node.id);
          if (childPos) return { ...node, position: childPos };
        }
        return node;
      }

      const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
      if (!elkNode || elkNode.x === undefined || elkNode.y === undefined) return node;

      if (node.type === 'frame') {
        const layout = frameLayouts.get(node.id);
        return {
          ...node,
          position: { x: elkNode.x, y: elkNode.y },
          width: layout?.width || node.width,
          height: layout?.height || node.height,
        };
      }

      return { ...node, position: { x: elkNode.x, y: elkNode.y } };
    });

    // 使用最小化交叉算法重新布局
    layoutedNodes = minimizeCrossingsLayout(layoutedNodes, connections, nodeSpacing, rankSpacing);

    return layoutedNodes;
  } catch (error) {
    console.error('ELK layout failed:', error);
    return nodes;
  }
}

/**
 * 同步版本的布局（使用简单算法作为后备）
 */
export function autoLayoutNodes(
  nodes: Node[],
  connections: Connection[],
  options: LayoutOptions = {}
): Node[] {
  const { direction = 'TB', nodeSpacing = 150, rankSpacing = 250 } = options;

  // 简单的分层布局算法
  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // 计算每个节点的入度
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();
  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    outEdges.set(n.id, []);
  });

  connections.forEach((conn) => {
    if (nodeMap.has(conn.from) && nodeMap.has(conn.to)) {
      inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1);
      outEdges.get(conn.from)?.push(conn.to);
    }
  });

  // 拓扑排序 + 分层
  const layers: string[][] = [];
  const assigned = new Set<string>();
  const currentInDegree = new Map(inDegree);

  while (assigned.size < nodes.length) {
    const layer: string[] = [];

    nodes.forEach((node) => {
      if (!assigned.has(node.id) && (currentInDegree.get(node.id) || 0) === 0) {
        layer.push(node.id);
      }
    });

    if (layer.length === 0) {
      nodes.forEach((node) => {
        if (!assigned.has(node.id)) layer.push(node.id);
      });
    }

    layer.forEach((id) => {
      assigned.add(id);
      outEdges.get(id)?.forEach((targetId) => {
        currentInDegree.set(targetId, (currentInDegree.get(targetId) || 0) - 1);
      });
    });

    if (layer.length > 0) layers.push(layer);
  }

  // 布局
  const isHorizontal = direction === 'LR' || direction === 'RL';
  const layoutedNodes = nodes.map((node) => {
    let layerIndex = 0;
    let posInLayer = 0;

    for (let i = 0; i < layers.length; i++) {
      const idx = layers[i].indexOf(node.id);
      if (idx !== -1) {
        layerIndex = i;
        posInLayer = idx;
        break;
      }
    }

    const layerSize = layers[layerIndex]?.length || 1;
    const layerWidth = (layerSize - 1) * nodeSpacing;
    const startOffset = -layerWidth / 2;

    let x: number, y: number;
    if (isHorizontal) {
      x = layerIndex * rankSpacing + 100;
      y = startOffset + posInLayer * nodeSpacing + 300;
    } else {
      x = startOffset + posInLayer * nodeSpacing + 400;
      y = layerIndex * rankSpacing + 100;
    }

    return { ...node, position: { x, y } };
  });

  return layoutedNodes;
}
