import type { Node, Connection } from '../../types/canvas';
import type { AnimationSettings } from '../../types/animation';

export interface AnimationRuntimeContext {
  nodes: Node[];
  connections: Connection[];
  settings: AnimationSettings;
  selectedIds?: string[];
}

export function applyAnimations(progress: number, context: AnimationRuntimeContext): void {
  const { nodes, connections } = context;

  // Progress is already adjusted by speed in useAnimationPlayer
  const nodeProgress = Math.min(progress, 1);

  // When playing animations, apply to ALL nodes with animation effects
  const targetNodes = nodes.filter(
    (node) => node.animationEffects && Object.keys(node.animationEffects).length > 0
  );

  // For path animations, we need to consider ALL nodes with path effects
  const allNodesWithPathEffects = nodes.filter(
    (node) => node.animationEffects?.pathDrawing || node.animationEffects?.pathFlow
  );

  // Check if any connection has pathDrawing/pathFlow effects
  const hasConnectionPathDrawing = connections.some(
    (conn: any) => conn.animationEffects?.pathDrawing
  );
  const hasConnectionPathFlow = connections.some((conn: any) => conn.animationEffects?.pathFlow);

  // Check if any node has pathDrawing/pathFlow effects
  const hasNodePathDrawing = allNodesWithPathEffects.some(
    (node) => node.animationEffects?.pathDrawing
  );
  const hasNodePathFlow = allNodesWithPathEffects.some((node) => node.animationEffects?.pathFlow);

  if (targetNodes.length === 0 && !hasConnectionPathDrawing && !hasConnectionPathFlow) {
    return;
  }

  // 清理所有节点上不再需要的动画元素和样式
  nodes.forEach((node) => {
    const effects = node.animationEffects || {};
    const iconElement = document.querySelector(`[data-node-icon="${node.id}"]`);

    // 如果没有 circuitPulse 效果，清理 circuit-pulse 元素
    if (!effects.circuitPulse) {
      const element = document.querySelector(`[data-node-id="${node.id}"]`);
      if (element instanceof HTMLElement) {
        const circuit = element.querySelector('.circuit-pulse');
        if (circuit) {
          circuit.remove();
        }
      }
    }

    // 精细清理 transform 相关样式
    if (iconElement instanceof HTMLElement) {
      let currentTransform = iconElement.style.transform;

      // 如果没有 shake 效果，清理 translate
      if (!effects.shake && currentTransform.includes('translate(')) {
        currentTransform = currentTransform.replace(/translate\([^)]*\)/g, '').trim();
      }

      // 如果没有 rotate 效果，清理 rotate
      if (!effects.rotate && currentTransform.includes('rotate(')) {
        currentTransform = currentTransform.replace(/rotate\([^)]*\)/g, '').trim();
      }

      // 如果没有 flip3D 效果，清理 perspective 和 rotateY
      if (!effects.flip3D) {
        currentTransform = currentTransform
          .replace(/perspective\([^)]*\)/g, '')
          .replace(/rotateY\([^)]*\)/g, '')
          .trim();
        iconElement.style.transformStyle = '';
      }

      // 如果没有 nodePulse 效果，清理 scale
      if (!effects.nodePulse && currentTransform.includes('scale')) {
        currentTransform = currentTransform.replace(/scale\([^)]*\)/g, '').trim();
      }

      // 如果没有 chargingBar 效果，清理 charging bar
      if (!effects.chargingBar) {
        const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
        if (nodeElement instanceof HTMLElement) {
          const chargingBar = nodeElement.querySelector('.charging-bar-container');
          if (chargingBar) {
            chargingBar.remove();
          }
        }
      }

      // 如果所有 transform 都清理完了，重置为空
      if (!currentTransform || currentTransform === '') {
        iconElement.style.transform = '';
      } else {
        iconElement.style.transform = currentTransform;
      }
    }

    // 如果没有 fadeIn 效果，重置 opacity
    if (!effects.fadeIn) {
      if (iconElement instanceof HTMLElement) {
        iconElement.style.opacity = '';
      }
    }
  });

  targetNodes.forEach((node) => {
    const effects = node.animationEffects || {};

    if (effects.nodePulse) {
      applyNodePulse(nodeProgress, [node]);
    }
    if (effects.fadeIn) {
      applyFadeIn(nodeProgress, [node]);
    }
    if (effects.circuitPulse) {
      applyCircuitPulse(nodeProgress, [node]);
    }
    if (effects.rotate) {
      applyRotate(nodeProgress, [node]);
    }
    if (effects.flip3D) {
      applyFlip3D(nodeProgress, [node]);
    }
    if (effects.chargingBar) {
      applyChargingBar(nodeProgress, [node]);
    }
    if (effects.shake) {
      applyShake(nodeProgress, [node]);
    }
  });

  if (hasConnectionPathDrawing || hasNodePathDrawing) {
    applyPathDrawing(progress, allNodesWithPathEffects, connections);
  }

  if (hasConnectionPathFlow || hasNodePathFlow) {
    applyPathFlow(progress, allNodesWithPathEffects, connections);
  }
}

export function resetAllAnimations(nodes: Node[]): void {
  nodes.forEach((node) => {
    const element = document.querySelector(`[data-node-id="${node.id}"]`);
    if (element instanceof HTMLElement) {
      element.style.transform = '';
      element.style.opacity = '';
      element.style.boxShadow = '';

      // 清理 circuit pulse 创建的元素
      const circuit = element.querySelector('.circuit-pulse');
      if (circuit) {
        circuit.remove();
      }

      // 清理 charging bar 创建的元素
      const chargingBar = element.querySelector('.charging-bar-container');
      if (chargingBar) {
        chargingBar.remove();
      }
    }

    // 清理 icon 元素的样式
    const iconElement = document.querySelector(`[data-node-icon="${node.id}"]`);
    if (iconElement instanceof HTMLElement) {
      iconElement.style.transform = '';
      iconElement.style.opacity = '';
      iconElement.style.filter = '';
    }
  });

  const edgePaths = Array.from(
    document.querySelectorAll('.react-flow__edge-path')
  ) as SVGPathElement[];

  edgePaths.forEach((path) => {
    path.style.strokeDasharray = '';
    path.style.strokeDashoffset = '';

    if (path.dataset.originalMarkerEnd) {
      path.setAttribute('marker-end', path.dataset.originalMarkerEnd);
    }

    const parent = path.parentElement;
    if (parent) {
      const markers = parent.querySelectorAll('.flow-marker');
      markers.forEach((marker) => marker.remove());
    }
  });
}

function applyNodePulse(progress: number, targetNodes: Node[]): void {
  targetNodes.forEach((node) => {
    const iconElement = document.querySelector(`[data-node-icon="${node.id}"]`);
    if (iconElement instanceof HTMLElement) {
      const pulse = Math.sin(progress * Math.PI * 4) * 0.1 + 1;
      const existingTransform = iconElement.style.transform.replace(/scale\([^)]*\)/g, '').trim();
      iconElement.style.transform = `${existingTransform} scale(${pulse})`.trim();
    }
  });
}

function applyFadeIn(progress: number, targetNodes: Node[]): void {
  targetNodes.forEach((node, index) => {
    const iconElement = document.querySelector(`[data-node-icon="${node.id}"]`);
    if (iconElement instanceof HTMLElement) {
      const delay = (index / targetNodes.length) * 0.3;
      const nodeProgress = Math.max(0, Math.min(1, (progress - delay) / 0.7));
      iconElement.style.opacity = `${nodeProgress}`;
    }
  });
}

function applyCircuitPulse(progress: number, targetNodes: Node[]): void {
  targetNodes.forEach((node) => {
    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
    if (nodeElement instanceof HTMLElement) {
      let circuit = nodeElement.querySelector('.circuit-pulse') as HTMLElement;
      if (!circuit) {
        circuit = document.createElement('div');
        circuit.className = 'circuit-pulse';
        circuit.style.cssText = `
          position: absolute;
          inset: -2px;
          border-radius: 12px;
          pointer-events: none;
          z-index: 10;
          border: 2px solid transparent;
        `;
        nodeElement.style.position = 'relative';
        nodeElement.appendChild(circuit);
      }

      const color = getNodeColor(node.type);
      const pulsePhase = (progress % 1) * Math.PI * 2;
      const glowIntensity = 0.3 + 0.7 * Math.abs(Math.sin(pulsePhase));
      const shadowSize = 4 + 8 * glowIntensity;

      circuit.style.borderColor = color;
      circuit.style.opacity = `${glowIntensity}`;
      circuit.style.boxShadow = `0 0 ${shadowSize}px ${color}, inset 0 0 ${shadowSize / 2}px ${color}`;
    }
  });
}

function applyRotate(progress: number, targetNodes: Node[]): void {
  targetNodes.forEach((node) => {
    const iconElement = document.querySelector(`[data-node-icon="${node.id}"]`);
    if (iconElement instanceof HTMLElement) {
      const rotation = progress * 360 * 2;
      iconElement.style.transformOrigin = 'center center';
      const existingTransform = iconElement.style.transform.replace(/rotate\([^)]*\)/g, '').trim();
      iconElement.style.transform = `${existingTransform} rotate(${rotation}deg)`.trim();
    }
  });
}

function applyFlip3D(progress: number, targetNodes: Node[]): void {
  targetNodes.forEach((node) => {
    const iconElement = document.querySelector(`[data-node-icon="${node.id}"]`);
    if (iconElement instanceof HTMLElement) {
      // 每个周期翻转一次
      const cycleProgress = (progress * 2) % 1; // 2秒一个周期

      let rotateY = 0;
      if (cycleProgress < 0.5) {
        // 前半段：0° → 180°
        rotateY = cycleProgress * 2 * 180;
      } else {
        // 后半段：180° → 360° (回到 0°)
        rotateY = 180 + (cycleProgress - 0.5) * 2 * 180;
      }

      const existingTransform = iconElement.style.transform
        .replace(/perspective\([^)]*\)/g, '')
        .replace(/rotateY\([^)]*\)/g, '')
        .trim();

      iconElement.style.transformOrigin = 'center center';
      iconElement.style.transform =
        `perspective(1000px) ${existingTransform} rotateY(${rotateY}deg)`.trim();
      iconElement.style.transformStyle = 'preserve-3d';
    }
  });
}

function applyChargingBar(progress: number, targetNodes: Node[]): void {
  targetNodes.forEach((node, index) => {
    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
    if (nodeElement instanceof HTMLElement) {
      const delay = (index / targetNodes.length) * 0.2;
      const nodeProgress = Math.max(0, (progress - delay) / (1 - delay));

      const cycle = (nodeProgress * 3) % 1;

      let barContainer = nodeElement.querySelector('.charging-bar-container') as HTMLElement;
      if (!barContainer) {
        const nodeHeight = nodeElement.offsetHeight || 100;
        barContainer = document.createElement('div');
        barContainer.className = 'charging-bar-container';
        barContainer.style.cssText = `
          position: absolute;
          top: ${nodeHeight - 6}px;
          left: 15%;
          right: 15%;
          height: 4px;
          background-color: rgba(0, 0, 0, 0.5);
          border-radius: 2px;
          overflow: hidden;
        `;

        const barFill = document.createElement('div');
        barFill.className = 'charging-bar-fill';
        barFill.style.cssText = `
          height: 100%;
          width: 0%;
          background-color: #00f0ff;
          border-radius: 2px;
          box-shadow: 0 0 8px #00f0ff;
        `;
        barContainer.appendChild(barFill);
        nodeElement.appendChild(barContainer);
      }

      const barFill = barContainer.querySelector('.charging-bar-fill') as HTMLElement;
      if (barFill) {
        barFill.style.width = `${cycle * 100}%`;
        const glowIntensity = 4 + cycle * 8;
        barFill.style.boxShadow = `0 0 ${glowIntensity}px #00f0ff`;
      }
    }
  });
}

function applyShake(_progress: number, targetNodes: Node[]): void {
  targetNodes.forEach((node) => {
    const iconElement = document.querySelector(`[data-node-icon="${node.id}"]`);
    if (iconElement instanceof HTMLElement) {
      const intensity = 5;
      const shakeX = (Math.random() - 0.5) * intensity * 2;
      const shakeY = (Math.random() - 0.5) * intensity * 2;

      const existingTransform = iconElement.style.transform
        .replace(/translate\([^)]*\)/g, '')
        .trim();
      iconElement.style.transform =
        `${existingTransform} translate(${shakeX}px, ${shakeY}px)`.trim();
    }
  });
}

function applyPathDrawing(
  progress: number,
  selectedNodes: Node[],
  connections: Connection[]
): void {
  const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

  const relevantConnections = connections.filter(
    (conn) =>
      (conn as any).animationEffects?.pathDrawing === true ||
      (selectedNodeIds.has(conn.from) && selectedNodeIds.has(conn.to))
  );

  relevantConnections.forEach((conn, index) => {
    // Find all path segments for this connection
    const segment1 = document.querySelector(`#${CSS.escape(conn.id)}-segment1`) as SVGPathElement;
    const segment2 = document.querySelector(`#${CSS.escape(conn.id)}-segment2`) as SVGPathElement;
    const singlePath = document.querySelector(`#${CSS.escape(conn.id)}`) as SVGPathElement;

    // Use segment2 if it exists (has marker-end), otherwise segment1, otherwise single path
    const edge = segment2 || segment1 || singlePath;

    if (edge instanceof SVGPathElement) {
      const length = edge.getTotalLength();
      const delay = (index / relevantConnections.length) * 0.2;
      const pathProgress = Math.max(0, Math.min(1, (progress - delay) / 0.8));
      const offset = length * (1 - pathProgress);

      // Apply to all segments
      [segment1, segment2, singlePath].forEach((seg) => {
        if (seg instanceof SVGPathElement) {
          // Save original dasharray if not already saved
          if (!seg.dataset.originalDasharray) {
            const currentDasharray = seg.style.strokeDasharray || '';
            seg.dataset.originalDasharray = currentDasharray;
          }

          seg.style.strokeDasharray = `${length}`;
          seg.style.strokeDashoffset = `${offset}`;
        }
      });

      if (!edge.dataset.originalMarkerEnd) {
        const currentMarkerEnd = edge.getAttribute('marker-end');
        if (currentMarkerEnd) {
          edge.dataset.originalMarkerEnd = currentMarkerEnd;
        }
      }

      if (pathProgress < 1) {
        if (edge.dataset.originalMarkerEnd) {
          edge.setAttribute('marker-end', 'none');
        }
      } else if (edge.dataset.originalMarkerEnd) {
        edge.setAttribute('marker-end', edge.dataset.originalMarkerEnd);
      }
    }
  });

  // Reset non-relevant connections
  connections.forEach((conn) => {
    const hasPathDrawingEffect = (conn as any).animationEffects?.pathDrawing === true;
    const isRelevant =
      hasPathDrawingEffect || (selectedNodeIds.has(conn.from) && selectedNodeIds.has(conn.to));

    if (!isRelevant) {
      const segment1 = document.querySelector(`#${CSS.escape(conn.id)}-segment1`) as SVGPathElement;
      const segment2 = document.querySelector(`#${CSS.escape(conn.id)}-segment2`) as SVGPathElement;
      const singlePath = document.querySelector(`#${CSS.escape(conn.id)}`) as SVGPathElement;

      [segment1, segment2, singlePath].forEach((seg) => {
        if (seg instanceof SVGPathElement) {
          // Restore original dasharray if it was saved
          if (seg.dataset.originalDasharray !== undefined) {
            seg.style.strokeDasharray = seg.dataset.originalDasharray;
            delete seg.dataset.originalDasharray;
          } else {
            seg.style.strokeDasharray = '';
          }
          seg.style.strokeDashoffset = '';

          if (seg.dataset.originalMarkerEnd) {
            seg.setAttribute('marker-end', seg.dataset.originalMarkerEnd);
          }
        }
      });
    }
  });
}

function applyPathFlow(progress: number, selectedNodes: Node[], connections: Connection[]): void {
  const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
  const markerCount = 4;

  connections.forEach((conn) => {
    const hasPathFlowEffect = (conn as any).animationEffects?.pathFlow === true;
    const isConnectedToSelectedNodes =
      selectedNodeIds.has(conn.from) && selectedNodeIds.has(conn.to);

    // Find the full path (hidden) for accurate length calculation
    const fullPath = document.querySelector(`#${CSS.escape(conn.id)}-full-path`) as SVGPathElement;
    const segment1 = document.querySelector(`#${CSS.escape(conn.id)}-segment1`) as SVGPathElement;
    const singlePath = document.querySelector(`#${CSS.escape(conn.id)}`) as SVGPathElement;

    // Use full path if available, otherwise segment1, otherwise single path
    const path = fullPath || segment1 || singlePath;

    if (!path) {
      return;
    }

    const edgeElement = path.parentElement;

    if (!hasPathFlowEffect && !isConnectedToSelectedNodes) {
      if (edgeElement) {
        const existingMarkers = edgeElement.querySelectorAll('.flow-marker');
        existingMarkers.forEach((marker) => marker.remove());
      }
      return;
    }

    if (edgeElement) {
      const length = path.getTotalLength();

      const visibleSegment = segment1 || singlePath;
      const computedColor = visibleSegment
        ? window.getComputedStyle(visibleSegment).stroke
        : conn.color || '#00f0ff';

      const baseColor = rgbToHex(computedColor) || conn.color || '#00f0ff';
      const brighterColor = brightenColor(baseColor, 0.4);

      let markers = Array.from(edgeElement.querySelectorAll('.flow-marker')) as SVGCircleElement[];

      if (markers.length > markerCount) {
        markers.slice(markerCount).forEach((marker) => marker.remove());
        markers = markers.slice(0, markerCount);
      }

      while (markers.length < markerCount) {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        marker.classList.add('flow-marker');
        marker.setAttribute('fill', brighterColor);
        marker.setAttribute('filter', `drop-shadow(0 0 4px ${brighterColor})`);
        edgeElement.appendChild(marker);
        markers.push(marker);
      }

      markers.forEach((marker) => {
        marker.setAttribute('fill', brighterColor);
        marker.setAttribute('filter', `drop-shadow(0 0 4px ${brighterColor})`);
      });

      markers.forEach((marker, index) => {
        const offset = index / markerCount;
        const localProgress = (progress + offset) % 1;
        const point = path.getPointAtLength(localProgress * length);

        marker.setAttribute('cx', point.x.toString());
        marker.setAttribute('cy', point.y.toString());

        const pulsePhase = localProgress * Math.PI * 2 * 3;
        const pulse = 0.5 + 0.5 * Math.sin(pulsePhase);
        const radius = 2 + 3 * pulse;
        const opacity = 0.4 + 0.6 * pulse;

        marker.setAttribute('r', radius.toString());
        marker.setAttribute('fill-opacity', opacity.toString());
      });
    }
  });
}

function getNodeColor(type: string): string {
  const colorMap: Record<string, string> = {
    service: '#00f0ff',
    database: '#b000ff',
    cache: '#ff00ff',
    queue: '#ff6b00',
    api: '#00ff88',
    frontend: '#00f0ff',
    backend: '#b000ff',
    concept: '#ff00ff',
  };
  return colorMap[type] || '#00f0ff';
}

function brightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function rgbToHex(rgb: string): string | null {
  if (rgb.startsWith('#')) return rgb;

  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return null;

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
