import type { Article } from "../domain/Article.ts";
import type { Feed } from "../ports/Feed.ts";

export const memoryFeed = (articles: readonly Article[]): Feed => ({
  coverOf: (image) => image,
  articles: () => Promise.resolve([...articles]),
});
