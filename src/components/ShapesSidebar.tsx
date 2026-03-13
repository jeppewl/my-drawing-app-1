import React from "react";
import type { Shape } from "../types/shape";
// import colorData from "../data/palette-ideal-rgb-cmyk.json";
import colorData from "../data/palette-hama-IMG_3973.json";

interface SidebarProps {
  shape: Shape | null;
  updateShape: (id: string, newProps: Partial<Shape>) => void;
}

type Color = {
  code: number;
  name: string;
  hexValue: string;
};

const presetColors: Color[] = colorData.colors;

// const presetColors = ["#FF595E", "#FFCA3A", "#8AC926", "#1982C4", "#6A4C93"];

const ShapesSidebar: React.FC<SidebarProps> = ({ shape, updateShape }) => {
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(24px, 0fr))",
            gap: "2px",
          }}
        >
          {presetColors.map((color) => (
            <div key={color.hexValue}>
              <button
                title={color.name}
                style={{
                  backgroundColor: color.hexValue,
                  width: "24px",
                  height: "24px",
                  padding: 0,
                  margin: 0,
                  border: "none",
                  borderRadius: "0",
                  cursor: "pointer",
                  display: "block",
                }}
                onClick={() => updateShape(shape.id, { color: color.hexValue })}
              />
            </div>
          ))}
        </div>
      </div>

      <h3>Edit Shape</h3>

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

export default ShapesSidebar;
