import type { Month } from "../../shared/domain/Month.ts";
import type { Quest, QuestFacts } from "./Quest.ts";
import { Quests } from "./Quests.ts";

export type Share = { total: number; minimum: number; drawnMinimum: number };
export type QuestTile = {
  tool?: QuestFacts;
  more?: QuestFacts[];
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

  // A lone small tool keeps its own tile; two or more share one.
  tiles(): QuestTile[] {
    const small = this.#quests.filter((quest) => this.#isSmall(quest));
    if (small.length < 2) return this.#quests.map((quest) => this.#tileOf(quest));
    const large = this.#quests.filter((quest) => !this.#isSmall(quest));
    const shared = { more: new Quests(small).asFacts(), ...this.#size(small) };
    return [...large.map((quest) => this.#tileOf(quest)), shared];
  }

  #isSmall(quest: Quest): boolean {
    return quest.asFacts().releases / this.#share.total < this.#share.minimum;
  }

  #tileOf(quest: Quest): QuestTile {
    return { tool: quest.asFacts(), ...this.#size([quest]) };
  }

  #size(quests: readonly Quest[]) {
    const releases = new Quests(quests).releases();
    const weight = Math.max(releases, this.#share.total * this.#share.drawnMinimum);
    const age = { months: RECENT_MONTHS, today: this.#today };
    return { releases, weight, recent: quests.some((quest) => quest.isUpdatedWithin(age)) };
  }
}
