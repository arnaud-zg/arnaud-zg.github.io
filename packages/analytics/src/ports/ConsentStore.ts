import type { SavedChoice } from "../domain/consent.ts";

// Remembers the choice, and nothing else.
export interface ConsentStore {
  read(): SavedChoice | undefined;
  write(choice: SavedChoice): void;
  // The choice may change in another tab, or before going back to this page.
  onChange(listener: () => void): void;
}
