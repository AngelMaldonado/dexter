import type {
  DexterEvent,
  AchievementDefinition,
  LeaderboardEntry,
} from '@dexter/core';
import { generateId } from '@dexter/core';
import { EventBus } from './event-bus.js';
import { EntityManager } from './entity-manager.js';

interface EntityXP {
  totalXp: number;
  level: number;
  tasksCompleted: number;
}

interface EntityStreak {
  type: 'daily' | 'sprint' | 'collaboration';
  currentCount: number;
  longestCount: number;
  lastActivityAt: string;
  isActive: boolean;
}

const XP_PER_LEVEL = 100;

export class GamificationEngine {
  private entityXP = new Map<string, EntityXP>();
  private entityStreaks = new Map<string, EntityStreak[]>();
  private achievements: AchievementDefinition[] = [];
  private unlockedAchievements = new Map<string, Set<string>>();

  constructor(
    private eventBus: EventBus,
    private entityManager: EntityManager,
  ) {
    this.setupEventListeners();
  }

  registerAchievements(definitions: AchievementDefinition[]): void {
    this.achievements = definitions;
  }

  awardXP(entityId: string, amount: number, source: string): void {
    const xp = this.entityXP.get(entityId) ?? { totalXp: 0, level: 1, tasksCompleted: 0 };
    const previousXp = xp.totalXp;
    xp.totalXp += amount;

    const newLevel = Math.floor(xp.totalXp / XP_PER_LEVEL) + 1;
    xp.level = newLevel;

    this.entityXP.set(entityId, xp);

    this.entityManager.updateEntity(entityId, {
      xp: xp.totalXp,
      level: xp.level,
    });

    this.eventBus.emit({
      type: 'xp:awarded',
      timestamp: new Date().toISOString(),
      payload: {
        entityId,
        amount,
        source,
        newTotal: xp.totalXp,
        newLevel: xp.level,
      },
    });
  }

  updateStreak(entityId: string, type: 'daily' | 'sprint' | 'collaboration'): void {
    const streaks = this.entityStreaks.get(entityId) ?? [];
    let streak = streaks.find(s => s.type === type);

    const now = new Date();

    if (!streak) {
      streak = {
        type,
        currentCount: 1,
        longestCount: 1,
        lastActivityAt: now.toISOString(),
        isActive: true,
      };
      streaks.push(streak);
    } else {
      const lastActivity = new Date(streak.lastActivityAt);
      const hoursSinceLast = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLast > 48) {
        streak.currentCount = 1;
      } else {
        streak.currentCount++;
      }

      streak.longestCount = Math.max(streak.longestCount, streak.currentCount);
      streak.lastActivityAt = now.toISOString();
      streak.isActive = true;
    }

    this.entityStreaks.set(entityId, streaks);
  }

  evaluateAchievements(entityId: string, event: DexterEvent): void {
    const unlocked = this.unlockedAchievements.get(entityId) ?? new Set();

    for (const achievement of this.achievements) {
      if (unlocked.has(achievement.id)) continue;

      if (this.checkAchievementCriteria(entityId, achievement, event)) {
        unlocked.add(achievement.id);
        this.unlockedAchievements.set(entityId, unlocked);

        this.awardXP(entityId, achievement.xpReward, `achievement:${achievement.id}`);

        this.eventBus.emit({
          type: 'achievement:unlocked',
          timestamp: new Date().toISOString(),
          payload: {
            entityId,
            achievementId: achievement.id,
            achievementName: achievement.name,
            xpReward: achievement.xpReward,
          },
        });
      }
    }
  }

  getLeaderboard(filters?: { departmentId?: string }): LeaderboardEntry[] {
    const entities = filters?.departmentId
      ? this.entityManager.getEntitiesByDepartment(filters.departmentId)
      : this.entityManager.getAllEntities();

    const entries: LeaderboardEntry[] = entities.map(entity => {
      const xp = this.entityXP.get(entity.id) ?? { totalXp: 0, level: 1, tasksCompleted: 0 };
      const streaks = this.entityStreaks.get(entity.id) ?? [];
      const dailyStreak = streaks.find(s => s.type === 'daily');

      return {
        entityId: entity.id,
        entityName: entity.name,
        departmentId: entity.departmentId,
        totalXp: xp.totalXp,
        level: xp.level,
        tasksCompleted: xp.tasksCompleted,
        currentStreak: dailyStreak?.currentCount ?? 0,
        rank: 0,
      };
    });

    entries.sort((a, b) => b.totalXp - a.totalXp);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  private checkAchievementCriteria(
    entityId: string,
    achievement: AchievementDefinition,
    _event: DexterEvent,
  ): boolean {
    const criteria = achievement.criteria;
    const xp = this.entityXP.get(entityId);
    const streaks = this.entityStreaks.get(entityId) ?? [];

    if (criteria['tasksCompleted'] && xp) {
      if (xp.tasksCompleted >= (criteria['tasksCompleted'] as number)) {
        return true;
      }
    }

    if (criteria['streakCount']) {
      const dailyStreak = streaks.find(s => s.type === 'daily');
      if (dailyStreak && dailyStreak.currentCount >= (criteria['streakCount'] as number)) {
        return true;
      }
    }

    if (criteria['xpTotal'] && xp) {
      if (xp.totalXp >= (criteria['xpTotal'] as number)) {
        return true;
      }
    }

    return false;
  }

  private setupEventListeners(): void {
    this.eventBus.on('task:completed', (event) => {
      if (event.type !== 'task:completed') return;
      const entityId = event.payload.entityId;

      const xp = this.entityXP.get(entityId) ?? { totalXp: 0, level: 1, tasksCompleted: 0 };
      xp.tasksCompleted++;
      this.entityXP.set(entityId, xp);

      this.awardXP(entityId, 25, 'task_completed');
      this.updateStreak(entityId, 'daily');
      this.evaluateAchievements(entityId, event);
    });
  }
}
