import { memo, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Graphics as PixiGraphics, Container as PixiContainer } from 'pixi.js';
import gsap from 'gsap';
import { toIsometric, TILE_WIDTH, TILE_HEIGHT } from './utils/isometric.js';
import { STATE_COLORS, getEnergyColor, getInitials } from './utils/sprites.js';
import type { Entity } from '../../types.js';

interface EntitySpriteProps {
  entity: Entity;
  onClick?: () => void;
}

export const EntitySprite = memo(function EntitySprite({ entity, onClick }: EntitySpriteProps) {
  const containerRef = useRef<PixiContainer>(null);

  const gridX = entity.deskX ?? 0;
  const gridY = entity.deskY ?? 0;
  const iso = useMemo(() => toIsometric(gridX, gridY), [gridX, gridY]);
  const targetX = iso.x + TILE_WIDTH / 2;
  const targetY = iso.y + TILE_HEIGHT / 2 - 12;

  // Animate position changes, kill tween on unmount to prevent writing to destroyed containers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const tween = gsap.to(container, {
      x: targetX,
      y: targetY,
      duration: 0.8,
      ease: 'power2.inOut',
    });
    return () => { tween.kill(); };
  }, [targetX, targetY]);

  const stateColor = STATE_COLORS[entity.state] ?? STATE_COLORS.idle;
  const energy = entity.energy;
  const state = entity.state;

  const drawBody = useCallback(
    (g: PixiGraphics) => {
      g.clear();

      // Shadow
      g.ellipse(0, 4, 10, 4);
      g.fill({ color: 0x000000, alpha: 0.3 });

      // Body circle
      g.circle(0, 0, 12);
      g.fill({ color: stateColor, alpha: 0.9 });
      g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });

      // State glow when working
      if (state === 'working' || state === 'collaborating') {
        g.circle(0, 0, 15);
        g.stroke({ color: stateColor, width: 2, alpha: 0.4 });
      }
    },
    [stateColor, state],
  );

  const drawEnergyBar = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const barWidth = 24;
      const barHeight = 3;
      const x = -barWidth / 2;
      const y = -20;

      // Background
      g.rect(x, y, barWidth, barHeight);
      g.fill({ color: 0x1a1a2e, alpha: 0.8 });

      // Energy fill
      const fillWidth = (energy / 100) * barWidth;
      g.rect(x, y, fillWidth, barHeight);
      g.fill({ color: getEnergyColor(energy) });
    },
    [energy],
  );

  const initials = useMemo(() => getInitials(entity.name), [entity.name]);
  const firstName = useMemo(() => entity.name.split(' ')[0], [entity.name]);

  return (
    <pixiContainer
      ref={containerRef}
      x={targetX}
      y={targetY}
      eventMode="static"
      cursor="pointer"
      onClick={onClick}
    >
      <pixiGraphics draw={drawBody} />
      <pixiGraphics draw={drawEnergyBar} />
      <pixiText
        text={initials}
        anchor={0.5}
        x={0}
        y={0}
        style={{
          fontSize: 9,
          fontWeight: 'bold',
          fill: '#ffffff',
          fontFamily: 'Arial',
        }}
      />
      <pixiText
        text={firstName}
        anchor={{ x: 0.5, y: 0 }}
        x={0}
        y={16}
        style={{
          fontSize: 9,
          fill: '#e0e0e0',
          fontFamily: 'Arial',
        }}
      />
    </pixiContainer>
  );
});
