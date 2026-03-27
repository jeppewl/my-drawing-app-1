import React from "react";

const BeadToolbar: React.FC<{
  isPicking: boolean;
  togglePicking: () => void;
  handleUndo: (e: React.MouseEvent) => void;
  handleRedo: (e: React.MouseEvent) => void;
}> = ({ isPicking, togglePicking, handleUndo, handleRedo }) => {
  return (
    <div
      style={{
        boxSizing: "border-box",
        background: "rgb(105, 130, 134)",
        width: "1000px",
        height: "100px",
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        flexDirection: "row",
        padding: "5px",
        gap: "10px",
      }}
    >
      <button onClick={togglePicking} style={{ background: isPicking ? "hotpink" : "gray" }}>
        Picker
      </button>
      <button onClick={handleUndo}>Undo</button>
      <button onClick={handleRedo}>Redo</button>
    </div>
  );
};

export default BeadToolbar;
