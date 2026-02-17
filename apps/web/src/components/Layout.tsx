import { useEffect, useState, useCallback } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { sseClient } from '../api/sse.js';
import { useEntityStore } from '../stores/entity-store.js';
import { useTaskStore } from '../stores/task-store.js';
import { useGamificationStore } from '../stores/gamification-store.js';
import { useBubbleStore } from '../stores/bubble-store.js';
import type { EntityStateChangedEvent, TaskAssignedEvent, TaskCompletedEvent, TaskFailedEvent, MessageSentEvent } from '../types.js';

const STATE_MESSAGES: Record<string, string> = {
  idle: 'Taking a break...',
  working: 'On it!',
  thinking: 'Hmm, let me think...',
  blocked: "I'm stuck...",
  collaborating: 'Working together!',
  on_break: 'Resting...',
};

export function Layout() {
  const handleEntityEvent = useEntityStore((s) => s.handleEntityEvent);
  const handleTaskEvent = useTaskStore((s) => s.handleTaskEvent);
  const handleAchievementEvent = useGamificationStore((s) => s.handleAchievementEvent);
  const handleXPEvent = useGamificationStore((s) => s.handleXPEvent);
  const addBubble = useBubbleStore((s) => s.addBubble);
  const [connected, setConnected] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleStateChangeBubble = useCallback(
    (data: EntityStateChangedEvent) => {
      const msg = STATE_MESSAGES[data.payload.newState];
      if (msg) addBubble(data.payload.entityId, msg, 'status');
    },
    [addBubble],
  );

  const handleTaskAssignedBubble = useCallback(
    (data: TaskAssignedEvent) => {
      addBubble(data.payload.entityId, 'Got a new task!', 'status');
    },
    [addBubble],
  );

  const handleTaskCompletedBubble = useCallback(
    (data: TaskCompletedEvent) => {
      addBubble(data.payload.entityId, 'Done!', 'speech');
    },
    [addBubble],
  );

  const handleTaskFailedBubble = useCallback(
    (data: TaskFailedEvent) => {
      addBubble(data.payload.entityId, 'Something went wrong...', 'thought');
    },
    [addBubble],
  );

  const handleMessageBubble = useCallback(
    (data: MessageSentEvent) => {
      addBubble(data.payload.fromEntityId, data.payload.content, 'speech');
    },
    [addBubble],
  );

  useEffect(() => {
    sseClient.connect();

    const unsubs = [
      sseClient.on('__connected', (val) => setConnected(!!val)),
      sseClient.on('entity:created', handleEntityEvent),
      sseClient.on('entity:state-changed', handleEntityEvent),
      sseClient.on('entity:energy-updated', handleEntityEvent),
      sseClient.on('task:created', handleTaskEvent),
      sseClient.on('task:assigned', handleTaskEvent),
      sseClient.on('task:started', handleTaskEvent),
      sseClient.on('task:completed', handleTaskEvent),
      sseClient.on('task:failed', handleTaskEvent),
      sseClient.on('achievement:unlocked', handleAchievementEvent),
      sseClient.on('xp:awarded', handleXPEvent),
      // Bubble triggers
      sseClient.on('entity:state-changed', handleStateChangeBubble),
      sseClient.on('task:assigned', handleTaskAssignedBubble),
      sseClient.on('task:completed', handleTaskCompletedBubble),
      sseClient.on('task:failed', handleTaskFailedBubble),
      sseClient.on('message:sent', handleMessageBubble),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
      sseClient.disconnect();
    };
  }, [handleEntityEvent, handleTaskEvent, handleAchievementEvent, handleXPEvent, handleStateChangeBubble, handleTaskAssignedBubble, handleTaskCompletedBubble, handleTaskFailedBubble, handleMessageBubble]);

  return (
    <div style={rootStyle}>
      {/* Top bar */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={menuBtnStyle}
            title="Toggle sidebar"
          >
            {sidebarCollapsed ? '>' : '<'}
          </button>
          <span style={logoStyle}>DEXTER</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ ...connectionDotStyle, background: connected ? 'var(--success)' : 'var(--error)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      <div style={bodyStyle}>
        {/* Sidebar */}
        <nav style={{ ...navStyle, width: sidebarCollapsed ? 0 : 'var(--sidebar-width)', padding: sidebarCollapsed ? 0 : '16px 0' }}>
          {!sidebarCollapsed && (
            <>
              <NavLink to="/office" style={linkStyleFn}>
                {({ isActive }) => <NavItem label="Office" active={isActive} />}
              </NavLink>
              <NavLink to="/entities" style={linkStyleFn}>
                {({ isActive }) => <NavItem label="Entities" active={isActive} />}
              </NavLink>
              <NavLink to="/tasks" style={linkStyleFn}>
                {({ isActive }) => <NavItem label="Tasks" active={isActive} />}
              </NavLink>
              <NavLink to="/gamification" style={linkStyleFn}>
                {({ isActive }) => <NavItem label="Gamification" active={isActive} />}
              </NavLink>
              <NavLink to="/logs" style={linkStyleFn}>
                {({ isActive }) => <NavItem label="Logs" active={isActive} />}
              </NavLink>
              <NavLink to="/settings" style={linkStyleFn}>
                {({ isActive }) => <NavItem label="Settings" active={isActive} />}
              </NavLink>
            </>
          )}
        </nav>

        {/* Main content */}
        <main style={mainStyle}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      style={{
        padding: '10px 20px',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        background: active ? 'var(--bg-card)' : 'transparent',
        fontWeight: active ? 600 : 400,
        borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
        fontSize: 14,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </div>
  );
}

const rootStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const headerStyle: React.CSSProperties = {
  height: 'var(--header-height)',
  background: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  flexShrink: 0,
};

const menuBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-muted)',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
};

const logoStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: 3,
  color: 'var(--accent)',
};

const connectionDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
};

const bodyStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
};

const navStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRight: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  flexShrink: 0,
  overflow: 'hidden',
  transition: 'width 0.2s, padding 0.2s',
};

function linkStyleFn(): React.CSSProperties {
  return { textDecoration: 'none' };
}

const mainStyle: React.CSSProperties = {
  flex: 1,
  padding: 24,
  overflow: 'auto',
};
