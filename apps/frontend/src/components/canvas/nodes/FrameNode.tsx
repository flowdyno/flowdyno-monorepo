import { memo, useState, useMemo } from 'react';
import { NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import { useCanvasStore } from '../../../stores/canvasStore';
import { useNodeData } from '../../../hooks/useNodeData';
import type { FrameNode as FrameNodeType } from '../../../types/canvas';
import FrameNodeHandles from '../FrameNodeHandles';

function FrameNode({ data, selected, id }: NodeProps<FrameNodeType>) {
  const [isHovered, setIsHovered] = useState(false);
  const dragOverFrameId = useCanvasStore((state) => state.dragOverFrameId);
  const nodes = useCanvasStore((state) => state.nodes);

  const nodeData = useNodeData<FrameNodeType>(id, data);

  const { color = '#00f0ff', borderStyle = 'solid' } = nodeData;
  const padding = (nodeData as any).padding ?? 16;
  const backgroundColor = (nodeData as any).backgroundColor || '#1a1a24';
  const borderRadius = (nodeData as any).borderRadius ?? 12;
  const label = (nodeData as any).label || '';
  const showLabel = (nodeData as any).showLabel !== false; // 默认显示 label

  const isDragOver = dragOverFrameId === id;

  // 检查是否有可见 label
  const hasVisibleLabel = showLabel && label;
  const labelOffset = hasVisibleLabel ? 30 : 0;

  // 计算最小尺寸：基于子节点的位置和尺寸，四个面都要有 padding
  const minSize = useMemo(() => {
    const children = (nodeData as any).children || [];
    if (children.length === 0) {
      return { minWidth: 100, minHeight: 80 + labelOffset };
    }

    let maxRight = 0;
    let maxBottom = 0;

    children.forEach((childId: string) => {
      const childNode = nodes.find((n) => n.id === childId);
      if (childNode) {
        const childWidth = childNode.width || 85;
        const childHeight = childNode.height || 85;
        const right = childNode.position.x + childWidth;
        // 子节点的 y 坐标是相对于 FrameNode 外层容器的，已经包含 labelOffset
        const bottom = childNode.position.y + childHeight;

        maxRight = Math.max(maxRight, right);
        maxBottom = Math.max(maxBottom, bottom);
      }
    });

    // node.height 存储的是 React Flow 节点总高度（包含 label）
    // maxBottom 是子节点最下方的 y 坐标（相对于外层容器）
    // minHeight = maxBottom + padding 就是总高度
    const requiredWidth = maxRight + padding;
    const requiredHeight = maxBottom + padding;

    return {
      minWidth: Math.max(100, requiredWidth),
      minHeight: Math.max(80 + labelOffset, requiredHeight),
    };
  }, [nodeData, nodes, padding, labelOffset]);

  const getBorderStyle = () => {
    const baseWidth = selected ? 2 : 1;
    const glowEnabled = (nodeData as any).glowEnabled ?? false;
    const glowColor = (nodeData as any).glowColor || color;

    let borderValue = `${baseWidth}px ${borderStyle} ${color}`;

    if (selected && glowEnabled) {
      borderValue = `${baseWidth}px ${borderStyle} ${glowColor}`;
    }

    return borderValue;
  };

  const getBoxShadow = () => {
    const glowEnabled = (nodeData as any).glowEnabled ?? false;
    const glowColor = (nodeData as any).glowColor || color;

    if (!selected || !glowEnabled) return 'none';

    return `0 0 20px ${glowColor}80, 0 0 40px ${glowColor}40`;
  };

  const labelHeight = hasVisibleLabel ? 30 : 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <NodeResizer
        color={color}
        isVisible={selected}
        minWidth={minSize.minWidth}
        minHeight={minSize.minHeight}
        handleStyle={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          border: `2px solid ${color}40`,
        }}
        lineStyle={{
          borderColor: color,
          borderWidth: '1px',
        }}
      />

      <FrameNodeHandles
        isHovered={isHovered}
        hideHandles={(nodeData as any).hideHandles}
        hasLabel={showLabel && !!label}
      />

      {/* Frame label - 使用 absolute + top 定位 */}
      {showLabel && label && (
        <div
          style={{
            height: `${labelHeight}px`,
            lineHeight: `${labelHeight}px`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              pointerEvents: 'none',
              borderRadius: '4px',
              color: '#fff',
              height: `${labelHeight}px`,
              lineHeight: `${labelHeight}px`,
            }}
          >
            {label}
          </div>
        </div>
      )}

      {/* Frame 主体 - 使用 absolute 定位，top 为 labelHeight */}
      <div
        style={{
          position: 'absolute',
          top: `${labelHeight}px`,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDragOver ? `${color}20` : backgroundColor,
          border: isDragOver ? `3px dashed ${color}` : getBorderStyle(),
          borderRadius: `${borderRadius}px`,
          padding: `${padding}px`,
          pointerEvents: 'auto',
          boxShadow: getBoxShadow(),
          transition: 'all 0.2s',
        }}
      >
        {/* 子节点现在由 React Flow 渲染为独立节点，设置了 parentNode 和 extent: 'parent' */}
      </div>
    </div>
  );
}

const arePropsEqual = (
  prevProps: NodeProps<FrameNodeType>,
  nextProps: NodeProps<FrameNodeType>
) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data.color === nextProps.data.color &&
    prevProps.data.borderStyle === nextProps.data.borderStyle
  );
};

export default memo(FrameNode, arePropsEqual);
