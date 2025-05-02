import React from "react";
import { ShapeType } from "../types/shape";

type ToolbarProps = {
  createShape: (type: ShapeType) => void;
};

const Toolbar: React.FC<ToolbarProps> = ({ createShape }) => {
  return (
    <div className="toolbar">
      <button onClick={() => createShape("circle")}>Add Circle</button>
      <button onClick={() => createShape("rectangle")}>Add Rectangle</button>
    </div>
  );
};

export default Toolbar;
