import React from "react";
import { ColorData } from "../types/colordata";
import "../styles.css";
import { Mode } from "../types/mode";

const BeadToolbar: React.FC<{
  workingColor: ColorData | null;
  handleUndo: (e: React.MouseEvent) => void;
  handleRedo: (e: React.MouseEvent) => void;
  mode: Mode;
  setModeSafe: (m: Mode) => void;
}> = ({ workingColor, handleUndo, handleRedo, mode, setModeSafe }) => {
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
      <button
        onClick={() => setModeSafe(mode === "pick" ? "idle" : "pick")}
        style={{ background: mode === "pick" ? "hotpink" : "gray" }}
      >
        Picker
      </button>
      <button onPointerUp={handleUndo}>Undo</button>
      <button onPointerUp={handleRedo}>Redo</button>
    </div>
  );
};

export default BeadToolbar;
