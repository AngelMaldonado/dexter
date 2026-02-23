import { useEffect } from 'react';
import { useGamificationStore } from '../stores/gamification-store.js';
import { useOfficeStore } from '../stores/office-store.js';
import { Leaderboard } from '../components/gamification/Leaderboard.js';
import { AchievementPanel } from '../components/gamification/AchievementPanel.js';
import { StreakDisplay } from '../components/gamification/StreakDisplay.js';

export function GamificationPage() {
  const fetchLeaderboard = useGamificationStore((s) => s.fetchLeaderboard);
  const fetchAchievements = useGamificationStore((s) => s.fetchAchievements);
  const fetchStreaks = useGamificationStore((s) => s.fetchStreaks);
  const achievements = useGamificationStore((s) => s.achievements);
  const streaks = useGamificationStore((s) => s.streaks);
  const departments = useOfficeStore((s) => s.departments);
  const fetchDepartments = useOfficeStore((s) => s.fetchDepartments);

  useEffect(() => {
    fetchLeaderboard();
    fetchAchievements();
    fetchStreaks();
    fetchDepartments();
  }, [fetchLeaderboard, fetchAchievements, fetchStreaks, fetchDepartments]);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Gamification</h1>

      <div style={layoutStyle}>
        <div style={{ flex: 1 }}>
          {/* Leaderboard */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Leaderboard</h2>
            <Leaderboard departments={departments} />
          </div>

          {/* Achievements */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Achievements</h2>
            <AchievementPanel achievements={achievements} unlocked={[]} />
          </div>
        </div>

        {/* Sidebar with streaks */}
        <div style={sidebarStyle}>
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Active Streaks</h2>
            <div style={streakContainerStyle}>
              <StreakDisplay streaks={streaks} />
            </div>
          </div>

          {/* Stats summary */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Stats</h2>
            <div style={statsCardStyle}>
              <StatItem label="Total Achievements" value={String(achievements.length)} />
              <StatItem label="Active Streaks" value={String(streaks.filter(s => s.isActive).length)} />
              <StatItem label="Departments" value={String(departments.length)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
};

const sidebarStyle: React.CSSProperties = {
  width: 300,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 24,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 12,
};

const streakContainerStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  padding: 14,
};

const statsCardStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  padding: '8px 16px',
};
