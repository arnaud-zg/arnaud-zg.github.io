import type { PrivacySignal } from "../ports/PrivacySignal.ts";

export const memorySignal = (objects: boolean): PrivacySignal => ({ objects: () => objects });
