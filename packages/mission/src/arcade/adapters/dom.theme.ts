// The site's theme, where the site keeps it (an <html> attribute, a storage key), else the system's.
import type { Shift } from "../../campaign/domain/levels/catalog/foes.ts";

export type ThemePlace = { readonly attribute: string; readonly storageKey: string };

const asShift = (value: string | null): Shift | undefined =>
  value === "dark" || value === "light" ? value : undefined;

export const themeOf = (place: ThemePlace) => {
  const root = document.documentElement;
  const name = `data-${place.attribute}`;
  return {
    read: (): Shift =>
      asShift(root.getAttribute(name)) ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    write: (shift: Shift) => {
      root.setAttribute(name, shift);
      try {
        localStorage.setItem(place.storageKey, shift);
      } catch {
        // storage refused (private mode): the page still switches
      }
    },
    watch: ({ changed, signal }: { changed: (shift: Shift) => void; signal: AbortSignal }) => {
      const observer = new MutationObserver(() => {
        const shift = asShift(root.getAttribute(name));
        if (shift) changed(shift);
      });
      observer.observe(root, { attributes: true, attributeFilter: [name] });
      signal.addEventListener("abort", () => observer.disconnect());
    },
  };
};
