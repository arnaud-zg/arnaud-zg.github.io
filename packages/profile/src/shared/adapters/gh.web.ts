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
// A body's fields make gh post them, as GitHub's GraphQL wants.
export const ghWeb = (gh = "gh"): Web => {
  const ask = async (url: string, body: Readonly<Record<string, string>> = {}) => {
    const fields = Object.entries(body).flatMap(([key, value]) => ["-f", `${key}=${value}`]);
    try {
      const options = { timeout: 15_000, maxBuffer: 10_000_000 };
      const { stdout } = await run(gh, ["api", url, ...fields], options);
      return stdout;
    } catch (error) {
      throw new Error(reasonOf(error, url), { cause: error });
    }
  };
  return {
    text: (url) => ask(url),
    json: async (url, body) => JSON.parse(await ask(url, body)) as unknown,
  };
};
