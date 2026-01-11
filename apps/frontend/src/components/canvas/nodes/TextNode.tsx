import { memo, useState, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import { useCanvasStore } from '../../../stores/canvasStore';
import { useNodeData } from '../../../hooks/useNodeData';
import type { TextNode as TextNodeType } from '../../../types/canvas';
import NodeHandles from '../NodeHandles';

function TextNode({ data, selected, id }: NodeProps<TextNodeType>) {
  const [isHovered, setIsHovered] = useState(false);
  const [manuallyResized, setManuallyResized] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const updateNode = useCanvasStore((state) => state.updateNode);

  const nodeData = useNodeData<TextNodeType>(id, data);

  const {
    content = 'Text',
    fontSize = 14,
    fontWeight = 400,
    textAlign = 'left',
    color = '#ffffff',
  } = nodeData;

  useEffect(() => {
    if (textRef.current && !manuallyResized) {
      const padding = 16;
      const width = Math.max(100, textRef.current.scrollWidth + padding);
      const height = Math.max(40, textRef.current.scrollHeight + padding);

      if (
        Math.abs((nodeData.width || 180) - width) > 5 ||
        Math.abs((nodeData.height || 85) - height) > 5
      ) {
        updateNode(id, { width, height });
      }
    }
  }, [content, fontSize, fontWeight, id, updateNode, data.width, data.height, manuallyResized]);

  return (
    <div
      className="relative"
      style={{
        width: '100%',
        height: '100%',
        zIndex: selected ? 1000 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeResizer
        color="#00f0ff"
        isVisible={selected}
        minWidth={100}
        minHeight={40}
        onResize={() => setManuallyResized(true)}
        handleStyle={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: '2px solid #0a0a0f',
          boxShadow: '0 0 10px #00f0ff',
          background: '#00f0ff',
        }}
        lineStyle={{
          borderWidth: 2,
          borderStyle: 'solid',
          borderColor: '#00f0ff',
        }}
      />

      {/* Connection handles */}
      <NodeHandles isHovered={isHovered} />

      {/* Text content */}
      <div
        className="w-full h-full flex items-center justify-center p-2 rounded transition-all duration-200"
        style={{
          backgroundColor: selected ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
          border: selected ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid transparent',
        }}
      >
        <div
          ref={textRef}
          style={{
            fontSize: `${fontSize}px`,
            fontWeight,
            textAlign,
            color,
            width: '100%',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}

// Custom comparison function for memo to prevent unnecessary re-renders
const arePropsEqual = (prevProps: NodeProps<TextNodeType>, nextProps: NodeProps<TextNodeType>) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.data.content === nextProps.data.content &&
    prevProps.data.fontSize === nextProps.data.fontSize &&
    prevProps.data.fontWeight === nextProps.data.fontWeight &&
    prevProps.data.textAlign === nextProps.data.textAlign &&
    prevProps.data.color === nextProps.data.color
  );
};

export default memo(TextNode, arePropsEqual);
