// Predefined color palette for multiplayer users (darker tones for white text)
// 사용자 아이덴티티(커서/프레즌스)에 쓰이는 진한 톤 10가지
const USER_COLORS = [
  '#B71C1C', // dark red
  '#C2185B', // dark pink
  '#7B1FA2', // dark purple
  '#1565C0', // dark blue
  '#00838F', // dark cyan
  '#2E7D32', // dark green
  '#F57C00', // dark orange
  '#6D4C41', // dark brown
  '#455A64', // blue grey
  '#8D6E63', // mocha
];

// Pastel color palette for shapes/objects (lighter complementary tones)
// 오브젝트(도형)용 파스텔 톤 10가지
export const SHAPE_COLORS = [
  '#F48FB1', // pastel pink (darker)
  '#CE93D8', // pastel purple (darker)
  '#B39DDB', // pastel deep purple (darker)
  '#64B5F6', // pastel blue (darker)
  '#4FC3F7', // pastel light blue (darker)
  '#4DD0E1', // pastel cyan (darker)
  '#4DB6AC', // pastel teal (darker)
  '#81C784', // pastel green (darker)
  '#FFB74D', // pastel orange (darker)
  '#FF8A65', // pastel deep orange (darker)
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

