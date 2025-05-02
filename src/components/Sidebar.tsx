import React from "react";
import type { Shape } from "../types/shape";
// type BaseShape = {
//   id: string;
//   x: number;
//   y: number;
//   color: string;
// };

// type CircleShape = BaseShape & {
//   type: "circle";
//   radius: number;
// };

// type RectangleShape = BaseShape & {
//   type: "rectangle";
//   width: number;
//   height: number;
// };

// type Shape = CircleShape | RectangleShape;

interface SidebarProps {
  shape: Shape | null;
  updateShape: (id: string, newProps: Partial<Shape>) => void;
}

const presetColors = ["#FF595E", "#FFCA3A", "#8AC926", "#1982C4", "#6A4C93"];

const Sidebar: React.FC<SidebarProps> = ({ shape, updateShape }) => {
  if (!shape) {
    return <div className="sidebar">No shape selected</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateShape(shape.id, { [name]: name === "color" ? value : parseFloat(value) });
  };

  return (
    <div className="sidebar">
      <div>
        <p>Color:</p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {presetColors.map((color) => (
            <button
              key={color}
              style={{
                backgroundColor: color,
                border: shape.color === color ? "2px solid black" : "2px solid #ccc",
                width: "24px",
                height: "24px",
                borderRadius: "25%",
                transition: "border-color 0.2s", // Smooth transition for border color
                cursor: "pointer",
              }}
              onClick={() => updateShape(shape.id, { color })}
              onMouseEnter={(e) => (e.currentTarget.style.border = "2px solid #555")} // On hover, show a darker border
              onMouseLeave={(e) =>
                (e.currentTarget.style.border =
                  shape.color === color ? "2px solid black" : "2px solid #ccc")
              } // Revert to original border
            />
          ))}
        </div>
      </div>
      <h3>Edit Shape</h3>
      {/* <label>
        Color:
        <input type="color" name="color" value={shape.color} onChange={handleChange} />
      </label> */}
      {shape.type === "circle" && (
        <label>
          Radius:
          <input type="number" name="radius" value={shape.radius} onChange={handleChange} min="1" />
        </label>
      )}
      {shape.type === "rectangle" && (
        <>
          <label>
            Width:
            <input type="number" name="width" value={shape.width} onChange={handleChange} min="1" />
          </label>
          <label>
            Height:
            <input
              type="number"
              name="height"
              value={shape.height}
              onChange={handleChange}
              min="1"
            />
          </label>
        </>
      )}
    </div>
  );
};

export default Sidebar;
