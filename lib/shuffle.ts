// Generic: a fair shuffle (Fisher–Yates) of a copy of `items`, drawing from `randomNumberGenerator`, which returns a
//  number in [0, 1). A random comparator passed to `sort` isn't one: it favours the items listed first
//  (civ-clone/web-renderer#284).
export const shuffle = <T>(
  items: T[],
  randomNumberGenerator: () => number
): T[] => {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(randomNumberGenerator() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

export default shuffle;
