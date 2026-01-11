import { useEffect, useRef } from 'react';
import { useAnimationStore } from '../stores/animationStore';
import { useCanvasStore } from '../stores/canvasStore';
import { applyAnimations, resetAllAnimations } from '../utils/animation/animationRuntime';

export function useAnimationPlayer() {
  const isPlaying = useAnimationStore((state) => state.isPlaying);
  const settings = useAnimationStore((state) => state.settings);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    // Get initial nodes for cleanup
    const initialNodes = useCanvasStore.getState().nodes;

    if (!isPlaying || !settings.enabled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      startTimeRef.current = undefined;
      resetAllAnimations(initialNodes);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = (timestamp - startTimeRef.current) / 1000;

      // Fixed duration: 5 seconds for one complete animation cycle
      const baseDuration = 5;

      // Speed multiplier: slow = 0.5x, normal = 1x, fast = 2x
      const speedMultiplier = settings.speed === 'slow' ? 0.5 : settings.speed === 'fast' ? 2 : 1;

      // Actual duration adjusted by speed
      const duration = baseDuration / speedMultiplier;

      // Get latest nodes and connections from store on every frame
      const currentNodes = useCanvasStore.getState().nodes;
      const currentConnections = useCanvasStore.getState().connections;
      const currentSelectedIds = useCanvasStore.getState().selectedIds;

      if (elapsed >= duration) {
        if (settings.loop) {
          // restart from beginning for looped playback
          startTimeRef.current = timestamp;
          resetAllAnimations(currentNodes);
          animationFrameRef.current = requestAnimationFrame(animate);
          return;
        }

        resetAllAnimations(currentNodes);
        useAnimationStore.getState().stop();
        return;
      }

      const progress = elapsed / duration;
      applyAnimations(progress, {
        nodes: currentNodes,
        connections: currentConnections,
        settings,
        selectedIds: currentSelectedIds,
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      const finalNodes = useCanvasStore.getState().nodes;
      resetAllAnimations(finalNodes);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, settings.enabled, settings.speed, settings.loop]);
}
