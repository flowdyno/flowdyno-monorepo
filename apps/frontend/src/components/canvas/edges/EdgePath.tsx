import { FC, CSSProperties } from 'react';

interface EdgePathProps {
  id: string;
  path: string;
  style?: CSSProperties;
  markerEnd?: any;
  className?: string;
  hidden?: boolean;
}

const EdgePath: FC<EdgePathProps> = ({
  id,
  path,
  style = {},
  markerEnd,
  className = 'react-flow__edge-path',
  hidden = false,
}) => {
  const pathStyle = hidden
    ? { opacity: 0, pointerEvents: 'none' as const }
    : { ...style, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <path
      id={id}
      d={path}
      style={pathStyle}
      markerEnd={markerEnd}
      className={className}
      data-edge-id={hidden ? id.replace('-full-path', '') : undefined}
    />
  );
};

export default EdgePath;
