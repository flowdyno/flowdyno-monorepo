import { ANIMATION_EFFECTS } from '@flowdyno/shared-config';
import { NodeAnimationEffects } from '../../types/canvas';

// 映射 shared-config 的 key 到前端的 key
const KEY_MAPPING: Record<string, keyof NodeAnimationEffects> = {
  pulse: 'nodePulse',
  'fade-in': 'fadeIn',
  'circuit-pulse': 'circuitPulse',
  rotate: 'rotate',
  flip3d: 'flip3D',
  chargingBar: 'chargingBar',
  shake: 'shake',
  path: 'pathDrawing',
  flow: 'pathFlow',
};

// 映射 shared-config 的 key 到 CSS class
const PREVIEW_CLASS_MAPPING: Record<string, string> = {
  pulse: 'animate-pulse-demo',
  'fade-in': 'animate-fade-in-demo',
  'circuit-pulse': 'animate-circuit-pulse-demo',
  rotate: 'animate-rotate-demo',
  flip3d: 'animate-flip3d-demo',
  chargingBar: 'animate-charging-bar-demo',
  shake: 'animate-shake-demo',
  path: 'animate-path-demo',
  flow: 'animate-flow-demo',
};

interface AnimationEffect {
  key: keyof NodeAnimationEffects;
  label: string;
  icon: string;
  description: string;
  previewClass: string;
}

// 转换 shared-config 的配置到前端格式
const animationEffects: AnimationEffect[] = ANIMATION_EFFECTS.map((effect) => ({
  key: KEY_MAPPING[effect.key],
  label: effect.label,
  icon: effect.icon,
  description: effect.description,
  previewClass: PREVIEW_CLASS_MAPPING[effect.key],
}));

interface AnimationEffectSelectorProps {
  selectedEffects: NodeAnimationEffects;
  onToggleEffect: (key: keyof NodeAnimationEffects) => void;
  disabled?: boolean;
}

export default function AnimationEffectSelector({
  selectedEffects,
  onToggleEffect,
  disabled = false,
}: AnimationEffectSelectorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs text-gray-400">🎨 Animation Effects</label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {animationEffects.map((effect) => {
          const isSelected = selectedEffects[effect.key] || false;
          const isDisabled = disabled;

          return (
            <button
              key={effect.key}
              onClick={() => {
                if (!isDisabled) {
                  onToggleEffect(effect.key);
                }
              }}
              disabled={isDisabled}
              className={`relative p-3 rounded-lg border transition-all ${
                isDisabled
                  ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                  : isSelected
                    ? 'border-neon-purple bg-neon-purple/20'
                    : 'border-white/10 bg-white/5 hover:border-neon-purple/50'
              }`}
              title={disabled ? 'Please select a node first' : effect.description}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 bg-gradient-to-br from-neon-blue to-neon-purple rounded flex items-center justify-center text-lg ${effect.previewClass}`}
                >
                  {effect.icon}
                </div>
                <span className="text-xs text-white font-medium text-center leading-tight">
                  {effect.label}
                </span>
              </div>

              {isSelected && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-neon-purple rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
