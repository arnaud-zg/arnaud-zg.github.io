import type { Web } from "../ports/Web.ts";

// Answers by address, with or without its query. Anything else is down.
export const memoryWeb = (answers: Readonly<Record<string, unknown>>): Web => {
  const answerOf = (url: string) => {
    const answer = answers[url] ?? answers[url.split("?")[0]];
    if (answer === undefined) throw new Error(`503 ${url}`);
    return answer;
  };
  return {
    async text(url) {
      const answer = await Promise.resolve(url).then(answerOf);
      return typeof answer === "string" ? answer : JSON.stringify(answer);
    },
    json: (url) => Promise.resolve(url).then(answerOf),
  };
};
