import React from "react";

const Toolbar = ({ createShape }) => {
  return (
    <div className="toolbar">
      <button onClick={() => createShape("circle")}>Add Circle</button>
      <button onClick={() => createShape("rectangle")}>Add Rectangle</button>
    </div>
  );
};

export default Toolbar;
