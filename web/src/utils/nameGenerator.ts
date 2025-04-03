const adjectives = ['快乐的', '聪明的', '可爱的', '优雅的', '友善的', '活泼的'];
const nouns = ['熊猫', '老虎', '兔子', '狮子', '猫咪', '小狗'];

export const generateRandomUsername = (): string => {
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective}${randomNoun}${Math.floor(Math.random() * 1000)}`;
}; 