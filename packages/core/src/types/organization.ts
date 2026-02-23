export interface Department {
  id: string;
  name: string;
  description: string;
  color: string;
  floorZoneX: number;
  floorZoneY: number;
  floorZoneWidth: number;
  floorZoneHeight: number;
  createdAt: string;
}

export interface OrgConfig {
  id: string;
  name: string;
  conventions: string;
  updatedAt: string;
}
