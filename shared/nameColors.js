export const PLAYER_NAME_COLORS = [
  "#00e5ff", // cyan
  "#ffcc00", // gold
  "#b967ff", // purple
  "#00ff7f", // spring green
  "#ff8c00", // orange
  "#4d7cff", // blue
  "#ff66c4", // pink
  "#39ff14", // neon green
  "#ffffff", // white
  "#a3ffea", // mint
  "#ffd1dc", // light pink
  "#c6ff00", // lime
  "#8ab4ff", // soft blue
  "#f5f5dc"  // cream
];

export const RESERVED_NAME_COLORS = [
  "#ff2d2d" // Makis red
];

export function getPlayerColorByIndex(index = 0) {
  return PLAYER_NAME_COLORS[Math.abs(index) % PLAYER_NAME_COLORS.length];
}

export function getAvailablePlayerColor(usedColors = []) {
  const used = new Set(
    usedColors
      .filter(Boolean)
      .map((color) => String(color).toLowerCase())
  );

  for (const color of PLAYER_NAME_COLORS) {
    if (!used.has(color.toLowerCase())) {
      return color;
    }
  }

  return getPlayerColorByIndex(used.size);
}
