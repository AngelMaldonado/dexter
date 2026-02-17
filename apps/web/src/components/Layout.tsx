import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { connectWebSocket, onWebSocketEvent } from '../lib/websocket.js';
import { useStore } from '../stores/useStore.js';

export function Layout() {
  const handleEvent = useStore((s) => s.handleEvent);

  useEffect(() => {
    connectWebSocket();
    return onWebSocketEvent(handleEvent);
  }, [handleEvent]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={navStyle}>
        <div style={logoStyle}>DEXTER</div>
        <NavLink to="/office" style={linkStyleFn}>Office</NavLink>
        <NavLink to="/entities" style={linkStyleFn}>Entities</NavLink>
        <NavLink to="/tasks" style={linkStyleFn}>Tasks</NavLink>
      </nav>
      <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

const navStyle: React.CSSProperties = {
  width: 200,
  background: 'var(--bg-secondary)',
  borderRight: '1px solid var(--border)',
  padding: '20px 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const logoStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: 4,
  padding: '0 20px 20px',
  color: 'var(--accent)',
  borderBottom: '1px solid var(--border)',
  marginBottom: 12,
};

function linkStyleFn({ isActive }: { isActive: boolean }): React.CSSProperties {
  return {
    padding: '10px 20px',
    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
    background: isActive ? 'var(--bg-tertiary)' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
    transition: 'all 0.15s',
  };
}
