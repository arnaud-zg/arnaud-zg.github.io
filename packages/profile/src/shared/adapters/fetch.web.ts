import type { Web } from "../ports/Web.ts";

// A limit reached says so and until when: a bare 403 hides that waiting is the fix.
const reasonOf = ({ status, headers }: Response, url: string) => {
  const limited = [403, 429].includes(status) && headers.get("x-ratelimit-remaining") === "0";
  const reset = Number(headers.get("x-ratelimit-reset"));
  if (!limited || !reset) return `${status} ${url}`;
  const { host } = new URL(url);
  const time = new Date(reset * 1000).toLocaleTimeString();
  return `the rate limit of ${host} is reached (${headers.get("x-ratelimit-limit")} requests), try again after ${time}`;
};

export const fetchWeb = (headers: Record<string, string> = {}): Web => {
  const get = async (url: string) => {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(reasonOf(response, url));
    return response;
  };
  return {
    text: async (url) => (await get(url)).text(),
    json: async (url) => (await get(url)).json(),
  };
};
