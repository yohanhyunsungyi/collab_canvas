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

/**
 * Simple hash function to convert string to number
 */
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Get a unique color for a user based on their user ID
 * Always returns the same color for the same user ID
 */
export const getUserColor = (userId: string): string => {
  const index = hashString(userId) % USER_COLORS.length;
  return USER_COLORS[index];
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

