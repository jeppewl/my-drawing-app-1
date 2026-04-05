export interface DrawPoint {
  x: number;
  y: number;
}

export interface MoveStep {
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
}

export interface CircleHitbox {
  id: number;
  cx: number;
  cy: number;
  r: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface TestRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface DebugPointer {
  x: number;
  y: number;
  id: number;
}
