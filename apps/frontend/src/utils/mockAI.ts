import { Node, Connection, TechNodeType } from '../types/canvas';

export function generateMockArchitecture(prompt: string): {
  nodes: Node[];
  connections: Connection[];
} {
  // Simple keyword-based mock generation
  const keywords = prompt.toLowerCase();

  const nodes: Node[] = [];
  const connections: Connection[] = [];

  let nodeId = 0;
  const createNode = (type: TechNodeType, label: string, x: number, y: number): Node => ({
    id: `node-${nodeId++}`,
    type,
    label,
    icon: type,
    position: { x, y },
  });

  // E-commerce system
  if (
    keywords.includes('电商') ||
    keywords.includes('ecommerce') ||
    keywords.includes('e-commerce')
  ) {
    nodes.push(
      createNode('frontend', 'Web App', 100, 200),
      createNode('api', 'API Gateway', 300, 200),
      createNode('service', 'User Service', 500, 100),
      createNode('service', 'Order Service', 500, 200),
      createNode('service', 'Payment Service', 500, 300),
      createNode('database', 'PostgreSQL', 700, 150),
      createNode('cache', 'Redis', 700, 250)
    );

    connections.push(
      {
        id: 'conn-0',
        from: 'node-0',
        to: 'node-1',
        label: 'HTTPS',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-1',
        from: 'node-1',
        to: 'node-2',
        label: 'REST',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-2',
        from: 'node-1',
        to: 'node-3',
        label: 'REST',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-3',
        from: 'node-1',
        to: 'node-4',
        label: 'REST',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-4',
        from: 'node-2',
        to: 'node-5',
        label: 'SQL',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-5',
        from: 'node-3',
        to: 'node-5',
        label: 'SQL',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-6',
        from: 'node-4',
        to: 'node-5',
        label: 'SQL',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-7',
        from: 'node-2',
        to: 'node-6',
        label: 'Cache',
        lineStyle: 'dashed',
        edgeType: 'bezier',
      }
    );
  }
  // Microservices
  else if (keywords.includes('microservice') || keywords.includes('微服务')) {
    nodes.push(
      createNode('frontend', 'Client', 100, 200),
      createNode('api', 'API Gateway', 300, 200),
      createNode('service', 'Auth Service', 500, 100),
      createNode('service', 'User Service', 500, 200),
      createNode('service', 'Product Service', 500, 300),
      createNode('database', 'PostgreSQL', 700, 200),
      createNode('queue', 'Message Queue', 700, 350)
    );

    connections.push(
      {
        id: 'conn-0',
        from: 'node-0',
        to: 'node-1',
        label: 'HTTPS',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-1',
        from: 'node-1',
        to: 'node-2',
        label: 'gRPC',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-2',
        from: 'node-1',
        to: 'node-3',
        label: 'gRPC',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-3',
        from: 'node-1',
        to: 'node-4',
        label: 'gRPC',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-4',
        from: 'node-3',
        to: 'node-5',
        label: 'SQL',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-5',
        from: 'node-4',
        to: 'node-6',
        label: 'Pub/Sub',
        lineStyle: 'dashed',
        edgeType: 'bezier',
      }
    );
  }
  // Video streaming
  else if (
    keywords.includes('视频') ||
    keywords.includes('video') ||
    keywords.includes('streaming')
  ) {
    nodes.push(
      createNode('frontend', 'Player', 100, 200),
      createNode('api', 'CDN', 300, 200),
      createNode('service', 'Transcoding', 500, 150),
      createNode('service', 'Storage', 500, 250),
      createNode('cache', 'Redis Cache', 700, 150),
      createNode('database', 'Metadata DB', 700, 250)
    );

    connections.push(
      {
        id: 'conn-0',
        from: 'node-0',
        to: 'node-1',
        label: 'HLS',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-1',
        from: 'node-1',
        to: 'node-2',
        label: 'Stream',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-2',
        from: 'node-2',
        to: 'node-3',
        label: 'Upload',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-3',
        from: 'node-1',
        to: 'node-4',
        label: 'Cache',
        lineStyle: 'dashed',
        edgeType: 'bezier',
      },
      {
        id: 'conn-4',
        from: 'node-3',
        to: 'node-5',
        label: 'Metadata',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      }
    );
  }
  // Default generic system
  else {
    nodes.push(
      createNode('frontend', 'Frontend', 100, 200),
      createNode('backend', 'Backend', 300, 200),
      createNode('database', 'Database', 500, 150),
      createNode('cache', 'Cache', 500, 250)
    );

    connections.push(
      {
        id: 'conn-0',
        from: 'node-0',
        to: 'node-1',
        label: 'API',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-1',
        from: 'node-1',
        to: 'node-2',
        label: 'Query',
        lineStyle: 'solid',
        edgeType: 'smoothstep',
      },
      {
        id: 'conn-2',
        from: 'node-1',
        to: 'node-3',
        label: 'Cache',
        lineStyle: 'dashed',
        edgeType: 'bezier',
      }
    );
  }

  return { nodes, connections };
}
