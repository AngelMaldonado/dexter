import { useEffect, useState } from 'react';
import { useStore } from '../stores/useStore.js';
import { EntityPanel } from '../components/entities/EntityPanel.js';
import { SoulEditor } from '../components/entities/SoulEditor.js';
import { api } from '../lib/api.js';

export function EntitiesPage() {
  const entities = useStore((s) => s.entities);
  const fetchEntities = useStore((s) => s.fetchEntities);
  const [showEditor, setShowEditor] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleCreateFromSoul = async (soulPath: string) => {
    setCreating(true);
    try {
      await api.createEntityFromSoul(soulPath);
      await fetchEntities();
      setShowEditor(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create entity');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Entities</h1>
        <button onClick={() => setShowEditor(!showEditor)}>
          {showEditor ? 'Close Editor' : 'New Entity'}
        </button>
      </div>

      {showEditor && (
        <div style={{ marginBottom: 24 }}>
          <SoulEditor
            onSave={() => {
              const path = prompt('Enter the soul file path (e.g., souls/templates/frontend-dev.soul.md):');
              if (path) handleCreateFromSoul(path);
            }}
            onCancel={() => setShowEditor(false)}
          />
          {creating && <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>Creating entity...</div>}
        </div>
      )}

      <div style={gridStyle}>
        {entities.map((entity) => (
          <EntityPanel key={entity.id} entity={entity} />
        ))}
        {entities.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 20 }}>
            No entities created yet. Create one from a SOUL.md template.
          </div>
        )}
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: 16,
};
