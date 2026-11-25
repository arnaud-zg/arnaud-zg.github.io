import type { Web } from "../ports/Web.ts";

export const fetchWeb = (headers: Record<string, string> = {}): Web => {
  const get = async (url: string) => {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response;
  };
  return {
    text: async (url) => (await get(url)).text(),
    json: async (url) => (await get(url)).json(),
  };
};
