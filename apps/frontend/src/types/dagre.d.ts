declare module 'dagre' {
  export namespace graphlib {
    class Graph {
      setDefaultEdgeLabel(callback: () => any): Graph;
      setGraph(options: {
        rankdir?: string;
        nodesep?: number;
        ranksep?: number;
        align?: string;
        marginx?: number;
        marginy?: number;
      }): void;
      setNode(id: string, config: { width: number; height: number }): void;
      setEdge(from: string, to: string): void;
      node(id: string): { x: number; y: number; width: number; height: number } | undefined;
    }
  }

  export function layout(graph: graphlib.Graph): void;
}
