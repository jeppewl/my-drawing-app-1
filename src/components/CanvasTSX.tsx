import React, { useState, useEffect } from "react";

const CanvasTSX = ({ shapes, selectedShape, setSelectedShape, updateShape }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Offset from the mouse to the shape's position

  const handleMouseDown = (shapeId, event) => {
    event.preventDefault();
    const shape = shapes.find((s) => s.id === shapeId);

    if (shape) {
      const svgRect = event.target.ownerSVGElement.getBoundingClientRect();
      const offsetX = event.clientX - svgRect.left - shape.x;
      const offsetY = event.clientY - svgRect.top - shape.y;

      setDragOffset({ x: offsetX, y: offsetY });
      setSelectedShape(shapeId);
      setIsDragging(true);
    }
  };

  // const handleMouseMove = (event) => {
  //   if (!isDragging || !selectedShape) return;

  //   const svgRect = document.querySelector(".canvas").getBoundingClientRect();
  //   const newX = event.clientX - svgRect.left - dragOffset.x;
  //   const newY = event.clientY - svgRect.top - dragOffset.y;

  //   updateShape(selectedShape, { x: newX, y: newY });
  // };

  // const handleMouseUp = () => {
  //   setIsDragging(false); // Stop dragging
  // };

  useEffect(() => {
    if (!isDragging || !selectedShape) return;

    const handleMouseMove = (event) => {
      const svgRect = document.querySelector(".canvas").getBoundingClientRect();
      const newX = event.clientX - svgRect.left - dragOffset.x;
      const newY = event.clientY - svgRect.top - dragOffset.y;

      updateShape(selectedShape, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, selectedShape, dragOffset, updateShape]);

  return (
    <svg className="canvas" width="800" height="600" style={{ border: "1px solid #ccc" }}>
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

export default CanvasTSX;
