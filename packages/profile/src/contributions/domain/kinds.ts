const PLURALS: Readonly<Record<string, string | undefined>> = {
  Fix: "fixes",
  Feature: "features",
  Performance: "performance changes",
  Types: "type updates",
  Refactor: "refactors",
  Test: "tests",
};

const counted = ({ kind, count }: { kind: string; count: number }) => {
  const singular = kind.toLowerCase();
  return `${count} ${count === 1 ? singular : (PLURALS[kind] ?? singular)}`;
};

// "2 fixes · 1 test", most frequent first.
export const summaryOf = (kinds: readonly string[]): string =>
  [...Map.groupBy(kinds, (kind) => kind)]
    .map(([kind, same]) => ({ kind, count: same.length }))
    .sort((a, b) => b.count - a.count)
    .map(counted)
    .join(" · ");
