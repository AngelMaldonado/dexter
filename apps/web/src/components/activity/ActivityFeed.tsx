import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import type { ActivityEntry } from '../../types.js';

interface ActivityFeedProps {
  limit?: number;
  entityId?: string;
}

export function ActivityFeed({ limit = 30, entityId }: ActivityFeedProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = entityId
          ? await api.activity.byEntity(entityId)
          : await api.activity.recent(limit);
        setEntries(data);
      } catch {
        // ignore
      }
      setLoading(false);
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [limit, entityId]);

  if (loading && entries.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12 }}>Loading...</div>;
  }

  return (
    <div style={feedStyle}>
      {entries.map((entry) => (
        <div key={entry.id} style={feedItemStyle}>
          <div style={feedTypeStyle}>
            {(entry.eventType ?? entry.type ?? '').includes(':') ? (entry.eventType ?? entry.type ?? '').split(':')[1] : (entry.eventType ?? entry.type ?? '')}
          </div>
          <div style={{ fontSize: 13 }}>{entry.description ?? entry.message}</div>
          <div style={feedTimeStyle}>
            {new Date(entry.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ))}
      {entries.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12 }}>
          No activity yet
        </div>
      )}
    </div>
  );
}

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
