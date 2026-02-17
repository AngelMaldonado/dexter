export interface Department {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  description: string;
  color?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
  color?: string;
}

export interface OrgConfig {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}
