// Predefined color palette for multiplayer users
const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B88B', // Peach
  '#A2D5AB', // Green
];

let colorIndex = 0;

/**
 * Get a unique color for a new user
 * Cycles through predefined palette
 */
export const getUserColor = (): string => {
  const color = USER_COLORS[colorIndex % USER_COLORS.length];
  colorIndex++;
  return color;
};

/**
 * Get a random color from the palette
 */
export const getRandomColor = (): string => {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
};

/**
 * Get color by index (useful for consistent assignment)
 */
export const getColorByIndex = (index: number): string => {
  return USER_COLORS[index % USER_COLORS.length];
};

export { USER_COLORS };

