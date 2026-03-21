import { ColorData } from "../types/colordata";

const PalettePanel: React.FC<{
  beadColors: ColorData[];
  workingColor: ColorData | null;
  setWorkingColor: React.Dispatch<React.SetStateAction<ColorData | null>>;
}> = ({ beadColors, workingColor, setWorkingColor }) => {
  return (
    <div
      // style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(30px, 1fr))",
        gap: "2px",
      }}
    >
      {beadColors.map((colData) => (
        <div
          onClick={() => {
            setWorkingColor(colData);
          }}
          key={colData.code}
          style={{
            background: colData.hexValue,
            boxSizing: "border-box",
            height: "30px",
            border: workingColor?.code === colData.code ? "2px solid black" : "2px solid #ccc",
            cursor: "pointer",
          }}
        >
          {colData.code}
        </div>
      ))}
    </div>
  );
};

export default PalettePanel;
