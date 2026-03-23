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
  const isPointerDown = useRef(false);
  const touchedCircle = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const beadIds = Array.from({ length: dotCount }, (_, i) => i + 0);

  const rad = 28.048;
  const startY = 50;
  const startX = 50;

  const contentWidth = rowLength * 2 * rad + 100; // antal kolonner * diameter
  const contentHeight = rows * 2 * sin60(rad) + 100; // antal rækker * højden på hex

  const currentStroke = useRef<PaintChange[]>([]);
  const visitedInStroke = useRef<Set<number>>(new Set());

  const [viewBox, setViewBox] = useState([0, 0, 800, 500]);

  const isPainting = useRef(false);

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

  const handlePointerDown = (e: React.PointerEvent<SVGCircleElement>, id: number) => {
    // 👉 kun venstre klik på mouse
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // reset gesture state
    isDragging.current = false;
    isPointerDown.current = true;

    startPos.current = { x: e.clientX, y: e.clientY };
    touchedCircle.current = id;

    // 👇 vi starter IKKE stroke endnu!
    // det sker først når vi ved det er paint

    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    // TAP = paint
    if (!isDragging.current && touchedCircle.current !== null) {
      startStroke();
      paintCircle(touchedCircle.current);
      endStroke();
    }

    // Drag paint = afslut stroke
    else if (isPainting.current) {
      endStroke();
    }

    // reset
    isDragging.current = false;
    isPointerDown.current = false;
    touchedCircle.current = null;
    startPos.current = null;
    isPainting.current = false;
  };

  const DRAG_THRESHOLD = 5;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!startPos.current) return;

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 👉 detect drag
    if (!isDragging.current && dist > DRAG_THRESHOLD) {
      isDragging.current = true;
    }

    // 👉 PAN (kun hvis drag)
    if (isDragging.current) {
      setViewBox(([x, y, w, h]) => {
        let newX = x - dx;
        let newY = y - dy;

        const maxX = contentWidth - w;
        const maxY = contentHeight - h;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        return [newX, newY, w, h];
      });

      startPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerEnter = (e: React.PointerEvent<SVGCircleElement>, id: number) => {
    if (e.pointerType === "mouse" && isPointerDown.current && !isDragging.current) {
      console.log("handlePointerEnter");
      // start stroke hvis vi ikke allerede painter
      if (!isPainting.current) {
        startStroke();
        isPainting.current = true;
      }

      paintCircle(id);
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    const panSpeed = 1;

    setViewBox(([x, y, w, h]) => {
      let newX = x;
      let newY = y;

      if (e.shiftKey) {
        newX = x + e.deltaY * panSpeed;
      } else {
        newY = y + e.deltaY * panSpeed;
      }

      // clamp x/y til content bounds
      const maxX = contentWidth - w;
      const maxY = contentHeight - h;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      return [newX, newY, w, h];
    });
  };

  function startStroke() {
    currentStroke.current = [];
    visitedInStroke.current.clear();
    redoStack.current = [];
  }

  function endStroke() {
    if (currentStroke.current.length === 0) return;

    undoStack.current.push([...currentStroke.current]);
  }

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
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: "crosshair", background: "#AAA", touchAction: "none" }}
        onContextMenu={(e) => e.preventDefault()}
        viewBox={viewBox.join(" ")}
        onWheel={handleWheel}
      >
        {beadIds.map((id) => (
          <React.Fragment key={id}>
            <circle
              cx={(getPosFromI(id) * 2 * rad + getStartX(id)).toFixed(2)}
              cy={(getRowFromI(id) * 2 * sin60(rad) + startY).toFixed(2)}
              r={rad.toFixed(2)}
              fill={hexArr[id]}
              onPointerDown={(e) => handlePointerDown(e, id)}
              onPointerEnter={(e) => handlePointerEnter(e, id)}
            />
          </React.Fragment>
        ))}
      </svg>
    </>
  );
};

export default BeadCanvas;
