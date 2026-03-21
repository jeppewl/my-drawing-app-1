import React, { useRef, useState } from "react";
import { mapToHueGradient, sin60 } from "../utils/colorUtils";
import { PaintChange } from "../types/paintchange";
import "../styles.css";
import { ColorData } from "../types/colordata";

const BeadCanvas: React.FC<{
  rowLength: number;
  rows: number;
  dotCount: number;
  hexArr: string[];
  setHexArr: React.Dispatch<React.SetStateAction<string[]>>;
  undoStack: React.MutableRefObject<PaintChange[][]>;
  redoStack: React.MutableRefObject<PaintChange[][]>;
  workingColor: ColorData | null;
}> = ({ rowLength, rows, dotCount, hexArr, setHexArr, undoStack, redoStack, workingColor }) => {
  const isDragging = useRef(false);
  const touchedCircle = useRef<number | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const beadIds = Array.from({ length: dotCount }, (_, i) => i + 0);

  const rad = 14.048;
  const startY = 52;
  const startX = 130;

  const currentStroke = useRef<PaintChange[]>([]);
  const visitedInStroke = useRef<Set<number>>(new Set());

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
    isDragging.current = true;

    currentStroke.current = [];
    visitedInStroke.current.clear();
    redoStack.current = [];

    startPos.current = { x: e.clientX, y: e.clientY };
    touchedCircle.current = id;

    paintCircle(id);
  };

  const handleMouseUp = () => {
    const id = touchedCircle.current;

    undoStack.current.push(currentStroke.current);

    isDragging.current = false;
    touchedCircle.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
  };

  const handleMouseEnter = (id: number) => {
    if (isDragging.current) {
      paintCircle(id);
    }
  };

  function paintCircle(id: number) {
    if (visitedInStroke.current.has(id)) return;

    visitedInStroke.current.add(id);

    const activeHex = workingColor?.hexValue ?? "";

    const prevColor = hexArr[id];

    if (prevColor === activeHex) return;

    const newColor = activeHex;

    currentStroke.current.push({
      id,
      prevColor,
      newColor,
    });

    setHexArr((prev) => {
      const next = [...prev];
      next[id] = activeHex;
      return next;
    });
  }

  return (
    <>
      <svg
        width={800}
        height={500}
        className="canvas"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: "crosshair", background: "#AAA" }}
      >
        {beadIds.map((id) => (
          <React.Fragment key={id}>
            <circle
              cx={(getPosFromI(id) * 2 * rad + getStartX(id)).toFixed(2)}
              cy={(getRowFromI(id) * 2 * sin60(rad) + startY).toFixed(2)}
              r={rad.toFixed(2)}
              fill={hexArr[id]}
              onMouseDown={(e) => handleMouseDown(e, id)}
              onMouseEnter={() => handleMouseEnter(id)}
            />
          </React.Fragment>
        ))}
      </svg>
    </>
  );
};

export default BeadCanvas;
