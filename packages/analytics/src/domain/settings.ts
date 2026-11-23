// Each provider's name and its one setting: a token, an address. An empty setting is a provider that
// is off; all off, no analytics.
export type Settings = Readonly<Record<string, string>>;

// `override` replaces the choice for one build: "none", or names separated by commas.
export const activeProviders = (settings: Settings, known: readonly string[], override?: string): Settings => {
  const names = override === undefined ? Object.keys(settings).filter((n) => settings[n]) : override.split(",").map((n) => n.trim()).filter((n) => n && n !== "none");
  for (const n of [...names, ...Object.keys(settings)]) if (!known.includes(n)) throw new Error(`Unknown analytics provider "${n}". Known: ${known.join(", ")}`);
  return Object.fromEntries(names.map((n) => [n, settings[n] ?? ""]));
};
