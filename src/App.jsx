import React, { useState } from "react";
import Toolbar from "./components/Toolbar";
import Canvas from "./components/Canvas";
import Sidebar from "./components/Sidebar";
import "./styles.css";

const App = () => {
  const [shapes, setShapes] = useState([]); // Stores all shapes
  const [selectedShape, setSelectedShape] = useState(null); // Tracks the selected shape

  // Function to add a new shape
  const createShape = (type) => {
    const newShape = {
      id: Date.now(),
      type,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      radius: 50,
      color: "#000000",
    };
    setShapes([...shapes, newShape]);
  };

  // Function to update a shape's properties
  const updateShape = (id, newProps) => {
    setShapes((prevShapes) =>
      prevShapes.map((shape) => (shape.id === id ? { ...shape, ...newProps } : shape))
    );
  };

  return (
    <div className="app">
      <Toolbar createShape={createShape} />
      <div className="workspace">
        <Canvas
          shapes={shapes}
          selectedShape={selectedShape}
          setSelectedShape={setSelectedShape}
          updateShape={updateShape}
        />
        {selectedShape && (
          <Sidebar
            shape={shapes.find((shape) => shape.id === selectedShape)}
            updateShape={updateShape}
          />
        )}
      </div>
    </div>
  );
};

export default App;
