import { useState, useEffect, useMemo } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useAnimationStore } from '../../stores/animationStore';
import ConnectionPanel from './ConnectionPanel';
import AnimationEffectSelector from './AnimationEffectSelector';
import type { FrameNode, TextNode, ImageNode, TechNode } from '../../types/canvas';
import { TECH_CATEGORIES } from '@flowdyno/shared-config';
import { calculateFrameSize } from '../../utils/frameLayout';

type PanelTab = 'properties' | 'connections' | 'animations';

// Helper function to check if node is Tech or Concept node
const isTechOrConceptNode = (nodeType: string): boolean => {
  const techTypes = [
    'service',
    'database',
    'cache',
    'queue',
    'api',
    'frontend',
    'backend',
    'language',
    'cloud',
    'devops',
    'monitoring',
    'testing',
    'ai',
    'game',
    'concept',
  ];
  return techTypes.includes(nodeType);
};

export default function PropertyPanel() {
  const [activeTab, setActiveTab] = useState<PanelTab>('properties');
  const nodes = useCanvasStore((state) => state.nodes);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const selectedConnectionId = useCanvasStore((state) => state.selectedConnectionId);
  const updateNode = useCanvasStore((state) => state.updateNode);

  // Animation store
  const animationSettings = useAnimationStore((state) => state.settings);
  const updateAnimationSettings = useAnimationStore((state) => state.updateSettings);
  const setSpeed = useAnimationStore((state) => state.setSpeed);
  const toggleAnimations = useAnimationStore((state) => state.toggleAnimations);
  const isPlaying = useAnimationStore((state) => state.isPlaying);
  const play = useAnimationStore((state) => state.play);
  const pause = useAnimationStore((state) => state.pause);
  const stop = useAnimationStore((state) => state.stop);

  const selectedNode = nodes.find((n) => selectedIds.includes(n.id));

  // 获取当前技术节点图标的可用变体
  const availableVariants = useMemo(() => {
    if (!selectedNode || !isTechOrConceptNode(selectedNode.type)) {
      return [];
    }

    const techNode = selectedNode as TechNode;
    const iconName = techNode.icon || techNode.techStackId;

    if (!iconName) {
      return [];
    }

    // 从 TECH_CATEGORIES 中查找图标的变体
    for (const category of TECH_CATEGORIES) {
      const techStack = category.techStacks.find((ts) => ts.id === iconName);
      if (techStack) {
        return techStack.variants;
      }
    }

    return [];
  }, [selectedNode]);

  // Auto-switch to connections tab when a connection is selected
  useEffect(() => {
    if (selectedConnectionId) {
      setActiveTab('connections');
    }
  }, [selectedConnectionId]);

  const handleBorderStyleChange = (borderStyle: 'none' | 'solid' | 'dashed') => {
    if (selectedNode) {
      updateNode(selectedNode.id, { borderStyle });
    }
  };

  // 获取子节点并计算 Frame 尺寸
  const getFrameSizeWithOverrides = (
    frameNode: FrameNode,
    overrides?: { padding?: number; gap?: number; layout?: string }
  ) => {
    const children = frameNode.children || [];
    const allNodes = useCanvasStore.getState().nodes;
    const childNodes = allNodes.filter((n) => children.includes(n.id));

    const frameWithOverrides = overrides
      ? {
          ...frameNode,
          padding: overrides.padding ?? frameNode.padding,
          gap: overrides.gap ?? frameNode.gap,
          layout: (overrides.layout ?? frameNode.layout) as FrameNode['layout'],
        }
      : frameNode;

    return calculateFrameSize(frameWithOverrides, childNodes, overrides);
  };

  // 根据 layout 重新排列子节点位置
  const repositionChildren = (frameNode: FrameNode, layout: 'flex-row' | 'flex-col' | 'grid') => {
    const children = frameNode.children || [];
    if (children.length === 0) return;

    const padding = frameNode.padding ?? 16;
    const gap = frameNode.gap ?? 8;
    const alignItems = frameNode.alignItems || 'flex-start';

    // 检查 Frame 是否显示 label（showLabel 默认为 true 且有 label 内容）
    const hasVisibleLabel = (frameNode as any).showLabel !== false && (frameNode as any).label;
    const labelOffset = hasVisibleLabel ? 30 : 0;

    const childNodes = children
      .map((childId) => nodes.find((n) => n.id === childId))
      .filter((n) => n !== undefined);

    // frameNode.height 现在是总高度（包含 label）
    // Frame 主体高度 = frameNode.height - labelOffset
    const frameBodyHeight = (frameNode.height || 200 + labelOffset) - labelOffset;

    if (layout === 'flex-row') {
      let currentX = padding;
      childNodes.forEach((child) => {
        const childWidth = child.width || 180;
        const childHeight = child.height || 85;

        let y = padding + labelOffset;
        if (alignItems === 'center') {
          // 在 Frame 主体内垂直居中
          y = labelOffset + (frameBodyHeight - childHeight) / 2;
        } else if (alignItems === 'flex-end') {
          // 在 Frame 主体内底部对齐
          y = labelOffset + frameBodyHeight - childHeight - padding;
        }

        updateNode(child.id, {
          position: { x: currentX, y },
        });

        currentX += childWidth + gap;
      });
    } else if (layout === 'flex-col') {
      let currentY = padding + labelOffset;
      childNodes.forEach((child) => {
        const childWidth = child.width || 180;
        const childHeight = child.height || 85;

        let x = padding;
        if (alignItems === 'center') {
          const frameWidth = frameNode.width || 300;
          x = (frameWidth - childWidth) / 2;
        } else if (alignItems === 'flex-end') {
          const frameWidth = frameNode.width || 300;
          x = frameWidth - childWidth - padding;
        }

        updateNode(child.id, {
          position: { x, y: currentY },
        });

        currentY += childHeight + gap;
      });
    } else if (layout === 'grid') {
      const gridCols = frameNode.gridCols || 2;
      const maxChildWidth = Math.max(...childNodes.map((n) => n.width || 180));
      const maxChildHeight = Math.max(...childNodes.map((n) => n.height || 85));

      childNodes.forEach((child, index) => {
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;

        const x = padding + col * (maxChildWidth + gap);
        const y = padding + labelOffset + row * (maxChildHeight + gap);

        updateNode(child.id, {
          position: { x, y },
        });
      });
    }
  };

  // 处理 Frame layout 改变并自动调整尺寸
  const handleLayoutChange = (layout: 'flex-row' | 'flex-col' | 'grid') => {
    if (!selectedNode || selectedNode.type !== 'frame') return;

    // 🔥 从 store 读取最新的 Frame 数据
    const frameNodeFromStore = useCanvasStore
      .getState()
      .nodes.find((n) => n.id === selectedNode.id) as FrameNode | undefined;
    if (!frameNodeFromStore) return;

    const children = frameNodeFromStore.children || [];

    // 如果没有子节点,只更新 layout
    if (children.length === 0) {
      updateNode(selectedNode.id, { layout });
      return;
    }

    // 计算新尺寸
    const { width: newWidth, height: newHeight } = getFrameSizeWithOverrides(frameNodeFromStore, {
      layout,
    });

    // 更新 Frame 的 layout 和尺寸
    updateNode(selectedNode.id, {
      layout,
      width: newWidth,
      height: newHeight,
    });

    // 重新排列子节点位置
    setTimeout(() => {
      const updatedFrameNode = useCanvasStore
        .getState()
        .nodes.find((n) => n.id === selectedNode.id) as FrameNode | undefined;
      if (updatedFrameNode) {
        repositionChildren(updatedFrameNode, layout);
      }
    }, 0);
  };

  // 处理 Gap 改变并自动调整 Frame 尺寸
  const handleGapChange = (gap: number) => {
    if (!selectedNode || selectedNode.type !== 'frame') return;

    // 🔥 从 store 读取最新的 Frame 数据
    const frameNodeFromStore = useCanvasStore
      .getState()
      .nodes.find((n) => n.id === selectedNode.id) as FrameNode | undefined;
    if (!frameNodeFromStore) return;

    const children = frameNodeFromStore.children || [];

    // 如果没有子节点,只更新 gap
    if (children.length === 0) {
      updateNode(selectedNode.id, { gap });
      return;
    }

    // 计算新尺寸
    const { width: newWidth, height: newHeight } = getFrameSizeWithOverrides(frameNodeFromStore, {
      gap,
    });

    updateNode(selectedNode.id, { gap, width: newWidth, height: newHeight });

    // 重新排列子节点位置
    setTimeout(() => {
      const updatedFrameNode = useCanvasStore
        .getState()
        .nodes.find((n) => n.id === selectedNode.id) as FrameNode | undefined;
      if (updatedFrameNode && updatedFrameNode.layout) {
        repositionChildren(updatedFrameNode, updatedFrameNode.layout);
      }
    }, 0);
  };

  // 处理 Padding 改变并自动调整 Frame 尺寸
  const handlePaddingChange = (padding: number) => {
    if (!selectedNode || selectedNode.type !== 'frame') return;

    // 🔥 从 store 读取最新的 Frame 数据
    const frameNodeFromStore = useCanvasStore
      .getState()
      .nodes.find((n) => n.id === selectedNode.id) as FrameNode | undefined;
    if (!frameNodeFromStore) return;

    const children = frameNodeFromStore.children || [];

    // 如果没有子节点,只更新 padding
    if (children.length === 0) {
      updateNode(selectedNode.id, { padding });
      return;
    }

    // 计算新尺寸
    const { width: newWidth, height: newHeight } = getFrameSizeWithOverrides(frameNodeFromStore, {
      padding,
    });

    updateNode(selectedNode.id, { padding, width: newWidth, height: newHeight });

    // 重新排列子节点位置
    setTimeout(() => {
      const updatedFrameNode = useCanvasStore
        .getState()
        .nodes.find((n) => n.id === selectedNode.id) as FrameNode | undefined;
      if (updatedFrameNode && updatedFrameNode.layout) {
        repositionChildren(updatedFrameNode, updatedFrameNode.layout);
      }
    }, 0);
  };

  // 处理对齐变化并自动调整尺寸
  const handleAlignmentChange = (
    justifyContent: FrameNode['justifyContent'],
    alignItems: FrameNode['alignItems']
  ) => {
    if (!selectedNode || selectedNode.type !== 'frame') return;

    // 🔥 从 store 读取最新的 Frame 数据
    const frameNodeFromStore = useCanvasStore
      .getState()
      .nodes.find((n) => n.id === selectedNode.id) as FrameNode | undefined;
    if (!frameNodeFromStore) return;

    const children = frameNodeFromStore.children || [];

    // 如果没有子节点,只更新对齐
    if (children.length === 0) {
      updateNode(selectedNode.id, { justifyContent, alignItems });
      return;
    }

    // 计算新尺寸
    const { width: newWidth, height: newHeight } = getFrameSizeWithOverrides(frameNodeFromStore);

    const updates = {
      justifyContent,
      alignItems,
      width: newWidth,
      height: newHeight,
    };

    updateNode(selectedNode.id, updates);

    // 重新排列子节点位置
    setTimeout(() => {
      const updatedFrameNode = useCanvasStore
        .getState()
        .nodes.find((n) => n.id === selectedNode.id) as FrameNode | undefined;
      if (updatedFrameNode && updatedFrameNode.layout) {
        repositionChildren(updatedFrameNode, updatedFrameNode.layout);
      }
    }, 0);
  };

  const tabs = [
    { id: 'properties' as PanelTab, label: 'Properties', icon: '⚙️' },
    { id: 'connections' as PanelTab, label: 'Connections', icon: '🔗' },
    { id: 'animations' as PanelTab, label: 'Animations', icon: '✨' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-neon-purple bg-white/5'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'properties' && (
          <div className="p-4 space-y-6">
            {selectedNode ? (
              <div className="space-y-6">
                {/* Node Info */}
                <div className="pb-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getNodeIcon(selectedNode.type)}</div>
                    <div>
                      <div className="font-semibold text-white text-sm">{selectedNode.label}</div>
                      <div className="text-xs text-gray-400 uppercase">{selectedNode.type}</div>
                    </div>
                  </div>
                </div>

                {/* Position Section */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 mb-3">Position</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">X</label>
                      <input
                        type="number"
                        value={Math.round(selectedNode.position.x)}
                        className="w-full px-2 py-1.5 bg-dark-900/50 border border-white/10 rounded text-xs focus:outline-none focus:border-neon-purple/50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Y</label>
                      <input
                        type="number"
                        value={Math.round(selectedNode.position.y)}
                        className="w-full px-2 py-1.5 bg-dark-900/50 border border-white/10 rounded text-xs focus:outline-none focus:border-neon-purple/50"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Border Style Selector */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Border Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleBorderStyleChange('solid')}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        (selectedNode.borderStyle || 'solid') === 'solid'
                          ? 'border-neon-purple bg-neon-purple/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-medium">Solid</div>
                      <div className="mt-1 h-0.5 bg-current"></div>
                    </button>
                    <button
                      onClick={() => handleBorderStyleChange('dashed')}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        selectedNode.borderStyle === 'dashed'
                          ? 'border-neon-purple bg-neon-purple/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-medium">Dashed</div>
                      <div className="mt-1 h-0.5 border-t-2 border-dashed border-current"></div>
                    </button>
                    <button
                      onClick={() => handleBorderStyleChange('none')}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        selectedNode.borderStyle === 'none'
                          ? 'border-neon-purple bg-neon-purple/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-medium">None</div>
                      <div className="mt-1 h-0.5"></div>
                    </button>
                  </div>
                </div>

                {/* Frame Node Specific Properties */}
                {selectedNode.type === 'frame' && (
                  <>
                    {/* Frame Label */}
                    <div className="pb-4 border-b border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-gray-400">Frame label</h4>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(selectedNode as FrameNode).showLabel !== false}
                            onChange={(e) =>
                              updateNode(selectedNode.id, { showLabel: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="relative w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-purple"></div>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={(selectedNode as FrameNode).label || ''}
                        onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                        placeholder="Enter frame label"
                        className="w-full px-3 py-2 bg-dark-900/50 border border-white/10 rounded text-sm focus:outline-none focus:border-neon-purple/50"
                        disabled={(selectedNode as FrameNode).showLabel === false}
                      />
                    </div>

                    {/* Auto Layout Section */}
                    <div className="pb-4 border-b border-white/10">
                      <h4 className="text-xs font-semibold text-gray-400 mb-3">Auto layout</h4>
                      <label className="block text-xs text-gray-500 mb-2">Flow</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => handleLayoutChange('flex-row')}
                          className={`p-2 rounded border transition-all ${
                            (selectedNode as FrameNode).layout === 'flex-row'
                              ? 'border-neon-blue bg-neon-blue/20 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                          title="Horizontal"
                        >
                          <svg
                            className="w-4 h-4 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <rect x="4" y="7" width="5" height="10" strokeWidth="2" rx="1" />
                            <rect x="11" y="7" width="5" height="10" strokeWidth="2" rx="1" />
                            <rect x="18" y="7" width="2" height="10" strokeWidth="2" rx="1" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleLayoutChange('flex-col')}
                          className={`p-2 rounded border transition-all ${
                            (selectedNode as FrameNode).layout === 'flex-col'
                              ? 'border-neon-blue bg-neon-blue/20 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                          title="Vertical"
                        >
                          <svg
                            className="w-4 h-4 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <rect x="7" y="4" width="10" height="5" strokeWidth="2" rx="1" />
                            <rect x="7" y="11" width="10" height="5" strokeWidth="2" rx="1" />
                            <rect x="7" y="18" width="10" height="2" strokeWidth="2" rx="1" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleLayoutChange('grid')}
                          className={`p-2 rounded border transition-all ${
                            (selectedNode as FrameNode).layout === 'grid'
                              ? 'border-neon-blue bg-neon-blue/20 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                          title="Grid"
                        >
                          <svg
                            className="w-4 h-4 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <rect x="4" y="4" width="7" height="7" strokeWidth="2" rx="1" />
                            <rect x="13" y="4" width="7" height="7" strokeWidth="2" rx="1" />
                            <rect x="4" y="13" width="7" height="7" strokeWidth="2" rx="1" />
                            <rect x="13" y="13" width="7" height="7" strokeWidth="2" rx="1" />
                          </svg>
                        </button>
                      </div>

                      {/* Alignment Grid - 9 combinations (only show for flex layouts, not grid) */}
                      {(selectedNode as FrameNode).layout !== 'grid' && (
                        <div className="mt-3">
                          <label className="block text-xs text-gray-500 mb-1.5">Alignment</label>
                          <div className="grid grid-cols-3 gap-1">
                            {/* Row 1: Top/Left alignment */}
                            <button
                              onClick={() => handleAlignmentChange('flex-start', 'flex-start')}
                              className={`p-2 rounded border transition-all ${
                                ((selectedNode as any).justifyContent === 'flex-start' ||
                                  !(selectedNode as any).justifyContent) &&
                                ((selectedNode as any).alignItems === 'flex-start' ||
                                  !(selectedNode as any).alignItems)
                                  ? 'border-neon-blue bg-neon-blue/20 text-white'
                                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                              }`}
                              title="Top Left"
                            >
                              <svg
                                className="w-5 h-5 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" strokeWidth="1.5" rx="2" />
                                <circle cx="8" cy="8" r="2.5" fill="currentColor" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleAlignmentChange('center', 'flex-start')}
                              className={`p-2 rounded border transition-all ${
                                (selectedNode as any).justifyContent === 'center' &&
                                ((selectedNode as any).alignItems === 'flex-start' ||
                                  !(selectedNode as any).alignItems)
                                  ? 'border-neon-blue bg-neon-blue/20 text-white'
                                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                              }`}
                              title="Top Center"
                            >
                              <svg
                                className="w-5 h-5 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" strokeWidth="1.5" rx="2" />
                                <circle cx="12" cy="8" r="2.5" fill="currentColor" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleAlignmentChange('flex-end', 'flex-start')}
                              className={`p-2 rounded border transition-all ${
                                (selectedNode as any).justifyContent === 'flex-end' &&
                                ((selectedNode as any).alignItems === 'flex-start' ||
                                  !(selectedNode as any).alignItems)
                                  ? 'border-neon-blue bg-neon-blue/20 text-white'
                                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                              }`}
                              title="Top Right"
                            >
                              <svg
                                className="w-5 h-5 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" strokeWidth="1.5" rx="2" />
                                <circle cx="16" cy="8" r="2.5" fill="currentColor" />
                              </svg>
                            </button>

                            {/* Row 2: Middle alignment */}
                            <button
                              onClick={() => handleAlignmentChange('flex-start', 'center')}
                              className={`p-2 rounded border transition-all ${
                                ((selectedNode as any).justifyContent === 'flex-start' ||
                                  !(selectedNode as any).justifyContent) &&
                                (selectedNode as any).alignItems === 'center'
                                  ? 'border-neon-blue bg-neon-blue/20 text-white'
                                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                              }`}
                              title="Middle Left"
                            >
                              <svg
                                className="w-5 h-5 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" strokeWidth="1.5" rx="2" />
                                <circle cx="8" cy="12" r="2.5" fill="currentColor" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleAlignmentChange('center', 'center')}
                              className={`p-2 rounded border transition-all ${
                                (selectedNode as any).justifyContent === 'center' &&
                                (selectedNode as any).alignItems === 'center'
                                  ? 'border-neon-blue bg-neon-blue/20 text-white'
                                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                              }`}
                              title="Center"
                            >
                              <svg
                                className="w-5 h-5 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" strokeWidth="1.5" rx="2" />
                                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleAlignmentChange('flex-end', 'center')}
                              className={`p-2 rounded border transition-all ${
                                (selectedNode as any).justifyContent === 'flex-end' &&
                                (selectedNode as any).alignItems === 'center'
                                  ? 'border-neon-blue bg-neon-blue/20 text-white'
                                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                              }`}
                              title="Middle Right"
                            >
                              <svg
                                className="w-5 h-5 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" strokeWidth="1.5" rx="2" />
                                <circle cx="16" cy="12" r="2.5" fill="currentColor" />
                              </svg>
                            </button>

                            {/* Row 3: Bottom/Right alignment */}
                            <button
                              onClick={() => handleAlignmentChange('flex-start', 'flex-end')}
                              className={`p-2 rounded border transition-all ${
                                ((selectedNode as any).justifyContent === 'flex-start' ||
                                  !(selectedNode as any).justifyContent) &&
                                (selectedNode as any).alignItems === 'flex-end'
                                  ? 'border-neon-blue bg-neon-blue/20 text-white'
                                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                              }`}
                              title="Bottom Left"
                            >
                              <svg
                                className="w-5 h-5 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" strokeWidth="1.5" rx="2" />
                                <circle cx="8" cy="16" r="2.5" fill="currentColor" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleAlignmentChange('center', 'flex-end')}
                              className={`p-2 rounded border transition-all ${
                                (selectedNode as any).justifyContent === 'center' &&
                                (selectedNode as any).alignItems === 'flex-end'
                                  ? 'border-neon-blue bg-neon-blue/20 text-white'
                                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                              }`}
                              title="Bottom Center"
                            >
                              <svg
                                className="w-5 h-5 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" strokeWidth="1.5" rx="2" />
                                <circle cx="12" cy="16" r="2.5" fill="currentColor" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleAlignmentChange('flex-end', 'flex-end')}
                              className={`p-2 rounded border transition-all ${
                                (selectedNode as any).justifyContent === 'flex-end' &&
                                (selectedNode as any).alignItems === 'flex-end'
                                  ? 'border-neon-blue bg-neon-blue/20 text-white'
                                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                              }`}
                              title="Bottom Right"
                            >
                              <svg
                                className="w-5 h-5 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="3" width="18" height="18" strokeWidth="1.5" rx="2" />
                                <circle cx="16" cy="16" r="2.5" fill="currentColor" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Gap */}
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-1.5">Gap</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="4"
                            max="48"
                            step="1"
                            value={(selectedNode as FrameNode).gap || 8}
                            onChange={(e) => handleGapChange(parseInt(e.target.value) || 4)}
                            className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-blue [&::-webkit-slider-thumb]:cursor-pointer"
                          />
                          <input
                            type="number"
                            min="4"
                            max="48"
                            value={(selectedNode as FrameNode).gap || 8}
                            onChange={(e) =>
                              handleGapChange(Math.max(4, parseInt(e.target.value) || 4))
                            }
                            className="w-16 px-2 py-1 bg-dark-900/50 border border-white/10 rounded text-xs text-center focus:outline-none focus:border-neon-purple/50"
                          />
                          <span className="text-xs text-gray-500">px</span>
                        </div>
                      </div>

                      {/* Grid Configuration (only for grid layout) */}
                      {(selectedNode as FrameNode).layout === 'grid' && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Columns</label>
                            <input
                              type="number"
                              min="1"
                              max="12"
                              value={(selectedNode as FrameNode).gridCols || 2}
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  gridCols: parseInt(e.target.value) || 2,
                                })
                              }
                              className="w-full px-2 py-1.5 bg-dark-900/50 border border-white/10 rounded text-xs focus:outline-none focus:border-neon-purple/50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Rows</label>
                            <input
                              type="number"
                              min="1"
                              max="12"
                              value={(selectedNode as FrameNode).gridRows || 2}
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  gridRows: parseInt(e.target.value) || 2,
                                })
                              }
                              className="w-full px-2 py-1.5 bg-dark-900/50 border border-white/10 rounded text-xs focus:outline-none focus:border-neon-purple/50"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Padding Section */}
                    <div className="pb-4 border-b border-white/10">
                      <h4 className="text-xs font-semibold text-gray-400 mb-3">Padding</h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="4"
                          max="64"
                          step="1"
                          value={(selectedNode as FrameNode).padding || 16}
                          onChange={(e) => handlePaddingChange(parseInt(e.target.value) || 4)}
                          className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-blue [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <input
                          type="number"
                          min="4"
                          max="64"
                          value={(selectedNode as FrameNode).padding || 16}
                          onChange={(e) =>
                            handlePaddingChange(Math.max(4, parseInt(e.target.value) || 4))
                          }
                          className="w-16 px-2 py-1 bg-dark-900/50 border border-white/10 rounded text-xs text-center focus:outline-none focus:border-neon-purple/50"
                        />
                        <span className="text-xs text-gray-500">px</span>
                      </div>
                    </div>

                    {/* Appearance Section */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 mb-3">Appearance</h4>

                      {/* Background Color */}
                      <div className="mb-3">
                        <label className="block text-xs text-gray-500 mb-1.5">Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={(selectedNode as FrameNode).backgroundColor || '#1a1a24'}
                            onChange={(e) =>
                              updateNode(selectedNode.id, { backgroundColor: e.target.value })
                            }
                            className="w-8 h-8 rounded border border-white/10 bg-dark-900/50 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={(selectedNode as FrameNode).backgroundColor || '#1a1a24'}
                            onChange={(e) =>
                              updateNode(selectedNode.id, { backgroundColor: e.target.value })
                            }
                            className="flex-1 px-2 py-1.5 bg-dark-900/50 border border-white/10 rounded text-xs focus:outline-none focus:border-neon-purple/50 font-mono"
                            placeholder="#1a1a24"
                          />
                        </div>
                      </div>

                      {/* Border Color */}
                      <div className="mb-3">
                        <label className="block text-xs text-gray-500 mb-1.5">Border</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedNode.color || '#00f0ff'}
                            onChange={(e) => updateNode(selectedNode.id, { color: e.target.value })}
                            className="w-8 h-8 rounded border border-white/10 bg-dark-900/50 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedNode.color || '#00f0ff'}
                            onChange={(e) => updateNode(selectedNode.id, { color: e.target.value })}
                            className="flex-1 px-2 py-1.5 bg-dark-900/50 border border-white/10 rounded text-xs focus:outline-none focus:border-neon-purple/50 font-mono"
                            placeholder="#00f0ff"
                          />
                        </div>
                      </div>

                      {/* Border Radius */}
                      <div className="mb-3">
                        <label className="block text-xs text-gray-500 mb-1.5">Radius</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="32"
                            step="1"
                            value={(selectedNode as FrameNode).borderRadius || 12}
                            onChange={(e) =>
                              updateNode(selectedNode.id, {
                                borderRadius: parseInt(e.target.value) || 0,
                              })
                            }
                            className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-blue [&::-webkit-slider-thumb]:cursor-pointer"
                          />
                          <input
                            type="number"
                            min="0"
                            max="32"
                            value={(selectedNode as FrameNode).borderRadius || 12}
                            onChange={(e) =>
                              updateNode(selectedNode.id, {
                                borderRadius: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-16 px-2 py-1 bg-dark-900/50 border border-white/10 rounded text-xs text-center focus:outline-none focus:border-neon-purple/50"
                          />
                          <span className="text-xs text-gray-500">px</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Text Node Specific Properties */}
                {selectedNode.type === 'text' && (
                  <>
                    {/* Text Content */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Content</label>
                      <textarea
                        value={(selectedNode as TextNode).content || ''}
                        onChange={(e) => updateNode(selectedNode.id, { content: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-900/50 border border-white/10 rounded-lg focus:outline-none focus:border-neon-purple/50 text-sm resize-none"
                        rows={3}
                        placeholder="Enter text..."
                      />
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">
                        Font Size: {(selectedNode as TextNode).fontSize || 14}px
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="72"
                        step="2"
                        value={(selectedNode as TextNode).fontSize || 14}
                        onChange={(e) =>
                          updateNode(selectedNode.id, { fontSize: parseInt(e.target.value) })
                        }
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    {/* Font Weight */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Font Weight</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => updateNode(selectedNode.id, { fontWeight: 300 })}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            (selectedNode as TextNode).fontWeight === 300
                              ? 'border-neon-purple bg-neon-purple/10 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <div className="text-xs font-light">Light</div>
                        </button>
                        <button
                          onClick={() => updateNode(selectedNode.id, { fontWeight: 400 })}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            (selectedNode as TextNode).fontWeight === 400 ||
                            !(selectedNode as TextNode).fontWeight
                              ? 'border-neon-purple bg-neon-purple/10 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <div className="text-xs font-normal">Normal</div>
                        </button>
                        <button
                          onClick={() => updateNode(selectedNode.id, { fontWeight: 700 })}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            (selectedNode as TextNode).fontWeight === 700
                              ? 'border-neon-purple bg-neon-purple/10 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <div className="text-xs font-bold">Bold</div>
                        </button>
                      </div>
                    </div>

                    {/* Text Align */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Text Align</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => updateNode(selectedNode.id, { textAlign: 'left' })}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            (selectedNode as TextNode).textAlign === 'left' ||
                            !(selectedNode as TextNode).textAlign
                              ? 'border-neon-purple bg-neon-purple/10 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <svg
                            className="w-4 h-4 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 6h16M4 12h10M4 18h14"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => updateNode(selectedNode.id, { textAlign: 'center' })}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            (selectedNode as TextNode).textAlign === 'center'
                              ? 'border-neon-purple bg-neon-purple/10 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <svg
                            className="w-4 h-4 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 6h16M7 12h10M5 18h14"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => updateNode(selectedNode.id, { textAlign: 'right' })}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            (selectedNode as TextNode).textAlign === 'right'
                              ? 'border-neon-purple bg-neon-purple/10 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <svg
                            className="w-4 h-4 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 6h16M10 12h10M6 18h14"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Text Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={(selectedNode as TextNode).color || '#ffffff'}
                          onChange={(e) => updateNode(selectedNode.id, { color: e.target.value })}
                          className="w-12 h-10 rounded-lg border-2 border-white/10 bg-dark-900/50 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(selectedNode as TextNode).color || '#ffffff'}
                          onChange={(e) => updateNode(selectedNode.id, { color: e.target.value })}
                          className="flex-1 px-3 py-2 bg-dark-900/50 border border-white/10 rounded-lg focus:outline-none focus:border-neon-purple/50 text-sm font-mono"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Image Node Specific Properties */}
                {selectedNode.type === 'image' && (
                  <>
                    {/* Image Upload */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Image</label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                updateNode(selectedNode.id, { src: base64 });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full px-3 py-2 bg-dark-900/50 border border-white/10 rounded-lg focus:outline-none focus:border-neon-purple/50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-neon-purple file:text-white hover:file:bg-neon-purple/80 file:cursor-pointer"
                        />
                        <input
                          type="text"
                          value={(selectedNode as ImageNode).src || ''}
                          onChange={(e) => updateNode(selectedNode.id, { src: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-900/50 border border-white/10 rounded-lg focus:outline-none focus:border-neon-purple/50 text-sm"
                          placeholder="或输入图片 URL..."
                        />
                      </div>
                    </div>

                    {/* Object Fit */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Object Fit</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => updateNode(selectedNode.id, { objectFit: 'contain' })}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            (selectedNode as ImageNode).objectFit === 'contain' ||
                            !(selectedNode as ImageNode).objectFit
                              ? 'border-neon-purple bg-neon-purple/10 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <div className="text-xs">Contain</div>
                        </button>
                        <button
                          onClick={() => updateNode(selectedNode.id, { objectFit: 'cover' })}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            (selectedNode as ImageNode).objectFit === 'cover'
                              ? 'border-neon-purple bg-neon-purple/10 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <div className="text-xs">Cover</div>
                        </button>
                        <button
                          onClick={() => updateNode(selectedNode.id, { objectFit: 'fill' })}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            (selectedNode as ImageNode).objectFit === 'fill'
                              ? 'border-neon-purple bg-neon-purple/10 text-white'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <div className="text-xs">Fill</div>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Tech/Concept Node Specific Properties */}
                {isTechOrConceptNode(selectedNode.type) && (
                  <>
                    {/* Label Input */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Label</label>
                      <input
                        type="text"
                        value={selectedNode.label || ''}
                        onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                        className="w-full px-3 py-2 bg-dark-900/50 border border-white/10 rounded-lg focus:outline-none focus:border-neon-purple/50 text-sm"
                        placeholder="Enter label..."
                      />
                    </div>

                    {/* Hide Label Toggle */}
                    <div>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-xs text-gray-400">Hide Label</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={(selectedNode as TechNode).hideLabel || false}
                            onChange={(e) =>
                              updateNode(selectedNode.id, { hideLabel: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neon-purple/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-purple"></div>
                        </div>
                      </label>
                    </div>

                    {/* Icon Variant Selector */}
                    {availableVariants.length > 0 && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">Icon Variant</label>
                        <select
                          value={(selectedNode as TechNode).variant || availableVariants[0]}
                          onChange={(e) => updateNode(selectedNode.id, { variant: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-900/50 border border-white/10 rounded-lg focus:outline-none focus:border-neon-purple/50 text-sm text-white cursor-pointer"
                        >
                          {availableVariants.map((variant) => (
                            <option
                              key={variant}
                              value={variant}
                              className="bg-dark-900 text-white"
                            >
                              {variant}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
                <div className="text-4xl mb-3 opacity-50">👆</div>
                <p className="text-gray-400 text-sm">Select a node to view properties</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && <ConnectionPanel />}

        {activeTab === 'animations' && (
          <div className="p-6 space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <label className="block text-xs text-gray-400 mb-2">⚡ Animation Settings</label>

              {/* Enable Animations Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-sm text-white">Enable Animations</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={animationSettings.enabled}
                    onChange={toggleAnimations}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neon-purple/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-purple"></div>
                </label>
              </div>

              {/* Loop */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-sm text-white">Loop Forever</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!animationSettings.loop}
                    onChange={() => updateAnimationSettings({ loop: !animationSettings.loop })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-neon-purple/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-purple"></div>
                </label>
              </div>

              {/* Speed */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Speed</label>
                <div className="flex gap-2">
                  {(['slow', 'normal', 'fast'] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setSpeed(speed)}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm capitalize ${
                        animationSettings.speed === speed
                          ? 'border-neon-purple bg-neon-purple/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-neon-purple/50'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Node Selection Info */}
            {selectedIds.length > 0 ? (
              <div className="p-3 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                <div className="text-sm text-white">
                  ✨ Selected:{' '}
                  {selectedNode?.label || selectedNode?.id || `${selectedIds.length} nodes`}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Click animation effects below to toggle them on/off
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="text-sm text-gray-400">
                  💡 Select a node to configure its animation effects
                </div>
              </div>
            )}

            {/* Effects - Always show, but only allow editing when a node is selected */}
            <AnimationEffectSelector
              selectedEffects={selectedNode?.animationEffects || {}}
              onToggleEffect={(key) => {
                if (selectedIds.length === 0 || !selectedNode) {
                  return;
                }

                const currentEffects = selectedNode.animationEffects || {};
                const newEffects = {
                  ...currentEffects,
                  [key]: !currentEffects[key],
                };

                selectedIds.forEach((id) => {
                  updateNode(id, { animationEffects: newEffects });
                });
              }}
              disabled={selectedIds.length === 0}
            />

            {/* Global Playback Controls */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">🎮 Global Playback</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isPlaying) {
                      pause();
                    } else {
                      play();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                      </svg>
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      <span>Play</span>
                    </>
                  )}
                </button>
                <button
                  onClick={stop}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.25 3A2.25 2.25 0 003 5.25v9.5A2.25 2.25 0 005.25 17h9.5A2.25 2.25 0 0017 14.75v-9.5A2.25 2.25 0 0014.75 3h-9.5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getNodeIcon(type: string): string {
  const icons: Record<string, string> = {
    service: '⚙️',
    database: '🗄️',
    cache: '⚡',
    queue: '📬',
    api: '🔌',
    frontend: '🎨',
    backend: '🖥️',
  };
  return icons[type] || '📦';
}
