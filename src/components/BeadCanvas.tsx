import React, { useRef, useState } from "react";
import { mapToHueGradient, sin60 } from "../utils/colorUtils";
import { PaintChange } from "../types/paintchange";
import "../styles.css";
import { ColorData } from "../types/colordata";

const BeadCanvas: React.FC<{
  rowLength: number;
  rows: number;
  dotCount: number;
  colorArr: ColorData[];
  setColorArr: React.Dispatch<React.SetStateAction<ColorData[]>>;
  undoStack: React.RefObject<PaintChange[][]>;
  redoStack: React.RefObject<PaintChange[][]>;
  workingColor: ColorData | null;
  setWorkingColor: React.Dispatch<React.SetStateAction<ColorData | null>>;
  isPicking: boolean;
  setIsPicking: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  rowLength,
  rows,
  dotCount,
  colorArr,
  setColorArr,
  undoStack,
  redoStack,
  workingColor,
  setWorkingColor,
  isPicking,
  setIsPicking,
}) => {
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const isPointerDown = useRef(false);
  const touchedCircle = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const beadIds = Array.from({ length: dotCount }, (_, i) => i + 0);

  const rad = 28.048;
  const startY = 50;
  const startX = 50;

  const contentWidth = rowLength * 2 * rad + 100;
  const contentHeight = rows * 2 * sin60(rad) + 100;
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

  const handlePointerDownCircle = (e: React.PointerEvent<SVGCircleElement>, id: number) => {
    e.stopPropagation(); // 👈 vigtigt!
    e.currentTarget.setPointerCapture(e.pointerId);

    isPointerDown.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };

    if (e.pointerType === "mouse") {
      // 👇 venstreklik = paint mode
      if (e.button === 0) {
        if (isPicking) {
          const picked = colorArr[id];
          if (!picked) return;

          setWorkingColor(picked);
          setIsPicking(false);
          return; // 👈 vigtigt!
        } else {
          isPainting.current = true;
          startStroke();
          paintCircle(id);
        }
      }

      // 👇 højreklik = pan mode
      if (e.button === 2) {
        isDraggingRef.current = true;
        setIsDragging(true);
      }
    }

    // 📱 TOUCH
    if (e.pointerType === "touch") {
      // start som "maybe tap"
      isDraggingRef.current = false;
      setIsDragging(false);
      touchedCircle.current = id;
    }
  };

  const handlePointerDownSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    isPointerDown.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };

    // 🖱️ højreklik → pan
    if (e.pointerType === "mouse" && e.button === 2) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }

    // 📱 touch → mulig pan
    if (e.pointerType === "touch") {
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  };

  const DRAG_THRESHOLD = 5;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!startPos.current) return;

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;

    // 📱 TOUCH → detect drag = pan
    if (e.pointerType === "touch") {
      const distSq = dx * dx + dy * dy;

      if (!isDraggingRef.current && distSq > DRAG_THRESHOLD * DRAG_THRESHOLD) {
        isDraggingRef.current = true;
        setIsDragging(true);

        touchedCircle.current = null; // ❌ det var ikke et tap
      }

      if (isDraggingRef.current) {
        setViewBox(([x, y, w, h]) => {
          let newX = x - dx;
          let newY = y - dy;

          const maxX = contentWidth - w;
          const maxY = contentHeight - h;

          newX = Math.max(0, Math.min(newX, maxX));
          newY = Math.max(0, Math.min(newY, maxY));

          return [newX, newY, w, h];
        });
      }
    }

    // 🖱️ MOUSE PAINT
    if (isPainting.current) {
      const el = document.elementFromPoint(e.clientX, e.clientY);

      if (el?.tagName === "circle") {
        const id = Number(el.getAttribute("data-id"));
        if (!isNaN(id)) paintCircle(id);
      }
    }

    // 🖱️ MOUSE PAN
    if (isDraggingRef.current && e.pointerType === "mouse") {
      setViewBox(([x, y, w, h]) => {
        let newX = x - dx;
        let newY = y - dy;

        const maxX = contentWidth - w;
        const maxY = contentHeight - h;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        return [newX, newY, w, h];
      });
    }

    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    // 📱 TAP → pick eller paint
    if (!isDraggingRef.current && touchedCircle.current !== null) {
      const id = touchedCircle.current;

      if (isPicking) {
        const picked = colorArr[id];
        if (picked) {
          setWorkingColor(picked);
          setIsPicking(false);
        }
      } else {
        startStroke();
        paintCircle(id);
        endStroke();
      }
    }
    // 🖱️ paint afslut
    if (isPainting.current) {
      endStroke();
    }

    isPainting.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
    isPointerDown.current = false;
    touchedCircle.current = null;
    startPos.current = null;

    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlePointerEnter = (e: React.PointerEvent<SVGCircleElement>, id: number) => {
    if (e.pointerType === "mouse" && isPointerDown.current && !isDraggingRef.current) {
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
    if (!workingColor) return;
    if (visitedInStroke.current.has(id)) return;

    visitedInStroke.current.add(id);

    const prevColor = colorArr[id];

    if (prevColor === workingColor) return;

    const newColor = workingColor;

    currentStroke.current.push({
      id,
      prevColor,
      newColor,
    });

    setColorArr((prev) => {
      const next = [...prev];
      next[id] = workingColor;
      return next;
    });
  }

  const myCursor = isDragging ? "grabbing" : isPicking ? "pointer" : "crosshair";

  return (
    <div style={{ position: "relative", width: 800 }}>
      <svg
        width={800}
        height={500}
        className="canvas"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerDown={handlePointerDownSvg}
        style={{
          cursor: myCursor,
          background: "#AAA",
          touchAction: "none",
          display: "block",
          position: "relative",
        }}
        onContextMenu={(e) => e.preventDefault()}
        viewBox={viewBox.join(" ")}
        onWheel={handleWheel}
      >
        {beadIds.map((id) => (
          <React.Fragment key={id}>
            <circle
              data-id={id}
              cx={(getPosFromI(id) * 2 * rad + getStartX(id)).toFixed(2)}
              cy={(getRowFromI(id) * 2 * sin60(rad) + startY).toFixed(2)}
              r={rad.toFixed(2)}
              fill={colorArr[id].hexValue}
              onPointerDown={(e) => handlePointerDownCircle(e, id)}
              onPointerEnter={(e) => handlePointerEnter(e, id)}
            />
          </React.Fragment>
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          background: "rgba(0, 0, 0, 0.363)",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 12,
          pointerEvents: "none",
        }}
      >
        Hej
      </div>
      <div
        onPointerUp={(e) => {
          e.pointerId;
        }}
      ></div>
    </div>
  );
};

export default BeadCanvas;
