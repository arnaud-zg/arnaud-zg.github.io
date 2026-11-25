// The profile, from its settings and the ports it reads.
import type { Article } from "./articles/domain/Article.ts";
import type { Feed } from "./articles/ports/Feed.ts";
import type { CareerFacts } from "./career/domain/Career.ts";
import type { ContributionRules } from "./contributions/domain/ContributionPolicy.ts";
import type { Records } from "./contributions/domain/PullRequest.ts";
import type { CodeHost } from "./contributions/ports/CodeHost.ts";
import type { QuestFacts } from "./quests/domain/Quest.ts";
import type { QuestMapRules } from "./quests/domain/QuestMap.ts";
import type { PackageRegistry } from "./quests/ports/PackageRegistry.ts";
import type { Notices } from "./shared/ports/Notices.ts";
import type { Skill } from "./skills/domain/Skill.ts";
import type { SkillList } from "./skills/ports/SkillList.ts";
import { Career } from "./career/domain/Career.ts";
import { ContributionLog } from "./contributions/application/ContributionLog.ts";
import { ContributionPolicy } from "./contributions/domain/ContributionPolicy.ts";
import { Contributions } from "./contributions/domain/Contributions.ts";
import { QuestCatalog } from "./quests/application/QuestCatalog.ts";
import { QuestMap } from "./quests/domain/QuestMap.ts";
import { Quests } from "./quests/domain/Quests.ts";
import { SavedData } from "./shared/application/SavedData.ts";
import { Month } from "./shared/domain/Month.ts";

export type ProfileSettings = {
  readonly career: CareerFacts;
  readonly github: ContributionRules;
  readonly npm: QuestMapRules & {
    readonly maintainer: string;
    readonly parkedVersion: RegExp;
    readonly activeMonths: number;
    readonly lines: Readonly<Record<string, string | undefined>>;
  };
  readonly skills: { readonly repo: string };
  readonly substack: { readonly feed: string };
};
export type Ports = {
  readonly registry: PackageRegistry;
  readonly host: CodeHost;
  readonly feed: Feed;
  readonly list: SkillList;
  readonly notices: Notices;
};
// What each source last said, for when it is down.
export type Saved = {
  readonly github: Records;
  readonly npm: QuestFacts[];
  readonly skills: Skill[];
  readonly substack: Article[];
};
export type Run = { readonly strict: boolean; readonly now: Date; readonly saved: Saved };
export type Profile = { settings: ProfileSettings; ports: Ports; run: Run };

export const profileOf = ({ settings, ports, run }: Profile) => {
  const { github, npm } = settings;
  const { registry, host, feed, list, notices } = ports;
  const { saved } = run;
  const savedData = new SavedData({ strict: run.strict, notices });
  const today = Month.at(run.now);
  const year = today.year();
  const policy = new ContributionPolicy(github);
  const log = new ContributionLog({
    host,
    savedData,
    policy,
    author: github.user,
    year,
    saved: saved.github,
  });
  const catalog = new QuestCatalog({
    registry,
    savedData,
    today,
    maintainer: npm.maintainer,
    parked: npm.parkedVersion,
    lines: npm.lines,
  });

  return {
    career() {
      const career = new Career(settings.career);
      return {
        roles: career.roles(),
        early: career.early(),
        current: career.current(),
        years: career.yearsAt(today),
        longestYears: career.longestYearsAt(today),
      };
    },
    async sideQuests() {
      const quests = Quests.of(
        await catalog.read().catch(savedData.insteadOf({ source: "npm", saved: saved.npm })),
      );
      const age = { months: npm.activeMonths, today };
      const active = quests.updatedWithin(age);
      const counted = active.asFacts().find(({ downloads }) => downloads !== undefined);
      return {
        tools: active.count(),
        releases: active.releases(),
        downloads: active.downloads(),
        downloadsMonth: counted?.downloadsMonth,
        groups: new QuestMap({ rules: npm, today }).groupsOf(active),
        earlier: quests.olderThan(age).asFacts(),
      };
    },
    async contributions() {
      const records = await log
        .read()
        .catch(savedData.insteadOf({ source: "github", saved: saved.github }));
      return new Contributions({ records, policy, year }).byRepository();
    },
    async articles() {
      const articles = await feed
        .articles()
        .catch(savedData.insteadOf({ source: "substack", saved: saved.substack }));
      return articles.map((article) => ({ ...article, image: feed.coverOf(article.image) }));
    },
    skills: () =>
      list.skills().catch(savedData.insteadOf({ source: "skills", saved: saved.skills })),
    // What `data:refresh` saves.
    live: {
      github: () => log.read({ fresh: true }),
      npm: () => catalog.read(),
      skills: () => list.skills(),
      substack: () => feed.articles(),
    },
  };
};
