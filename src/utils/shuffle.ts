// Fisher-Yates (Knuth) shuffle. Returns a new array, leaving the input untouched.
export function shuffle<T>(input: readonly T[]): T[] {
  const result = input.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
