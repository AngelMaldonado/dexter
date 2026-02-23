export type AchievementCategory = 'milestone' | 'streak' | 'performance' | 'social';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  criteria: Record<string, unknown>;
  xpReward: number;
}

export interface EntityAchievement {
  entityId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface XPEvent {
  id: string;
  entityId: string;
  amount: number;
  source: string;
  sourceEventId: string | null;
  createdAt: string;
}

export interface Streak {
  id: string;
  entityId: string;
  type: 'daily' | 'sprint' | 'collaboration';
  currentCount: number;
  longestCount: number;
  lastActivityAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface EntityDailyStats {
  id: string;
  entityId: string;
  date: string;
  tasksCompleted: number;
  tokensUsed: number;
  cost: number;
  activeTimeMinutes: number;
  xpEarned: number;
}

export interface LeaderboardEntry {
  entityId: string;
  entityName: string;
  departmentId: string | null;
  totalXp: number;
  level: number;
  tasksCompleted: number;
  currentStreak: number;
  rank: number;
}

export interface DeskPosition {
  x: number;
  y: number;
  entityId: string | null;
}

export interface OfficeLayout {
  width: number;
  height: number;
  departments: Array<{
    departmentId: string;
    zone: { x: number; y: number; width: number; height: number };
  }>;
  desks: DeskPosition[];
  meetingRooms: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
  }>;
}
