// Node categories
export type NodeCategory = 'tech' | 'basic';

// Tech node types (microservices architecture components)
export type TechNodeType =
  | 'service'
  | 'database'
  | 'cache'
  | 'queue'
  | 'api'
  | 'frontend'
  | 'backend'
  | 'language'
  | 'cloud'
  | 'devops'
  | 'monitoring'
  | 'testing'
  | 'ai'
  | 'game'
  | 'concept';

// Basic node types (UI building blocks)
export type BasicNodeType = 'frame' | 'text' | 'image';

// All node types
export type NodeType = TechNodeType | BasicNodeType;

export interface Position {
  x: number;
  y: number;
}

// Layout types for frame nodes (inspired by Figma)
// 移除 'none' - Frame 默认就应该有 auto-layout
export type LayoutType = 'flex-row' | 'flex-col' | 'grid';

// Animation effects that can be applied to a node
export interface NodeAnimationEffects {
  pathDrawing?: boolean;
  nodePulse?: boolean;
  fadeIn?: boolean;
  circuitPulse?: boolean;
  rotate?: boolean;
  flip3D?: boolean;
  chargingBar?: boolean;
  shake?: boolean;
  pathFlow?: boolean;
}

// Base node interface
export interface BaseNode {
  id: string;
  type: NodeType;
  label: string;
  position: Position;
  width?: number;
  height?: number;
  color?: string;
  borderStyle?: 'none' | 'solid' | 'dashed';
  animationEffects?: NodeAnimationEffects;
}

// Frame node (container with layout capabilities)
export interface FrameNode extends BaseNode {
  type: 'frame';
  layout: LayoutType;
  children?: string[]; // Child node IDs
  padding?: number;
  backgroundColor?: string; // Background color
  borderRadius?: number; // Border radius (0-32px)
  gap?: number; // Gap between children (for flex and grid layouts)
  gridRows?: number; // Number of rows in grid layout
  gridCols?: number; // Number of columns in grid layout
  alignItems?: 'flex-start' | 'center' | 'flex-end'; // Cross-axis alignment for flex layouts
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between'; // Main-axis alignment for flex layouts
  showLabel?: boolean; // Whether to show the label
}

// Text node
export interface TextNode extends BaseNode {
  type: 'text';
  content: string;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
}

// Image node
export interface ImageNode extends BaseNode {
  type: 'image';
  src: string;
  alt?: string;
  objectFit?: 'contain' | 'cover' | 'fill';
}

// Tech node (composite: frame + icon + text)
export interface TechNode extends BaseNode {
  type: TechNodeType;
  icon: string;
  variant?: string; // Devicon variant (e.g., 'plain', 'original', 'line')
  techStackId?: string; // Specific tech stack (e.g., 'react', 'mysql')
  hideLabel?: boolean; // Hide label text
  emphasized?: boolean; // Add pulse/glow animation to emphasize important nodes
}

// Union type for all nodes
export type Node = FrameNode | TextNode | ImageNode | TechNode;

export type ConnectionPoint = 'top' | 'right' | 'bottom' | 'left' | 'center';

export interface Connection {
  id: string;
  from: string;
  to: string;
  fromAnchor?: ConnectionPoint; // Which connection point on source node
  toAnchor?: ConnectionPoint; // Which connection point on target node
  label?: string;
  lineStyle: 'solid' | 'dashed'; // Line style: solid or dashed
  edgeType: 'smoothstep' | 'bezier'; // Edge type: right-angle or bezier curve
  color?: string;
  showLabel?: boolean; // Whether to show label (default: true)
  glowEnabled?: boolean; // Whether to show glow effect
  animationEffects?: {
    pathDrawing?: boolean;
    pathFlow?: boolean;
  };
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasState {
  nodes: Node[];
  connections: Connection[];
  selectedIds: string[];
  viewport: Viewport;
}
