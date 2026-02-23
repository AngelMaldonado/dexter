import { useEffect, useState } from 'react';
import { useEntityStore } from '../stores/entity-store.js';
import { EntityPanel } from '../components/entities/EntityPanel.js';
import { EntityStats } from '../components/entities/EntityStats.js';
import { SoulEditor } from '../components/entities/SoulEditor.js';
import type { CreateEntityInput } from '../types.js';

export function EntitiesPage() {
  const entities = useEntityStore((s) => s.entities);
  const loading = useEntityStore((s) => s.loading);
  const fetchEntities = useEntityStore((s) => s.fetchEntities);
  const createEntity = useEntityStore((s) => s.createEntity);
  const selectEntity = useEntityStore((s) => s.selectEntity);
  const selectedEntityId = useEntityStore((s) => s.selectedEntityId);
  const [showEditor, setShowEditor] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const selectedEntity = selectedEntityId ? entities.find((e) => e.id === selectedEntityId) : null;

  const handleCreateEntity = async (soulMd: string) => {
    setCreating(true);
    try {
      const lines = soulMd.split('\n');
      let name = 'New Entity';
      for (const line of lines) {
        const match = line.match(/^name:\s*(.+)/);
        if (match) {
          name = match[1].trim();
          break;
        }
      }

      const input: CreateEntityInput = { name, soulMd };
      await createEntity(input);
      setShowEditor(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create entity');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ flex: 1 }}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Entities</h1>
          <button onClick={() => setShowEditor(!showEditor)}>
            {showEditor ? 'Close Editor' : 'Create Entity'}
          </button>
        </div>

        {showEditor && (
          <div style={{ marginBottom: 24 }}>
            <SoulEditor
              onSave={handleCreateEntity}
              onCancel={() => setShowEditor(false)}
            />
            {creating && (
              <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                Creating entity...
              </div>
            )}
          </div>
        )}

        {loading && entities.length === 0 ? (
          <div style={loadingStyle}>Loading entities...</div>
        ) : (
          <div style={gridStyle}>
            {entities.map((entity) => (
              <EntityPanel
                key={entity.id}
                entity={entity}
                onClick={() => selectEntity(entity.id)}
              />
            ))}
            {entities.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 20, gridColumn: '1 / -1' }}>
                No entities created yet. Use the Create Entity button to add one.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedEntity && (
        <div style={detailSidebarStyle}>
          <EntityStats entity={selectedEntity} onClose={() => selectEntity(null)} />
        </div>
      )}
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  height: '100%',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: 40,
  color: 'var(--text-muted)',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: 16,
};

const detailSidebarStyle: React.CSSProperties = {
  width: 360,
  flexShrink: 0,
};
