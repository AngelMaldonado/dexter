import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';
import { useEntityStore } from '../stores/entity-store.js';
import type { ActivityEntry, Entity } from '../types.js';

export function LogsPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntityId, setFilterEntityId] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const entities = useEntityStore((s) => s.entities);
  const fetchEntities = useEntityStore((s) => s.fetchEntities);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '200' };
      if (filterEntityId) params.entityId = filterEntityId;
      if (filterType) params.eventType = filterType;
      const qs = new URLSearchParams(params).toString();
      const data = await api.activity.recent(200);
      let filtered = data;
      if (filterEntityId) filtered = filtered.filter((e) => e.entityId === filterEntityId);
      if (filterType) filtered = filtered.filter((e) => e.type === filterType || e.eventType === filterType);
      setEntries(filtered);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [filterEntityId, filterType]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const eventTypes = [...new Set(entries.map((e) => e.eventType ?? e.type))].sort();
  const entityMap = new Map(entities.map((e) => [e.id, e]));

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Logs</h1>
        <button onClick={fetchLogs} style={refreshBtnStyle}>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={filtersStyle}>
        <select
          value={filterEntityId}
          onChange={(e) => setFilterEntityId(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Entities</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Event Types</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {entries.length} entries
        </span>
      </div>

      {/* Log entries */}
      <div style={logContainerStyle}>
        {loading && entries.length === 0 && (
          <div style={emptyStyle}>Loading...</div>
        )}

        {!loading && entries.length === 0 && (
          <div style={emptyStyle}>No log entries yet. Activity will appear here as entities work on tasks.</div>
        )}

        {entries.map((entry) => {
          const entity = entry.entityId ? entityMap.get(entry.entityId) : undefined;
          const eventType = entry.eventType ?? entry.type ?? '';
          const isError = eventType.includes('failed') || entry.description?.includes('failed');
          const isSuccess = eventType.includes('completed');

          return (
            <div key={entry.id} style={{ ...logRowStyle, borderLeft: `3px solid ${isError ? 'var(--error)' : isSuccess ? 'var(--success)' : 'var(--border)'}` }}>
              <div style={logRowHeaderStyle}>
                <span style={{ ...eventBadgeStyle, background: getEventColor(eventType) }}>
                  {eventType}
                </span>
                {entity && (
                  <span style={entityBadgeStyle}>{entity.name}</span>
                )}
                <span style={timestampStyle}>
                  {formatTime(entry.createdAt)}
                </span>
              </div>
              <div style={logDescStyle}>{entry.description ?? entry.message}</div>
              {entry.metadata && entry.metadata !== '{}' && (
                <details style={detailsStyle}>
                  <summary style={summaryStyle}>Details</summary>
                  <pre style={preStyle}>{formatMetadata(entry.metadata)}</pre>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getEventColor(type: string): string {
  if (type.includes('failed')) return 'rgba(239, 68, 68, 0.2)';
  if (type.includes('completed')) return 'rgba(34, 197, 94, 0.2)';
  if (type.includes('assigned') || type.includes('started')) return 'rgba(59, 130, 246, 0.2)';
  if (type.includes('created')) return 'rgba(139, 92, 246, 0.2)';
  if (type.includes('state')) return 'rgba(245, 158, 11, 0.2)';
  return 'rgba(107, 114, 128, 0.15)';
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

function formatMetadata(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
};

const refreshBtnStyle: React.CSSProperties = {
  padding: '6px 16px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
};

const filtersStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  marginBottom: 16,
};

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: 6,
  fontSize: 13,
};

const logContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const emptyStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 14,
  padding: 24,
  textAlign: 'center',
};

const logRowStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'var(--bg-card)',
  borderRadius: 6,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const logRowHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const eventBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 4,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
};

const entityBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--accent)',
};

const timestampStyle: React.CSSProperties = {
  marginLeft: 'auto',
  fontSize: 11,
  color: 'var(--text-muted)',
};

const logDescStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  lineHeight: 1.4,
};

const detailsStyle: React.CSSProperties = {
  marginTop: 4,
};

const summaryStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  cursor: 'pointer',
};

const preStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  background: 'var(--bg-primary)',
  padding: 8,
  borderRadius: 4,
  overflow: 'auto',
  maxHeight: 200,
  margin: '4px 0 0',
};
