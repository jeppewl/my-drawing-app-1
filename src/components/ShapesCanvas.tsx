import React, { useState, useEffect, useRef } from "react";
import type { Shape } from "../types/shape";

// type Shape = {
//   id: string;
//   type: "circle" | "rectangle";
//   x: number;
//   y: number;
//   radius?: number; // for circle
//   width?: number; // for rectangle
//   height?: number; // for rectangle
//   color: string;
// };

type CanvasProps = {
  shapes: Shape[];
  selectedShape: string | null;
  setSelectedShape: React.Dispatch<React.SetStateAction<string | null>>;
  updateShape: (id: string, newProps: Partial<Shape>) => void;
};

const ShapesCanvas: React.FC<CanvasProps> = ({
  shapes,
  selectedShape,
  setSelectedShape,
  updateShape,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 }); // Offset from the mouse to the shape's position

  // Ref to the SVG element
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = (shapeId: string, event: React.MouseEvent<SVGElement, MouseEvent>) => {
    event.preventDefault();
    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape) return;

    // const svg = event.currentTarget.closest("svg");
    const svgRect = svgRef.current?.getBoundingClientRect();
    // if (!svg) return;
    if (!svgRect) return;

    // const svgRect = svg.getBoundingClientRect();

    const offsetX = event.clientX - svgRect.left - shape.x;
    const offsetY = event.clientY - svgRect.top - shape.y;

    setDragOffset({ x: offsetX, y: offsetY });
    setSelectedShape(shapeId);
    setIsDragging(true);
  };

  React.useEffect(() => {
    if (!isDragging || !selectedShape) return;

    const handleMouseMove = (event: MouseEvent) => {
      //   const svgRect = document.querySelector(".canvas")?.getBoundingClientRect();
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;

      const newX = event.clientX - svgRect.left - dragOffset.x;
      const newY = event.clientY - svgRect.top - dragOffset.y;

      updateShape(selectedShape, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Add event listeners
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Cleanup on unmount or when dragging stops
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, selectedShape, dragOffset, updateShape]);

  return (
    // <svg className="canvas" width="800" height="600" style={{ border: "1px solid #ccc" }}>
    <svg
      ref={svgRef} // Use the ref here
      className="canvas"
      width="800"
      height="600"
      style={{ border: "1px solid #ccc" }}
    >
      {shapes.map((shape) => (
        <React.Fragment key={shape.id}>
          {shape.type === "circle" && (
            <circle
              cx={shape.x}
              cy={shape.y}
              r={shape.radius}
              fill={shape.color}
              stroke={selectedShape === shape.id ? "blue" : "none"}
              strokeWidth="2"
              onMouseDown={(e) => handleMouseDown(shape.id, e)}
            />
          )}
          {shape.type === "rectangle" && (
            <rect
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              fill={shape.color}
              stroke={selectedShape === shape.id ? "blue" : "none"}
              strokeWidth="2"
              onMouseDown={(e) => handleMouseDown(shape.id, e)}
            />
          )}
        </React.Fragment>
      ))}
    </svg>
  );
};

export default ShapesCanvas;
