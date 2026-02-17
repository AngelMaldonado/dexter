export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'failed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  skills: string[];
  assigneeId: string | null;
  departmentId: string | null;
  boardCardId: string | null;
  boardConfigId: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority?: TaskPriority;
  skills?: string[];
  assigneeId?: string;
  departmentId?: string;
  boardCardId?: string;
  boardConfigId?: string;
  estimatedMinutes?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  skills?: string[];
  assigneeId?: string | null;
  departmentId?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  completedAt?: string | null;
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
}
