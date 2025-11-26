import type { Point } from "./types";

export const createBezierPath = (point: Point, nextPoint: Point) => {
  const startX = point.x;
  const startY = point.y;
  const cp1X = point.x + point.rightX;
  const cp1Y = point.y + point.rightY;
  const cp2X = nextPoint.x + nextPoint.leftX;
  const cp2Y = nextPoint.y + nextPoint.leftY;
  const endX = nextPoint.x;
  const endY = nextPoint.y;
  return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
};

export const getBezierLength = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  segments = 100
) => {
  let length = 0;
  let prev = p0;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x =
      (1 - t) ** 3 * p0.x +
      3 * (1 - t) ** 2 * t * p1.x +
      3 * (1 - t) * t ** 2 * p2.x +
      t ** 3 * p3.x;
    const y =
      (1 - t) ** 3 * p0.y +
      3 * (1 - t) ** 2 * t * p1.y +
      3 * (1 - t) * t ** 2 * p2.y +
      t ** 3 * p3.y;
    length += Math.hypot(x - prev.x, y - prev.y);
    prev = { x, y };
  }
  return length;
};
