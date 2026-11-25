import type { Age, QuestFacts } from "./Quest.ts";
import { Quest } from "./Quest.ts";

export class Quests {
  readonly #quests: readonly Quest[];

  constructor(quests: readonly Quest[]) {
    this.#quests = quests;
  }

  static of(facts: readonly QuestFacts[]): Quests {
    return new Quests(facts.map((quest) => new Quest(quest)));
  }

  updatedWithin(age: Age): Quests {
    return this.where((quest) => quest.isUpdatedWithin(age));
  }

  olderThan(age: Age): Quests {
    const older = this.#quests.filter((quest) => !quest.isUpdatedWithin(age));
    return new Quests(older.sort((a, b) => b.compareUpdate(a)));
  }

  where(accepts: (quest: Quest) => boolean): Quests {
    return new Quests(this.#quests.filter(accepts));
  }

  byReleases(): Quest[] {
    return [...this.#quests].sort((a, b) => b.asFacts().releases - a.asFacts().releases);
  }

  count(): number {
    return this.#quests.length;
  }

  releases(): number {
    return this.asFacts().reduce((total, { releases }) => total + releases, 0);
  }

  monthlyReleases(): number {
    return this.asFacts().reduce((total, { monthlyReleases }) => total + monthlyReleases, 0);
  }

  // No total when a figure is missing: never an understated number.
  downloads(): number | undefined {
    const figures = this.asFacts().flatMap(({ downloads }) => downloads ?? []);
    if (!figures.length || figures.length < this.count()) return undefined;
    return figures.reduce((total, figure) => total + figure, 0);
  }

  asFacts(): QuestFacts[] {
    return this.#quests.map((quest) => quest.asFacts());
  }
}
