import { useRef, useState } from "react";
import BeadCanvas from "./components/BeadCanvas";
import { mapToHueGradient } from "./utils/colorUtils";
import { PaintChange } from "./types/paintchange";
import BeadToolbar from "./components/BeadToolbar";
import PalettePanel from "./components/PalettePanel";
import { ColorData } from "./types/colordata";
import paletteData from "./data/palette-hama-IMG_3973.json";

const BeadApp = () => {
  const rowLength = 18;
  const rows = 16;
  const dotCount = rowLength * rows;

  const beadColors: ColorData[] = paletteData.colors;

  const [workingColor, setWorkingColor] = useState<ColorData | null>(beadColors[0] ?? null);

  const [colorArr, setColorArr] = useState<ColorData[]>(() => {
    const firstColor = beadColors[0];

    if (!firstColor) return [];

    return Array.from({ length: dotCount }, () => firstColor);
  });

  const undoStack = useRef<PaintChange[][]>([]);
  const redoStack = useRef<PaintChange[][]>([]);

  const handleUndo = (e: React.MouseEvent) => {
    const stroke = undoStack.current.pop();
    if (!stroke) return;

    redoStack.current.push(stroke);

    setColorArr((prev) => {
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

    setColorArr((prev) => {
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
        <div style={{ display: "flex", flexDirection: "row" }}>
          <BeadCanvas
            rowLength={rowLength}
            rows={rows}
            dotCount={dotCount}
            colorArr={colorArr}
            setColorArr={setColorArr}
            undoStack={undoStack}
            redoStack={redoStack}
            workingColor={workingColor}
          />
          <div
            style={{
              boxSizing: "border-box",
              background: "#d4d492",
              width: "200px",
              height: "500px",
              padding: "10px",
            }}
          >
            <PalettePanel
              beadColors={beadColors}
              workingColor={workingColor}
              setWorkingColor={setWorkingColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeadApp;
