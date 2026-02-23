import { memo, useCallback, useMemo } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import { toIsometric, TILE_WIDTH, TILE_HEIGHT } from './utils/isometric.js';
import { hexToNumber } from './utils/sprites.js';
import type { OfficeLayout, Department } from '../../types.js';

interface FloorLayerProps {
  layout: OfficeLayout;
  departments: Department[];
}

export const FloorLayer = memo(function FloorLayer({ layout, departments }: FloorLayerProps) {
  const hw = TILE_WIDTH / 2;
  const hh = TILE_HEIGHT / 2;

  const drawGrid = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (let gx = 0; gx < layout.width; gx++) {
        for (let gy = 0; gy < layout.height; gy++) {
          const iso = toIsometric(gx, gy);
          g.moveTo(iso.x + hw, iso.y);
          g.lineTo(iso.x + TILE_WIDTH, iso.y + hh);
          g.lineTo(iso.x + hw, iso.y + TILE_HEIGHT);
          g.lineTo(iso.x, iso.y + hh);
          g.closePath();
          g.fill({ color: 0x1a1a2e, alpha: 0.4 });
          g.stroke({ color: 0x2a2a4a, width: 1, alpha: 0.3 });
        }
      }
    },
    [layout.width, layout.height, hw, hh],
  );

  // Stable key for zone drawing to avoid redraws when references change but data doesn't
  const zonesKey = useMemo(() => {
    return layout.departments
      .map((dz) => `${dz.departmentId}:${dz.zone.x}:${dz.zone.y}:${dz.zone.width}:${dz.zone.height}`)
      .join('|')
      + '||'
      + departments.map((d) => `${d.id}:${d.color}`).join('|');
  }, [layout.departments, departments]);

  const drawZones = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const deptZone of layout.departments) {
        const dept = departments.find((d) => d.id === deptZone.departmentId);
        const color = dept ? hexToNumber(dept.color) : 0x6366f1;
        const { zone } = deptZone;

        for (let gx = zone.x; gx < zone.x + zone.width; gx++) {
          for (let gy = zone.y; gy < zone.y + zone.height; gy++) {
            const iso = toIsometric(gx, gy);
            g.moveTo(iso.x + hw, iso.y);
            g.lineTo(iso.x + TILE_WIDTH, iso.y + hh);
            g.lineTo(iso.x + hw, iso.y + TILE_HEIGHT);
            g.lineTo(iso.x, iso.y + hh);
            g.closePath();
            g.fill({ color, alpha: 0.15 });
          }
        }

        // Zone border
        const topLeft = toIsometric(zone.x, zone.y);
        const topRight = toIsometric(zone.x + zone.width, zone.y);
        const bottomRight = toIsometric(zone.x + zone.width, zone.y + zone.height);
        const bottomLeft = toIsometric(zone.x, zone.y + zone.height);

        g.moveTo(topLeft.x + hw, topLeft.y);
        g.lineTo(topRight.x + hw, topRight.y);
        g.lineTo(bottomRight.x + hw, bottomRight.y);
        g.lineTo(bottomLeft.x + hw, bottomLeft.y);
        g.closePath();
        g.stroke({ color, width: 2, alpha: 0.5 });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zonesKey, hw, hh],
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={drawGrid} />
      <pixiGraphics draw={drawZones} />
    </pixiContainer>
  );
});
