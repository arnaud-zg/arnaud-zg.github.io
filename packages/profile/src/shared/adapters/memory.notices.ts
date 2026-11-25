import type { Notices } from "../ports/Notices.ts";

export const memoryNotices = (): Notices & { readonly said: string[] } => {
  const said: string[] = [];
  return { said, warn: (message) => void said.push(message) };
};
