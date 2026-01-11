import { memo, useState } from 'react';
import { NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import { useNodeData } from '../../../hooks/useNodeData';
import type { ImageNode as ImageNodeType } from '../../../types/canvas';
import NodeHandles from '../NodeHandles';

function ImageNode({ data, selected, id }: NodeProps<ImageNodeType>) {
  const [isHovered, setIsHovered] = useState(false);

  const nodeData = useNodeData<ImageNodeType>(id, data);

  const { src, alt = 'Image', objectFit = 'contain' } = nodeData;

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
        minWidth={60}
        minHeight={60}
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

      <div
        className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg"
        style={{
          backgroundColor: '#1a1a24',
        }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full"
            style={{
              objectFit: objectFit as any,
            }}
          />
        ) : (
          <div className="text-gray-500 text-sm">No image</div>
        )}
      </div>
    </div>
  );
}

export default memo(ImageNode);
