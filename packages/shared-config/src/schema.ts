/**
 * JSON Schema for FlowDyno architecture diagrams
 * Shared between frontend and backend
 */

export type NodeType =
  | 'service'
  | 'database'
  | 'cache'
  | 'queue'
  | 'api'
  | 'frontend'
  | 'backend'
  | 'cloud'
  | 'devops'
  | 'monitoring'
  | 'concept';

export type FrameLayoutType = 'flex-row' | 'flex-col' | 'grid';

export type LineStyle = 'solid' | 'dashed';

export type EdgeType = 'smoothstep' | 'bezier';

export type AnchorPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * 预设连接线颜色
 */
export const CONNECTION_COLORS = [
  { name: 'Cyan', value: '#00f0ff', usage: 'default, primary connections' },
  { name: 'Green', value: '#00ff88', usage: 'success, data flow, healthy connections' },
  { name: 'Purple', value: '#a855f7', usage: 'async, events, messaging' },
  { name: 'Pink', value: '#ec4899', usage: 'user interactions, UI flow' },
  { name: 'Orange', value: '#f97316', usage: 'warnings, important paths' },
  { name: 'Yellow', value: '#eab308', usage: 'config, metadata, dependencies' },
  { name: 'Red', value: '#ef4444', usage: 'errors, critical paths, security' },
  { name: 'Blue', value: '#3b82f6', usage: 'external APIs, third-party services' },
] as const;

export type ConnectionColor = (typeof CONNECTION_COLORS)[number]['value'];

/**
 * 连接线样式说明
 */
export const LINE_STYLE_USAGE = {
  solid: 'normal connections, direct dependencies, synchronous calls',
  dashed: 'optional connections, async calls, weak dependencies, future plans',
} as const;

export const EDGE_TYPE_USAGE = {
  smoothstep: 'default, right-angle connections, clean layout',
  bezier: 'curved connections, more organic flow, complex diagrams',
} as const;

export interface NodePosition {
  x: number;
  y: number;
}

export interface BaseNodeSchema {
  id: string;
  type: NodeType | 'frame';
  label: string;
  position: NodePosition;
}

export interface RegularNodeSchema extends BaseNodeSchema {
  type: NodeType;
  icon: string;
}

export interface FrameNodeSchema extends BaseNodeSchema {
  type: 'frame';
  layout: FrameLayoutType;
  backgroundColor?: string;
  padding?: number;
  gap?: number;
  children: string[];
  showLabel?: boolean; // Whether to show the frame label (default: true)
  gridRows?: number; // Number of rows in grid layout
  gridCols?: number; // Number of columns in grid layout
  alignItems?: 'flex-start' | 'center' | 'flex-end'; // Cross-axis alignment for flex layouts
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between'; // Main-axis alignment for flex layouts
}

export type NodeSchema = RegularNodeSchema | FrameNodeSchema;

export interface ConnectionSchema {
  id: string;
  from: string;
  to: string;
  label?: string;
  lineStyle?: LineStyle;
  edgeType?: EdgeType;
  fromAnchor?: AnchorPosition;
  toAnchor?: AnchorPosition;
  color?: string;
}

export interface DiagramSchema {
  nodes: NodeSchema[];
  connections: ConnectionSchema[];
}

/**
 * Format JSON schema for AI prompt
 */
export function formatSchemaForAI(): string {
  const colorList = CONNECTION_COLORS.map((c) => `"${c.value}" (${c.name}: ${c.usage})`).join(
    '\n      '
  );

  return `JSON format (MUST match this exact structure):
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "service" | "database" | "cache" | "queue" | "api" | "frontend" | "backend" | "cloud" | "devops" | "monitoring" | "concept",
      "label": "Node name",
      "icon": "icon-name",
      "position": { "x": number, "y": number }
    },
    {
      "id": "frame-id",
      "type": "frame",
      "label": "Frame title (REQUIRED)",
      "position": { "x": number, "y": number },
      "layout": "flex-row" | "flex-col" | "grid",
      "backgroundColor": "#1a1a24",
      "padding": 16,
      "gap": 8,
      "children": ["child-node-id-1", "child-node-id-2"],
      "showLabel": true,
      "gridRows": 2,
      "gridCols": 2,
      "alignItems": "flex-start" | "center" | "flex-end",
      "justifyContent": "flex-start" | "center" | "flex-end" | "space-between"
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "from": "source-node-id",
      "to": "target-node-id",
      "label": "Connection label (optional)",
      "lineStyle": "solid" | "dashed",
      "edgeType": "smoothstep" | "bezier",
      "fromAnchor": "top" | "bottom" | "left" | "right",
      "toAnchor": "top" | "bottom" | "left" | "right",
      "color": "#00f0ff"
    }
  ]
}

⚠️ CONNECTION STYLING RULES:
- Available colors (choose based on connection meaning):
      ${colorList}
- lineStyle options:
  * "solid": ${LINE_STYLE_USAGE.solid}
  * "dashed": ${LINE_STYLE_USAGE.dashed}
- edgeType options:
  * "smoothstep": ${EDGE_TYPE_USAGE.smoothstep}
  * "bezier": ${EDGE_TYPE_USAGE.bezier}
- Use DIFFERENT colors to distinguish connection types (e.g., data flow vs events vs API calls)
- Use dashed lines for async/optional connections, solid for sync/required`;
}

/**
 * Layout guidelines for AI
 */
export function getLayoutGuidelines(): string {
  return `Layout guidelines:
- Arrange nodes in layers (top to bottom or left to right)
- Frontend/API Gateway at top (y: 100-200)
- Services in middle (y: 400-500)
- Databases/Cache at bottom (y: 700-800)
- ⚠️ CRITICAL: Use LARGE spacing to avoid overlap:
  - Horizontal spacing: minimum 300px between nodes
  - Vertical spacing: minimum 250px between layers
  - Frame padding: 40-60px to prevent child nodes from touching edges

⚠️ CRITICAL: Connection rules (MUST FOLLOW):
- ❌ NEVER create bidirectional connections (A→B and B→A) - this causes overlapping lines
- ❌ NEVER create loops or cycles in the graph
- For each pair of nodes, only ONE direction of connection is allowed
- When a node has MULTIPLE outgoing connections, spread target nodes HORIZONTALLY
  - Example: If A connects to B and C → place B at x=200, C at x=600 (same y level)
- When a node has MULTIPLE incoming connections, spread source nodes HORIZONTALLY
- NEVER stack all nodes vertically in a single column
- Connections should flow in ONE direction: typically top→bottom or left→right
- Use proper anchors: top-to-bottom flow uses fromAnchor="bottom", toAnchor="top"

Frame layout rules:
- Frame MUST have these properties for proper rendering:
  * "layout": "flex-row" | "flex-col" | "grid" (REQUIRED)
  * "padding": 16-40 (recommended: 24)
  * "gap": 8-20 (recommended: 12)
  * "width": calculated based on children (for flex-row: sum of child widths + gaps + padding*2)
  * "height": calculated based on children (for flex-col: sum of child heights + gaps + padding*2)
- Child nodes inside Frame:
  * DO NOT set position for child nodes - Frame's layout auto-positions them
  * Child nodes should have position: { x: 0, y: 0 } as placeholder
  * Frame's layout property controls arrangement:
    - "flex-row": horizontal layout, alignItems controls vertical alignment
    - "flex-col": vertical layout, alignItems controls horizontal alignment
    - "grid": use gridRows/gridCols for grid layout
- Frame connections:
  * Connect TO the Frame node, not to child nodes inside Frame
  * Connections between Frames should use Frame IDs

Frame label display:
- Frame label shows at top center by default
- Set "showLabel": false to hide the label
- When label is shown, top connection point moves above the label`;
}
