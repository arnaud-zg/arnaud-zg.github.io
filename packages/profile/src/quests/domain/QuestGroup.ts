import type { Month } from "../../shared/domain/Month.ts";
import type { Quest, QuestFacts } from "./Quest.ts";

// `drawnMinimum`: the least share of the whole treemap a tile is drawn at. `beside`: the least
// share of its group's largest tile, so a small tool next to a big one is never a sliver.
export type Share = { total: number; drawnMinimum: number; beside: number };
export type QuestTile = {
  tool: QuestFacts;
  releases: number;
  weight: number;
  recent: boolean;
};

const RECENT_MONTHS = 12;

export class QuestGroup {
  readonly #quests: readonly Quest[];
  readonly #share: Share;
  readonly #today: Month;

  constructor({ quests, share, today }: { quests: Quest[]; share: Share; today: Month }) {
    this.#quests = quests;
    this.#share = share;
    this.#today = today;
  }

  // Every tool keeps its own tile.
  tiles(): QuestTile[] {
    const largest = Math.max(0, ...this.#quests.map((quest) => quest.asFacts().releases));
    return this.#quests.map((quest) => this.#tileOf(quest, largest));
  }

  #tileOf(quest: Quest, largest: number): QuestTile {
    const { total, drawnMinimum, beside } = this.#share;
    const { releases } = quest.asFacts();
    const weight = Math.max(releases, total * drawnMinimum, largest * beside);
    const age = { months: RECENT_MONTHS, today: this.#today };
    return { tool: quest.asFacts(), releases, weight, recent: quest.isUpdatedWithin(age) };
  }
}
