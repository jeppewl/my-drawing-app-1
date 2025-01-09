import React from "react";

const Sidebar = ({ shape, updateShape }) => {
  if (!shape) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateShape(shape.id, { [name]: name === "color" ? value : parseFloat(value) });
  };

  return (
    <div className="sidebar">
      <h3>Edit Shape</h3>
      <label>
        Color:
        <input type="color" name="color" value={shape.color} onChange={handleChange} />
      </label>
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
