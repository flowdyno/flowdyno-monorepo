import { Node, Connection } from './canvas';
import { AnimationConfig } from './animation';

export interface Project {
  id: string;
  name: string;
  description?: string;
  data: {
    nodes: Node[];
    connections: Connection[];
    animations: AnimationConfig[];
  };
  thumbnailUrl?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  data: {
    nodes: Node[];
    connections: Connection[];
    animations: AnimationConfig[];
  };
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  data?: {
    nodes: Node[];
    connections: Connection[];
    animations: AnimationConfig[];
  };
  isPublic?: boolean;
}
