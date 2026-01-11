import { create } from 'zustand';
import { ConnectionPoint } from '../types/canvas';

type EditorMode = 'select' | 'pan' | 'draw';
type EditorTool = 'pointer' | 'hand' | 'connection';
type Theme = 'dark-neon' | 'light';

interface ConnectionDrawing {
  isDrawing: boolean;
  startNodeId: string | null;
  startPoint: { x: number; y: number } | null;
  startAnchor: ConnectionPoint | null; // Which connection point was clicked
  currentPoint: { x: number; y: number } | null;
}

interface EditorStore {
  // State
  mode: EditorMode;
  tool: EditorTool;
  theme: Theme;
  showGrid: boolean;
  gridSize: number;
  connectionDrawing: ConnectionDrawing;

  // Actions
  setMode: (mode: EditorMode) => void;
  setTool: (tool: EditorTool) => void;
  setTheme: (theme: Theme) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  startConnectionDrawing: (
    nodeId: string,
    point: { x: number; y: number },
    anchor: ConnectionPoint
  ) => void;
  updateConnectionDrawing: (point: { x: number; y: number }) => void;
  endConnectionDrawing: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  // Initial state
  mode: 'select',
  tool: 'pointer',
  theme: 'dark-neon',
  showGrid: true,
  gridSize: 20,
  connectionDrawing: {
    isDrawing: false,
    startNodeId: null,
    startPoint: null,
    startAnchor: null,
    currentPoint: null,
  },

  // Actions
  setMode: (mode) => set({ mode }),
  setTool: (tool) => set({ tool }),
  setTheme: (theme) => set({ theme }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  setGridSize: (size) => set({ gridSize: size }),
  startConnectionDrawing: (nodeId, point, anchor) =>
    set({
      connectionDrawing: {
        isDrawing: true,
        startNodeId: nodeId,
        startPoint: point,
        startAnchor: anchor,
        currentPoint: point,
      },
    }),
  updateConnectionDrawing: (point) =>
    set((state) => ({
      connectionDrawing: {
        ...state.connectionDrawing,
        currentPoint: point,
      },
    })),
  endConnectionDrawing: () =>
    set({
      connectionDrawing: {
        isDrawing: false,
        startNodeId: null,
        startPoint: null,
        startAnchor: null,
        currentPoint: null,
      },
    }),
}));
