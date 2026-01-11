import html2canvas from 'html2canvas';
import { useAnimationStore } from '../../stores/animationStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { useReactFlowStore } from '../../stores/reactFlowStore';
import { applyAnimations, resetAllAnimations } from '../animation/animationRuntime';

export interface OfflineRenderOptions {
  element: HTMLElement;
  duration: number;
  fps: number;
  onProgress?: (progress: number) => void;
  progressStart?: number;
  progressEnd?: number;
}

export interface OfflineRenderResult {
  frames: HTMLCanvasElement[];
  originalSettings: any;
  wasPlaying: boolean;
}

export interface StaticRenderResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

function getNodeDimensions(node: any): { width: number; height: number } {
  if (node.width !== undefined && node.height !== undefined) {
    return { width: node.width, height: node.height };
  }

  if (node.type === 'frame') {
    return { width: node.width || 300, height: node.height || 200 };
  }
  if (node.type === 'text') {
    return { width: node.width || 200, height: node.height || 60 };
  }
  if (node.type === 'image') {
    return { width: node.width || 85, height: node.height || 85 };
  }

  const basicNodeTypes = ['frame', 'text', 'image'];
  const isTechNode = !basicNodeTypes.includes(node.type);
  if (isTechNode) {
    return { width: 85, height: 100 };
  }

  return { width: 85, height: 85 };
}

function calculateBounds(nodes: any[], connections: any[] = []) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const nodeMap = new Map<string, any>();

  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
  });

  // 构建 parentMap：childId -> parentId
  const parentMap = new Map<string, string>();
  nodes.forEach((node) => {
    if (node.type === 'frame' && node.children) {
      node.children.forEach((childId: string) => {
        parentMap.set(childId, node.id);
      });
    }
  });

  // 只计算顶级节点的边界（Frame 和非子节点）
  nodes.forEach((node) => {
    // 跳过子节点，因为它们包含在 Frame 内
    if (parentMap.has(node.id)) {
      return;
    }

    const x = node.position.x;
    const y = node.position.y;

    const { width, height } = getNodeDimensions(node);

    console.log(`Node ${node.id} (${node.type}): pos=(${x}, ${y}), size=(${width}, ${height})`);

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  connections.forEach((conn) => {
    const fromNode = nodeMap.get(conn.from);
    const toNode = nodeMap.get(conn.to);
    if (!fromNode || !toNode) return;

    let fromX = fromNode.position.x;
    let fromY = fromNode.position.y;
    let toX = toNode.position.x;
    let toY = toNode.position.y;

    if (fromNode.parentId) {
      const parentNode = nodeMap.get(fromNode.parentId);
      if (parentNode) {
        fromX += parentNode.position.x;
        fromY += parentNode.position.y;
      }
    }
    if (toNode.parentId) {
      const parentNode = nodeMap.get(toNode.parentId);
      if (parentNode) {
        toX += parentNode.position.x;
        toY += parentNode.position.y;
      }
    }

    const fromDim = getNodeDimensions(fromNode);
    const toDim = getNodeDimensions(toNode);
    fromX += fromDim.width / 2;
    fromY += fromDim.height / 2;
    toX += toDim.width / 2;
    toY += toDim.height / 2;

    const edgeType = conn.edgeType || 'smoothstep';
    if (edgeType === 'smoothstep') {
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      minX = Math.min(minX, midX - 50);
      maxX = Math.max(maxX, midX + 50);
      minY = Math.min(minY, midY - 50);
      maxY = Math.max(maxY, midY + 50);
    }
  });

  console.log('Calculated bounds:', { minX, minY, maxX, maxY });
  return { minX, minY, maxX, maxY };
}

export async function renderStaticOffline(element: HTMLElement): Promise<StaticRenderResult> {
  const animationStore = useAnimationStore.getState();
  const canvasStoreState = useCanvasStore.getState();
  const reactFlowStore = useReactFlowStore.getState();
  const originalSettings = { ...animationStore.settings };
  const wasPlaying = animationStore.isPlaying;

  animationStore.stop();
  canvasStoreState.setSelection([]);
  canvasStoreState.setSelectedConnection(null);
  reactFlowStore.setIsExporting(true);

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await new Promise((resolve) => setTimeout(resolve, 200));

  const nodes = canvasStoreState.nodes;
  const connections = canvasStoreState.connections;
  const selectedIds = canvasStoreState.selectedIds;

  if (nodes.length === 0) {
    throw new Error('No nodes to export. Please add some nodes to the canvas first.');
  }

  const { minX, minY, maxX, maxY } = calculateBounds(nodes, connections);

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    throw new Error('Invalid node positions detected. Please check your canvas.');
  }

  const padding = 100;
  const rawWidth = Math.max(100, maxX - minX + padding * 2);
  const rawHeight = Math.max(100, maxY - minY + padding * 2);
  const boundsWidth = Math.ceil(rawWidth / 2) * 2;
  const boundsHeight = Math.ceil(rawHeight / 2) * 2;

  console.log('Static render bounds:', {
    minX,
    minY,
    maxX,
    maxY,
    boundsWidth,
    boundsHeight,
    nodeCount: nodes.length,
  });

  const originalViewport = reactFlowStore.getViewport();
  const originalWidth = element.style.width;
  const originalHeight = element.style.height;

  const excludeElements = element.querySelectorAll('.export-exclude');
  const originalDisplays: string[] = [];
  excludeElements.forEach((el, index) => {
    const htmlEl = el as HTMLElement;
    originalDisplays[index] = htmlEl.style.display;
    htmlEl.style.display = 'none';
  });

  const backgroundElement = element.querySelector('.react-flow__background') as HTMLElement;
  const originalBackgroundDisplay = backgroundElement?.style.display || '';
  if (backgroundElement) {
    backgroundElement.style.display = 'none';
  }

  applyAnimations(0, {
    nodes,
    connections,
    settings: originalSettings,
    selectedIds,
  });

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  element.style.width = `${boundsWidth}px`;
  element.style.height = `${boundsHeight}px`;

  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  reactFlowStore.setViewport({ x: offsetX, y: offsetY, zoom: 1 });

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await new Promise((resolve) => setTimeout(resolve, 150));

  const svgElement = element.querySelector('.react-flow__edges') as SVGElement;
  const originalSvgStyle = svgElement?.getAttribute('style') || '';
  if (svgElement) {
    svgElement.style.width = `${boundsWidth * 2}px`;
    svgElement.style.height = `${boundsHeight * 2}px`;
    svgElement.style.overflow = 'visible';
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      backgroundColor: '#1a1a2e',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: boundsWidth,
      height: boundsHeight,
    });

    console.log('Static render canvas:', { width: canvas.width, height: canvas.height });
  } finally {
    if (svgElement) {
      svgElement.setAttribute('style', originalSvgStyle);
    }

    if (originalViewport) {
      reactFlowStore.setViewport(originalViewport);
    }

    element.style.width = originalWidth;
    element.style.height = originalHeight;

    excludeElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = originalDisplays[index];
    });

    if (backgroundElement) {
      backgroundElement.style.display = originalBackgroundDisplay;
    }

    reactFlowStore.setIsExporting(false);
  }

  resetAllAnimations(nodes);

  animationStore.updateSettings(originalSettings);
  if (wasPlaying) {
    animationStore.play();
  }

  return {
    canvas,
    width: boundsWidth,
    height: boundsHeight,
  };
}

export async function renderFramesOffline(
  options: OfflineRenderOptions
): Promise<OfflineRenderResult> {
  const {
    element,
    duration,
    fps,
    onProgress = () => {},
    progressStart = 0,
    progressEnd = 100,
  } = options;

  const animationStore = useAnimationStore.getState();
  const canvasStoreState = useCanvasStore.getState();
  const reactFlowStore = useReactFlowStore.getState();
  const originalSettings = { ...animationStore.settings };
  const wasPlaying = animationStore.isPlaying;

  animationStore.stop();
  canvasStoreState.setSelection([]);
  canvasStoreState.setSelectedConnection(null);
  reactFlowStore.setIsExporting(true);

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await new Promise((resolve) => setTimeout(resolve, 200));

  const nodes = canvasStoreState.nodes;
  const connections = canvasStoreState.connections;
  const selectedIds = canvasStoreState.selectedIds;

  if (nodes.length === 0) {
    throw new Error('No nodes to export. Please add some nodes to the canvas first.');
  }

  const { minX, minY, maxX, maxY } = calculateBounds(nodes, connections);

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    throw new Error('Invalid node positions detected. Please check your canvas.');
  }

  const padding = 100;
  const rawWidth = Math.max(100, maxX - minX + padding * 2);
  const rawHeight = Math.max(100, maxY - minY + padding * 2);
  const boundsWidth = Math.ceil(rawWidth / 2) * 2;
  const boundsHeight = Math.ceil(rawHeight / 2) * 2;
  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  console.log('Render bounds:', {
    minX,
    minY,
    maxX,
    maxY,
    boundsWidth,
    boundsHeight,
    nodeCount: nodes.length,
  });

  const originalViewport = reactFlowStore.getViewport();
  const originalWidth = element.style.width;
  const originalHeight = element.style.height;

  const excludeElements = element.querySelectorAll('.export-exclude');
  const originalDisplays: string[] = [];
  excludeElements.forEach((el, index) => {
    const htmlEl = el as HTMLElement;
    originalDisplays[index] = htmlEl.style.display;
    htmlEl.style.display = 'none';
  });

  const backgroundElement = element.querySelector('.react-flow__background') as HTMLElement;
  const originalBackgroundDisplay = backgroundElement?.style.display || '';
  if (backgroundElement) {
    backgroundElement.style.display = 'none';
  }

  element.style.width = `${boundsWidth}px`;
  element.style.height = `${boundsHeight}px`;

  reactFlowStore.setViewport({ x: offsetX, y: offsetY, zoom: 1 });

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await new Promise((resolve) => setTimeout(resolve, 150));

  const svgElement = element.querySelector('.react-flow__edges') as SVGElement;
  const originalSvgStyle = svgElement?.getAttribute('style') || '';
  if (svgElement) {
    svgElement.style.width = `${boundsWidth * 2}px`;
    svgElement.style.height = `${boundsHeight * 2}px`;
    svgElement.style.overflow = 'visible';
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const totalFrames = Math.round(duration * fps);
  const frameCanvases: HTMLCanvasElement[] = [];

  console.log(`Rendering ${totalFrames + 1} frames at ${fps}fps...`);

  const dashedAnimationPeriod = 0.5;
  const dashedAnimationOffset = 10;

  try {
    for (let i = 0; i <= totalFrames; i++) {
      const progress = i / totalFrames;
      const currentTime = i / fps;

      applyAnimations(progress, {
        nodes,
        connections,
        settings: originalSettings,
        selectedIds,
      });

      const animatedEdges = element.querySelectorAll(
        '.react-flow__edge.animated .react-flow__edge-path'
      );
      animatedEdges.forEach((edge) => {
        if (edge instanceof SVGPathElement) {
          const cycleProgress = (currentTime % dashedAnimationPeriod) / dashedAnimationPeriod;
          const offset = (1 - cycleProgress) * dashedAnimationOffset;
          edge.style.strokeDashoffset = `${offset}`;
          edge.style.animation = 'none';
        }
      });

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 30));

      const canvas = await html2canvas(element, {
        backgroundColor: '#1a1a2e',
        scale: 1,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: boundsWidth,
        height: boundsHeight,
      });

      if (i === 0) {
        console.log('First frame canvas:', { width: canvas.width, height: canvas.height });
      }

      frameCanvases.push(canvas);

      const currentProgress = progressStart + (i / totalFrames) * (progressEnd - progressStart);
      onProgress(currentProgress);
    }
  } finally {
    if (svgElement) {
      svgElement.setAttribute('style', originalSvgStyle);
    }

    if (originalViewport) {
      reactFlowStore.setViewport(originalViewport);
    }

    element.style.width = originalWidth;
    element.style.height = originalHeight;

    excludeElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = originalDisplays[index];
    });

    if (backgroundElement) {
      backgroundElement.style.display = originalBackgroundDisplay;
    }

    const animatedEdges = element.querySelectorAll(
      '.react-flow__edge.animated .react-flow__edge-path'
    );
    animatedEdges.forEach((edge) => {
      if (edge instanceof SVGPathElement) {
        edge.style.strokeDashoffset = '';
        edge.style.animation = '';
      }
    });

    reactFlowStore.setIsExporting(false);
  }

  console.log(`Rendered ${frameCanvases.length} frames successfully`);

  resetAllAnimations(nodes);

  return {
    frames: frameCanvases,
    originalSettings,
    wasPlaying,
  };
}
