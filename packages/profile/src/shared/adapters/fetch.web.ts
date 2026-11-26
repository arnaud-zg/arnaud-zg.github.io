import type { Web } from "../ports/Web.ts";

export const fetchWeb = (headers: Record<string, string> = {}): Web => {
  const get = async (url: string, body?: Readonly<Record<string, string>>) => {
    const posted = body ? { method: "POST", body: JSON.stringify(body) } : {};
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000), ...posted });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response;
  };
  return {
    text: async (url) => (await get(url)).text(),
    json: async (url, body) => (await get(url, body)).json() as Promise<unknown>,
  };
};
