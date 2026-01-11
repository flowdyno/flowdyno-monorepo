import { memo, useState } from 'react';
import { NodeProps } from 'reactflow';
import { useNodeData } from '../../hooks/useNodeData';
import { TechIcon } from '../common/TechIcon';
import { ConceptIcon } from '../common/ConceptIcon';
import NodeHandles from './NodeHandles';

interface CustomNodeData {
  label: string;
  type: string;
  icon?: string;
  variant?: string; // Devicon variant
  color?: string;
  borderStyle?: 'none' | 'solid' | 'dashed';
  hideHandles?: boolean;
  isChildNode?: boolean;
  hideLabel?: boolean;
  emphasized?: boolean;
}

function CustomNode({ data, selected, id }: NodeProps<CustomNodeData>) {
  const [isHovered, setIsHovered] = useState(false);

  // 🔥 如果有 id,使用统一的 Hook 从 store 读取最新数据
  // CustomNode 可能被 FrameNode 直接调用(没有 id),所以需要兼容
  const nodeData = id ? useNodeData<any>(id, data) : data;

  const color = nodeData.color || '#00f0ff';
  const borderStyle = nodeData.borderStyle !== undefined ? nodeData.borderStyle : 'none';
  const hideHandles = nodeData.hideHandles || false;
  const isChildNode = nodeData.isChildNode || false;
  const emphasized = nodeData.emphasized || false;

  // Get border style
  const getBorderStyle = () => {
    // 如果是子节点且被选中,不显示边框(由外层虚线边框代替)
    if (isChildNode && selected) return '2px solid transparent';
    if (borderStyle === 'none') return '2px solid transparent';
    if (borderStyle === 'dashed') return `2px dashed ${color}`;
    return `2px solid ${color}`;
  };

  return (
    <div
      className="relative"
      data-node-id={id}
      style={{
        width: '100%',
        height: '100%',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection handles */}
      <NodeHandles isHovered={isHovered} hideHandles={hideHandles} />

      {/* Node content */}
      <div
        className={`w-full h-full rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${
          emphasized ? 'node-emphasized' : ''
        }`}
        style={{
          backgroundColor: selected ? 'rgba(31, 31, 46, 0.3)' : 'transparent',
          border: getBorderStyle(),
          boxShadow: 'none',
          boxSizing: 'border-box',
          padding: '8px 4px 6px 4px',
          gap: '4px',
        }}
      >
        {/* Icon */}
        <div className={`flex-shrink-0 ${emphasized ? 'icon-emphasized' : ''}`} data-node-icon={id}>
          {nodeData.icon ? (
            nodeData.type === 'concept' ? (
              <ConceptIcon name={nodeData.icon} size={44} />
            ) : (
              <TechIcon name={nodeData.icon} size={44} variant={nodeData.variant} />
            )
          ) : (
            <div className="text-2xl">{getIconEmoji(data.type)}</div>
          )}
        </div>

        {/* Label */}
        {!nodeData.hideLabel && (
          <div
            className="text-xs font-semibold text-center text-white leading-tight"
            style={{
              maxWidth: '100%',
              padding: '0 2px',
            }}
          >
            {nodeData.label}
          </div>
        )}
      </div>

      {/* Selection border - same as Frame (only for non-child nodes) */}
      {selected && !isChildNode && (
        <div
          style={{
            position: 'absolute',
            inset: -2,
            border: '2px solid #00f0ff',
            borderRadius: '14px',
            pointerEvents: 'none',
            boxShadow: '0 0 0 1px #00f0ff, 0 0 12px rgba(0, 240, 255, 0.6)',
          }}
        />
      )}
    </div>
  );
}

function getIconEmoji(type: string): string {
  const iconMap: Record<string, string> = {
    service: '⚙️',
    api: '🔌',
    database: '💾',
    queue: '📬',
    cache: '⚡',
    frontend: '🖥️',
    backend: '🔧',
  };
  return iconMap[type.toLowerCase()] || '⚙️';
}

// Custom comparison function for memo to prevent unnecessary re-renders
const arePropsEqual = (
  prevProps: NodeProps<CustomNodeData>,
  nextProps: NodeProps<CustomNodeData>
) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data.label === nextProps.data.label &&
    prevProps.data.type === nextProps.data.type &&
    prevProps.data.color === nextProps.data.color &&
    prevProps.data.borderStyle === nextProps.data.borderStyle &&
    prevProps.data.hideLabel === nextProps.data.hideLabel
  );
};

export default memo(CustomNode, arePropsEqual);
