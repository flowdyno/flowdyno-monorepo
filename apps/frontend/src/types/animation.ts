export type AnimationType = 'path' | 'pulse' | 'fade' | 'scale';

export type EasingFunction = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export interface AnimationConfig {
  id: string;
  targetId: string; // Node ID or Connection ID
  type: AnimationType;
  duration: number; // milliseconds
  delay: number; // milliseconds
  easing: EasingFunction;
  loop?: boolean;
}

export interface AnimationSettings {
  enabled: boolean;
  duration?: number; // Optional: for backward compatibility
  speed: AnimationSpeed; // Animation playback speed (slow/normal/fast)
  loop: boolean; // Whether to loop the animation playback
  effects: {
    pathDrawing: boolean;
    nodePulse: boolean;
    fadeIn: boolean;
    circuitPulse: boolean;
    rotate: boolean;
    flip3D: boolean;
    chargingBar: boolean;
    shake: boolean;
    pathFlow: boolean;
  };
}

export interface AnimationState {
  animations: AnimationConfig[];
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  settings: AnimationSettings;
}
