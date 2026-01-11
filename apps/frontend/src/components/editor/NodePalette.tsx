import { useState, useMemo } from 'react';
import { TECH_CATEGORIES, CONCEPT_CATEGORIES, BASIC_NODES } from '@flowdyno/shared-config';
import { useCanvasStore } from '../../stores/canvasStore';
import type { TechNodeType, BasicNodeType } from '../../types/canvas';
import { TechIcon } from '../common/TechIcon';
import { ConceptIcon } from '../common/ConceptIcon';

// 本地 TechStack 类型（兼容 Tech 和 Concept）
interface LocalTechStack {
  id: string;
  label: string;
  icon: string;
  variants?: string[]; // 可选，Concept 图标没有 variants
}

interface TechCategory {
  type: TechNodeType;
  icon: string;
  label: string;
  color: string;
  techStacks: LocalTechStack[];
  categoryId?: string;
}

interface BasicNodeItem {
  type: BasicNodeType;
  icon: string;
  label: string;
  color: string;
  description: string;
}

interface NodeGroup {
  id: string;
  label: string;
  icon: string;
  items: (TechCategory | BasicNodeItem)[];
}

// Tech categories (从 shared-config 导入)
const techCategories: TechCategory[] = TECH_CATEGORIES.map((cat) => ({
  type: cat.type as TechNodeType,
  icon: cat.techStacks[0]?.icon || 'default',
  label: cat.label,
  color: cat.color,
  techStacks: cat.techStacks,
}));

// 颜色映射（为每个概念分类分配颜色）
const CONCEPT_CATEGORY_COLORS: Record<string, string> = {
  'concept-users': 'from-blue-500 to-cyan-500',
  'concept-devices': 'from-purple-500 to-pink-500',
  'concept-infrastructure': 'from-green-500 to-emerald-500',
  'concept-data': 'from-orange-500 to-red-500',
  'concept-documents': 'from-yellow-500 to-amber-500',
  'concept-communication': 'from-indigo-500 to-blue-500',
};

// Concept categories (从 shared-config 导入)
const conceptCategories: TechCategory[] = CONCEPT_CATEGORIES.map((cat) => ({
  type: 'concept' as TechNodeType,
  categoryId: cat.id,
  icon: cat.icons[0]?.icon || 'default',
  label: cat.label,
  color: CONCEPT_CATEGORY_COLORS[cat.id] || 'from-gray-500 to-slate-500',
  techStacks: cat.icons,
}));

// 基础节点颜色映射
const BASIC_NODE_COLORS: Record<string, string> = {
  frame: 'from-purple-500 to-pink-500',
  text: 'from-green-500 to-teal-500',
  image: 'from-orange-500 to-red-500',
  icon: 'from-yellow-500 to-amber-500',
};

// Basic nodes (从 shared-config 导入)
const basicNodes: BasicNodeItem[] = BASIC_NODES.map((node) => ({
  type: node.type as BasicNodeType,
  icon: node.icon,
  label: node.label,
  color: BASIC_NODE_COLORS[node.type] || 'from-gray-500 to-slate-500',
  description: node.description,
}));

// Node groups
const nodeGroups: NodeGroup[] = [
  {
    id: 'tech',
    label: 'Tech Stack',
    icon: '🔧',
    items: techCategories,
  },
  {
    id: 'concepts',
    label: 'Concepts',
    icon: '🧩',
    items: conceptCategories,
  },
  {
    id: 'basic',
    label: 'Basic Elements',
    icon: '🎨',
    items: basicNodes,
  },
];

export default function NodePalette() {
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['tech'])); // Tech group expanded by default
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const { addNode, setSelection } = useCanvasStore();

  // 查找不与现有节点重叠的位置
  const findAvailablePosition = (width: number = 180, height: number = 85) => {
    const nodes = useCanvasStore.getState().nodes;
    const startX = 400;
    const startY = 300;
    const spacing = 20;
    const maxAttempts = 100;

    // 检查位置是否与现有节点重叠
    const isOverlapping = (x: number, y: number) => {
      return nodes.some((node) => {
        const nodeWidth = node.width || 180;
        const nodeHeight = node.height || 85;
        const nodeX = node.position.x;
        const nodeY = node.position.y;

        return !(
          x + width + spacing < nodeX ||
          x > nodeX + nodeWidth + spacing ||
          y + height + spacing < nodeY ||
          y > nodeY + nodeHeight + spacing
        );
      });
    };

    // 尝试螺旋式查找可用位置
    let x = startX;
    let y = startY;
    let radius = 0;
    let angle = 0;

    for (let i = 0; i < maxAttempts; i++) {
      if (!isOverlapping(x, y)) {
        return { x, y };
      }

      // 螺旋式增加搜索半径
      angle += Math.PI / 4;
      if (angle >= Math.PI * 2) {
        angle = 0;
        radius += 150;
      }
      x = startX + Math.cos(angle) * radius;
      y = startY + Math.sin(angle) * radius;
    }

    // 如果找不到,返回随机位置
    return { x: startX + Math.random() * 200, y: startY + Math.random() * 200 };
  };

  const handleAddTechNode = (
    type: TechNodeType,
    label: string,
    techStackId?: string,
    iconName?: string,
    variant?: string
  ) => {
    // Tech 节点使用默认尺寸 120x120 (不设置 width/height,由 CSS 控制)
    const { x, y } = findAvailablePosition(85, 85);

    addNode({
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type,
      label,
      icon: iconName || techStackId || type,
      variant, // 保存 variant
      position: { x, y },
      borderStyle: 'none',
      techStackId,
      // 不设置 width/height,使用默认值
    } as any);
  };

  const handleAddBasicNode = (type: BasicNodeType, label: string) => {
    // 根据节点类型确定尺寸
    let width = 180;
    let height = 85;
    if (type === 'frame') {
      width = 300;
      height = 200;
    } else if (type === 'text') {
      width = 200;
      height = 60;
    } else if (type === 'image') {
      width = 85;
      height = 85;
    }

    const { x, y } = findAvailablePosition(width, height);

    // Create node with type-specific defaults
    const baseNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type,
      label,
      position: { x, y },
      borderStyle: 'solid' as const,
    };

    let newNode: any;

    if (type === 'frame') {
      newNode = {
        ...baseNode,
        layout: 'flex-row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        glowEnabled: false,
        padding: 16,
        width: 300,
        height: 200,
        backgroundColor: '#1a1a24',
        borderRadius: 12,
        gap: 8,
        gridRows: 2,
        gridCols: 2,
      };
    } else if (type === 'text') {
      newNode = {
        ...baseNode,
        content: label,
        fontSize: 14,
        fontWeight: 400,
        textAlign: 'left',
        width,
        height,
      };
    } else if (type === 'image') {
      newNode = {
        ...baseNode,
        src: '',
        alt: label,
        objectFit: 'contain',
        width,
        height,
      };
    }

    if (newNode) {
      addNode(newNode);
      // Select the newly created node
      setTimeout(() => {
        setSelection([newNode.id]);
      }, 100);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const toggleCategory = (categoryType: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryType)) {
        newSet.delete(categoryType);
      } else {
        newSet.add(categoryType);
      }
      return newSet;
    });
  };

  const filteredTechStacks = useMemo(() => {
    if (!searchQuery.trim()) {
      return techCategories;
    }

    const query = searchQuery.toLowerCase();
    return techCategories
      .map((category) => ({
        ...category,
        techStacks: category.techStacks.filter((tech) => tech.label.toLowerCase().includes(query)),
      }))
      .filter((category) => category.techStacks.length > 0);
  }, [searchQuery]);

  return (
    <div className="h-full flex flex-col bg-dark-800/50 backdrop-blur-sm border-r border-white/5">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <button
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-300 hover:text-white transition-colors"
        >
          <span className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span>Components</span>
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isPanelExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Node Groups */}
      {isPanelExpanded && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {nodeGroups.map((group) => {
            const isGroupExpanded = expandedGroups.has(group.id);

            return (
              <div key={group.id} className="space-y-2">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full p-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-all text-left"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{group.icon}</span>
                    <span className="text-sm font-bold text-white">{group.label}</span>
                    <svg
                      className={`ml-auto w-4 h-4 text-gray-400 transition-transform ${isGroupExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Group Items */}
                {isGroupExpanded && (
                  <div className="ml-2 space-y-2">
                    {group.id === 'tech' || group.id === 'concepts'
                      ? // Tech/Concept categories with sub-items
                        (() => {
                          const categories =
                            group.id === 'tech'
                              ? filteredTechStacks
                              : (group.items as TechCategory[]);

                          return (
                            <div className="space-y-2">
                              {/* Search Input (only for tech) */}
                              {group.id === 'tech' && (
                                <div className="px-1">
                                  <input
                                    type="text"
                                    placeholder="Search tech stacks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 transition-colors"
                                  />
                                </div>
                              )}

                              {/* Categories */}
                              {categories.map((category) => {
                                const categoryKey = category.categoryId || category.type;
                                const isCategoryExpanded = expandedCategories.has(categoryKey);

                                return (
                                  <div key={categoryKey} className="space-y-1">
                                    {/* Tech Category Header */}
                                    <button
                                      onClick={() => toggleCategory(categoryKey)}
                                      className="group w-full p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-purple/50 rounded-lg transition-all text-left"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <div
                                          className={`w-8 h-8 bg-gradient-to-br rounded-md flex items-center justify-center shadow-lg`}
                                        >
                                          {category.type === 'concept' ? (
                                            <ConceptIcon name={category.icon} size={22} />
                                          ) : (
                                            <TechIcon name={category.icon} size={22} />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="text-xs font-semibold text-white">
                                            {category.label}
                                          </div>
                                          <div className="text-[10px] text-gray-400">
                                            {category.techStacks.length} items
                                          </div>
                                        </div>
                                        <svg
                                          className={`w-4 h-4 text-gray-500 group-hover:text-neon-purple transition-all ${isCategoryExpanded ? 'rotate-90' : ''}`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      </div>
                                    </button>

                                    {/* Tech Stack Items - Grid Layout */}
                                    {isCategoryExpanded && (
                                      <div className="grid grid-cols-2 gap-2 p-2">
                                        {category.techStacks.map((tech) => {
                                          const isConcept = category.type === 'concept';

                                          return (
                                            <button
                                              key={tech.id}
                                              onClick={() =>
                                                handleAddTechNode(
                                                  category.type,
                                                  tech.label,
                                                  tech.id,
                                                  tech.icon,
                                                  tech.variants?.[0] // 传递第一个 variant（如果存在）
                                                )
                                              }
                                              className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-neon-blue/50 rounded-lg transition-all flex flex-col items-center justify-center space-y-2"
                                            >
                                              {isConcept ? (
                                                <ConceptIcon name={tech.icon} size={32} />
                                              ) : (
                                                <TechIcon name={tech.icon} size={32} />
                                              )}
                                              <span className="text-[10px] font-medium text-gray-300 group-hover:text-white transition-colors text-center leading-tight">
                                                {tech.label}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()
                      : // Basic nodes (flat list)
                        (group.items as BasicNodeItem[]).map((item) => (
                          <button
                            key={item.type}
                            onClick={() => handleAddBasicNode(item.type, item.label)}
                            className="group w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-blue/50 rounded-lg transition-all text-left"
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center text-xl shadow-lg`}
                              >
                                {item.icon}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-white">{item.label}</div>
                                <div className="text-xs text-gray-400">{item.description}</div>
                              </div>
                              <svg
                                className="w-5 h-5 text-gray-600 group-hover:text-neon-blue transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </div>
                          </button>
                        ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div className="p-4 border-t border-white/5">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="flex items-center space-x-2">
            <span>💡</span>
            <span>Click to add nodes</span>
          </p>
          <p className="flex items-center space-x-2">
            <span>🖱️</span>
            <span>Drag nodes to move</span>
          </p>
        </div>
      </div>
    </div>
  );
}
