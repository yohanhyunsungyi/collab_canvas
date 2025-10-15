// Predefined color palette for multiplayer users
// 유저별로 확실히 구분되는 선명한 색상들
const USER_COLORS = [
  '#FF0000', // 빨강
  '#00FF00', // 초록
  '#0000FF', // 파랑
  '#FFFF00', // 노랑
  '#FF00FF', // 마젠타
  '#00FFFF', // 시안
  '#FF6B00', // 주황
  '#9D00FF', // 보라
  '#FF1493', // 핑크
  '#00FF7F', // 청록
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

