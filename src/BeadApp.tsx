import { useRef, useState } from "react";
import BeadCanvas from "./components/BeadCanvas";
import { mapToHueGradient } from "./utils/colorUtils";
import { PaintChange } from "./types/paintchange";
import BeadToolbar from "./components/BeadToolbar";

const BeadApp = () => {
  const rowLength = 12;
  const rows = 18;
  const dotCount = rowLength * rows;

  const [hexArr, setHexArr] = useState(() => {
    const arr = Array.from({ length: dotCount }, (_, i) =>
      mapToHueGradient(i * (100 / dotCount), 0, 100),
    );

    return arr;
  });

  const undoStack = useRef<PaintChange[][]>([]);
  const redoStack = useRef<PaintChange[][]>([]);

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
    <div className="app">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <BeadToolbar handleUndo={handleUndo} handleRedo={handleRedo} />
        <BeadCanvas
          rowLength={rowLength}
          rows={rows}
          dotCount={dotCount}
          hexArr={hexArr}
          setHexArr={setHexArr}
          undoStack={undoStack}
          redoStack={redoStack}
        />
      </div>
    </div>
  );
};

export default BeadApp;
