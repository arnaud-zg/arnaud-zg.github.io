import type { SavedChoice } from "../domain/consent.ts";
import type { ConsentStore } from "../ports/ConsentStore.ts";

// `changeElsewhere` is another tab making a choice.
export const memoryConsent = (
  first?: SavedChoice,
): ConsentStore & { changeElsewhere(choice: SavedChoice): void } => {
  const listeners: (() => void)[] = [];
  let saved = first;
  return {
    read: () => saved,
    write(choice) {
      saved = choice;
    },
    onChange: (listener) => void listeners.push(listener),
    changeElsewhere(choice) {
      saved = choice;
      for (const listener of listeners) listener();
    },
  };
};
