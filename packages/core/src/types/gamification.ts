export type AchievementCategory = 'streak' | 'milestone' | 'performance' | 'social';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  points: number;
  criteria: string; // JSON-encoded criteria
  createdAt: string;
}

export interface EntityAchievement {
  id: string;
  entityId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface EntityDailyStats {
  id: string;
  entityId: string;
  date: string;
  tasksCompleted: number;
  tasksFailed: number;
  totalWorkMinutes: number;
  averageEnergy: number;
  averageMood: string;
}

export interface LeaderboardEntry {
  entityId: string;
  entityName: string;
  totalPoints: number;
  achievementCount: number;
  tasksCompleted: number;
}
