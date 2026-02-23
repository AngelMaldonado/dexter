import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import type { LLMConfig, MCPServerConfig, BoardProviderConfig, OrgConfig, LLMProviderType } from '../types.js';

type SettingsTab = 'llm' | 'mcp' | 'boards' | 'org';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('llm');

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Settings</h1>

      <div style={tabsStyle}>
        {([
          ['llm', 'LLM Providers'],
          ['mcp', 'MCP Servers'],
          ['boards', 'Board Providers'],
          ['org', 'Organization'],
        ] as [SettingsTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              ...tabBtnStyle,
              background: activeTab === key ? 'var(--accent)' : 'var(--bg-card)',
              color: activeTab === key ? 'white' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={contentStyle}>
        {activeTab === 'llm' && <LLMSettings />}
        {activeTab === 'mcp' && <MCPSettings />}
        {activeTab === 'boards' && <BoardSettings />}
        {activeTab === 'org' && <OrgSettings />}
      </div>
    </div>
  );
}

function LLMSettings() {
  const [configs, setConfigs] = useState<LLMConfig[]>([]);
  const [editing, setEditing] = useState<Partial<LLMConfig> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.providers.llm.list().then(setConfigs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    try {
      if (editing.id) {
        const updated = await api.providers.llm.update(editing.id, editing);
        setConfigs((c) => c.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await api.providers.llm.create(editing as Omit<LLMConfig, 'id' | 'createdAt'>);
        setConfigs((c) => [...c, created]);
      }
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    await api.providers.llm.delete(id);
    setConfigs((c) => c.filter((x) => x.id !== id));
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>LLM Provider Configurations</h3>
        <button onClick={() => setEditing({ provider: 'anthropic', model: '', maxTokens: 4096, temperature: 0.7, name: '' })}>
          Add Provider
        </button>
      </div>

      {editing && (
        <div style={formCardStyle}>
          <div style={formGridStyle}>
            <div>
              <label style={formLabelStyle}>Name</label>
              <input value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label style={formLabelStyle}>Provider</label>
              <select value={editing.provider ?? 'anthropic'} onChange={(e) => setEditing({ ...editing, provider: e.target.value as LLMProviderType })}>
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>
            <div>
              <label style={formLabelStyle}>Model</label>
              <input value={editing.model ?? ''} onChange={(e) => setEditing({ ...editing, model: e.target.value })} placeholder="e.g. claude-sonnet-4-5-20250929" />
            </div>
            <div>
              <label style={formLabelStyle}>API Key</label>
              <input type="password" value={editing.apiKey ?? ''} onChange={(e) => setEditing({ ...editing, apiKey: e.target.value })} placeholder="sk-..." />
            </div>
            <div>
              <label style={formLabelStyle}>Max Tokens</label>
              <input type="number" value={editing.maxTokens ?? 4096} onChange={(e) => setEditing({ ...editing, maxTokens: parseInt(e.target.value) })} />
            </div>
            <div>
              <label style={formLabelStyle}>Temperature</label>
              <input type="number" step="0.1" min="0" max="2" value={editing.temperature ?? 0.7} onChange={(e) => setEditing({ ...editing, temperature: parseFloat(e.target.value) })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setEditing(null)} style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={listStyle}>
        {configs.map((config) => (
          <div key={config.id} style={listItemStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{config.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {config.provider} / {config.model} | temp: {config.temperature} | max tokens: {config.maxTokens}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setEditing(config)} style={smallBtnStyle}>Edit</button>
              <button onClick={() => handleDelete(config.id)} style={{ ...smallBtnStyle, color: 'var(--error)' }}>Delete</button>
            </div>
          </div>
        ))}
        {configs.length === 0 && <div style={{ color: 'var(--text-muted)', padding: 16 }}>No LLM providers configured</div>}
      </div>
    </div>
  );
}

function MCPSettings() {
  const [configs, setConfigs] = useState<MCPServerConfig[]>([]);
  const [editing, setEditing] = useState<Partial<MCPServerConfig> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.providers.mcp.list().then(setConfigs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    try {
      if (editing.id) {
        const updated = await api.providers.mcp.update(editing.id, editing);
        setConfigs((c) => c.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await api.providers.mcp.create(editing as Omit<MCPServerConfig, 'id' | 'createdAt'>);
        setConfigs((c) => [...c, created]);
      }
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    await api.providers.mcp.delete(id);
    setConfigs((c) => c.filter((x) => x.id !== id));
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>MCP Server Configurations</h3>
        <button onClick={() => setEditing({ name: '', command: '', args: [], capabilities: [] })}>
          Add MCP Server
        </button>
      </div>

      {editing && (
        <div style={formCardStyle}>
          <div style={formGridStyle}>
            <div>
              <label style={formLabelStyle}>Name</label>
              <input value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label style={formLabelStyle}>Command</label>
              <input value={editing.command ?? ''} onChange={(e) => setEditing({ ...editing, command: e.target.value })} placeholder="e.g. npx" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={formLabelStyle}>Args (comma-separated)</label>
              <input value={(editing.args ?? []).join(', ')} onChange={(e) => setEditing({ ...editing, args: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="e.g. -y, @modelcontextprotocol/server-filesystem" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setEditing(null)} style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={listStyle}>
        {configs.map((config) => (
          <div key={config.id} style={listItemStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{config.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                {config.command} {config.args.join(' ')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setEditing(config)} style={smallBtnStyle}>Edit</button>
              <button onClick={() => handleDelete(config.id)} style={{ ...smallBtnStyle, color: 'var(--error)' }}>Delete</button>
            </div>
          </div>
        ))}
        {configs.length === 0 && <div style={{ color: 'var(--text-muted)', padding: 16 }}>No MCP servers configured</div>}
      </div>
    </div>
  );
}

function BoardSettings() {
  const [configs, setConfigs] = useState<BoardProviderConfig[]>([]);
  const [editing, setEditing] = useState<Partial<BoardProviderConfig> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.providers.boards.list().then(setConfigs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    try {
      if (editing.id) {
        const updated = await api.providers.boards.update(editing.id, editing);
        setConfigs((c) => c.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await api.providers.boards.create(editing as Omit<BoardProviderConfig, 'id' | 'createdAt'>);
        setConfigs((c) => [...c, created]);
      }
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    await api.providers.boards.delete(id);
    setConfigs((c) => c.filter((x) => x.id !== id));
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Board Provider Configurations</h3>
        <button onClick={() => setEditing({ name: '', type: 'trello', credentials: {}, boardId: '', pollIntervalMs: 30000, statusMapping: {} })}>
          Add Board Provider
        </button>
      </div>

      {editing && (
        <div style={formCardStyle}>
          <div style={formGridStyle}>
            <div>
              <label style={formLabelStyle}>Name</label>
              <input value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label style={formLabelStyle}>Type</label>
              <select value={editing.type ?? 'trello'} onChange={(e) => setEditing({ ...editing, type: e.target.value as BoardProviderConfig['type'] })}>
                <option value="trello">Trello</option>
                <option value="linear">Linear</option>
                <option value="github">GitHub</option>
              </select>
            </div>
            <div>
              <label style={formLabelStyle}>Board ID</label>
              <input value={editing.boardId ?? ''} onChange={(e) => setEditing({ ...editing, boardId: e.target.value })} />
            </div>
            <div>
              <label style={formLabelStyle}>Poll Interval (ms)</label>
              <input type="number" value={editing.pollIntervalMs ?? 30000} onChange={(e) => setEditing({ ...editing, pollIntervalMs: parseInt(e.target.value) })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setEditing(null)} style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={listStyle}>
        {configs.map((config) => (
          <div key={config.id} style={listItemStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{config.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {config.type} | Board: {config.boardId} | Poll: {config.pollIntervalMs / 1000}s
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setEditing(config)} style={smallBtnStyle}>Edit</button>
              <button onClick={() => api.providers.boards.sync(config.id)} style={smallBtnStyle}>Sync</button>
              <button onClick={() => handleDelete(config.id)} style={{ ...smallBtnStyle, color: 'var(--error)' }}>Delete</button>
            </div>
          </div>
        ))}
        {configs.length === 0 && <div style={{ color: 'var(--text-muted)', padding: 16 }}>No board providers configured</div>}
      </div>
    </div>
  );
}

function OrgSettings() {
  const [org, setOrg] = useState<OrgConfig | null>(null);
  const [name, setName] = useState('');
  const [conventions, setConventions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.org.get().then((o) => {
      setOrg(o);
      setName(o.name);
      setConventions(o.conventions);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.org.update({ name, conventions });
      setOrg(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Organization Settings</h3>
      <div style={formCardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={formLabelStyle}>Organization Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label style={formLabelStyle}>Coding Conventions</label>
            <textarea
              value={conventions}
              onChange={(e) => setConventions(e.target.value)}
              rows={10}
              style={{ fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: 13 }}
              placeholder="Define coding conventions, style guides, and team preferences..."
            />
          </div>
          <div>
            <button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {org && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Last updated: {new Date(org.updatedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Shared styles
const tabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  marginBottom: 24,
};

const tabBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
};

const contentStyle: React.CSSProperties = {
  minHeight: 400,
};

const formCardStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: 20,
  marginBottom: 16,
};

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
};

const formLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-muted)',
  marginBottom: 4,
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const listItemStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const smallBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  borderRadius: 6,
  cursor: 'pointer',
};
