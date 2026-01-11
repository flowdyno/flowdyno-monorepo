import { create } from 'zustand';
import { AnimationConfig, AnimationSettings, AnimationSpeed } from '../types/animation';

interface AnimationStore {
  // State
  animations: AnimationConfig[];
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  settings: AnimationSettings;

  // Actions
  addAnimation: (animation: AnimationConfig) => void;
  updateAnimation: (id: string, updates: Partial<AnimationConfig>) => void;
  deleteAnimation: (id: string) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setCurrentTime: (time: number) => void;
  calculateTotalDuration: () => void;
  clearAnimations: () => void;

  // Settings Actions
  updateSettings: (updates: Partial<AnimationSettings>) => void;
  setDuration: (duration: number) => void;
  setSpeed: (speed: AnimationSpeed) => void;
  toggleEffect: (effect: keyof AnimationSettings['effects']) => void;
  toggleAnimations: () => void;
}

export const useAnimationStore = create<AnimationStore>((set) => ({
  // Initial state
  animations: [],
  isPlaying: false,
  currentTime: 0,
  totalDuration: 0,
  settings: {
    enabled: true,
    speed: 'normal',
    loop: true,
    effects: {
      pathDrawing: true,
      nodePulse: true,
      fadeIn: true,
      circuitPulse: true,
      rotate: false,
      flip3D: false,
      chargingBar: false,
      shake: false,
      pathFlow: false,
    },
  },

  // Actions
  addAnimation: (animation) =>
    set((state) => {
      const newAnimations = [...state.animations, animation];
      const maxEnd = Math.max(...newAnimations.map((a) => a.delay + a.duration));
      return {
        animations: newAnimations,
        totalDuration: maxEnd,
      };
    }),

  updateAnimation: (id, updates) =>
    set((state) => ({
      animations: state.animations.map((anim) => (anim.id === id ? { ...anim, ...updates } : anim)),
    })),

  deleteAnimation: (id) =>
    set((state) => ({
      animations: state.animations.filter((anim) => anim.id !== id),
    })),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ isPlaying: false, currentTime: 0 }),

  setCurrentTime: (time) => set({ currentTime: time }),

  calculateTotalDuration: () =>
    set((state) => {
      const maxEnd =
        state.animations.length > 0
          ? Math.max(...state.animations.map((a) => a.delay + a.duration))
          : 0;
      return { totalDuration: maxEnd };
    }),

  clearAnimations: () =>
    set({
      animations: [],
      isPlaying: false,
      currentTime: 0,
      totalDuration: 0,
    }),

  // Settings Actions
  updateSettings: (updates) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...updates,
        effects: updates.effects
          ? { ...state.settings.effects, ...updates.effects }
          : state.settings.effects,
      },
    })),

  setDuration: (duration) =>
    set((state) => ({
      settings: { ...state.settings, duration },
    })),

  setSpeed: (speed) =>
    set((state) => ({
      settings: { ...state.settings, speed },
    })),

  toggleEffect: (effect) =>
    set((state) => ({
      settings: {
        ...state.settings,
        effects: {
          ...state.settings.effects,
          [effect]: !state.settings.effects[effect],
        },
      },
    })),

  toggleAnimations: () =>
    set((state) => ({
      settings: {
        ...state.settings,
        enabled: !state.settings.enabled,
      },
    })),
}));
