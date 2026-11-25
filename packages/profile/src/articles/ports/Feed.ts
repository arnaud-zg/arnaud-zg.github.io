import type { Article } from "../domain/Article.ts";

export interface Feed {
  articles(): Promise<Article[]>;
}
