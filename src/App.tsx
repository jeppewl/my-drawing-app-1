import { useState } from "react";
import ShapesSidebar from "./components/ShapesSidebar";
import "./styles.css";
import Toolbar from "./components/Toolbar";
import ShapesCanvas from "./components/ShapesCanvas";
import IntZigzag from "./datastructures/IntZigzag";
import type { Shape, ShapeType } from "./types/shape";

const App = () => {
  const [shapes, setShapes] = useState<Shape[]>([]); // Stores all shapes
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null); // Tracks the selected shape

  const createShape = (type: ShapeType) => {
    const newShape: Shape = {
      id: crypto.randomUUID(), // returns a string UUID
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

  const updateShape = (id: string, newProps: Partial<Shape>) => {
    setShapes((prevShapes) =>
      prevShapes.map((shape) => (shape.id === id ? { ...shape, ...newProps } : shape)),
    );
  };

  const zzTest = new IntZigzag(5, 7);

  return (
    <div className="app">
      <Toolbar createShape={createShape} />
      <div className="workspace">
        <ShapesCanvas
          shapes={shapes}
          selectedShape={selectedShapeId}
          setSelectedShape={setSelectedShapeId}
          updateShape={updateShape}
        />

        <ShapesSidebar
          shape={shapes.find((shape) => shape.id === selectedShapeId) || null}
          updateShape={updateShape}
        />
      </div>
    </div>
  );
};

export default App;
