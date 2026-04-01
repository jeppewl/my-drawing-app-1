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
  interface DebugPointer {
    x: number;
    y: number;
    id: number;
  }

  // sæt state med type
  const [debugPointers, setDebugPointers] = useState<DebugPointer[]>([]);
  const activePointers = useRef(new Map());
  const updateDebugPointers = () => {
    const arr = Array.from(activePointers.current.values()).map((p) => ({
      x: p.clientX,
      y: p.clientY,
      id: p.pointerId,
    }));
    setDebugPointers(arr);
  };
  // -------
  const modeRef = useRef<"idle" | "draw" | "pan">("idle");

  const resolveMode = (e?: PointerEvent) => {
    const count = activePointers.current.size;

    // 🖱️ MOUSE
    if (e?.pointerType === "mouse") {
      if (e.buttons === 2) return "pan"; // højreklik
      if (e.buttons === 1) return "draw"; // venstreklik
    }

    // 📱 TOUCH
    if (count === 1) return "draw";
    if (count === 2) return "pan";

    return "idle";
  };

  const updateMode = () => {
    const nextMode = resolveMode();
    const prevMode = modeRef.current;

    if (nextMode === prevMode) return;

    // cleanup gammel mode
    if (prevMode === "draw") endStroke();
    if (prevMode === "pan") endPan?.();

    // start ny mode
    if (nextMode === "draw") startStroke();
    if (nextMode === "pan") startPan?.();

    modeRef.current = nextMode;
  };
  // ---
  const pointers = [...activePointers.current.values()];
  const midX = pointers.reduce((sum, p) => sum + p.clientX, 0) / pointers.length;
  const midY = pointers.reduce((sum, p) => sum + p.clientY, 0) / pointers.length;
  const lastPanPos = useRef<{ x: number; y: number } | null>(null);
  // ---
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

  const [pickedId, setPickedId] = useState<number | null>(null);

  const [viewBox, setViewBox] = useState([0, 0, 800, 500]);

  const isPainting = useRef(false);

  const rowAndPos = useRef<{ row: number; pos: number } | null>(null);

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

  const handlePointerDownCommon = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, e);
    // e.currentTarget.setPointerCapture(e.pointerId);
    (e.target as Element).closest("svg")?.setPointerCapture(e.pointerId);

    startPos.current = { x: e.clientX, y: e.clientY };

    const count = activePointers.current.size;

    if (e.pointerType === "touch") {
      if (count === 1) {
        modeRef.current = "draw";
        // startStroke();
      }

      if (count === 2) {
        if (modeRef.current === "draw") endStroke();
        modeRef.current = "pan";
      }
    }

    if (e.pointerType === "mouse") {
      if (e.button === 0) {
        modeRef.current = "draw";
        // startStroke();
      }

      if (e.button === 2) {
        modeRef.current = "pan";
      }
    }
  };

  const handlePointerDownSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    handlePointerDownCommon(e);
  };

  const handlePointerDownCircle = (e: React.PointerEvent<SVGCircleElement>, id: number) => {
    handlePointerDownCommon(e);

    // 🆕 kun registrér til evt. tap
    if (e.pointerType === "touch") {
      touchedCircle.current = id;
    }

    // faktisk skal vi slet ikke tjekke for pointerType
    if (e.pointerType === "mouse") {
      touchedCircle.current = id;
    }

    // ❌ ingen painting her
  };

  // const handlePointerDownCircle = (e: React.PointerEvent<SVGCircleElement>, id: number) => {
  //   e.stopPropagation(); // 👈 vigtigt!
  //   //---
  //   activePointers.current.set(e.pointerId, e);
  //   e.currentTarget.setPointerCapture(e.pointerId); // bevar
  //   updateDebugPointers();
  //   //---

  //   isPointerDown.current = true;
  //   startPos.current = { x: e.clientX, y: e.clientY };

  //   if (e.pointerType === "mouse") {
  //     // 👇 venstreklik = paint mode
  //     if (e.button === 0) {
  //       if (isPicking) {
  //         pickColor(id);
  //         return; // 👈 vigtigt!
  //       } else {
  //         isPainting.current = true;
  //         startStroke();
  //         paintCircle(id);
  //       }
  //     }

  //     // 👇 højreklik = pan mode
  //     if (e.button === 2) {
  //       isDraggingRef.current = true;
  //       setIsDragging(true);
  //     }
  //   }

  //   // 📱 TOUCH
  //   if (e.pointerType === "touch") {
  //     // start som "maybe tap"
  //     isDraggingRef.current = false;
  //     setIsDragging(false);
  //     touchedCircle.current = id;
  //   }
  // };

  // const handlePointerDownSvg = (e: React.PointerEvent<SVGSVGElement>) => {
  //   //---
  //   activePointers.current.set(e.pointerId, e);
  //   e.currentTarget.setPointerCapture(e.pointerId); // bevar
  //   updateDebugPointers();
  //   //---
  //   isPointerDown.current = true;
  //   startPos.current = { x: e.clientX, y: e.clientY };

  //   const count = activePointers.current.size;

  //   if (e.pointerType === "mouse") {
  //     if (e.button === 0) {
  //       modeRef.current = "draw";
  //       startStroke();
  //     }

  //     if (e.button === 2) {
  //       modeRef.current = "pan";
  //     }
  //   }

  //   if (e.pointerType === "touch") {
  //     if (count === 1) {
  //       modeRef.current = "draw";
  //       startStroke();
  //     }

  //     if (count === 2) {
  //       modeRef.current = "pan";
  //     }
  //   }

  //   // // 🖱️ højreklik → pan
  //   // if (e.pointerType === "mouse" && e.button === 2) {
  //   //   isDraggingRef.current = true;
  //   //   setIsDragging(true);
  //   // }

  //   // // 📱 touch → mulig pan
  //   // if (e.pointerType === "touch") {
  //   //   isDraggingRef.current = false;
  //   //   setIsDragging(false);
  //   // }
  // };

  const DRAG_THRESHOLD = 5;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activePointers.current.has(e.pointerId)) return;

    activePointers.current.set(e.pointerId, e);
    updateDebugPointers();
    //---
    // if (!startPos.current) return;

    // const dx = e.clientX - startPos.current.x;
    // const dy = e.clientY - startPos.current.y;

    // 🆕 brug mode
    const mode = modeRef.current;

    // 🖱️ DESKTOP FIX
    if (e.pointerType === "mouse") {
      if (e.buttons === 1) {
        // venstreklik holdt nede
        if (modeRef.current !== "draw") {
          modeRef.current = "draw";
          startStroke();
        }
      } else if (e.buttons === 2) {
        // højreklik holdt nede
        modeRef.current = "pan";
      } else {
        // ingen knapper → idle
        if (modeRef.current === "draw") {
          endStroke();
        }
        modeRef.current = "idle";
      }
    }

    // ✏️ DRAW
    if (mode === "draw") {
      const p = [...activePointers.current.values()][0];

      const el = document.elementFromPoint(p.clientX, p.clientY);

      if (el?.tagName === "circle") {
        const id = Number(el.getAttribute("data-id"));

        if (!isPainting.current) {
          startStroke(); // 👈 lazy start, eneste sted
          isPainting.current = true;
        }
        paintCircle(id);
      }
    }

    // ✋ PAN
    if (mode === "pan") {
      const pointers = [...activePointers.current.values()];

      const midX = pointers.reduce((sum, p) => sum + p.clientX, 0) / pointers.length;
      const midY = pointers.reduce((sum, p) => sum + p.clientY, 0) / pointers.length;

      if (lastPanPos.current) {
        const dx = midX - lastPanPos.current.x;
        const dy = midY - lastPanPos.current.y;

        panBy(dx, dy);
      }

      lastPanPos.current = { x: midX, y: midY };
      // // midlertidigt: genbrug din gamle dx/dy
      // if (!startPos.current) return;
      // const dx = e.clientX - startPos.current.x;
      // const dy = e.clientY - startPos.current.y;
      // panBy(dx, dy);
      // startPos.current = { x: e.clientX, y: e.clientY };
    }

    // 📱 TOUCH → detect drag = pan
    // if (e.pointerType === "touch") {
    //   const distSq = dx * dx + dy * dy;

    //   if (!isDraggingRef.current && distSq > DRAG_THRESHOLD * DRAG_THRESHOLD) {
    //     isDraggingRef.current = true;
    //     setIsDragging(true);

    //     touchedCircle.current = null; // ❌ det var ikke et tap
    //   }

    //   if (isDraggingRef.current) {
    //     panBy(dx, dy);
    //   }
    // }

    // 🖱️ MOUSE PAINT
    // if (isPainting.current) {
    //   const el = document.elementFromPoint(e.clientX, e.clientY);

    //   if (el?.tagName === "circle") {
    //     const id = Number(el.getAttribute("data-id"));
    //     if (!isNaN(id)) paintCircle(id);
    //   }
    // }

    // 🖱️ MOUSE PAN
    // if (isDraggingRef.current && e.pointerType === "mouse") {
    //   panBy(dx, dy);
    // }

    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    activePointers.current.delete(e.pointerId);
    updateDebugPointers();
    //----

    // 🆕 TAP fallback (meget vigtig)
    if (modeRef.current === "draw") {
      if (!isPainting.current && touchedCircle.current !== null) {
        startStroke();
        paintCircle(touchedCircle.current);
        endStroke();
      } else if (isPainting.current) {
        endStroke();
      }
    }

    // reset
    isPainting.current = false;
    touchedCircle.current = null;

    if (modeRef.current === "pan") {
      lastPanPos.current = null;
    }

    modeRef.current = "idle";
    startPos.current = null;

    // // 📱 TAP → pick eller paint
    // if (!isDraggingRef.current && touchedCircle.current !== null) {
    //   const id = touchedCircle.current;

    //   if (isPicking) {
    //     const picked = colorArr[id];
    //     if (picked) {
    //       pickColor(id);
    //     }
    //   } else {
    //     startStroke();
    //     paintCircle(id);
    //     endStroke();
    //   }
    // } else if (isPainting.current) {
    //   // 🖱️ paint afslut
    //   endStroke();
    // }

    // isPainting.current = false;
    // isDraggingRef.current = false;
    // setIsDragging(false);
    // isPointerDown.current = false;
    // touchedCircle.current = null;
    // startPos.current = null;

    // e.currentTarget.releasePointerCapture(e.pointerId);
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

  // funktionalitet fælles for handlePointerDownCircle-mouse-0 og handlePointerUp-not-drag
  function pickColor(id: number) {
    const picked = colorArr[id];
    if (!picked) return;

    setWorkingColor(picked);
    setIsPicking(false);
    setPickedId(id); // 🔥 trigger visual cue

    setTimeout(() => setPickedId(null), 200);

    rowAndPos.current = { row: getRowFromI(id), pos: getPosFromI(id) };
  }

  function panBy(dx: number, dy: number) {
    setViewBox(([x, y, w, h]) => {
      let newX = x - dx;
      let newY = y - dy;

      const maxX = contentWidth - w;
      const maxY = contentHeight - h;

      return [Math.max(0, Math.min(newX, maxX)), Math.max(0, Math.min(newY, maxY)), w, h];
    });
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
    <div className="canvas-wrapper">
      <svg
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerDown={handlePointerDownSvg}
        className="canvas-svg"
        style={{
          cursor: myCursor,
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
            {pickedId === id && (
              <circle
                cx={(getPosFromI(id) * 2 * rad + getStartX(id)).toFixed(2)}
                cy={(getRowFromI(id) * 2 * sin60(rad) + startY).toFixed(2)}
                r={(rad * 1.2).toFixed(2)}
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.9"
              />
            )}
          </React.Fragment>
        ))}
      </svg>
      <div className="debug-layer">
        {debugPointers.map((p) => (
          <div
            key={p.id}
            className="debug-dot"
            style={{
              left: p.x,
              top: p.y,
            }}
          />
        ))}
      </div>
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
        Hej {rowAndPos.current?.row} {rowAndPos.current?.pos}
      </div>
    </div>
  );
};

export default BeadCanvas;
