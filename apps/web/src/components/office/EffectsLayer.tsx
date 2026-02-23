import { memo, useCallback, useMemo } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import { toIsometric, TILE_WIDTH, TILE_HEIGHT } from './utils/isometric.js';
import { STATE_COLORS } from './utils/sprites.js';
import type { EntityState } from '../../types.js';

interface EffectEntity {
  id: string;
  state: EntityState;
  deskX: number;
  deskY: number;
}

interface EffectsLayerProps {
  effectEntities: EffectEntity[];
}

function arePropsEqual(prev: EffectsLayerProps, next: EffectsLayerProps) {
  if (prev.effectEntities.length !== next.effectEntities.length) return false;
  for (let i = 0; i < prev.effectEntities.length; i++) {
    const a = prev.effectEntities[i];
    const b = next.effectEntities[i];
    if (a.id !== b.id || a.state !== b.state || a.deskX !== b.deskX || a.deskY !== b.deskY) return false;
  }
  return true;
}

export const EffectsLayer = memo(function EffectsLayer({ effectEntities }: EffectsLayerProps) {
  const effectsKey = useMemo(
    () => effectEntities.map((e) => `${e.id}:${e.state}:${e.deskX}:${e.deskY}`).join('|'),
    [effectEntities],
  );

  const drawEffects = useCallback(
    (g: PixiGraphics) => {
      g.clear();

      for (const entity of effectEntities) {
        const iso = toIsometric(entity.deskX, entity.deskY);
        const cx = iso.x + TILE_WIDTH / 2;
        const cy = iso.y + TILE_HEIGHT / 2 - 12;
        const color = STATE_COLORS[entity.state] ?? STATE_COLORS.idle;

        if (entity.state === 'thinking') {
          for (let i = 0; i < 3; i++) {
            g.circle(cx + 18 + i * 6, cy - 20 + i * -3, 2 - i * 0.5);
            g.fill({ color: 0xf59e0b, alpha: 0.6 - i * 0.15 });
          }
        }

        if (entity.state === 'working') {
          g.circle(cx, cy, 18);
          g.stroke({ color, width: 1, alpha: 0.2 });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectsKey],
  );

  return <pixiGraphics draw={drawEffects} />;
}, arePropsEqual);
