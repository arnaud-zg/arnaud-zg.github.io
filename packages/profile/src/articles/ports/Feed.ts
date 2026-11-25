import type { Article } from "../domain/Article.ts";

export interface Feed {
  articles(): Promise<Article[]>;
  // The address of a small version of an article's image.
  coverOf(image: string): string;
}
