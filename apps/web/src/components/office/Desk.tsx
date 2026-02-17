import type { Entity } from '../../lib/api.js';
import { EntityAvatar } from './EntityAvatar.js';

export function Desk({ entity }: { entity: Entity }) {
  return (
    <div style={deskStyle}>
      <EntityAvatar entity={entity} />
    </div>
  );
}

const deskStyle: React.CSSProperties = {
  background: 'var(--bg-tertiary)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  padding: 8,
  minWidth: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
