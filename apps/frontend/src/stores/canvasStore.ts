import { create } from 'zustand';
import { Node, Connection, Viewport, FrameNode } from '../types/canvas';
import { autoLayoutNodes } from '../utils/autoLayout';
import type { LayoutOptions } from '../utils/autoLayout';
import { smartGraphLayout } from '../utils/graphLayout';
import { calculateFrameLayout } from '../utils/frameLayout';

interface CanvasStore {
  // State
  nodes: Node[];
  connections: Connection[];
  selectedIds: string[];
  selectedConnectionId: string | null;
  viewport: Viewport;
  dragOverFrameId: string | null; // ID of frame being dragged over
  isResizing: boolean; // 是否正在 resize
  layoutVersion: number; // Auto Layout 版本号，每次布局时递增

  // Actions
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  removeChildFromFrame: (childId: string, frameId: string) => void;
  addConnection: (connection: Connection) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;
  setSelection: (ids: string[]) => void;
  setSelectedConnection: (id: string | null) => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  setDragOverFrame: (id: string | null) => void;
  setIsResizing: (isResizing: boolean) => void; // 设置 resize 状态
  clearCanvas: () => void;
  loadData: (nodes: Node[], connections: Connection[]) => void;
  applyAutoLayout: (options?: LayoutOptions) => void; // 应用自动布局
  applySmartLayout: (diagramType?: 'architecture' | 'flowchart' | 'roadmap') => void; // 智能布局
  recalculateFrames: () => void; // 重新计算所有 Frame 的尺寸和子节点位置
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  // Initial state
  nodes: [],
  connections: [],
  selectedIds: [],
  selectedConnectionId: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  dragOverFrameId: null,
  isResizing: false,
  layoutVersion: 0,

  // Actions
  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? ({ ...node, ...updates } as Node) : node
      ) as Node[],
    })),

  deleteNode: (id) =>
    set((state) => {
      const nodeToDelete = state.nodes.find((node) => node.id === id);
      if (!nodeToDelete) return state;

      // 检查是否是某个 Frame 的子节点
      const parentFrame = state.nodes.find(
        (node) => node.type === 'frame' && (node as any).children?.includes(id)
      );

      if (parentFrame) {
        // 如果是子节点,从父节点的 children 中移除,并删除节点本身
        const updatedChildren = ((parentFrame as any).children || []).filter(
          (childId: string) => childId !== id
        );

        // TODO: 自动计算 Frame 尺寸的逻辑已注释，改用 sub-flows 后由用户手动调整 Frame 大小
        // const childNodes = state.nodes.filter((n) => updatedChildren.includes(n.id));
        // const padding = (parentFrame as any).padding || 16;
        // const gap = (parentFrame as any).gap || 8;
        // const layout = (parentFrame as any).layout || 'flex-row';
        // let newWidth = parentFrame.width || 300;
        // let newHeight = parentFrame.height || 200;
        // ... 计算逻辑 ...

        return {
          nodes: state.nodes
            .filter((node) => node.id !== id)
            .map((node) =>
              node.id === parentFrame.id ? { ...node, children: updatedChildren } : node
            ),
          connections: state.connections.filter((conn) => conn.from !== id && conn.to !== id),
          selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
        };
      }

      // 如果不是子节点,正常删除
      // 如果删除的是 Frame,也删除它的所有子节点
      let nodesToDelete = [id];
      if (nodeToDelete.type === 'frame' && (nodeToDelete as any).children) {
        nodesToDelete = [id, ...((nodeToDelete as any).children || [])];
      }

      return {
        nodes: state.nodes.filter((node) => !nodesToDelete.includes(node.id)),
        connections: state.connections.filter(
          (conn) => !nodesToDelete.includes(conn.from) && !nodesToDelete.includes(conn.to)
        ),
        selectedIds: state.selectedIds.filter((selectedId) => !nodesToDelete.includes(selectedId)),
      };
    }),

  removeChildFromFrame: (childId, frameId) =>
    set((state) => {
      const parentFrame = state.nodes.find((node) => node.id === frameId);
      if (!parentFrame || parentFrame.type !== 'frame') return state;

      const updatedChildren = ((parentFrame as any).children || []).filter(
        (id: string) => id !== childId
      );

      // TODO: 自动计算 Frame 尺寸的逻辑已注释，改用 sub-flows 后由用户手动调整 Frame 大小
      // const childNodes = state.nodes.filter((n) => updatedChildren.includes(n.id));
      // const padding = (parentFrame as any).padding || 16;
      // const gap = (parentFrame as any).gap || 8;
      // const layout = (parentFrame as any).layout || 'flex-row';
      // let newWidth = parentFrame.width || 300;
      // let newHeight = parentFrame.height || 200;
      // ... 计算逻辑 ...

      return {
        nodes: state.nodes.map((node) =>
          node.id === frameId ? { ...node, children: updatedChildren } : node
        ),
      };
    }),

  addConnection: (connection) =>
    set((state) => ({
      connections: [...state.connections, connection],
    })),

  updateConnection: (id, updates) =>
    set((state) => ({
      connections: state.connections.map((conn) =>
        conn.id === id ? { ...conn, ...updates } : conn
      ),
    })),

  deleteConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== id),
    })),

  setSelection: (ids) => set({ selectedIds: ids, selectedConnectionId: null }),

  setSelectedConnection: (id) => set({ selectedConnectionId: id, selectedIds: [] }),

  setViewport: (viewport) =>
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    })),

  setDragOverFrame: (id) => set({ dragOverFrameId: id }),

  setIsResizing: (isResizing) => set({ isResizing }), // 设置 resize 状态

  clearCanvas: () =>
    set({
      nodes: [],
      connections: [],
      selectedIds: [],
    }),

  loadData: (nodes, connections) =>
    set((state) => {
      // Keep width and height from imported data
      const processedNodes = nodes.map((node) => node as Node);

      return {
        nodes: processedNodes,
        connections,
        selectedIds: [],
        layoutVersion: state.layoutVersion + 1,
      };
    }),

  // 应用自动布局
  applyAutoLayout: (options?: LayoutOptions) =>
    set((state) => {
      const layoutedNodes = autoLayoutNodes(state.nodes, state.connections, options);
      return {
        nodes: layoutedNodes,
        layoutVersion: state.layoutVersion + 1,
      };
    }),

  // 智能布局
  applySmartLayout: (diagramType?: 'architecture' | 'flowchart' | 'roadmap') =>
    set((state) => {
      if (state.nodes.length === 0) {
        return state;
      }

      const layoutedNodes = smartGraphLayout(state.nodes, state.connections, diagramType);
      return {
        nodes: layoutedNodes,
        layoutVersion: state.layoutVersion + 1,
      };
    }),

  // 重新计算所有 Frame 的尺寸和子节点位置
  recalculateFrames: () =>
    set((state) => {
      const frameNodes = state.nodes.filter((n) => n.type === 'frame') as FrameNode[];
      if (frameNodes.length === 0) return state;

      let updatedNodes = [...state.nodes];

      frameNodes.forEach((frame) => {
        const children = frame.children || [];
        if (children.length === 0) return;

        const childNodes = updatedNodes.filter((n) => children.includes(n.id));
        if (childNodes.length === 0) return;

        const { width, height, childPositions } = calculateFrameLayout(frame, childNodes);

        updatedNodes = updatedNodes.map((n) => (n.id === frame.id ? { ...n, width, height } : n));

        updatedNodes = updatedNodes.map((n) => {
          const newPos = childPositions.get(n.id);
          if (newPos) {
            return { ...n, position: newPos };
          }
          return n;
        });
      });

      return {
        nodes: updatedNodes,
        layoutVersion: state.layoutVersion + 1,
      };
    }),
}));
