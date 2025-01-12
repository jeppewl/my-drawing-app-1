export function mapToGradient(number, min, max) {
  // Normalize the number to a value between 0 and 1
  const normalized = (number - min) / (max - min);

  // Interpolate RGB values (e.g., red to blue gradient)
  const r = Math.round(255 * (1 - normalized)); // Red decreases
  const g = 0; // Green stays constant
  const b = Math.round(255 * normalized); // Blue increases

  // Convert to hex
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function rgbToHex(r, g, b) {
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function sin60(rad) {
  return rad * (Math.sqrt(3) / 2);
}

// export function cyOffsetNum(rowsFrom, startY, rad) {
//   return rowsFrom * 2 * sin60(rad) + startY;
// }

// export function cyOffsetStr(rowsFrom, startY, rad) {
//   return cyOffsetNum(rowsFrom, startY, rad).toFixed(2);
// }

export function mapToHueGradient(number, min, max) {
  // Normalize the number to a value between 0 and 1
  const normalized = (number - min) / (max - min);

  // Map normalized value to a hue (0 to 360 degrees)
  const hue = Math.round(360 * normalized);

  // Convert hue to RGB
  const [r, g, b] = hslToRgb(hue, 1, 0.5); // Full saturation and 50% lightness

  // Convert RGB to hex
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// Helper function: Convert HSL to RGB
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s; // Chroma
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1)); // Secondary color
  const m = l - c / 2; // Match lightness

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
  else if (h >= 60 && h < 120) [r, g, b] = [x, c, 0];
  else if (h >= 120 && h < 180) [r, g, b] = [0, c, x];
  else if (h >= 180 && h < 240) [r, g, b] = [0, x, c];
  else if (h >= 240 && h < 300) [r, g, b] = [x, 0, c];
  else if (h >= 300 && h < 360) [r, g, b] = [c, 0, x];

  // Convert to 0-255 range
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
}
