import React, { useRef, useState } from "react";
import { mapToHueGradient, sin60 } from "../utils/colorUtils";

// function BeadCanvas() {
const BeadCanvas: React.FC = () => {
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const touchedCircle = useRef<number | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const thresMov = 5;

  const rowLength = 7;
  const rows = 10;
  const dotCount = rowLength * rows;
  const beadIds = Array.from({ length: dotCount }, (_, i) => i + 0);

  const [hexArr, setHexArr] = useState(() => {
    const arr = Array.from({ length: dotCount }, (_, i) =>
      mapToHueGradient(i * (100 / dotCount), 0, 100),
    );

    return arr;
  });

  const rad = 24.048;
  const startY = 52;
  const startX = 130;

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

  const handleMouseOver = (id: number, event: React.MouseEvent<SVGCircleElement>) => {
    // console.log("hover circle", id);
  };

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    touchedCircle.current = id;
    isDragging.current = true;
    hasMoved.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    const id = touchedCircle.current;

    if (!hasMoved.current && id !== null) {
      console.log("circle clicked", id);
      setHexArr((prev) => {
        const next = [...prev];
        next[id] = "#CCCCCC";
        return next;
      });
    } else if (hasMoved.current) {
      console.log("flyttet siden mousedown");
    }

    isDragging.current = false;
    touchedCircle.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;

    if (Math.abs(dx) > thresMov || Math.abs(dy) > thresMov) {
      hasMoved.current = true;
    }
    // console.log("dragging", e.clientX, e.clientY);
    // console.log("dx:", dx, "dy", dy);
  };

  return (
    <>
      <button onClick={() => console.log(getStartX(9))}>Test</button>
      <svg
        width={800}
        height={500}
        className="canvas"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {beadIds.map((id) => (
          <React.Fragment key={id}>
            <circle
              cx={(getPosFromI(id) * 2 * rad + getStartX(id)).toFixed(2)}
              cy={(getRowFromI(id) * 2 * sin60(rad) + startY).toFixed(2)}
              r={rad.toFixed(2)}
              fill={hexArr[id]}
              // onMouseOver={(e) => handleMouseOver(id, e)}
              onMouseDown={(e) => handleMouseDown(e, id)}
            />
          </React.Fragment>
        ))}
      </svg>
      {/* <button onClick={() => console.log(hexArr)}>Hej</button> */}
    </>
  );
};

export default BeadCanvas;
