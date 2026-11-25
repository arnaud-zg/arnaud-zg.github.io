import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { Web } from "../ports/Web.ts";

const run = promisify(execFile);

// The reason alone: execFile's own message repeats the whole command.
const reasonOf = (error: unknown, url: string) => {
  const { code, killed, stderr, message } = error as Error & {
    code?: unknown;
    killed?: boolean;
    stderr?: string;
  };
  if (code === "ENOENT") return "gh is not installed: https://cli.github.com";
  if (killed) return `gh did not answer in time: ${url}`;
  return `${stderr?.trim() || message}: ${url}`;
};

// GitHub through gh's sign-in: 5,000 requests an hour, where anonymous ones get 60.
export const ghWeb = (gh = "gh"): Web => {
  const text = async (url: string) => {
    try {
      const { stdout } = await run(gh, ["api", url], { timeout: 15_000, maxBuffer: 10_000_000 });
      return stdout;
    } catch (error) {
      throw new Error(reasonOf(error, url), { cause: error });
    }
  };
  return { text, json: async (url) => JSON.parse(await text(url)) as unknown };
};
