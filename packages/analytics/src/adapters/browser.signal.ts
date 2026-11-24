import type { PrivacySignal } from "../ports/PrivacySignal.ts";

// Global Privacy Control, and the older Do Not Track.
export const browserSignal = (): PrivacySignal => ({
  objects: () => (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true || navigator.doNotTrack === "1",
});
