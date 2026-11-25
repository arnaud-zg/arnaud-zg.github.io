// Wires the ports. Everything a site gives is an argument: nothing here knows whose profile it is.
import type { CareerFacts } from "./career/domain/Career.ts";
import type { ContributionRules } from "./contributions/domain/ContributionPolicy.ts";
import type { QuestMapRules } from "./quests/domain/QuestMap.ts";
import { smallCover, substackFeed } from "./articles/adapters/substack.feed.ts";
import { Career } from "./career/domain/Career.ts";
import { githubHost } from "./contributions/adapters/github.host.ts";
import { ContributionLog } from "./contributions/application/ContributionLog.ts";
import { ContributionPolicy } from "./contributions/domain/ContributionPolicy.ts";
import { Contributions } from "./contributions/domain/Contributions.ts";
import { npmRegistry } from "./quests/adapters/npm.registry.ts";
import { QuestCatalog } from "./quests/application/QuestCatalog.ts";
import { QuestMap } from "./quests/domain/QuestMap.ts";
import { Quests } from "./quests/domain/Quests.ts";
import { fetchWeb } from "./shared/adapters/fetch.web.ts";
import { Snapshots } from "./shared/adapters/snapshots.ts";
import { SavedData } from "./shared/application/SavedData.ts";
import { Month } from "./shared/domain/Month.ts";
import { readmeSkills } from "./skills/adapters/readme.skills.ts";

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
export type Run = { strict: boolean; now: Date; snapshots: unknown };

const AGENT = { "User-Agent": "portfolio-build" };

export const createProfile = ({ settings, run }: { settings: ProfileSettings; run: Run }) => {
  const { github, npm, skills, substack } = settings;
  const snapshots = Snapshots.parse(run.snapshots);
  const savedData = new SavedData({ strict: run.strict });
  const today = Month.at(run.now);
  const year = today.year();
  const web = fetchWeb(AGENT);
  const policy = new ContributionPolicy(github);
  const log = new ContributionLog({
    host: githubHost(fetchWeb({ ...AGENT, Accept: "application/vnd.github+json" })),
    savedData,
    policy,
    author: github.user,
    year,
    saved: snapshots.github,
  });
  const catalog = new QuestCatalog({
    registry: npmRegistry(web),
    savedData,
    today,
    maintainer: npm.maintainer,
    parked: npm.parkedVersion,
    lines: npm.lines,
  });
  const feed = substackFeed({ web, url: substack.feed });
  const list = readmeSkills({ web, repo: skills.repo });

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
        await catalog.read().catch(savedData.insteadOf({ source: "npm", saved: snapshots.npm })),
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
        .catch(savedData.insteadOf({ source: "github", saved: snapshots.github }));
      return new Contributions({ records, policy, year }).byRepository();
    },
    async articles() {
      const articles = await feed
        .articles()
        .catch(savedData.insteadOf({ source: "substack", saved: snapshots.substack }));
      return articles.map((article) => ({ ...article, image: smallCover(article.image) }));
    },
    skills: () =>
      list.skills().catch(savedData.insteadOf({ source: "skills", saved: snapshots.skills })),
    // What `data:refresh` saves.
    live: {
      github: () => log.read({ fresh: true }),
      npm: () => catalog.read(),
      skills: () => list.skills(),
      substack: () => feed.articles(),
    },
  };
};
