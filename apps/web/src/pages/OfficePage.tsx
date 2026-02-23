import { useEffect, useState, memo } from 'react';
import { useOfficeStore } from '../stores/office-store.js';
import { useEntityStore } from '../stores/entity-store.js';
import { OfficeCanvas } from '../components/office/OfficeCanvas.js';
import { EntityStats } from '../components/entities/EntityStats.js';
import { ActivityFeed } from '../components/activity/ActivityFeed.js';
import { api } from '../api/client.js';
import type { OrchestratorStatus } from '../types.js';

export function OfficePage() {
  const fetchLayout = useOfficeStore((s) => s.fetchLayout);
  const fetchDepartments = useOfficeStore((s) => s.fetchDepartments);
  const fetchEntities = useEntityStore((s) => s.fetchEntities);
  const selectedEntityId = useEntityStore((s) => s.selectedEntityId);
  const selectEntity = useEntityStore((s) => s.selectEntity);
  const selectedEntity = useEntityStore((s) =>
    s.selectedEntityId ? s.entities.find((e) => e.id === s.selectedEntityId) ?? null : null,
  );

  useEffect(() => {
    fetchLayout();
    fetchDepartments();
    fetchEntities();
  }, [fetchLayout, fetchDepartments, fetchEntities]);

  return (
    <div style={pageStyle}>
      {/* Main canvas area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <OfficeCanvas />
      </div>

      {/* Selected entity detail panel */}
      {selectedEntity && (
        <div style={detailPanelStyle}>
          <EntityStats entity={selectedEntity} onClose={() => selectEntity(null)} />
        </div>
      )}

      {/* Sidebar isolated to prevent polling re-renders from hitting the canvas */}
      <OfficeSidebar />
    </div>
  );
}

// Isolated sidebar: its polling state won't cascade to OfficeCanvas
const OfficeSidebar = memo(function OfficeSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orchStatus, setOrchStatus] = useState<OrchestratorStatus | null>(null);
  const entityCount = useEntityStore((s) => s.entities.length);
  const workingCount = useEntityStore((s) => s.entities.filter((e) => e.state === 'working').length);
  const idleCount = useEntityStore((s) => s.entities.filter((e) => e.state === 'idle').length);

  useEffect(() => {
    const fetchStatus = () => {
      api.orchestrator.status().then(setOrchStatus).catch(() => {});
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOrchAction = async (action: 'start' | 'pause' | 'resume') => {
    try {
      await api.orchestrator[action]();
      const status = await api.orchestrator.status();
      setOrchStatus(status);
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ ...sidePanelStyle, width: sidebarOpen ? 280 : 40 }}>
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={toggleBtnStyle}
        title={sidebarOpen ? 'Collapse' : 'Expand'}
      >
        {sidebarOpen ? '>' : '<'}
      </button>

      {sidebarOpen && (
        <div style={sidebarContentStyle}>
          {/* Orchestrator controls */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Orchestrator</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div
                style={{
                  ...statusDotStyle,
                  background: orchStatus?.state === 'running' ? 'var(--success)' :
                    orchStatus?.state === 'paused' ? 'var(--warning)' : 'var(--text-muted)',
                }}
              />
              <span style={{ fontSize: 13, textTransform: 'capitalize' }}>
                {orchStatus?.state ?? 'Unknown'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => handleOrchAction('start')} style={orchBtnStyle}>Start</button>
              <button onClick={() => handleOrchAction('pause')} style={orchBtnStyle}>Pause</button>
              <button onClick={() => handleOrchAction('resume')} style={orchBtnStyle}>Resume</button>
            </div>
            {orchStatus && (
              <div style={quickStatsStyle}>
                <div><span style={statLabelStyle}>Active:</span> {orchStatus.activeEntities}</div>
                <div><span style={statLabelStyle}>Tasks:</span> {orchStatus.runningTasks}</div>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Quick Stats</h3>
            <div style={quickStatsStyle}>
              <div><span style={statLabelStyle}>Entities:</span> {entityCount}</div>
              <div><span style={statLabelStyle}>Working:</span> {workingCount}</div>
              <div><span style={statLabelStyle}>Idle:</span> {idleCount}</div>
            </div>
          </div>

          {/* Activity feed */}
          <div style={{ ...sectionStyle, flex: 1, overflow: 'hidden' }}>
            <h3 style={sectionTitleStyle}>Activity</h3>
            <ActivityFeed limit={20} />
          </div>
        </div>
      )}
    </div>
  );
});

const pageStyle: React.CSSProperties = {
  display: 'flex',
  height: '100%',
  overflow: 'hidden',
};

const detailPanelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  width: 340,
  maxHeight: 'calc(100% - 32px)',
  zIndex: 10,
  overflow: 'auto',
};

const sidePanelStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderLeft: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  transition: 'width 0.2s',
  overflow: 'hidden',
  position: 'relative',
};

const toggleBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  width: 24,
  height: 24,
  borderRadius: 4,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-muted)',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
  zIndex: 1,
};

const sidebarContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '40px 14px 14px',
  height: '100%',
  overflow: 'hidden',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: 0.5,
};

const statusDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
};

const orchBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '4px 8px',
  fontSize: 11,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  borderRadius: 6,
  cursor: 'pointer',
};

const quickStatsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 13,
};

const statLabelStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 12,
};
