import { create } from 'zustand';
import { api } from '../api/client.js';
import type {
  LeaderboardEntry,
  AchievementDefinition,
  EntityAchievement,
  Streak,
  DexterEvent,
} from '../types.js';

interface GamificationStore {
  leaderboard: LeaderboardEntry[];
  achievements: AchievementDefinition[];
  entityAchievements: Record<string, EntityAchievement[]>;
  streaks: Streak[];
  loading: boolean;
  timeFilter: 'today' | 'week' | 'month' | 'all';
  departmentFilter: string | null;

  fetchLeaderboard: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchEntityAchievements: (entityId: string) => Promise<void>;
  fetchStreaks: () => Promise<void>;
  setTimeFilter: (filter: 'today' | 'week' | 'month' | 'all') => void;
  setDepartmentFilter: (departmentId: string | null) => void;
  handleAchievementEvent: (event: DexterEvent) => void;
  handleXPEvent: (event: DexterEvent) => void;
}

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  leaderboard: [],
  achievements: [],
  entityAchievements: {},
  streaks: [],
  loading: false,
  timeFilter: 'all',
  departmentFilter: null,

  fetchLeaderboard: async () => {
    set({ loading: true });
    try {
      const { timeFilter, departmentFilter } = get();
      const filters: Record<string, string> = {};
      if (timeFilter !== 'all') filters.period = timeFilter;
      if (departmentFilter) filters.departmentId = departmentFilter;
      const leaderboard = await api.achievements.leaderboard(filters);
      set({ leaderboard, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchAchievements: async () => {
    try {
      const achievements = await api.achievements.list();
      set({ achievements });
    } catch {
      // ignore
    }
  },

  fetchEntityAchievements: async (entityId) => {
    try {
      const achievements = await api.achievements.entityAchievements(entityId);
      set((s) => ({
        entityAchievements: { ...s.entityAchievements, [entityId]: achievements },
      }));
    } catch {
      // ignore
    }
  },

  fetchStreaks: async () => {
    try {
      const streaks = await api.achievements.streaks();
      set({ streaks });
    } catch {
      // ignore
    }
  },

  setTimeFilter: (filter) => {
    set({ timeFilter: filter });
    get().fetchLeaderboard();
  },

  setDepartmentFilter: (departmentId) => {
    set({ departmentFilter: departmentId });
    get().fetchLeaderboard();
  },

  handleAchievementEvent: (event) => {
    if (event.type === 'achievement:unlocked') {
      get().fetchLeaderboard();
      get().fetchEntityAchievements(event.payload.entityId);
    }
  },

  handleXPEvent: (event) => {
    if (event.type === 'xp:awarded') {
      set((s) => ({
        leaderboard: s.leaderboard.map((entry) =>
          entry.entityId === event.payload.entityId
            ? { ...entry, totalXp: event.payload.newTotal, level: event.payload.newLevel }
            : entry,
        ),
      }));
    }
  },
}));
