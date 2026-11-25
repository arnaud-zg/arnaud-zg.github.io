const KINDS: Readonly<Record<string, string | undefined>> = {
  feat: "Feature",
  fix: "Fix",
  perf: "Performance",
  refactor: "Refactor",
  test: "Test",
  docs: "Docs",
  chore: "Change",
};
const TYPES = /^\[@types\/[^\]]+\]\s*(.*)$/;
const CONVENTIONAL = /^(\w+)(?:\([^)]*\))?!?:\s*(.*)$/;

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// "fix(mf): keep the whole range" is a Fix: "Keep the whole range".
export class PullRequestTitle {
  readonly #raw: string;

  constructor(raw: string) {
    this.#raw = raw;
  }

  describe(): { kind: string; title: string } {
    const types = TYPES.exec(this.#raw);
    if (types) return { kind: "Types", title: capitalized(types[1]) };
    const conventional = CONVENTIONAL.exec(this.#raw);
    if (!conventional) return { kind: "Change", title: capitalized(this.#raw) };
    const [, type, subject] = conventional;
    return { kind: KINDS[type.toLowerCase()] ?? "Change", title: capitalized(subject) };
  }
}
