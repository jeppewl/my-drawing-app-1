import React, { useRef, useState } from "react";
import { mapToHueGradient, sin60 } from "../utils/colorUtils";

const BeadCanvas: React.FC = () => {
  const isDragging = useRef(false);
  const touchedCircle = useRef<number | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const rowLength = 12;
  const rows = 18;
  const dotCount = rowLength * rows;
  const beadIds = Array.from({ length: dotCount }, (_, i) => i + 0);

  const [hexArr, setHexArr] = useState(() => {
    const arr = Array.from({ length: dotCount }, (_, i) =>
      mapToHueGradient(i * (100 / dotCount), 0, 100),
    );

    return arr;
  });

  const rad = 14.048;
  const startY = 52;
  const startX = 130;

  const undoStack = useRef<PaintChange[][]>([]);
  const redoStack = useRef<PaintChange[][]>([]);
  const currentStroke = useRef<PaintChange[]>([]);
  const visitedInStroke = useRef<Set<number>>(new Set());

  type PaintChange = {
    id: number;
    prevColor: string;
    newColor: string;
  };

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

    const prevColor = hexArr[id];

    if (prevColor === "#BBBBBB") return;

    const newColor = "#BBBBBB";

    currentStroke.current.push({
      id,
      prevColor,
      newColor,
    });

    setHexArr((prev) => {
      const next = [...prev];
      next[id] = "#BBBBBB";
      return next;
    });
  }

  const handleUndo = (e: React.MouseEvent) => {
    const stroke = undoStack.current.pop();
    if (!stroke) return;

    redoStack.current.push(stroke);

    setHexArr((prev) => {
      const next = [...prev];

      stroke.forEach((change) => {
        next[change.id] = change.prevColor;
      });

      return next;
    });
  };

  const handleRedo = (e: React.MouseEvent) => {
    const stroke = redoStack.current.pop();
    if (!stroke) return;

    undoStack.current.push(stroke);

    setHexArr((prev) => {
      const next = [...prev];

      stroke.forEach((change) => {
        next[change.id] = change.newColor;
      });

      return next;
    });
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
              onMouseEnter={(e) => handleMouseEnter(id)}
            />
          </React.Fragment>
        ))}
      </svg>
      <div>
        <button onClick={(e) => handleUndo(e)}>Undo</button>
        <button onClick={(e) => handleRedo(e)}>Redo</button>
      </div>
    </>
  );
};

export default BeadCanvas;
