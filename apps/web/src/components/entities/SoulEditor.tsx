import { useState } from 'react';

interface SoulEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

const TEMPLATE = `---
name:
role:
hierarchy: worker
skills: []
personality: []
communication: professional
---

# Rules
- Follow best practices
- Ask for clarification when uncertain

# Background
A capable AI entity ready to contribute to the team.
`;

export function SoulEditor({ initialContent, onSave, onCancel }: SoulEditorProps) {
  const [content, setContent] = useState(initialContent ?? TEMPLATE);

  return (
    <div style={editorStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: 16 }}>SOUL.md Editor</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button onClick={() => onSave(content)}>Save</button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={textareaStyle}
        spellCheck={false}
        placeholder="Write SOUL.md content..."
      />
    </div>
  );
}

const editorStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const cancelBtnStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  color: 'var(--text-secondary)',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 400,
  padding: 16,
  background: 'var(--bg-primary)',
  border: 'none',
  color: 'var(--text-primary)',
  fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
  fontSize: 13,
  lineHeight: 1.6,
  resize: 'vertical',
};
