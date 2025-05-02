export type ShapeType = "circle" | "rectangle";

export type Shape = {
  id: string; // Use string if that's what your app uses
  type: ShapeType;
  x: number;
  y: number;
  radius?: number; // for circle
  width?: number; // for rectangle
  height?: number; // for rectangle
  color: string;
};
