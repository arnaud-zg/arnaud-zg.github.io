import type { SavedChoice } from "../domain/consent.ts";
import type { ConsentStore } from "../ports/ConsentStore.ts";

const KEY = "analytics-choice";
const parse = (text: string | null): SavedChoice | undefined => {
  try {
    const v = JSON.parse(text ?? "");
    if ((v.choice === "granted" || v.choice === "refused") && typeof v.at === "number" && typeof v.plan === "number") return v;
  } catch { /* unreadable: no choice made */ }
};

export const localStorageConsent = (): ConsentStore => {
  // Where storage is blocked, the choice lasts as long as the page.
  let memory: SavedChoice | undefined;
  return {
    read() { try { return parse(localStorage.getItem(KEY)) ?? memory; } catch { return memory; } },
    write(choice) {
      memory = choice;
      try { localStorage.setItem(KEY, JSON.stringify(choice)); memory = undefined; } catch { /* kept in memory */ }
    },
    onChange(listener) {
      addEventListener("storage", (e) => { if (e.key === KEY || e.key === null) listener(); });
      addEventListener("pageshow", (e) => { if (e.persisted) listener(); });
    },
  };
};
