import type { OfficeState } from '../../lib/api.js';
import { Desk } from './Desk.js';

export function OfficeFloor({ state }: { state: OfficeState }) {
  return (
    <div style={floorStyle}>
      {state.departments.map((dept) => (
        <div key={dept.id} style={deptStyle}>
          <div style={{ ...deptHeaderStyle, borderLeftColor: dept.color }}>
            <span style={{ fontWeight: 600 }}>{dept.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {dept.entities.length} members
            </span>
          </div>
          <div style={desksGridStyle}>
            {dept.entities.map((entity) => (
              <Desk key={entity.id} entity={entity} />
            ))}
            {dept.entities.length === 0 && (
              <div style={emptyStyle}>No entities assigned</div>
            )}
          </div>
        </div>
      ))}

      {state.unassigned.length > 0 && (
        <div style={deptStyle}>
          <div style={{ ...deptHeaderStyle, borderLeftColor: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600 }}>Unassigned</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {state.unassigned.length} entities
            </span>
          </div>
          <div style={desksGridStyle}>
            {state.unassigned.map((entity) => (
              <Desk key={entity.id} entity={entity} />
            ))}
          </div>
        </div>
      )}

      {state.departments.length === 0 && state.unassigned.length === 0 && (
        <div style={emptyOfficeStyle}>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)' }}>The office is empty</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Create entities and departments to populate the office
          </p>
        </div>
      )}
    </div>
  );
}

const floorStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const deptStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  overflow: 'hidden',
};

const deptHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--border)',
  borderLeft: '4px solid',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const desksGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
  gap: 12,
  padding: 16,
};

const emptyStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 13,
  padding: '8px 0',
};

const emptyOfficeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 60,
};
