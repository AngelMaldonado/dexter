import type { LeaderboardEntry, Department } from '../../types.js';
import { useGamificationStore } from '../../stores/gamification-store.js';

interface LeaderboardProps {
  departments: Department[];
}

export function Leaderboard({ departments }: LeaderboardProps) {
  const leaderboard = useGamificationStore((s) => s.leaderboard);
  const timeFilter = useGamificationStore((s) => s.timeFilter);
  const departmentFilter = useGamificationStore((s) => s.departmentFilter);
  const setTimeFilter = useGamificationStore((s) => s.setTimeFilter);
  const setDepartmentFilter = useGamificationStore((s) => s.setDepartmentFilter);

  return (
    <div style={containerStyle}>
      <div style={filtersStyle}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['today', 'week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period)}
              style={{
                ...filterBtnStyle,
                background: timeFilter === period ? 'var(--accent)' : 'var(--bg-card)',
                color: timeFilter === period ? 'white' : 'var(--text-secondary)',
              }}
            >
              {period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={departmentFilter ?? ''}
          onChange={(e) => setDepartmentFilter(e.target.value || null)}
          style={{ maxWidth: 160, fontSize: 12, padding: '4px 8px' }}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>Entity</th>
              <th style={thStyle}>Level</th>
              <th style={thStyle}>XP</th>
              <th style={thStyle}>Tasks</th>
              <th style={thStyle}>Streak</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, i) => (
              <tr key={entry.entityId} style={i % 2 === 0 ? evenRowStyle : undefined}>
                <td style={tdCenterStyle}>
                  <span style={rankStyle(entry.rank)}>{entry.rank}</span>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500 }}>{entry.entityName}</div>
                  {entry.departmentId && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {departments.find((d) => d.id === entry.departmentId)?.name ?? ''}
                    </div>
                  )}
                </td>
                <td style={tdCenterStyle}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{entry.level}</span>
                </td>
                <td style={tdCenterStyle}>{entry.totalXp.toLocaleString()}</td>
                <td style={tdCenterStyle}>{entry.tasksCompleted}</td>
                <td style={tdCenterStyle}>
                  {entry.currentStreak > 0 && (
                    <span style={{ color: 'var(--warning)' }}>{entry.currentStreak}d</span>
                  )}
                </td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdCenterStyle, padding: 24, color: 'var(--text-muted)' }}>
                  No leaderboard data yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function rankStyle(rank: number): React.CSSProperties {
  const colors: Record<number, string> = { 1: '#fbbf24', 2: '#94a3b8', 3: '#cd7f32' };
  return {
    fontWeight: 700,
    color: colors[rank] ?? 'var(--text-secondary)',
    fontSize: rank <= 3 ? 16 : 14,
  };
}

const containerStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  overflow: 'hidden',
};

const filtersStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 8,
};

const filterBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
};

const tableWrapperStyle: React.CSSProperties = {
  overflow: 'auto',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'center',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: 0.5,
  borderBottom: '1px solid var(--border)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
};

const tdCenterStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'center',
};

const evenRowStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
};
