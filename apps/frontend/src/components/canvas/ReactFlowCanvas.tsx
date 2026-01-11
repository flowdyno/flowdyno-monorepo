import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  NodeChange,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@reactflow/node-resizer/dist/style.css';

import { useCanvasStore } from '../../stores/canvasStore';
import { useEditorStore } from '../../stores/editorStore';
import { useReactFlowStore } from '../../stores/reactFlowStore';
import { useAnimationPlayer } from '../../hooks/useAnimationPlayer';
import CustomNode from './CustomNode';
import FrameNode from './nodes/FrameNode';
import TextNode from './nodes/TextNode';
import ImageNode from './nodes/ImageNode';
import CustomEdge from './edges/CustomEdge';
import { TECH_CATEGORIES } from '@flowdyno/shared-config';

// 自动从 TECH_CATEGORIES 生成节点类型注册
// 这样添加新分类时不需要手动注册，避免遗漏
const techNodeTypes = TECH_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.type] = CustomNode;
    return acc;
  },
  {} as Record<string, typeof CustomNode>
);

// Concept 使用统一的 'concept' 类型
const conceptNodeTypes = {
  concept: CustomNode,
};

// Define custom node types
const nodeTypes = {
  // Tech nodes - 自动从 TECH_CATEGORIES 生成
  ...techNodeTypes,

  // Concept nodes - 自动从 CONCEPT_CATEGORIES 生成
  ...conceptNodeTypes,

  // Legacy types (保留兼容性)
  service: CustomNode,
  cache: CustomNode,
  queue: CustomNode,
  monitoring: CustomNode,
  ai: CustomNode,

  // Basic nodes (UI building blocks)
  frame: FrameNode,
  text: TextNode,
  image: ImageNode,
};

// Define custom edge types
const edgeTypes = {
  custom: CustomEdge,
};

// Custom edge style
const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
  },
  style: {
    strokeWidth: 2,
    stroke: '#00f0ff',
  },
};

function ReactFlowInstanceSync() {
  const reactFlowInstance = useReactFlow();
  const setInstance = useReactFlowStore((state) => state.setInstance);

  useEffect(() => {
    setInstance(reactFlowInstance);
    return () => setInstance(null);
  }, [reactFlowInstance, setInstance]);

  return null;
}

// Zoom Controls Component (must be inside ReactFlow)
function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const nodes = useCanvasStore((state) => state.nodes);

  if (nodes.length === 0) return null;

  return (
    <div className="absolute bottom-6 right-6 flex flex-col space-y-2 z-10 export-exclude">
      <button
        onClick={() => zoomIn({ duration: 200 })}
        className="w-10 h-10 bg-dark-800/80 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all flex items-center justify-center"
        title="Zoom In"
      >
        <span className="text-lg">+</span>
      </button>
      <button
        onClick={() => zoomOut({ duration: 200 })}
        className="w-10 h-10 bg-dark-800/80 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all flex items-center justify-center"
        title="Zoom Out"
      >
        <span className="text-lg">−</span>
      </button>
      <button
        onClick={() => fitView({ duration: 200, padding: 0.2 })}
        className="w-10 h-10 bg-dark-800/80 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all flex items-center justify-center"
        title="Fit View"
      >
        <span className="text-sm">⊙</span>
      </button>
    </div>
  );
}

export default function ReactFlowCanvas() {
  const storeNodes = useCanvasStore((state) => state.nodes);
  const connections = useCanvasStore((state) => state.connections);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const isResizing = useCanvasStore((state) => state.isResizing);
  const layoutVersion = useCanvasStore((state) => state.layoutVersion);
  const addConnection = useCanvasStore((state) => state.addConnection);
  const updateNode = useCanvasStore((state) => state.updateNode);
  const deleteNode = useCanvasStore((state) => state.deleteNode);
  const deleteConnection = useCanvasStore((state) => state.deleteConnection);
  const setSelection = useCanvasStore((state) => state.setSelection);
  const setSelectedConnection = useCanvasStore((state) => state.setSelectedConnection);
  const setDragOverFrame = useCanvasStore((state) => state.setDragOverFrame);
  const showGrid = useEditorStore((state) => state.showGrid);
  const tool = useEditorStore((state) => state.tool);
  const isExporting = useReactFlowStore((state) => state.isExporting);

  // Animation player
  useAnimationPlayer();

  // Convert store nodes to React Flow nodes
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Handle edge changes (including deletion)
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      onEdgesChange(changes);

      // Sync edge deletions to store
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteConnection(change.id);
        }
      });
    },
    [onEdgesChange, deleteConnection]
  );

  // Sync store nodes to React Flow nodes (memoized for performance)
  const flowNodes = useMemo(() => {
    // 构建父子关系映射
    const parentMap = new Map<string, string>(); // childId -> parentId
    storeNodes.forEach((node) => {
      if (node.type === 'frame' && (node as any).children) {
        const children = (node as any).children as string[];
        children.forEach((childId) => {
          parentMap.set(childId, node.id);
        });
      }
    });

    // 渲染所有节点（包括子节点）
    return storeNodes.map((node) => {
      // 检查是否是子节点
      const parentId = parentMap.get(node.id);
      const isChildNode = !!parentId;

      // 设置 z-index: Frame=1, Edges=2, Child Nodes=3
      let zIndex: number;
      if (node.type === 'frame') {
        zIndex = 1;
      } else {
        zIndex = 3;
      }

      const baseNode: any = {
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node,
          hideHandles: false,
          isChildNode,
        },
        selected: selectedIds.includes(node.id),
        draggable: !isResizing,
        zIndex,
      };

      // 如果是子节点，设置 parentNode（extent 稍后设置）
      if (isChildNode) {
        baseNode.parentNode = parentId;
        baseNode.draggable = true; // 子节点始终可拖拽
      }

      // Set width and height for nodes
      // Tech 节点默认尺寸 - 所有非 Basic 节点都是 Tech 节点
      const basicNodeTypes = ['frame', 'text', 'image'];
      const isTechNode = !basicNodeTypes.includes(node.type);

      if (node.type === 'frame') {
        // Frame 节点：node.height 存储的是 React Flow 节点的总高度（包含 label）
        // 如果没有设置过高度，使用默认值并加上 label 高度
        const hasVisibleLabel = node.showLabel !== false && node.label;
        const labelHeight = hasVisibleLabel ? 30 : 0;
        const frameHeight = node.height !== undefined ? node.height : 200 + labelHeight;
        const frameWidth = node.width !== undefined ? node.width : 300;
        baseNode.style = {
          width: frameWidth,
          height: frameHeight,
        };
        baseNode.measured = {
          width: frameWidth,
          height: frameHeight,
        };
      } else if (node.width !== undefined && node.height !== undefined) {
        // 其他节点有明确的 width/height
        baseNode.style = {
          width: node.width,
          height: node.height,
        };
        baseNode.measured = {
          width: node.width,
          height: node.height,
        };
      } else if (isTechNode) {
        baseNode.style = {
          width: 85,
          height: 100,
        };
        baseNode.measured = {
          width: 85,
          height: 100,
        };
      }

      // 如果是子节点，设置 extent（在尺寸确定后）
      if (isChildNode && baseNode.parentNode) {
        const parentNode = storeNodes.find((n) => n.id === parentId);
        const padding = (parentNode as any)?.padding || 16;
        const parentWidth = parentNode?.width || 300;
        // parentHeight 现在是 React Flow 节点的总高度（包含 label）
        const parentHeight = parentNode?.height || 200;

        // 检查父节点是否有可见 label
        const parentHasVisibleLabel =
          parentNode?.type === 'frame' &&
          (parentNode as any).showLabel !== false &&
          (parentNode as any).label;
        const labelOffset = parentHasVisibleLabel ? 30 : 0;

        // 获取当前节点的实际尺寸
        const nodeWidth = baseNode.measured?.width || baseNode.style?.width || 85;
        const nodeHeight = baseNode.measured?.height || baseNode.style?.height || 85;

        // 计算边界 - 子节点 y 坐标是相对于 FrameNode 外层容器的
        // minY: 从 label 下方 + padding 开始
        // maxY: Frame 总高度 - 节点高度 - padding（parentHeight 已经是总高度）
        const minX = padding;
        const minY = labelOffset + padding;
        const maxX = Math.max(minX, parentWidth - nodeWidth - padding);
        const maxY = Math.max(minY, parentHeight - nodeHeight - padding);

        // 使用数组形式的 extent，指定具体的边界（考虑 padding）
        baseNode.extent = [
          [minX, minY], // 左上角 [x, y]
          [maxX, maxY], // 右下角 [x, y]
        ];
      }

      return baseNode;
    });
  }, [storeNodes, selectedIds, isResizing]);

  // 关键修复: 只在节点 ID 或数量变化时同步
  useEffect(() => {
    // 如果正在 resize,不要同步!避免干扰 ReactFlow 的 resize 过程
    if (isResizing) {
      return;
    }

    // 只比较节点 ID,避免无限循环
    const flowNodeIds = flowNodes
      .map((n) => n.id)
      .sort()
      .join(',');
    const currentNodeIds = nodes
      .map((n) => n.id)
      .sort()
      .join(',');

    // 只有当节点 ID 变化时才更新
    if (flowNodeIds !== currentNodeIds) {
      setNodes((currentNodes) => {
        // 创建位置映射
        const positionMap = new Map(currentNodes.map((n) => [n.id, n.position]));

        // 使用 flowNodes 作为基础,但保留 ReactFlow 的位置
        return flowNodes.map((flowNode) => {
          const existingPosition = positionMap.get(flowNode.id);
          return {
            ...flowNode,
            position: existingPosition || flowNode.position, // 保留 ReactFlow 的位置
          };
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowNodes, isResizing]);

  // 同步节点尺寸和位置变化（当 Frame 的 width/height 或 padding 变化时，或子节点位置变化时）
  useEffect(() => {
    if (isResizing) return;

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const flowNode = flowNodes.find((fn) => fn.id === node.id);
        if (!flowNode) return node;

        // 检查尺寸、位置、extent 是否变化
        const widthChanged = flowNode.style?.width !== node.style?.width;
        const heightChanged = flowNode.style?.height !== node.style?.height;
        const extentChanged = JSON.stringify(flowNode.extent) !== JSON.stringify(node.extent);
        const positionChanged =
          flowNode.position.x !== node.position.x || flowNode.position.y !== node.position.y;

        // 只同步子节点的位置，不同步 Frame 的位置（避免 Frame 跳回原位置）
        const isChildNode = !!flowNode.parentNode;
        const shouldUpdatePosition = isChildNode && positionChanged;

        if (widthChanged || heightChanged || extentChanged || shouldUpdatePosition) {
          return {
            ...node,
            position: shouldUpdatePosition ? flowNode.position : node.position,
            style: flowNode.style,
            measured: flowNode.measured,
            extent: flowNode.extent,
          };
        }

        return node;
      })
    );
  }, [flowNodes, isResizing, setNodes]);

  // 强制同步节点位置变化（仅用于 Auto Layout 等主动布局操作）
  // 监听 layoutVersion，只有在 Auto Layout 时才触发同步
  useEffect(() => {
    if (layoutVersion === 0 || isResizing) {
      return;
    }

    setNodes((currentNodes) => {
      return currentNodes.map((node) => {
        const storeNode = storeNodes.find((n) => n.id === node.id);
        if (!storeNode) return node;

        const currentPosition = node.position;
        const storePosition = storeNode.position;

        const positionChanged =
          currentPosition.x !== storePosition.x || currentPosition.y !== storePosition.y;

        if (positionChanged) {
          return {
            ...node,
            position: storePosition,
          };
        }

        return node;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutVersion, isResizing]);

  // 🔥 同步 storeNodes 到 React Flow（包括父子关系）
  // 只在节点数量变化、节点类型变化、或父子关系变化时更新
  const nodeStructureKey = useMemo(() => {
    return storeNodes
      .map((n) => {
        const children = n.type === 'frame' ? (n as any).children || [] : [];
        return `${n.id}:${n.type}:${children.join(',')}`;
      })
      .join('|');
  }, [storeNodes]);

  useEffect(() => {
    if (isResizing) return;

    setNodes((currentNodes) => {
      // 检查是否需要更新
      const needsUpdate =
        currentNodes.length !== flowNodes.length ||
        flowNodes.some((flowNode, index) => {
          const currentNode = currentNodes[index];
          if (!currentNode || currentNode.id !== flowNode.id) return true;

          // 检查 parentNode 是否变化
          const currentParent = (currentNode as any).parentNode;
          const flowParent = (flowNode as any).parentNode;
          if (currentParent !== flowParent) return true;

          // 检查选中状态是否变化
          if (currentNode.selected !== flowNode.selected) return true;

          return false;
        });

      if (needsUpdate) {
        return flowNodes;
      }

      return currentNodes;
    });
  }, [nodeStructureKey, isResizing, setNodes, selectedIds, flowNodes]);

  // Custom onNodesChange handler to sync changes to store
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // 关键: 先应用到 ReactFlow,让 ReactFlow 处理所有变化
      onNodesChange(changes);

      // 如果正在 resize,不要同步到 store!让 ReactFlow 完全控制
      if (isResizing) {
        return;
      }

      // 然后同步特定类型的变化到 store（延迟到下一个事件循环）
      setTimeout(() => {
        changes.forEach((change) => {
          // 同步尺寸变化
          if (change.type === 'dimensions' && change.dimensions) {
            const node = storeNodes.find((n) => n.id === change.id);
            if (node) {
              // 直接存储 React Flow 节点的高度（Frame 节点包含 label 高度）
              updateNode(change.id, {
                width: change.dimensions.width,
                height: change.dimensions.height,
              });

              // 如果是 Frame 节点，调整子节点位置（使用 setNodes）
              if (node.type === 'frame') {
                const children = (node as any).children || [];
                const newWidth = change.dimensions!.width;
                const newHeight = change.dimensions!.height;
                const padding = (node as any).padding || 16;
                const hasVisibleLabel = (node as any).showLabel !== false && (node as any).label;
                const labelOffset = hasVisibleLabel ? 30 : 0;

                // 使用 setNodes 批量更新子节点位置
                setNodes((nds) =>
                  nds.map((n) => {
                    if (!children.includes(n.id)) return n;

                    const childNode = storeNodes.find((sn) => sn.id === n.id);
                    if (!childNode) return n;

                    const childWidth = childNode.width || 85;
                    const childHeight = childNode.height || 85;

                    // 检查子节点是否超出边界
                    let newX = childNode.position.x;
                    let newY = childNode.position.y;

                    // 确保子节点不超出右边界
                    if (newX + childWidth > newWidth - padding) {
                      newX = Math.max(padding, newWidth - childWidth - padding);
                    }

                    // 确保子节点不超出下边界（考虑 label 高度）
                    if (newY + childHeight > newHeight - padding) {
                      newY = Math.max(labelOffset + padding, newHeight - childHeight - padding);
                    }

                    // 确保子节点不超出左边界
                    if (newX < padding) {
                      newX = padding;
                    }

                    // 确保子节点不超出上边界（考虑 label 高度）
                    if (newY < labelOffset + padding) {
                      newY = labelOffset + padding;
                    }

                    // 如果位置改变，更新节点
                    if (newX !== childNode.position.x || newY !== childNode.position.y) {
                      // 同时更新 store
                      updateNode(n.id, {
                        position: { x: newX, y: newY },
                      });

                      return {
                        ...n,
                        position: { x: newX, y: newY },
                      };
                    }

                    return n;
                  })
                );
              }
            }
          }
          // 同步位置变化 (通过 onNodeDragStop 处理)
          if (change.type === 'position' && change.position) {
            // Position updates are now handled in onNodeDragStop
            // This prevents duplicate updates and ensures proper timing
          }
        });
      }, 0);
    },
    [onNodesChange, storeNodes, updateNode, isResizing, setNodes]
  );

  // 父子关系现在由 handleNodeDragStop 处理,不需要额外的 useEffect

  // Sync store connections to React Flow edges (memoized for performance)
  const flowEdges = useMemo(() => {
    return connections.map((conn) => {
      const edgeColor = conn.color || '#00f0ff';
      const lineStyle = conn.lineStyle || 'solid';
      const edgeType = conn.edgeType || 'smoothstep';
      const glowEnabled = conn.glowEnabled !== false;

      // Check if this connection has pathDrawing or pathFlow animation
      const hasPathAnimation =
        (conn as any).animationEffects?.pathDrawing || (conn as any).animationEffects?.pathFlow;

      // Check if connected nodes have pathDrawing or pathFlow animation
      const fromNode = nodes.find((n) => n.id === conn.from) as any;
      const toNode = nodes.find((n) => n.id === conn.to) as any;
      const nodesHavePathAnimation =
        fromNode?.animationEffects?.pathDrawing ||
        fromNode?.animationEffects?.pathFlow ||
        toNode?.animationEffects?.pathDrawing ||
        toNode?.animationEffects?.pathFlow;

      // Disable ReactFlow's animated property if path animation is active
      const shouldAnimate = lineStyle === 'dashed' && !hasPathAnimation && !nodesHavePathAnimation;

      return {
        id: conn.id,
        source: conn.from,
        target: conn.to,
        sourceHandle: conn.fromAnchor || 'right',
        targetHandle: conn.toAnchor || 'left',
        type: 'custom',
        animated: shouldAnimate,
        selectable: true,
        focusable: true,
        zIndex: 2, // Edges z-index = 2 (Frame=1, Edges=2, Nodes=3)
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: edgeColor,
        },
        style: {
          strokeWidth: 3,
          stroke: edgeColor,
          strokeDasharray: lineStyle === 'dashed' ? '5,5' : '0',
          filter: glowEnabled ? `drop-shadow(0 0 8px ${edgeColor})` : 'none',
          cursor: 'pointer',
        },
        label: conn.label,
        labelStyle: {
          fill: '#ffffff',
          fontSize: 10,
          fontWeight: 500,
        },
        data: {
          edgeType,
          showLabel: conn.showLabel !== false,
        },
      };
    });
  }, [connections, nodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  // Handle node drag - check if dragging over a frame
  const handleNodeDrag = useCallback(
    (_event: unknown, node: Node) => {
      if (!node || !node.id) {
        setDragOverFrame(null);
        return;
      }

      const draggedNode = storeNodes.find((n) => n.id === node.id);
      if (!draggedNode) {
        setDragOverFrame(null);
        return;
      }

      // 如果是子节点，限制在父节点的 padding 范围内
      const reactFlowNode = nodes.find((n) => n.id === node.id);
      const parentId = (reactFlowNode as any)?.parentNode;

      if (parentId) {
        const parentNode = storeNodes.find((n) => n.id === parentId);

        if (parentNode) {
          const padding = (parentNode as any)?.padding || 16;
          const parentWidth = parentNode.width || 300;
          // parentHeight 现在是 React Flow 节点的总高度（包含 label）
          const parentHeight = parentNode.height || 200;
          const nodeWidth = draggedNode.width || 85;
          const nodeHeight = draggedNode.height || 85;

          // 检查父节点是否有可见 label
          const parentHasVisibleLabel =
            parentNode.type === 'frame' &&
            (parentNode as any).showLabel !== false &&
            (parentNode as any).label;
          const labelOffset = parentHasVisibleLabel ? 30 : 0;

          // 计算边界 - 子节点 y 坐标是相对于 FrameNode 外层容器的
          // parentHeight 已经是总高度，不需要再加 labelOffset
          const minX = padding;
          const minY = labelOffset + padding;
          const maxX = Math.max(minX, parentWidth - nodeWidth - padding);
          const maxY = Math.max(minY, parentHeight - nodeHeight - padding);

          // 限制位置
          let newX = node.position.x;
          let newY = node.position.y;

          if (newX < minX) newX = minX;
          if (newX > maxX) newX = maxX;
          if (newY < minY) newY = minY;
          if (newY > maxY) newY = maxY;

          // 如果位置被限制，更新节点位置
          if (newX !== node.position.x || newY !== node.position.y) {
            setNodes((nds) =>
              nds.map((n) => (n.id === node.id ? { ...n, position: { x: newX, y: newY } } : n))
            );
          }
        }

        // 子节点不需要检测 Frame hover
        setDragOverFrame(null);
        return;
      }

      // 如果是 Frame 节点，不需要检测 hover
      if (draggedNode.type === 'frame') {
        setDragOverFrame(null);
        return;
      }

      // 从 ReactFlow 的 nodes 状态获取 Frame 的实时位置
      const frameNodesInReactFlow = nodes.filter((n) => n.type === 'frame');

      // Check if node is over any frame
      let foundFrame: string | null = null;
      for (const frameNode of frameNodesInReactFlow) {
        if (frameNode.id === node.id) continue;

        // 使用 ReactFlow 的实时位置
        const nodeX = node.position.x;
        const nodeY = node.position.y;

        const measuredNode = node as any;
        const measuredFrameNode = frameNode as any;

        const nodeWidth = (measuredNode.measured?.width || draggedNode.width || 180) as number;
        const nodeHeight = (measuredNode.measured?.height || draggedNode.height || 85) as number;

        // 使用 ReactFlow Frame 的实时位置和尺寸
        const frameX = frameNode.position.x;
        const frameY = frameNode.position.y;
        const frameWidth = (measuredFrameNode.measured?.width || 300) as number;
        const frameHeight = (measuredFrameNode.measured?.height || 200) as number;

        const nodeCenterX = nodeX + nodeWidth / 2;
        const nodeCenterY = nodeY + nodeHeight / 2;

        const isOver =
          nodeCenterX >= frameX &&
          nodeCenterX <= frameX + frameWidth &&
          nodeCenterY >= frameY &&
          nodeCenterY <= frameY + frameHeight;

        if (isOver) {
          foundFrame = frameNode.id;
          break;
        }
      }

      setDragOverFrame(foundFrame);
    },
    [storeNodes, nodes, setDragOverFrame, setNodes]
  );

  // Handle node drag end - check if node should be added to a Frame
  const handleNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      // 从 React Flow 的 nodes 状态中获取节点（包含 parentNode 信息）
      const reactFlowNode = nodes.find((n) => n.id === node.id);

      // Clear drag over state
      setDragOverFrame(null);

      // 检查节点是否被拖入 Frame
      const droppedNode = storeNodes.find((n) => n.id === node.id);
      if (!droppedNode) {
        return;
      }

      // Frame 节点不能嵌套，但需要更新位置
      if (droppedNode.type === 'frame') {
        updateNode(node.id, {
          position: node.position,
        });
        return;
      }

      // 检查节点是否已经有父节点（从 React Flow 状态中获取）
      const currentParentId = (reactFlowNode as any)?.parentNode;

      // 如果节点已经是子节点，直接保存相对位置
      if (currentParentId) {
        updateNode(node.id, {
          position: node.position,
        });
        return;
      }

      // 找到所有 Frame 节点
      const frameNodes = storeNodes.filter((n) => n.type === 'frame');

      for (const frame of frameNodes) {
        if (frame.id === node.id) continue; // Skip self

        // 关键修复: 如果节点已经有父节点,它的 position 是相对于父节点的
        // 我们需要使用 ReactFlow 节点的实际屏幕位置
        const flowNode = nodes.find((n) => n.id === node.id);
        const flowFrame = nodes.find((n) => n.id === frame.id);

        if (!flowNode || !flowFrame) continue;

        // 使用 ReactFlow 节点的位置(这是屏幕上的实际位置)
        const nodeX = flowNode.position.x;
        const nodeY = flowNode.position.y;
        const nodeWidth = flowNode.width || 180;
        const nodeHeight = flowNode.height || 85;

        const frameX = flowFrame.position.x;
        const frameY = flowFrame.position.y;
        const frameWidth = flowFrame.width || 180;
        const frameHeight = flowFrame.height || 85;

        const nodeCenterX = nodeX + nodeWidth / 2;
        const nodeCenterY = nodeY + nodeHeight / 2;

        const isInside =
          nodeCenterX >= frameX &&
          nodeCenterX <= frameX + frameWidth &&
          nodeCenterY >= frameY &&
          nodeCenterY <= frameY + frameHeight;

        if (isInside) {
          // 如果节点已经在这个 Frame 中,不需要重复添加
          const currentChildren = (frame as any).children || [];
          const framePadding = (frame as any).padding || 16;

          // 检查 Frame 是否有可见 label
          const frameHasVisibleLabel = (frame as any).showLabel !== false && (frame as any).label;
          const labelOffset = frameHasVisibleLabel ? 30 : 0;

          if (currentChildren.includes(node.id)) {
            // 节点已经在这个 Frame 中，只需要更新位置（确保四周有 padding）
            let relativeX = nodeX - frameX;
            let relativeY = nodeY - frameY;

            // 确保左边有 padding
            if (relativeX < framePadding) {
              relativeX = framePadding;
            }

            // 确保上边有 padding（考虑 label 偏移）
            if (relativeY < labelOffset + framePadding) {
              relativeY = labelOffset + framePadding;
            }

            // 确保右边有 padding
            if (relativeX + nodeWidth > frameWidth - framePadding) {
              relativeX = frameWidth - nodeWidth - framePadding;
            }

            // 确保下边有 padding（frameHeight 已经包含 labelOffset）
            if (relativeY + nodeHeight > frameHeight - framePadding) {
              relativeY = frameHeight - nodeHeight - framePadding;
            }

            updateNode(node.id, {
              position: { x: relativeX, y: relativeY },
            });
            return;
          }

          // 如果节点在另一个 Frame 中,先从那个 Frame 移除
          if (currentParentId && currentParentId !== frame.id) {
            const oldParent = storeNodes.find((n) => n.id === currentParentId);
            if (oldParent && oldParent.type === 'frame') {
              const oldChildren = (oldParent as any).children || [];
              updateNode(currentParentId, {
                children: oldChildren.filter((id: string) => id !== node.id),
              });
            }
          }

          // 添加到新的 Frame（不自动调整尺寸，由用户手动调整）
          const newChildren = [...currentChildren, node.id];

          updateNode(frame.id, {
            children: newChildren,
          });

          // 转换节点位置为相对于 Frame 的坐标，并确保四周都有 padding
          let relativeX = nodeX - frameX;
          let relativeY = nodeY - frameY;

          // 确保左边有 padding
          if (relativeX < framePadding) {
            relativeX = framePadding;
          }

          // 确保上边有 padding（考虑 label 偏移）
          if (relativeY < labelOffset + framePadding) {
            relativeY = labelOffset + framePadding;
          }

          // 确保右边有 padding
          if (relativeX + nodeWidth > frameWidth - framePadding) {
            relativeX = frameWidth - nodeWidth - framePadding;
          }

          // 确保下边有 padding（frameHeight 已经包含 labelOffset）
          if (relativeY + nodeHeight > frameHeight - framePadding) {
            relativeY = frameHeight - nodeHeight - framePadding;
          }

          updateNode(node.id, {
            position: { x: relativeX, y: relativeY },
          });

          return; // 只添加到第一个匹配的 Frame
        }
      }

      // 如果节点不在任何 Frame 内,但之前有父节点,则从父节点移除
      if (currentParentId) {
        const oldParent = storeNodes.find((n) => n.id === currentParentId);
        if (oldParent && oldParent.type === 'frame') {
          const oldChildren = (oldParent as any).children || [];
          if (oldChildren.includes(node.id)) {
            updateNode(currentParentId, {
              children: oldChildren.filter((id: string) => id !== node.id),
            });
          }
        }
      }

      // Save the node's new position to store
      updateNode(node.id, {
        position: node.position,
      });
    },
    [setDragOverFrame, storeNodes, updateNode, nodes]
  );

  // 跟踪连接的起点，用于确定真实的拖拽方向
  const connectStartRef = useRef<{ nodeId: string; handleId: string | null } | null>(null);

  const onConnectStart = useCallback(
    (_: any, params: { nodeId: string | null; handleId: string | null }) => {
      if (params.nodeId) {
        connectStartRef.current = { nodeId: params.nodeId, handleId: params.handleId };
      }
    },
    []
  );

  const onConnectEnd = useCallback(() => {
    connectStartRef.current = null;
  }, []);

  // Handle new connection
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceId = params.source!;
      const targetId = params.target!;
      const sourceHandle = params.sourceHandle;
      const targetHandle = params.targetHandle;

      // 使用 connectStartRef 来确定真实的拖拽起点
      let actualFrom = sourceId;
      let actualTo = targetId;
      let actualFromAnchor = sourceHandle;
      let actualToAnchor = targetHandle;

      if (connectStartRef.current) {
        const dragStartNodeId = connectStartRef.current.nodeId;

        // 如果拖拽起点和 React Flow 的 source 不一致，说明 React Flow 调整了方向
        if (dragStartNodeId !== sourceId) {
          actualFrom = targetId;
          actualTo = sourceId;
          actualFromAnchor = targetHandle;
          actualToAnchor = sourceHandle;
        }
      }

      // 检查是否已经存在这两个节点之间的连接（任意方向）
      const existingConnection = connections.find(
        (conn) =>
          (conn.from === actualFrom && conn.to === actualTo) ||
          (conn.from === actualTo && conn.to === actualFrom)
      );

      // 如果存在旧连接，先删除
      if (existingConnection) {
        deleteConnection(existingConnection.id);
      }

      // 创建新连接，使用修正后的方向
      addConnection({
        id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        from: actualFrom,
        to: actualTo,
        fromAnchor: actualFromAnchor as any,
        toAnchor: actualToAnchor as any,
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      });
    },
    [addConnection, deleteConnection, connections]
  );

  // Handle node selection
  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      // Only update node selection, don't interfere with edge selection
      if (nodes.length > 0) {
        setSelection(nodes.map((node) => node.id));
      }
    },
    [setSelection]
  );

  // Handle node click - ensure child nodes can be selected
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelection([node.id]);
    },
    [setSelection]
  );

  // Handle canvas click (deselect all)
  const onPaneClick = useCallback(() => {
    setSelection([]);
    setSelectedConnection(null);
  }, [setSelection, setSelectedConnection]);

  // Handle edge click (select connection)
  const onEdgeClick = useCallback(
    (_event: any, edge: Edge) => {
      setSelectedConnection(edge.id);
    },
    [setSelectedConnection]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否在输入框中
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Backspace 删除选中的节点
      if (e.key === 'Backspace' && selectedIds.length > 0) {
        e.preventDefault();
        selectedIds.forEach((id) => deleteNode(id));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteNode]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        elementsSelectable
        elevateNodesOnSelect={false}
        fitView={false}
        minZoom={0.1}
        maxZoom={4}
        className="bg-[#373737]"
        proOptions={{ hideAttribution: true }}
        nodesDraggable={tool === 'pointer'}
        nodesConnectable
        nodesFocusable
        edgesFocusable
        autoPanOnNodeDrag={false}
        autoPanOnConnect={false}
        panOnDrag={tool === 'hand'}
        selectionOnDrag={tool === 'pointer'}
        zoomOnScroll
        zoomOnPinch
        panOnScroll={false}
        preventScrolling
        zoomActivationKeyCode={null}
        deleteKeyCode={null}
        onlyRenderVisibleElements={!isExporting}
      >
        {showGrid && <Background color="#4a4a5a" gap={20} size={2} style={{ opacity: 0.8 }} />}
        <ZoomControls />
        <ReactFlowInstanceSync />
      </ReactFlow>
    </div>
  );
}
