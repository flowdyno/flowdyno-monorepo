import { FC } from 'react';

interface EdgeLabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string | React.ReactNode;
}

const EdgeLabel: FC<EdgeLabelProps> = ({ x, y, width, height, label }) => {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={3}
        ry={3}
        fill="none"
        className="react-flow__edge-label-bg"
      />

      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: 10,
          fontWeight: 500,
          fill: '#ffffff',
          pointerEvents: 'all',
        }}
        className="react-flow__edge-label nodrag nopan"
      >
        {label}
      </text>
    </>
  );
};

export default EdgeLabel;
