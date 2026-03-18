import React from "react";

const BeadToolbar: React.FC<{
  handleUndo: (e: React.MouseEvent) => void;
  handleRedo: (e: React.MouseEvent) => void;
}> = ({ handleUndo, handleRedo }) => {
  return (
    <div
      style={{
        boxSizing: "border-box",
        background: "#f88",
        width: "800px",
        justifyContent: "center",
        display: "flex",
        flexDirection: "row",
        padding: "5px",
        gap: "10px",
      }}
    >
      <button onClick={(e) => handleUndo(e)}>Undo</button>
      <button onClick={(e) => handleRedo(e)}>Redo</button>
    </div>
  );
};

export default BeadToolbar;
