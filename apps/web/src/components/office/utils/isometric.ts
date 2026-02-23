export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

export function toIsometric(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2),
    y: (gridX + gridY) * (TILE_HEIGHT / 2),
  };
}

export function fromIsometric(isoX: number, isoY: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.round((isoX / (TILE_WIDTH / 2) + isoY / (TILE_HEIGHT / 2)) / 2),
    gridY: Math.round((isoY / (TILE_HEIGHT / 2) - isoX / (TILE_WIDTH / 2)) / 2),
  };
}

export function getTileVertices(tileWidth = TILE_WIDTH, tileHeight = TILE_HEIGHT) {
  const hw = tileWidth / 2;
  const hh = tileHeight / 2;
  return [hw, 0, tileWidth, hh, hw, tileHeight, 0, hh];
}

export function depthSort(a: { gridX: number; gridY: number }, b: { gridX: number; gridY: number }): number {
  return (a.gridX + a.gridY) - (b.gridX + b.gridY);
}

export function getGridCenter(gridWidth: number, gridHeight: number): { x: number; y: number } {
  return toIsometric(gridWidth / 2, gridHeight / 2);
}
