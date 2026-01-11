/**
 * Animation configuration for FlowDyno
 * Shared between frontend and backend
 */

export type AnimationEffectType =
  | 'pulse'
  | 'fade-in'
  | 'circuit-pulse'
  | 'rotate'
  | 'flip3d'
  | 'chargingBar'
  | 'shake'
  | 'path'
  | 'flow';

export interface AnimationEffectConfig {
  key: AnimationEffectType;
  label: string;
  description: string;
  icon: string;
  category: 'single-node' | 'multi-node';
  requirements?: string;
}

/**
 * All available animation effects
 */
export const ANIMATION_EFFECTS: AnimationEffectConfig[] = [
  {
    key: 'pulse',
    label: 'Pulse',
    description: 'Scale pulsing effect',
    icon: '💓',
    category: 'single-node',
  },
  {
    key: 'fade-in',
    label: 'Fade In',
    description: 'Fade in/out effect',
    icon: '👻',
    category: 'single-node',
  },
  {
    key: 'circuit-pulse',
    label: 'Circuit Pulse',
    description: 'Circuit pulse border effect',
    icon: '⚡',
    category: 'single-node',
    requirements: "requires borderStyle to be 'solid' or 'dashed'",
  },
  {
    key: 'rotate',
    label: 'Rotate',
    description: 'Continuous rotation',
    icon: '🔄',
    category: 'single-node',
  },
  {
    key: 'flip3d',
    label: 'Flip 3D',
    description: '3D flip effect, like flipping a card in 3D space',
    icon: '🎴',
    category: 'single-node',
  },
  {
    key: 'chargingBar',
    label: 'Charging Bar',
    description: 'Charging progress bar effect, loops from left to right',
    icon: '🔋',
    category: 'single-node',
  },
  {
    key: 'shake',
    label: 'Shake',
    description: 'Shaking effect',
    icon: '📳',
    category: 'single-node',
  },
  {
    key: 'path',
    label: 'Path Drawing',
    description: 'Progress bar animation (shows data flow)',
    icon: '📊',
    category: 'multi-node',
    requirements: 'requires 2+ nodes in sequence',
  },
  {
    key: 'flow',
    label: 'Flow',
    description: 'Flowing particle animation (shows data flow)',
    icon: '🌊',
    category: 'multi-node',
    requirements: 'requires 2+ nodes in sequence',
  },
];

/**
 * Get single-node animation effects
 */
export function getSingleNodeAnimations(): AnimationEffectConfig[] {
  return ANIMATION_EFFECTS.filter((effect) => effect.category === 'single-node');
}

/**
 * Get multi-node animation effects
 */
export function getMultiNodeAnimations(): AnimationEffectConfig[] {
  return ANIMATION_EFFECTS.filter((effect) => effect.category === 'multi-node');
}

/**
 * Get animation effect by key
 */
export function getAnimationEffect(key: AnimationEffectType): AnimationEffectConfig | undefined {
  return ANIMATION_EFFECTS.find((effect) => effect.key === key);
}

/**
 * Format animation effects for AI prompt
 */
export function formatAnimationsForAI(): string {
  return ANIMATION_EFFECTS.map((effect, index) => {
    const requirements = effect.requirements ? ` (${effect.requirements})` : '';
    return `${index + 1}. ${effect.key} - ${effect.description}${requirements}`;
  }).join('\n');
}
