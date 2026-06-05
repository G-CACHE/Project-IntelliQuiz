/**
 * Deterministic option shuffle matching the backend OptionOrderUtil (Java Random + Collections.shuffle).
 * Uses BigInt for nextInt so results match Java's 64-bit long arithmetic (JS bitwise ops are 32-bit).
 */

class JavaRandom {
  private seed: bigint;

  constructor(seed: number) {
    const seedBig = BigInt(Math.trunc(seed));
    this.seed = (seedBig ^ 0x5deece66dn) & ((1n << 48n) - 1n);
  }

  private next(bits: number): number {
    this.seed = (this.seed * 0x5deece66dn + 0xbn) & ((1n << 48n) - 1n);
    return Number(this.seed >> BigInt(48 - bits));
  }

  nextInt(bound: number): number {
    if (bound <= 0) {
      return 0;
    }

    const m = bound - 1;
    if ((bound & m) === 0) {
      // Power-of-two bound: Java uses (n * (long) next(31)) >> 31
      return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
    }

    let u = this.next(31);
    let result = u % bound;
    while (u - result + m < 0) {
      u = this.next(31);
      result = u % bound;
    }
    return result;
  }
}

export function shuffleSeed(teamId: number, questionId: number): number {
  return teamId * 31 + questionId;
}

export function createPermutation(size: number, seed: number): number[] {
  const permutation = Array.from({ length: size }, (_, index) => index);
  if (size <= 1) {
    return permutation;
  }

  const rng = new JavaRandom(seed);
  for (let i = size - 1; i > 0; i -= 1) {
    const j = rng.nextInt(i + 1);
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }
  return permutation;
}

export function getShuffledOptions(options: string[], teamId: number, questionId: number): string[] {
  if (options.length <= 1) {
    return options;
  }
  const permutation = createPermutation(options.length, shuffleSeed(teamId, questionId));
  return permutation.map((index) => options[index]);
}

export function displayLetterToAdminLetter(
  displayLetter: string,
  optionCount: number,
  teamId: number,
  questionId: number,
): string {
  const upper = displayLetter.trim().toUpperCase();
  if (upper.length !== 1 || upper < 'A') {
    return upper;
  }

  const displayIndex = upper.charCodeAt(0) - 65;
  if (displayIndex < 0 || displayIndex >= optionCount) {
    return upper;
  }

  const permutation = createPermutation(optionCount, shuffleSeed(teamId, questionId));
  const originalIndex = permutation[displayIndex];
  return String.fromCharCode(65 + originalIndex);
}
