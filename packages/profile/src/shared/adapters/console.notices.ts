import type { Notices } from "../ports/Notices.ts";

export const consoleNotices = (): Notices => ({ warn: (message) => console.warn(message) });
