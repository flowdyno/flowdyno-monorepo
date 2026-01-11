import { Node, Connection } from './canvas';

export interface GenerateArchitectureRequest {
  prompt: string;
  complexity?: 'simple' | 'detailed';
  maxNodes?: number;
}

export interface GenerateArchitectureResponse {
  nodes: Node[];
  connections: Connection[];
  metadata: {
    generatedAt: string; // ISO 8601 date string
    model: string;
    tokensUsed?: number;
    usage?: {
      current: number;
      limit: number;
      plan: string;
    };
  };
}

export interface AIError {
  message: string;
  code: string;
}
