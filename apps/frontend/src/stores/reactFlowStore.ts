import { create } from 'zustand';
import type { ReactFlowInstance, Viewport } from 'reactflow';

interface ReactFlowStore {
  instance: ReactFlowInstance | null;
  isExporting: boolean;
  setInstance: (instance: ReactFlowInstance | null) => void;
  setIsExporting: (isExporting: boolean) => void;
  fitView: (options?: { padding?: number; duration?: number }) => void;
  getViewport: () => Viewport | null;
  setViewport: (viewport: Viewport) => void;
}

export const useReactFlowStore = create<ReactFlowStore>((set, get) => ({
  instance: null,
  isExporting: false,

  setInstance: (instance) => set({ instance }),
  setIsExporting: (isExporting) => set({ isExporting }),

  fitView: (options) => {
    const { instance } = get();
    if (instance) {
      instance.fitView({
        padding: options?.padding ?? 0.2,
        duration: options?.duration ?? 0,
      });
    }
  },

  getViewport: () => {
    const { instance } = get();
    return instance?.getViewport() ?? null;
  },

  setViewport: (viewport) => {
    const { instance } = get();
    if (instance) {
      instance.setViewport(viewport);
    }
  },
}));
