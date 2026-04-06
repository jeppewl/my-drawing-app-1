import React, { useMemo, useRef, useState } from "react";
import { sin60 } from "../utils/colorUtils";
import { PaintChange } from "../types/paintchange";
import "../styles.css";
import { ColorData } from "../types/colordata";
import { CircleHitbox, DebugPointer, DrawPoint, MoveStep, TestRect } from "../types/draw-related";
import { Mode } from "../types/mode";

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
  mode: Mode;
  modeRef: React.RefObject<Mode>;
  setModeSafe: (m: Mode) => void;
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
  mode,
  modeRef,
  setModeSafe,
}) => {
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

  const lastPanPos = useRef<{ x: number; y: number } | null>(null);
  const touchedCircle = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const beadIds = useMemo(() => {
    console.log("useMemo for beadIds");
    return Array.from({ length: dotCount }, (_, i) => i);
  }, [dotCount]);

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

  const circleHitboxes = useMemo(() => {
    console.log("useMemo på circleHitboxes");
    return beadIds.map((id) => {
      const cx = getPosFromI(id) * 2 * rad + getStartX(id);
      const cy = getRowFromI(id) * 2 * sin60(rad) + startY;
      return {
        id,
        cx,
        cy,
        r: rad,
        minX: cx - rad,
        maxX: cx + rad,
        minY: cy - rad,
        maxY: cy + rad,
      };
    });
  }, [beadIds, rad, startX, startY, rowLength]);

  const latestMoveStepRef = useRef<MoveStep | null>(null);

  const step = latestMoveStepRef.current;

  const myTestBox = step ? rectFromSegment(step) : null;
  const candidates = step ? getCirclesInBox(rectFromSegment(step), circleHitboxes) : [];

  const drawPoints = useRef<DrawPoint[]>([]); // opsamle drawpoints til udvikling

  // kan forbinde
  const pathData = drawPoints.current
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // der skal laves en ref til koord-korrektion
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handlePointerDownCommon = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, e);
    (e.target as Element).closest("svg")?.setPointerCapture(e.pointerId);

    startPos.current = { x: e.clientX, y: e.clientY };

    const count = activePointers.current.size;

    if (e.pointerType === "touch") {
      if (count === 1 && modeRef.current !== "pick") {
        setModeSafe("draw"); // brug setModeSafe for UI + ref
        const { x, y } = clientToSvg(e.clientX, e.clientY);
        drawPoints.current = [{ x, y }];
        isPainting.current = false;
      }

      if (count === 2) {
        if (modeRef.current === "draw") endStroke();
        setModeSafe("pan");
        isPainting.current = false;
      }
    }

    if (e.pointerType === "mouse") {
      if (e.button === 0 && modeRef.current !== "pick") {
        setModeSafe("draw");
        // 👇 første punkt (SVG coords)
        const { x, y } = clientToSvg(e.clientX, e.clientY);

        drawPoints.current = [{ x, y }];
        isPainting.current = false;
      }

      if (e.button === 2) {
        setModeSafe("pan");
        isPainting.current = false;
      }
    }
  };

  const handlePointerDownSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    handlePointerDownCommon(e);
  };

  const handlePointerDownCircle = (e: React.PointerEvent<SVGCircleElement>, id: number) => {
    handlePointerDownCommon(e);

    // 👇 NYT: pick mode
    if (modeRef.current === "pick") {
      pickColor(id);
      return;
    }

    // 🆕 kun registrér til evt. tap
    touchedCircle.current = id;
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activePointers.current.has(e.pointerId)) return;

    activePointers.current.set(e.pointerId, e);
    updateDebugPointers();

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
        setModeSafe("pan");
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

      const { x, y } = clientToSvg(p.clientX, p.clientY);

      drawPoints.current.push({ x, y });

      //--- movestep logik
      if (drawPoints.current.length >= 2) {
        const n = drawPoints.current.length;
        const p1 = drawPoints.current[n - 2];
        const p2 = drawPoints.current[n - 1];

        latestMoveStepRef.current = {
          p1x: p1.x,
          p1y: p1.y,
          p2x: p2.x,
          p2y: p2.y,
        };
      }

      // --- sted at indsætte collision logik
      const step = latestMoveStepRef.current;

      if (step) {
        const candidates = getCirclesInBox(rectFromSegment(step), circleHitboxes);

        const hits: number[] = [];

        candidates.forEach((id) => {
          const circle = circleHitboxes[id];

          if (segmentIntersectsCircle(step, circle)) {
            hits.push(id);
          }
        });

        if (hits.length === 0) return; // nu skal vi muligvis picke

        // 👇 MODE SWITCH
        if (modeRef.current === "pick") {
          return; // 👈 gør ingenting i move
        }

        if (modeRef.current === "draw") {
          if (!isPainting.current) {
            startStroke();
            isPainting.current = true;
          }

          hits.forEach(paintCircle);
        }
      }

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
    }

    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    activePointers.current.delete(e.pointerId);
    updateDebugPointers();

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
    setModeSafe("idle"); // 👈 opdater både ref + state
    startPos.current = null;
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
  }

  function endStroke() {
    if (currentStroke.current.length === 0) return;

    undoStack.current.push([...currentStroke.current]);

    redoStack.current = []; // ✅ her i stedet
  }

  function clientToSvg(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;

    const transformed = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    return {
      x: transformed.x,
      y: transformed.y,
    };
  }

  function getCirclesInBox(testBox: TestRect, hitboxes: CircleHitbox[]) {
    const result = [];

    const testMinX = testBox.left;
    const testMaxX = testBox.left + testBox.width;
    const testMinY = testBox.top;
    const testMaxY = testBox.top + testBox.height;

    for (const c of hitboxes) {
      // ❌ ingen overlap → skip
      if (c.maxX < testMinX || c.minX > testMaxX || c.maxY < testMinY || c.minY > testMaxY) {
        continue;
      }

      // ✅ overlap → kandidat
      result.push(c.id);
    }

    return result;
  }

  function rectFromSegment(step: MoveStep): TestRect {
    const minX = Math.min(step.p1x, step.p2x);
    const maxX = Math.max(step.p1x, step.p2x);
    const minY = Math.min(step.p1y, step.p2y);
    const maxY = Math.max(step.p1y, step.p2y);

    return {
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  // funktion til hit detection af candidates
  function segmentIntersectsCircle(moveStep: MoveStep, circle: CircleHitbox) {
    const { p1x, p1y, p2x, p2y } = moveStep;
    const { cx, cy, r } = circle;

    const dx = p2x - p1x;
    const dy = p2y - p1y;

    const lengthSquared = dx * dx + dy * dy;

    // Hvis segmentet er et punkt
    if (lengthSquared === 0) {
      const distSq = (cx - p1x) ** 2 + (cy - p1y) ** 2;
      return distSq <= r * r;
    }

    // Projektion (t mellem 0 og 1)
    let t = ((cx - p1x) * dx + (cy - p1y) * dy) / lengthSquared;

    // Clamp til segment
    t = Math.max(0, Math.min(1, t));

    // Nærmeste punkt på segmentet
    const closestX = p1x + t * dx;
    const closestY = p1y + t * dy;

    // Afstand til cirkel center
    const distSq = (cx - closestX) ** 2 + (cy - closestY) ** 2;

    return distSq <= r * r;
  }

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

  function pickColor(id: number) {
    console.log("kalder pickColor, id:", id);
    const picked = colorArr[id];
    if (!picked) return;

    setWorkingColor(picked);
    setPickedId(id);

    setModeSafe("idle"); // 👈 BRUG DENNE (ikke modeRef)

    setTimeout(() => setPickedId(null), 200);

    rowAndPos.current = {
      row: getRowFromI(id),
      pos: getPosFromI(id),
    };
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

  const myCursor = mode === "pan" ? "grabbing" : mode === "pick" ? "pointer" : "crosshair";

  return (
    <div className="canvas-wrapper">
      <svg
        ref={svgRef}
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
        {candidates.map((id) => (
          <rect
            key={id}
            x={circleHitboxes[id].minX}
            y={circleHitboxes[id].minY}
            width={circleHitboxes[id].r * 2}
            height={circleHitboxes[id].r * 2}
            fill="#2188fd39"
            pointerEvents="none" // 👈 KEY
          />
        ))}
        {myTestBox && (
          <rect
            x={myTestBox.left}
            y={myTestBox.top}
            width={myTestBox.width}
            height={myTestBox.height}
            fill="#fa2c2c3e"
            pointerEvents="none"
          />
        )}
        {drawPoints.current.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2} fill="red" pointerEvents="none" />
        ))}
        <path d={pathData} fill="none" stroke="#ff55e384" strokeWidth={2} pointerEvents="none" />
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
