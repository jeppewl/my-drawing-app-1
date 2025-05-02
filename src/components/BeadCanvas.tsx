import React from "react";
import { mapToHueGradient, sin60 } from "../utils/colorUtils";

// function BeadCanvas() {
const BeadCanvas: React.FC = () => {
  const rowLength = 7;
  const rows = 10;
  const dotCount = rowLength * rows;
  const beadIds = Array.from({ length: dotCount }, (_, i) => i + 0);
  const hexArr = Array(dotCount).fill("");
  const rad = 24.048;
  const startY = 52;
  const startX = 23;

  function getRowFromI(i: number): number {
    return Math.floor(i / rowLength);
  }

  function getPosFromI(i: number): number {
    return i % rowLength;
  }

  function getStartX(i: number): number {
    return getRowFromI(i) % 2 === 0 ? startX : startX + rad;
  }

  function getStartY(i: number) {}

  for (let i = 0; i < hexArr.length; i++) {
    hexArr[i] = mapToHueGradient(i * (100 / dotCount), 0, 100);
  }

  return (
    <>
      <button onClick={() => console.log(getStartX(9))}>Test</button>
      <svg width={500} height={500} className="canvas">
        {beadIds.map((id) => (
          <React.Fragment key={id}>
            <circle
              cx={(getPosFromI(id) * 2 * rad + getStartX(id)).toFixed(2)}
              cy={(getRowFromI(id) * 2 * sin60(rad) + startY).toFixed(2)}
              r={rad.toFixed(2)}
              fill={hexArr[id]}
            />
          </React.Fragment>
        ))}
      </svg>
      <button onClick={() => console.log(hexArr)}>Hej</button>
    </>
  );
};

export default BeadCanvas;
