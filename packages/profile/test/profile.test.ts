import assert from "node:assert/strict";
import { test } from "node:test";

import type { CodeHost } from "../src/contributions/ports/CodeHost.ts";
import type { PackageRegistry } from "../src/quests/ports/PackageRegistry.ts";
import { Career } from "../src/career/domain/Career.ts";
import { ContributionLog } from "../src/contributions/application/ContributionLog.ts";
import { ContributionPolicy } from "../src/contributions/domain/ContributionPolicy.ts";
import { Contributions } from "../src/contributions/domain/Contributions.ts";
import { PullRequestTitle } from "../src/contributions/domain/PullRequestTitle.ts";
import { npmRegistry } from "../src/quests/adapters/npm.registry.ts";
import { QuestCatalog } from "../src/quests/application/QuestCatalog.ts";
import { QuestMap } from "../src/quests/domain/QuestMap.ts";
import { Quests } from "../src/quests/domain/Quests.ts";
import { SavedData } from "../src/shared/application/SavedData.ts";
import { Month } from "../src/shared/domain/Month.ts";
import { readmeSkills } from "../src/skills/adapters/readme.skills.ts";

const today = Month.of("2026-01-15");
const savedData = new SavedData({ strict: false, warn: () => {} });

test("January looks back on the December before it, whole", () => {
  const month = today.previous();
  assert.deepEqual(
    [month.firstDay(), month.lastDay(), month.label()],
    ["2025-12-01", "2025-12-31", "December 2025"],
  );
});

const station = { role: "Engineer", stack: "Go, SQL", fullTime: true };
const career = new Career({
  school: { name: "School", role: "Intern" },
  stations: [
    { ...station, name: "Lab", start: "2015-01", end: "2015-06", fullTime: false },
    {
      ...station,
      name: "Acme",
      start: "2018-01",
      end: "2022-12",
      milestones: [{ at: "2020-03", label: "Senior", title: "Senior engineer" }],
    },
    { ...station, name: "Now Inc", start: "2023-01" },
  ],
});
test("experience counts full-time positions only", () => {
  assert.equal(career.yearsAt(today), 8);
  assert.equal(career.longestYearsAt(today), 5);
  assert.deepEqual(career.current(), { role: "Engineer", company: "Now Inc" });
});
test("roles are newest first, with their promotions; internships fold into one line", () => {
  const [latest, earlier] = career.roles();
  assert.equal(latest.dates, "2023 → now");
  assert.deepEqual(earlier.titles, [
    { title: "Engineer" },
    { title: "Senior engineer", since: "2020" },
  ]);
  assert.equal(career.early().years, "2015–2015");
});

const quest = (name: string, releases: number, more = {}) => ({
  name,
  releases,
  line: "",
  href: "",
  keywords: [] as string[],
  updated: "2025-12-01",
  members: 1,
  ...more,
});
const rules = {
  groups: [{ name: "Ship", emoji: "S", match: ["release"] }],
  otherGroup: "Other",
  otherEmoji: "O",
  minShare: 0.1,
  minTileShare: 0.2,
};
test("a total of downloads is left out when one figure is missing", () => {
  const known = quest("a", 1, { downloads: 2 });
  assert.equal(Quests.of([known, known]).downloads(), 4);
  assert.equal(Quests.of([known, quest("b", 1)]).downloads(), undefined);
  assert.equal(Quests.of([]).downloads(), undefined);
});
test("quests join the group they are about, and small ones share a tile", () => {
  const quests = Quests.of([
    quest("release-kit", 90),
    quest("x", 5),
    quest("y", 5, { updated: "2020-01-01" }),
  ]);
  const [ship, other] = new QuestMap({ rules, today }).groupsOf(quests);
  assert.deepEqual([ship.name, ship.tiles[0].weight], ["Ship", 90]);
  assert.equal(other.tiles.length, 1);
  const [shared] = other.tiles;
  assert.deepEqual([shared.more?.length, shared.releases, shared.weight], [2, 10, 20]);
  assert.equal(shared.recent, true);
});
test("a quest too old moves to the earlier ones, newest first", () => {
  const quests = Quests.of([
    quest("old", 1, { updated: "2020-01-01" }),
    quest("older", 1, { updated: "2019-01-01" }),
    quest("new", 1),
  ]);
  const age = { months: 24, today };
  const names = (some: Quests) => some.asFacts().map(({ name }) => name);
  assert.deepEqual(names(quests.updatedWithin(age)), ["new"]);
  assert.deepEqual(names(quests.olderThan(age)), ["old", "older"]);
});

const published = (name: string, more = {}) => ({
  name,
  version: "1.0.0",
  date: "2025-01-01",
  description: `${name}: what it does`,
  keywords: [],
  href: "",
  ...more,
});
test("plugins count with their tool, parked packages do not, and a failed figure is retried once", async () => {
  let asked = 0;
  const registry: PackageRegistry = {
    publishedBy: () =>
      Promise.resolve([
        published("kit"),
        published("@kit/plugin", { date: "2025-05-01" }),
        published("parked", { version: "0.0.0" }),
        published("held", { description: "Coming soon" }),
      ]),
    historyOf: () => Promise.resolve({ versions: ["0.0.0", "0.1.0", "1.0.0"] }),
    downloadsIn: () => {
      asked += 1;
      return Promise.reject(new Error("429"));
    },
  };
  const catalog = new QuestCatalog({
    registry,
    savedData,
    today,
    maintainer: "me",
    parked: /^0\.0\.0(-|$)/,
    lines: {},
    pause: () => Promise.resolve(),
  });
  const [only, ...others] = await catalog.read();
  assert.equal(others.length, 0);
  assert.deepEqual(
    [only.name, only.line, only.members, only.updated, only.releases, only.downloads],
    ["kit", "kit", 2, "2025-05-01", 2, undefined],
  );
  assert.equal(asked, 2);
});

test("a title says what kind of change it is", () => {
  const kindOf = (title: string) => new PullRequestTitle(title).describe();
  assert.deepEqual(kindOf("fix(mf): keep the range"), { kind: "Fix", title: "Keep the range" });
  assert.deepEqual(kindOf("[@types/x] add y"), { kind: "Types", title: "Add y" });
  assert.deepEqual(kindOf("Something else"), { kind: "Change", title: "Something else" });
});

const policy = new ContributionPolicy({
  user: "me",
  ownOrgs: ["mine", "Employer"],
  keepOrgs: ["employer"],
  excludeRepos: ["a/sandbox"],
  minStars: 50,
  shownKinds: ["Fix", "Feature"],
  trivial: /typo/i,
  weights: { Fix: 3, Feature: 3, Change: 1 },
});
const pull = (repo: string, title: string, id: number) => ({
  repo,
  title,
  url: `https://github.com/${repo}/pull/${id}`,
  date: "2025-01-01",
});
const prs = [
  pull("a/small", "fix: one", 1),
  pull("a/big", "fix: two", 2),
  pull("a/big", "feat: three", 3),
  pull("a/big", "fix: typo", 4),
  pull("a/unknown", "fix: x", 5),
  pull("a/sandbox", "fix: x", 6),
  pull("mine/own", "fix: x", 7),
];
const host: CodeHost = {
  mergedPullRequests: () => Promise.resolve(prs),
  repository: (name) =>
    Promise.resolve({ stars: name === "a/unknown" ? 1 : 100, description: "A tool. More" }),
  linesOf: (url) =>
    url.endsWith("/1") ? Promise.reject(new Error("down")) : Promise.resolve([10, 2]),
};
const saved = { prs: [], repos: {}, lines: { [prs[0].url]: [1, 1] as const } };
const read = (data: SavedData) =>
  new ContributionLog({ host, savedData: data, policy, author: "me", year: 2026, saved }).read({
    fresh: true,
  });
test("contributions are other people's projects, with reach, largest first", async () => {
  const records = await read(savedData);
  assert.deepEqual(policy.owners(), ["me", "mine"]);
  assert.deepEqual(new Contributions({ records, policy, year: 2026 }).byRepository(), [
    { repo: "a/big", about: "A tool", added: 20, removed: 4, kinds: "1 fix · 1 feature" },
    { repo: "a/small", about: "A tool", added: 1, removed: 1, kinds: "1 fix" },
  ]);
});
test("a strict run stops rather than using saved data", async () => {
  await assert.rejects(read(new SavedData({ strict: true, warn: () => {} })), /no live data: down/);
});

const web = { text: () => Promise.resolve(""), json: () => Promise.resolve({ oops: 1 }) };
test("an answer of the wrong shape is refused where it enters", async () => {
  await assert.rejects(npmRegistry(web).publishedBy("me"));
  await assert.rejects(readmeSkills({ web, repo: "me/skills" }).skills(), /no skills table/);
});
