import { ulid } from 'ulid';
import { initializeDatabase } from './migrate.js';
import { DepartmentRepository } from './repositories/department-repository.js';
import { GamificationRepository } from './repositories/gamification-repository.js';
import { ConfigRepository } from './repositories/config-repository.js';

export function seed(dbPath = 'dexter.db') {
  const db = initializeDatabase(dbPath);

  const configRepo = new ConfigRepository(db);
  const deptRepo = new DepartmentRepository(db);
  const gamificationRepo = new GamificationRepository(db);

  // ─── Org Config ─────────────────────────────────────────────────
  if (!configRepo.getOrgConfig()) {
    configRepo.updateOrgConfig({
      name: 'Dexter Organization',
      conventions: '',
    });
  }

  // ─── Departments ────────────────────────────────────────────────
  const existingDepts = deptRepo.findAll();
  if (existingDepts.length === 0) {
    deptRepo.create({ name: 'Frontend', description: 'UI/UX development team', color: '#3b82f6', floorZoneX: 0, floorZoneY: 0, floorZoneWidth: 200, floorZoneHeight: 200 });
    deptRepo.create({ name: 'Backend', description: 'API and services team', color: '#10b981', floorZoneX: 220, floorZoneY: 0, floorZoneWidth: 200, floorZoneHeight: 200 });
    deptRepo.create({ name: 'QA', description: 'Quality assurance and testing team', color: '#f59e0b', floorZoneX: 0, floorZoneY: 220, floorZoneWidth: 200, floorZoneHeight: 200 });
    deptRepo.create({ name: 'DevOps', description: 'Infrastructure and deployment team', color: '#ef4444', floorZoneX: 220, floorZoneY: 220, floorZoneWidth: 200, floorZoneHeight: 200 });
  }

  // ─── Achievement Definitions ────────────────────────────────────
  const existingAchievements = gamificationRepo.getAchievementDefinitions();
  if (existingAchievements.length === 0) {
    const achievements = [
      // Milestone
      { name: 'First Task', description: 'Complete your first task', category: 'milestone', icon: '🎯', criteria: JSON.stringify({ tasksCompleted: 1 }), xpReward: 50 },
      { name: 'Task Master', description: 'Complete 50 tasks', category: 'milestone', icon: '⚡', criteria: JSON.stringify({ tasksCompleted: 50 }), xpReward: 500 },
      { name: 'Century Club', description: 'Complete 100 tasks', category: 'milestone', icon: '💯', criteria: JSON.stringify({ tasksCompleted: 100 }), xpReward: 1000 },
      { name: 'Level 5', description: 'Reach level 5', category: 'milestone', icon: '⭐', criteria: JSON.stringify({ level: 5 }), xpReward: 200 },
      { name: 'Level 10', description: 'Reach level 10', category: 'milestone', icon: '🌟', criteria: JSON.stringify({ level: 10 }), xpReward: 500 },

      // Streak
      { name: 'On a Roll', description: 'Maintain a 3-day activity streak', category: 'streak', icon: '🔥', criteria: JSON.stringify({ dailyStreak: 3 }), xpReward: 100 },
      { name: 'Unstoppable', description: 'Maintain a 7-day activity streak', category: 'streak', icon: '💪', criteria: JSON.stringify({ dailyStreak: 7 }), xpReward: 300 },
      { name: 'Marathon Runner', description: 'Maintain a 30-day activity streak', category: 'streak', icon: '🏃', criteria: JSON.stringify({ dailyStreak: 30 }), xpReward: 1000 },

      // Performance
      { name: 'Speed Demon', description: 'Complete a task in under 60 seconds', category: 'performance', icon: '⚡', criteria: JSON.stringify({ taskDurationUnder: 60000 }), xpReward: 150 },
      { name: 'Efficient Worker', description: 'Complete 5 tasks in a single day', category: 'performance', icon: '📊', criteria: JSON.stringify({ tasksPerDay: 5 }), xpReward: 200 },
      { name: 'Token Saver', description: 'Complete a task using under 1000 tokens', category: 'performance', icon: '💎', criteria: JSON.stringify({ tokensUnder: 1000 }), xpReward: 100 },

      // Social
      { name: 'Team Player', description: 'Send 10 messages to other entities', category: 'social', icon: '🤝', criteria: JSON.stringify({ messagesSent: 10 }), xpReward: 100 },
      { name: 'Mentor', description: 'Review 5 tasks from other entities', category: 'social', icon: '🎓', criteria: JSON.stringify({ tasksReviewed: 5 }), xpReward: 200 },
      { name: 'Collaborator', description: 'Work on tasks across 3 different departments', category: 'social', icon: '🌐', criteria: JSON.stringify({ departmentsWorked: 3 }), xpReward: 250 },
    ];

    for (const achievement of achievements) {
      gamificationRepo.createAchievementDefinition(achievement);
    }
  }

  return db;
}

// Run directly: bun run src/seed.ts
if (import.meta.main) {
  seed();
  console.log('Database seeded successfully.');
}
