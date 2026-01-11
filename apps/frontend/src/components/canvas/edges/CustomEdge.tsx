import { FC, useMemo } from 'react';
import { EdgeProps, getBezierPath, getSmoothStepPath } from 'reactflow';
import { calculateLabelDimensions, splitPathAroundLabel } from '../../../utils/edgeUtils';
import EdgePath from './EdgePath';
import EdgeLabel from './EdgeLabel';

const CustomEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
}) => {
  const edgeType = data?.edgeType || 'smoothstep';
  const showLabel = data?.showLabel !== false;

  const pathFunction = edgeType === 'bezier' ? getBezierPath : getSmoothStepPath;

  const [edgePath, labelX, labelY] = pathFunction({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const labelDimensions = useMemo(
    () => calculateLabelDimensions(String(label || ''), labelX, labelY),
    [label, labelX, labelY]
  );

  const { path1, path2 } = useMemo(() => {
    if (!label || !showLabel) {
      return { path1: edgePath, path2: '' };
    }
    return splitPathAroundLabel(edgePath, labelDimensions);
  }, [edgePath, label, showLabel, labelDimensions]);

  if (!label || !showLabel) {
    return <EdgePath id={id} path={edgePath} style={style} markerEnd={markerEnd} />;
  }

  return (
    <>
      <EdgePath
        id={`${id}-full-path`}
        path={edgePath}
        hidden
        className="react-flow__edge-path-full"
      />
      <EdgePath id={`${id}-segment1`} path={path1} style={style} />
      {path2 && <EdgePath id={`${id}-segment2`} path={path2} style={style} markerEnd={markerEnd} />}
      <EdgeLabel
        x={labelDimensions.x}
        y={labelDimensions.y}
        width={labelDimensions.width}
        height={labelDimensions.height}
        label={label}
      />
    </>
  );
};

export default CustomEdge;
