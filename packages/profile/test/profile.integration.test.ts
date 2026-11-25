// The whole profile, on its in-memory adapters: refreshed, then shown from what was saved.
import assert from "node:assert/strict";
import { test } from "node:test";

import type { Ports, Saved } from "../src/profile.ts";
import { memoryFeed } from "../src/articles/adapters/memory.feed.ts";
import { createProfile } from "../src/composition.ts";
import { memoryHost } from "../src/contributions/adapters/memory.host.ts";
import { profileOf } from "../src/profile.ts";
import { memoryRegistry } from "../src/quests/adapters/memory.registry.ts";
import { memorySkills } from "../src/skills/adapters/memory.skills.ts";

const job = { role: "Engineer", stack: "Go, SQL", fullTime: true };
const promotion = { at: "2020-03", label: "Senior", title: "Senior engineer" };
const settings = {
  career: {
    school: { name: "School", role: "Intern" },
    stations: [
      { ...job, name: "Lab", start: "2015-01", end: "2015-06", fullTime: false },
      { ...job, name: "Acme", start: "2018-01", end: "2022-12", milestones: [promotion] },
      { ...job, name: "Now Inc", start: "2023-01" },
    ],
  },
  github: {
    user: "me",
    ownOrgs: ["mine", "Employer"],
    keepOrgs: ["employer"],
    excludeRepos: ["a/sandbox"],
    minStars: 50,
    shownKinds: ["Fix", "Feature"],
    trivial: /typo/i,
    weights: { Fix: 3, Feature: 3 },
  },
  npm: {
    maintainer: "me",
    parkedVersion: /^0\.0\.0(-|$)/,
    activeMonths: 24,
    lines: {},
    groups: [{ name: "Ship", emoji: "S", match: ["release"] }],
    otherGroup: "Other",
    otherEmoji: "O",
    minShare: 0.2,
    minTileShare: 0.3,
  },
  skills: { repo: "me/skills" },
  substack: { feed: "https://me.substack.com/feed" },
};

const published = (name: string, more = {}) => ({
  name,
  version: "1.0.0",
  date: "2025-12-01",
  description: `${name}: how`,
  keywords: [],
  href: "",
  versions: ["0.0.0", "1.0.0"],
  downloads: 5,
  ...more,
});
const packages = [
  published("release-kit", { versions: ["0.0.0", ..."12345678"] }),
  published("@release-kit/plugin"),
  published("x"),
  published("y"),
  published("old", { date: "2020-01-01" }),
  published("parked", { version: "0.0.0" }),
  published("held", { description: "Coming soon" }),
];
const pull = (repo: string, title: string, lines: [number, number] = [10, 2]) => ({
  repo,
  title,
  url: `https://github.com/${repo}/pull/${title.length}`,
  date: "2025-01-01",
  author: "me",
  lines,
});
const pullRequests = [
  pull("a/small", "fix(core): one", [1, 1]),
  pull("a/big", "fix: two"),
  pull("a/big", "feat: three"),
  pull("a/big", "fix: a typo"),
  pull("a/big", "docs: a page"),
  pull("a/unknown", "fix: it"),
  pull("a/sandbox", "fix: it"),
  pull("mine/own", "fix: it"),
  pull("employer/app", "feat: nine", [5, 0]),
];
const tool = { stars: 100, description: "🚀 A tool (fast). More" };
const repositories = {
  "a/small": tool,
  "a/big": tool,
  "a/unknown": { ...tool, stars: 1 },
  "mine/own": tool,
  "employer/app": tool,
};
const article = { title: "T", subtitle: "S", url: "u", date: "2025-11-05", image: "i" };
const skill = { name: "do-it", use: "Do it", href: "h" };
const saved: Saved = {
  github: {
    prs: [{ repo: "a/saved", title: "fix: it", url: "u", date: "2025-01-01" }],
    repos: {
      "a/saved": { stars: 90, about: "Saved" },
      "a/big": { stars: 60, about: "A tool" },
    },
    lines: { u: [3, 4] },
  },
  npm: [],
  skills: [{ name: "saved", use: "", href: "" }],
  substack: [],
};
const registryOf = (some: typeof packages) => memoryRegistry({ packages: some, maintainer: "me" });

const profileOn = (some: Partial<Ports>, data: Saved) => {
  const ports = {
    registry: registryOf(packages),
    host: memoryHost({ pullRequests, repositories }),
    feed: memoryFeed([article]),
    list: memorySkills([skill]),
    ...some,
  };
  const run = { now: new Date("2026-01-15"), saved: data };
  return profileOf({ settings, ports, run });
};
const profileWith = async (some: Partial<Ports> = {}) => {
  const { live } = profileOn(some, saved);
  const [github, npm, skills, substack] = await Promise.all([
    live.github(),
    live.npm(),
    live.skills(),
    live.substack(),
  ]);
  return profileOn(some, { github, npm, skills, substack });
};
const down = () => Promise.reject(new Error("down"));
const allDown: Partial<Ports> = {
  registry: { publishedBy: down, historyOf: down, downloadsIn: down },
  host: { mergedPullRequests: down, repository: down, linesOf: down },
  feed: { articles: down, coverOf: (image) => image },
  list: { skills: down },
};

test("career: experience counts full-time jobs, newest first, with promotions", () => {
  const career = profileOn({}, saved).career();
  assert.deepEqual([career.years, career.longestYears], [8, 5]);
  assert.deepEqual(career.current, { role: "Engineer", company: "Now Inc" });
  assert.deepEqual(
    career.roles.map(({ company, dates }) => [company, dates]),
    [
      ["Now Inc", "2023 → now"],
      ["Acme", "2018 → 2022"],
    ],
  );
  const started = { title: "Engineer" };
  assert.deepEqual(career.roles[1].titles, [started, { title: "Senior engineer", since: "2020" }]);
  assert.equal(career.early.years, "2015–2015");
});

test("side quests: plugins join their tool, parked ones are left out, old ones move to earlier", async () => {
  const quests = (await profileWith()).sideQuests();
  assert.deepEqual([quests.tools, quests.releases], [3, 10]);
  assert.deepEqual([quests.downloads, quests.downloadsMonth], [15, "December 2025"]);
  assert.deepEqual(
    quests.earlier.map(({ name }) => name),
    ["old"],
  );
  const [ship, other] = quests.groups;
  assert.deepEqual([ship.name, ship.tiles[0].tool?.line], ["Ship", "release-kit"]);
  assert.equal(ship.tiles[0].tool?.members, 2);
  const [shared, ...more] = other.tiles;
  assert.equal(more.length, 0);
  assert.deepEqual(
    [shared.more?.map(({ name }) => name), shared.releases, shared.weight],
    [["x", "y"], 2, 3],
  );
});

test("side quests: one missing figure leaves the total out", async () => {
  const registry = registryOf([published("a"), published("b", { downloads: undefined })]);
  assert.equal((await profileWith({ registry })).sideQuests().downloads, undefined);
});

test("side quests: a refresh without any figure fails", async () => {
  const registry = { ...registryOf(packages), downloadsIn: down };
  await assert.rejects(profileOn({ registry }, saved).live.npm(), /down/);
});

test("contributions: other people's projects with reach, largest first", async () => {
  const about = "A tool";
  assert.deepEqual((await profileWith()).contributions(), [
    { repo: "a/big", about, added: 20, removed: 4, kinds: "1 fix · 1 feature" },
    { repo: "employer/app", about, added: 5, removed: 0, kinds: "1 feature" },
    { repo: "a/small", about, added: 1, removed: 1, kinds: "1 fix" },
  ]);
});

test("contributions: own work is left out even when the host returns it", async () => {
  const host = memoryHost({ pullRequests, repositories });
  const careless = {
    ...host,
    mergedPullRequests: () => host.mergedPullRequests({ author: "me", outside: [] }),
  };
  const found = (await profileWith({ host: careless })).contributions();
  assert.equal(found.length, 3);
});

test("articles and skills are given as they are", async () => {
  const profile = await profileWith();
  assert.deepEqual(profile.articles(), [article]);
  assert.deepEqual(profile.skills(), [skill]);
});

test("a build shows the saved data, even with every source down", () => {
  const profile = profileOn(allDown, saved);
  assert.deepEqual(profile.contributions(), [
    { repo: "a/saved", about: "Saved", added: 3, removed: 4, kinds: "1 fix" },
  ]);
  assert.equal(profile.skills()[0].name, "saved");
  assert.deepEqual(profile.articles(), []);
  assert.equal(profile.sideQuests().tools, 0);
});

test("a refresh fails when a source is down", async () => {
  const { live } = profileOn(allDown, saved);
  for (const read of Object.values(live)) await assert.rejects(read(), /down/);
});

test("a refresh asks again for what is saved", async () => {
  const { repos } = await profileOn({}, saved).live.github();
  assert.deepEqual(repos["a/big"], { stars: 100, about: "A tool" });
});

test("saved data of the wrong shape stops the build", () => {
  const run = { now: new Date(), snapshots: { ...saved, npm: [{}] } };
  assert.throws(() => createProfile({ settings, run }));
});
