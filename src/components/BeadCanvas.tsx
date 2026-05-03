import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const rad = 40.0;
  const startX = 50;
  const startY = 50;

  const contentWidth = rowLength * 2 * rad + 100;
  const contentHeight = rows * 2 * sin60(rad) + 100;

  const MIN_W = 100;
  const MIN_H = 100;

  const DRAW_THRESHOLD = 5; // px

  // useMemo
  const beadIds = useMemo(() => {
    console.log("useMemo for beadIds");
    return Array.from({ length: dotCount }, (_, i) => i);
  }, [dotCount]);

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

  // UI/state
  const [viewBox, setViewBox] = useState<[number, number, number, number]>([0, 0, 800, 500]);
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [debugPointers, setDebugPointers] = useState<DebugPointer[]>([]);

  // Gesture refs
  const activePointers = useRef(new Map());
  const pinchStart = useRef<{
    // til korrekt panning
    startDist: number;
    startViewBox: [number, number, number, number];
    startMid: { x: number; y: number };
  } | null>(null);
  const panStart = useRef<{
    startSvg: { x: number; y: number };
    startViewBox: [number, number, number, number];
  } | null>(null);

  // Drawing refs
  const currentStroke = useRef<PaintChange[]>([]);
  const visitedInStroke = useRef<Set<number>>(new Set());
  const drawPoints = useRef<DrawPoint[]>([]); // opsamle drawpoints til udvikling
  const isPainting = useRef(false);

  // Interaction refs
  const touchedCircle = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const rowAndPos = useRef<{ row: number; pos: number } | null>(null);

  // der skal laves en ref til koord-korrektion
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Derived runtime refs
  const latestMoveStepRef = useRef<MoveStep | null>(null);
  const viewBoxRef = useRef<[number, number, number, number]>(viewBox);

  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  // Computed values
  const step = latestMoveStepRef.current; // ikke forveksle med lokal step i move-handling
  const myTestBox = step ? rectFromSegment(step) : null;
  const candidates = step ? getCirclesInBox(rectFromSegment(step), circleHitboxes) : [];
  const pathData = drawPoints.current
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const updateDebugPointers = () => {
    const arr = Array.from(activePointers.current.values()).map((p) => ({
      x: p.clientX,
      y: p.clientY,
      id: p.pointerId,
    }));
    setDebugPointers(arr);
  };

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

        // måske nødvendigt til pinch korrekt
        panStart.current = null;
      }

      if (count === 2) {
        if (modeRef.current === "draw") endStroke();
        setModeSafe("pan");
        isPainting.current = false;

        const [p1, p2] = [...activePointers.current.values()];

        const midX = (p1.clientX + p2.clientX) / 2;
        const midY = (p1.clientY + p2.clientY) / 2;

        const dist = distance(p1, p2);

        const midSVG = clientToSvgWithViewBox(midX, midY, viewBoxRef.current);

        pinchStart.current = {
          startDist: dist,
          startViewBox: viewBoxRef.current,
          startMid: midSVG,
        };
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

        const { x, y } = clientToSvg(e.clientX, e.clientY);

        panStart.current = {
          startSvg: { x, y },
          startViewBox: viewBoxRef.current,
        };
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

    // Snapshot generelt en god ide
    const currentMode = modeRef.current;

    // ✏️ DRAW
    if (currentMode === "draw") {
      const p = [...activePointers.current.values()][0];

      if (!startPos.current) return; // 👈 tilføj denne

      // 👇 INDSÆT THRESHOLD CHECK HER
      const dx = p.clientX - startPos.current.x;
      const dy = p.clientY - startPos.current.y;
      const distSq = dx * dx + dy * dy;

      if (!isPainting.current && distSq < DRAW_THRESHOLD * DRAW_THRESHOLD) {
        return;
      }

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

        if (hits.length === 0) return;

        if (!isPainting.current) {
          startStroke();
          isPainting.current = true;
        }

        hits.forEach(paintCircle);
      }

      //TODO undersøge hvorvidt dette er nødvendigt
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

    if (currentMode === "pan") {
      const pointers = [...activePointers.current.values()];

      if (pointers.length === 1 && panStart.current) {
        // ✅ desktop eller enkeltfinger pan
        const p = pointers[0];
        const currentSvg = clientToSvgWithViewBox(
          p.clientX,
          p.clientY,
          panStart.current.startViewBox,
        );
        const dx = currentSvg.x - panStart.current.startSvg.x;
        const dy = currentSvg.y - panStart.current.startSvg.y;

        const [startX, startY, w, h] = panStart.current.startViewBox;
        setViewBox(clampViewBox(startX - dx, startY - dy, w, h));
      } else if (pointers.length >= 2 && pinchStart.current) {
        const midX = (pointers[0].clientX + pointers[1].clientX) / 2;
        const midY = (pointers[0].clientY + pointers[1].clientY) / 2;

        const dist = distance(pointers[0], pointers[1]);
        if (dist === 0) return;
        const scaleFactor = pinchStart.current.startDist / dist;

        // 🔹 ALT i start-space
        const midSVG = clientToSvgWithViewBox(midX, midY, pinchStart.current.startViewBox);
        const dx = midSVG.x - pinchStart.current.startMid.x;
        const dy = midSVG.y - pinchStart.current.startMid.y;

        const [startX, startY, startW, startH] = pinchStart.current.startViewBox;

        // 🔹 zoom
        const newW = startW * scaleFactor;
        const newH = startH * scaleFactor;

        // 🔹 pan + zoom kombineret korrekt
        const newX = startX + (pinchStart.current.startMid.x - startX) * (1 - scaleFactor) - dx;

        const newY = startY + (pinchStart.current.startMid.y - startY) * (1 - scaleFactor) - dy;

        setViewBox(clampViewBox(newX, newY, newW, newH));
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    activePointers.current.delete(e.pointerId);
    updateDebugPointers();

    if (activePointers.current.size < 2) {
      pinchStart.current = null;
    }
    if (activePointers.current.size === 0) panStart.current = null;

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

    setModeSafe("idle"); // 👈 opdater både ref + state
    startPos.current = null;
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    const zoomFactor = 1.05;
    const scale = e.deltaY < 0 ? 1 / zoomFactor : zoomFactor;

    const { x, y } = clientToSvg(e.clientX, e.clientY);

    zoomAt(x, y, scale);
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

  function distance(p1: PointerEvent, p2: PointerEvent) {
    const dx = p1.clientX - p2.clientX;
    const dy = p1.clientY - p2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function clientToSvgWithViewBox(
    clientX: number,
    clientY: number,
    viewBox: [number, number, number, number],
  ) {
    const rect = svgRef.current!.getBoundingClientRect();

    const [vbX, vbY, vbW, vbH] = viewBox;

    const x = vbX + ((clientX - rect.left) / rect.width) * vbW;
    const y = vbY + ((clientY - rect.top) / rect.height) * vbH;

    return { x, y };
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

  function clampViewBox(
    x: number,
    y: number,
    w: number,
    h: number,
  ): [number, number, number, number] {
    const clampedW = Math.max(MIN_W, Math.min(w, contentWidth));
    const clampedH = Math.max(MIN_H, Math.min(h, contentHeight));

    const maxX = contentWidth - clampedW;
    const maxY = contentHeight - clampedH;

    const clampedX = Math.max(0, Math.min(x, maxX));
    const clampedY = Math.max(0, Math.min(y, maxY));

    return [clampedX, clampedY, clampedW, clampedH] as const;
  }

  function panBy(dx: number, dy: number) {
    setViewBox(([x, y, w, h]) => {
      const newX = x - dx;
      const newY = y - dy;

      return clampViewBox(newX, newY, w, h);
    });
  }

  function zoomAt(svgX: number, svgY: number, scale: number) {
    setViewBox(([x, y, w, h]) => {
      let targetW = w * scale;
      let targetH = h * scale;

      // --- Clip til min/max
      targetW = Math.max(MIN_W, Math.min(targetW, contentWidth));
      targetH = Math.max(MIN_H, Math.min(targetH, contentHeight));

      // --- Check om vi rammer limit
      const atMinOrMax =
        (w <= MIN_W && targetW <= MIN_W) ||
        (w >= contentWidth && targetW >= contentWidth) ||
        (h <= MIN_H && targetH <= MIN_H) ||
        (h >= contentHeight && targetH >= contentHeight);

      if (atMinOrMax) {
        // STOP: ingen bevægelse overhovedet
        return [x, y, w, h];
      }

      const actualScaleX = targetW / w;
      const actualScaleY = targetH / h;

      const dx = svgX - x;
      const dy = svgY - y;

      const newX = svgX - dx * actualScaleX;
      const newY = svgY - dy * actualScaleY;

      return clampViewBox(newX, newY, targetW, targetH);
    });
  }

  // ---

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
        <circle cx={startX} cy={startY} r={100} fill="#32cfff60" />

        <rect
          x={startX}
          y={startY}
          width={contentWidth}
          height={contentHeight}
          fill="none"
          stroke="black"
          strokeDasharray="4,2"
          pointerEvents="none"
        />
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
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 50,
          background: "rgba(0, 0, 0, 0.363)",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 12,
          pointerEvents: "none",
        }}
      >
        ContentWidth/Height {contentWidth.toFixed(2)} {contentHeight.toFixed(2)}
      </div>
    </div>
  );
};

export default BeadCanvas;
