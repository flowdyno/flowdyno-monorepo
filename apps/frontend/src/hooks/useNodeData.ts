import { useMemo } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import type { Node } from '../types/canvas';

/**
 * 自定义 Hook: 从 Zustand store 读取节点的最新数据
 *
 * 解决 ReactFlow 的 data prop 传递延迟问题:
 * - ReactFlow 的 data prop 更新有延迟
 * - 直接从 Zustand store 订阅,获取实时数据
 * - 所有节点组件都应该使用这个 Hook
 *
 * @param nodeId - 节点 ID
 * @param fallbackData - 备用数据 (从 ReactFlow 的 data prop 传入)
 * @returns 合并后的节点数据 (优先使用 store 中的数据)
 */
export function useNodeData<T extends Node>(nodeId: string, fallbackData: Partial<T>): T {
  // 从 store 订阅当前节点的数据
  const nodeFromStore = useCanvasStore((state) => state.nodes.find((n) => n.id === nodeId)) as
    | T
    | undefined;

  // 合并 store 数据和 fallback 数据
  const mergedData = useMemo(() => {
    if (!nodeFromStore) {
      return fallbackData as T;
    }

    // 优先使用 store 中的数据,fallback 作为默认值
    return {
      ...fallbackData,
      ...nodeFromStore,
    } as T;
  }, [nodeFromStore, fallbackData]);

  return mergedData;
}

/**
 * 获取节点的特定属性值
 * 优先从 store 读取,如果不存在则使用 fallback 值
 *
 * @param nodeId - 节点 ID
 * @param key - 属性名
 * @param fallbackValue - 备用值
 * @returns 属性值
 */
export function useNodeProperty<T = any>(nodeId: string, key: string, fallbackValue: T): T {
  const value = useCanvasStore((state) => {
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return fallbackValue;

    const nodeValue = (node as any)[key];
    // 使用 ?? 而不是 || 来处理 0, false 等 falsy 值
    return nodeValue ?? fallbackValue;
  });

  return value;
}
