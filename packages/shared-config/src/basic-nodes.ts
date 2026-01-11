export type BasicNodeType = 'frame' | 'text' | 'image';

export interface BasicNodeConfig {
  type: BasicNodeType;
  label: string;
  description: string;
  icon: string;
}

export const BASIC_NODES: BasicNodeConfig[] = [
  {
    type: 'frame',
    label: 'Frame',
    description: 'Container with layout (flex-row, flex-col, grid)',
    icon: '🖼️',
  },
  {
    type: 'text',
    label: 'Text',
    description: 'Text element for labels and descriptions',
    icon: '📝',
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Image element with URL',
    icon: '🖼️',
  },
];

/**
 * 格式化基础节点配置为 AI 提示词
 */
export function formatBasicNodesForAI(): string {
  return BASIC_NODES.map((node, index) => {
    return `${index + 1}. ${node.type} - ${node.description}`;
  }).join('\n');
}

/**
 * 根据类型获取基础节点配置
 */
export function getBasicNode(type: BasicNodeType): BasicNodeConfig | undefined {
  return BASIC_NODES.find((node) => node.type === type);
}
