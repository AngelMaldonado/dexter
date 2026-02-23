import { memo, useCallback, useMemo } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import { toIsometric, TILE_WIDTH, TILE_HEIGHT } from './utils/isometric.js';
import type { OfficeLayout } from '../../types.js';

interface FurnitureLayerProps {
  layout: OfficeLayout;
}

export const FurnitureLayer = memo(function FurnitureLayer({ layout }: FurnitureLayerProps) {
  const desksKey = useMemo(
    () => layout.desks.map((d) => `${d.x}:${d.y}`).join('|'),
    [layout.desks],
  );

  const drawDesks = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const hw = TILE_WIDTH / 2;
      const hh = TILE_HEIGHT / 2;
      const deskScale = 0.6;

      for (const desk of layout.desks) {
        const iso = toIsometric(desk.x, desk.y);
        const cx = iso.x + hw;
        const cy = iso.y + hh;
        const dw = hw * deskScale;
        const dh = hh * deskScale;

        g.moveTo(cx, cy - dh);
        g.lineTo(cx + dw, cy);
        g.lineTo(cx, cy + dh);
        g.lineTo(cx - dw, cy);
        g.closePath();
        g.fill({ color: 0x3d2b1f, alpha: 0.7 });
        g.stroke({ color: 0x5a4234, width: 1 });

        g.moveTo(cx, cy - dh);
        g.lineTo(cx + dw, cy);
        g.stroke({ color: 0x6b5344, width: 1, alpha: 0.5 });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [desksKey],
  );

  const roomsKey = useMemo(
    () => layout.meetingRooms.map((r) => `${r.x}:${r.y}:${r.width}:${r.height}`).join('|'),
    [layout.meetingRooms],
  );

  const drawMeetingRooms = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const hw = TILE_WIDTH / 2;
      const hh = TILE_HEIGHT / 2;

      for (const room of layout.meetingRooms) {
        const topLeft = toIsometric(room.x, room.y);
        const topRight = toIsometric(room.x + room.width, room.y);
        const bottomRight = toIsometric(room.x + room.width, room.y + room.height);
        const bottomLeft = toIsometric(room.x, room.y + room.height);

        g.moveTo(topLeft.x + hw, topLeft.y + hh);
        g.lineTo(topRight.x + hw, topRight.y + hh);
        g.lineTo(bottomRight.x + hw, bottomRight.y + hh);
        g.lineTo(bottomLeft.x + hw, bottomLeft.y + hh);
        g.closePath();
        g.fill({ color: 0x3b82f6, alpha: 0.08 });

        g.moveTo(topLeft.x + hw, topLeft.y + hh);
        g.lineTo(topRight.x + hw, topRight.y + hh);
        g.lineTo(bottomRight.x + hw, bottomRight.y + hh);
        g.lineTo(bottomLeft.x + hw, bottomLeft.y + hh);
        g.closePath();
        g.stroke({ color: 0x3b82f6, width: 2, alpha: 0.4 });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomsKey],
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={drawDesks} />
      <pixiGraphics draw={drawMeetingRooms} />
    </pixiContainer>
  );
});
