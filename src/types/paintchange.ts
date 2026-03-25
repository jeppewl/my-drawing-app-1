import { ColorData } from "./colordata";

export type PaintChange = {
  id: number;
  prevColor: ColorData;
  newColor: ColorData;
};
