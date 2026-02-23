export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'failed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  requiredSkills: string[];
  assignedEntityId: string | null;
  parentTaskId: string | null;
  departmentId: string | null;
  boardCardId: string | null;
  boardProviderId: string | null;
  estimatedEffort: number;
  actualTokensUsed: number;
  actualCost: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority?: TaskPriority;
  requiredSkills?: string[];
  assignedEntityId?: string;
  parentTaskId?: string;
  departmentId?: string;
  boardCardId?: string;
  boardProviderId?: string;
  estimatedEffort?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  requiredSkills?: string[];
  assignedEntityId?: string | null;
  parentTaskId?: string | null;
  departmentId?: string | null;
  boardCardId?: string | null;
  boardProviderId?: string | null;
  estimatedEffort?: number;
  actualTokensUsed?: number;
  actualCost?: number;
  completedAt?: string | null;
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}

export interface SubTask {
  id: string;
  parentTaskId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedEntityId: string | null;
}
