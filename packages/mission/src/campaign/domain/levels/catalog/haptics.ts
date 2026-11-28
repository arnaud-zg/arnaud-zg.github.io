// Buzz patterns in milliseconds, buzz then pause, spoken in Morse code or binary.
const DOT = 50;
const DASH = 150;
const MORSE: Partial<Record<string, string>> = {
  O: "---",
  K: "-.-",
  S: "...",
  G: "--.",
  "4": "....-",
  "0": "-----",
};

// A word in Morse: a dot's pause between signals, a dash's between letters.
export const morse = (word: string) =>
  [...word]
    .map((letter) => [...(MORSE[letter] ?? "")].map((signal) => (signal === "." ? DOT : DASH)))
    .flatMap((signals, i) => [
      ...(i > 0 ? [DASH] : []),
      ...signals.flatMap((ms, j) => (j > 0 ? [DOT, ms] : [ms])),
    ]);

// A number in binary: a short buzz for 0, a long one for 1, most significant first.
export const binary = (n: number) =>
  [...Math.max(1, Math.floor(n)).toString(2)].flatMap((bit, i) => [
    ...(i > 0 ? [60] : []),
    bit === "1" ? 120 : 40,
  ]);

export const HAPTICS = {
  kill: [12], // one bit
  combo: (chain: number) => binary(chain),
  death: [400, 80, 80, 80, 80], // SEGFAULT: one long, two short
  right: morse("OK"),
  wrong: [40, 40, 40, 40, 40, 40, 40, 200, 300, 200, 40, 40, 40, 40, 40, 40, 40], // 4 0 4
  crash: Array.from({ length: 17 }, () => 30), // SIGKILL: nine quick ones
  green: [80, 60, 80, 60, 80], // 200: three beats, all fine
  faster: [120, 80, 90, 60, 60, 40, 40, 20, 20], // the loop speeding up
  bossDown: morse("GG"),
  start: [150, 60, 150, 60, 50, 60, 50], // ↑ ↑ ↓ ↓
} as const;
