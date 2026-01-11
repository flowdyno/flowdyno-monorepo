import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

interface NodeHandlesProps {
  isHovered: boolean;
  hideHandles?: boolean;
}

const HANDLE_OFFSET = -2;

const getHandleStyle = (isHovered: boolean) => ({
  background: 'radial-gradient(circle, #00f0ff 0%, #00d4e6 100%)',
  border: '2px solid #0a0a0f',
  boxShadow: '0 0 0 1px #00f0ff, 0 0 12px rgba(0, 240, 255, 0.9), 0 0 24px rgba(0, 240, 255, 0.5)',
  opacity: isHovered ? 1 : 0,
  cursor: 'crosshair',
});

function NodeHandles({ isHovered, hideHandles = false }: NodeHandlesProps) {
  const handleStyle = useMemo(() => getHandleStyle(isHovered), [isHovered]);

  if (hideHandles) {
    return null;
  }

  return (
    <>
      {/* Top Handle - 既可以作为起点也可以作为终点 */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !rounded-full transition-opacity duration-200"
        style={{
          ...handleStyle,
          top: `${HANDLE_OFFSET}px`,
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 999,
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !rounded-full transition-opacity duration-200"
        style={{
          ...handleStyle,
          top: `${HANDLE_OFFSET}px`,
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 999,
        }}
      />

      {/* Right Handle - 既可以作为起点也可以作为终点 */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !rounded-full transition-opacity duration-200"
        style={{
          ...handleStyle,
          right: `${HANDLE_OFFSET}px`,
          top: '50%',
          transform: 'translate(50%, -50%)',
          zIndex: 999,
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !rounded-full transition-opacity duration-200"
        style={{
          ...handleStyle,
          right: `${HANDLE_OFFSET}px`,
          top: '50%',
          transform: 'translate(50%, -50%)',
          zIndex: 999,
        }}
      />

      {/* Bottom Handle - 既可以作为起点也可以作为终点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !rounded-full transition-opacity duration-200"
        style={{
          ...handleStyle,
          bottom: `${HANDLE_OFFSET}px`,
          left: '50%',
          transform: 'translate(-50%, 50%)',
          zIndex: 999,
        }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !rounded-full transition-opacity duration-200"
        style={{
          ...handleStyle,
          bottom: `${HANDLE_OFFSET}px`,
          left: '50%',
          transform: 'translate(-50%, 50%)',
          zIndex: 999,
        }}
      />

      {/* Left Handle - 既可以作为起点也可以作为终点 */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !rounded-full transition-opacity duration-200"
        style={{
          ...handleStyle,
          left: `${HANDLE_OFFSET}px`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 999,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !rounded-full transition-opacity duration-200"
        style={{
          ...handleStyle,
          left: `${HANDLE_OFFSET}px`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 999,
        }}
      />
    </>
  );
}

export default memo(NodeHandles);
