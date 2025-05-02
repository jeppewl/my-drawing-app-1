import { useState } from "react";
import Sidebar from "./components/Sidebar";
import "./styles.css";
import Toolbar from "./components/Toolbar";
import BeadCanvas from "./components/BeadCanvas";
import ShapesCanvas from "./components/ShapesCanvas";
import IntZigzag from "./datastructures/IntZigzag";
import type { Shape, ShapeType } from "./types/shape";

const App = () => {
  // const [shapes, setShapes] = useState([]); // Stores all shapes
  const [shapes, setShapes] = useState<Shape[]>([]); // Stores all shapes
  // const [selectedShape, setSelectedShape] = useState(null); // Tracks the selected shape
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null); // Tracks the selected shape

  // type ShapeType = "rectangle" | "circle" | "triangle"; // expand as needed

  // type Shape = {
  //   id: number;
  //   type: ShapeType;
  //   x: number;
  //   y: number;
  //   width: number;
  //   height: number;
  //   radius: number;
  //   color: string;
  // };

  // Function to add a new shape
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

  // Function to update a shape's properties
  const updateShape = (id: string, newProps: Partial<Shape>) => {
    setShapes((prevShapes) =>
      prevShapes.map((shape) => (shape.id === id ? { ...shape, ...newProps } : shape))
    );
  };

  const zzTest = new IntZigzag(5, 7);

  return (
    <div className="app">
      <h2>{zzTest.getIndices()}</h2>
      <Toolbar createShape={createShape} />
      <div className="workspace">
        <ShapesCanvas
          shapes={shapes}
          selectedShape={selectedShapeId}
          setSelectedShape={setSelectedShapeId}
          updateShape={updateShape}
        />

        {
          <Sidebar
            shape={shapes.find((shape) => shape.id === selectedShapeId) || null}
            updateShape={updateShape}
          />
        }
      </div>
      <BeadCanvas />
    </div>
  );
};

export default App;
