import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useOfficeStore } from '../../stores/office-store.js';
import { useEntityStore } from '../../stores/entity-store.js';
import { useBubbleStore } from '../../stores/bubble-store.js';
import { FloorLayer } from './FloorLayer.js';
import { FurnitureLayer } from './FurnitureLayer.js';
import { EntitySprite } from './EntitySprite.js';
import { EffectsLayer } from './EffectsLayer.js';
import { SpeechBubble } from './SpeechBubble.js';
import { depthSort, toIsometric, TILE_WIDTH, TILE_HEIGHT } from './utils/isometric.js';
import type { Entity } from '../../types.js';

extend({ Container, Graphics, Text });

export function OfficeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { layout, departments, viewport, zoom, pan, resetView } = useOfficeStore();
  const entities = useEntityStore((s) => s.entities);
  const selectEntity = useEntityStore((s) => s.selectEntity);
  const bubbles = useBubbleStore((s) => s.bubbles);
  const [dragging, setDragging] = useState(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let timeout: ReturnType<typeof setTimeout>;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }, 200);
      }
    });
    obs.observe(el);
    return () => { obs.disconnect(); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom(e.deltaY > 0 ? -0.08 : 0.08);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [zoom]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 0) {
      setDragging(true);
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      pan(dx, dy);
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    },
    [dragging, pan],
  );

  const handlePointerUp = useCallback(() => setDragging(false), []);

  const sortedEntities = useMemo(
    () =>
      [...entities]
        .filter((e): e is Entity & { deskX: number; deskY: number } => e.deskX !== null && e.deskY !== null)
        .sort((a, b) => depthSort({ gridX: a.deskX, gridY: a.deskY }, { gridX: b.deskX, gridY: b.deskY })),
    [entities],
  );

  // Build bubble entries with isometric positions for entities that have active bubbles
  const bubbleEntries = useMemo(() => {
    const result: Array<{ entityId: string; text: string; type: 'thought' | 'speech' | 'status'; x: number; y: number }> = [];
    for (const [entityId, bubble] of bubbles) {
      const entity = entities.find((e) => e.id === entityId);
      if (!entity || entity.deskX === null || entity.deskY === null) continue;
      const iso = toIsometric(entity.deskX, entity.deskY);
      result.push({
        entityId,
        text: bubble.text,
        type: bubble.type,
        x: iso.x + TILE_WIDTH / 2,
        y: iso.y + TILE_HEIGHT / 2 - 40,
      });
    }
    return result;
  }, [bubbles, entities]);

  // Extract only the data EffectsLayer needs to avoid passing full entities array
  const effectEntities = useMemo(
    () =>
      entities
        .filter((e) => e.deskX !== null && e.deskY !== null && (e.state === 'working' || e.state === 'thinking'))
        .map((e) => ({ id: e.id, state: e.state, deskX: e.deskX!, deskY: e.deskY! })),
    [entities],
  );

  if (!layout) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Loading office...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', cursor: dragging ? 'grabbing' : 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <Application
        width={dimensions.width}
        height={dimensions.height}
        background={0x0f0f1a}
        antialias
      >
        <pixiContainer x={viewport.x} y={viewport.y} scale={viewport.scale}>
          <FloorLayer layout={layout} departments={departments} />
          <FurnitureLayer layout={layout} />
          {sortedEntities.map((entity) => (
            <MemoizedEntityWrapper
              key={entity.id}
              entity={entity}
              selectEntity={selectEntity}
            />
          ))}
          <EffectsLayer effectEntities={effectEntities} />
          {bubbleEntries.map((b) => (
            <SpeechBubble key={b.entityId} text={b.text} type={b.type} x={b.x} y={b.y} />
          ))}
        </pixiContainer>
      </Application>

      {/* Zoom controls overlay */}
      <div style={controlsStyle}>
        <button onClick={() => zoom(0.2)} style={controlBtnStyle}>+</button>
        <button onClick={() => zoom(-0.2)} style={controlBtnStyle}>-</button>
        <button onClick={resetView} style={controlBtnStyle} title="Reset view">R</button>
      </div>

      <div style={scaleIndicatorStyle}>
        {Math.round(viewport.scale * 100)}%
      </div>
    </div>
  );
}

// Wrapper to stabilize onClick callback per entity
function MemoizedEntityWrapper({ entity, selectEntity }: { entity: Entity; selectEntity: (id: string) => void }) {
  const handleClick = useCallback(() => selectEntity(entity.id), [entity.id, selectEntity]);
  return <EntitySprite entity={entity} onClick={handleClick} />;
}

const controlsStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 16,
  right: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const controlBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontSize: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
};

const scaleIndicatorStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 16,
  left: 16,
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '4px 10px',
  fontSize: 12,
  color: 'var(--text-muted)',
};
