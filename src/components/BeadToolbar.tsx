import React from "react";
import { ColorData } from "../types/colordata";
import "../styles.css";

const BeadToolbar: React.FC<{
  workingColor: ColorData | null;
  isPicking: boolean;
  togglePicking: () => void;
  handleUndo: (e: React.MouseEvent) => void;
  handleRedo: (e: React.MouseEvent) => void;
}> = ({ workingColor, isPicking, togglePicking, handleUndo, handleRedo }) => {
  return (
    <div className="toolbar">
      <div
        style={{
          height: "20px",
          width: "30px",
          borderRadius: "5px",
          background: workingColor?.hexValue,
        }}
      ></div>
      <button onClick={togglePicking} style={{ background: isPicking ? "hotpink" : "gray" }}>
        Picker
      </button>
      <button onPointerUp={handleUndo}>Undo</button>
      <button onPointerUp={handleRedo}>Redo</button>
    </div>
  );
};

export default BeadToolbar;
