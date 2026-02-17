import { useEffect } from 'react';
import { useStore } from '../stores/useStore.js';
import { OfficeFloor } from '../components/office/OfficeFloor.js';

export function OfficePage() {
  const officeState = useStore((s) => s.officeState);
  const fetchOfficeState = useStore((s) => s.fetchOfficeState);
  const activity = useStore((s) => s.activity);
  const fetchActivity = useStore((s) => s.fetchActivity);

  useEffect(() => {
    fetchOfficeState();
    fetchActivity();
  }, [fetchOfficeState, fetchActivity]);

  return (
    <div>
      <h1 style={headingStyle}>Office</h1>
      <div style={layoutStyle}>
        <div style={{ flex: 1 }}>
          {officeState ? (
            <OfficeFloor state={officeState} />
          ) : (
            <div style={loadingStyle}>Loading office...</div>
          )}
        </div>
        <aside style={sidebarStyle}>
          <h2 style={subheadingStyle}>Activity Feed</h2>
          <div style={feedStyle}>
            {activity.map((entry) => (
              <div key={entry.id} style={feedItemStyle}>
                <div style={feedTypeStyle}>{entry.type.split(':')[1]}</div>
                <div style={{ fontSize: 13 }}>{entry.message}</div>
                <div style={feedTimeStyle}>
                  {new Date(entry.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12 }}>
                No activity yet
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const headingStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, marginBottom: 20 };
const subheadingStyle: React.CSSProperties = { fontSize: 16, fontWeight: 600, marginBottom: 12 };

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: 40,
  color: 'var(--text-muted)',
};

const sidebarStyle: React.CSSProperties = {
  width: 300,
  flexShrink: 0,
};

const feedStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  maxHeight: 500,
  overflow: 'auto',
};

const feedItemStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const feedTypeStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: 'var(--accent)',
  letterSpacing: 0.5,
};

const feedTimeStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
};
