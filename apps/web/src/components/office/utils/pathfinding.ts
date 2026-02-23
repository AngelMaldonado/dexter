interface Grid {
  width: number;
  height: number;
  walkable: boolean[][];
}

interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

function heuristic(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function findPath(
  grid: Grid,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): Array<{ x: number; y: number }> {
  if (startX === endX && startY === endY) return [{ x: startX, y: startY }];
  if (!grid.walkable[startY]?.[startX] || !grid.walkable[endY]?.[endX]) return [];

  const open: PathNode[] = [];
  const closed = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;

  const start: PathNode = {
    x: startX,
    y: startY,
    g: 0,
    h: heuristic(startX, startY, endX, endY),
    f: heuristic(startX, startY, endX, endY),
    parent: null,
  };
  open.push(start);

  const directions = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;

    if (current.x === endX && current.y === endY) {
      const path: Array<{ x: number; y: number }> = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closed.add(key(current.x, current.y));

    for (const [dx, dy] of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (nx < 0 || nx >= grid.width || ny < 0 || ny >= grid.height) continue;
      if (!grid.walkable[ny][nx]) continue;
      if (closed.has(key(nx, ny))) continue;

      const isDiagonal = dx !== 0 && dy !== 0;
      const g = current.g + (isDiagonal ? 1.414 : 1);
      const h = heuristic(nx, ny, endX, endY);
      const existing = open.find((n) => n.x === nx && n.y === ny);

      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = g + h;
          existing.parent = current;
        }
      } else {
        open.push({ x: nx, y: ny, g, h, f: g + h, parent: current });
      }
    }
  }

  return [];
}

export function createWalkableGrid(
  width: number,
  height: number,
  obstacles: Array<{ x: number; y: number }>,
): Grid {
  const walkable = Array.from({ length: height }, () =>
    Array(width).fill(true) as boolean[],
  );
  for (const obs of obstacles) {
    if (obs.y >= 0 && obs.y < height && obs.x >= 0 && obs.x < width) {
      walkable[obs.y][obs.x] = false;
    }
  }
  return { width, height, walkable };
}
