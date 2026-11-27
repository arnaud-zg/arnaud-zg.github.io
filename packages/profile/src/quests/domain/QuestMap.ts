import type { Month } from "../../shared/domain/Month.ts";
import type { Quest } from "./Quest.ts";
import type { QuestTile } from "./QuestGroup.ts";
import type { Quests } from "./Quests.ts";
import { QuestGroup } from "./QuestGroup.ts";

type Subject = {
  readonly name: string;
  readonly emoji: string;
  readonly match: readonly string[];
};
export type QuestMapRules = {
  readonly groups: readonly Subject[];
  readonly otherGroup: string;
  readonly otherEmoji: string;
  readonly minTileShare: number;
  readonly minTileBeside: number;
};
export type MappedGroup = { name: string; emoji: string; tiles: QuestTile[] };

// A quest joins the first group it is about; groups keep their configured order.
export class QuestMap {
  readonly #rules: QuestMapRules;
  readonly #other: Subject;
  readonly #today: Month;

  constructor({ rules, today }: { rules: QuestMapRules; today: Month }) {
    this.#rules = rules;
    this.#other = { name: rules.otherGroup, emoji: rules.otherEmoji, match: [] };
    this.#today = today;
  }

  groupsOf(quests: Quests): MappedGroup[] {
    const { minTileShare, minTileBeside, groups } = this.#rules;
    const share = { total: quests.releases(), drawnMinimum: minTileShare, beside: minTileBeside };
    const members = Map.groupBy(quests.byReleases(), (quest) => this.#subjectOf(quest));
    return [...groups, this.#other].flatMap((subject) => {
      const own = members.get(subject);
      if (!own) return [];
      const group = new QuestGroup({ quests: own, share, today: this.#today });
      return [{ name: subject.name, emoji: subject.emoji, tiles: group.tiles() }];
    });
  }

  #subjectOf(quest: Quest): Subject {
    return this.#rules.groups.find(({ match }) => quest.isAbout(match)) ?? this.#other;
  }
}
