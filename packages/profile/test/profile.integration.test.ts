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
      {
        ...job,
        name: "Lab",
        emoji: "L",
        motion: "fizz",
        start: "2015-01",
        end: "2015-06",
        fullTime: false,
      },
      { ...job, name: "Acme", start: "2018-01", end: "2022-12", milestones: [promotion] },
      { ...job, name: "Now Inc", emoji: "N", motion: "pulse", start: "2023-01" },
    ],
  },
  github: {
    user: "me",
    ownOrgs: ["mine", "Employer"],
    keepOrgs: ["employer"],
    excludeRepos: ["a/sandbox"],
    shownKinds: ["Fix", "Feature"],
    trivial: /typo/i,
    recentMonths: 6,
  },
  npm: {
    maintainer: "me",
    parkedVersion: /^0\.0\.0(-|$)/,
    activeMonths: 24,
    lines: {},
    groups: [{ name: "Ship", emoji: "S", match: ["release"] }],
    otherGroup: "Other",
    otherEmoji: "O",
    minTileShare: 0.3,
    minTileBeside: 0.4,
  },
  skills: { repo: "me/skills" },
  substack: { feed: "https://me.substack.com/feed" },
};

const undated = (...versions: string[]): Record<string, string> =>
  Object.fromEntries(versions.map((one) => [one, ""]));
const published = (name: string, more = {}) => ({
  name,
  version: "1.0.0",
  date: "2025-12-01",
  description: `${name}: how`,
  keywords: [],
  href: "",
  versions: undated("0.0.0", "1.0.0"),
  downloads: 5,
  ...more,
});
const packages = [
  published("release-kit", { versions: undated("0.0.0", ..."12345678") }),
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
  pull("a/big", "fix: one more typo"),
  pull("a/big", "docs: a page"),
  pull("a/sandbox", "fix: it"),
  pull("mine/own", "fix: it"),
  pull("employer/app", "feat: nine", [5, 0]),
];
// Within the six months before 2026-01-15.
const recent = (repo: string, n: number, title: string, more = {}) => ({
  ...pull(repo, title),
  url: `https://github.com/${repo}/pull/${n}`,
  date: "2025-12-01",
  ...more,
});
const mine = (n: number) => ({ url: `https://github.com/a/new/issues/${n}`, author: "Me" });
const recentPullRequests = [
  recent("a/big", 90, "fix(core): keep the range"),
  recent("a/big", 91, "feat: share it", { open: true, date: "2025-11-01" }),
  recent("a/new", 92, "feat: add it", { open: true, date: "2026-01-10", closes: [mine(5)] }),
  recent("a/new", 93, "fix: parse", {
    open: true,
    closes: [{ url: "https://github.com/a/new/issues/6", author: "someone" }],
  }),
  recent("a/old", 94, "fix: stale", { open: true, date: "2025-01-01" }),
  recent("a/big", 95, "fix: a typo", { open: true }),
  recent("mine/own", 96, "fix: it", { open: true }),
];
const tool = { description: "🚀 A tool (fast). More" };
const calendar = { 2025: 1234, 2026: 5 };
const repositories = {
  "a/small": tool,
  "a/big": tool,
  "mine/own": tool,
  "employer/app": tool,
  "a/new": { description: "New" },
};
const article = { title: "T", subtitle: "S", url: "u", date: "2025-11-05", image: "i" };
const skill = { name: "do-it", use: "Do it", href: "h" };
const saved: Saved = {
  github: {
    prs: [{ repo: "a/saved", title: "fix: it", url: "u", date: "2025-01-01" }],
    repos: {
      "a/saved": { about: "Saved" },
      "a/big": { about: "A tool" },
    },
    open: [],
    closes: {},
    lines: { u: [3, 4] },
    contributions: { year: 2024, total: 900 },
  },
  npm: [],
  skills: [{ name: "saved", use: "", href: "" }],
  substack: [],
};
const registryOf = (some: typeof packages) => memoryRegistry({ packages: some, maintainer: "me" });

const profileOn = (some: Partial<Ports>, data: Saved) => {
  const ports = {
    registry: registryOf(packages),
    host: memoryHost({ pullRequests, repositories, calendar }),
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
  registry: { publishedBy: down, versionsOf: down, downloadsIn: down },
  host: {
    mergedPullRequests: down,
    openPullRequests: down,
    issuesClosedBy: down,
    repository: down,
    linesOf: down,
    contributionsIn: down,
  },
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

test("career: each job brings its emoji and its motion to its row, early ones too", () => {
  const career = profileOn({}, saved).career();
  assert.deepEqual(
    career.roles.map(({ emoji, motion }) => [emoji, motion]),
    [
      ["N", "pulse"],
      [undefined, undefined],
    ],
  );
  assert.deepEqual([career.early.stints[0].emoji, career.early.stints[0].motion], ["L", "fizz"]);
});

test("career: each job carries its months, the current one left open", () => {
  const career = profileOn({}, saved).career();
  assert.deepEqual(career.roles[0].since, "2023-01");
  assert.equal(career.roles[0].until, undefined);
  assert.deepEqual(
    [career.early.stints[0].since, career.early.stints[0].until],
    ["2015-01", "2015-06"],
  );
});

test("side quests: plugins join their tool and count its releases, parked ones are left out, old ones move to earlier", async () => {
  const quests = (await profileWith()).sideQuests();
  assert.deepEqual([quests.tools, quests.releases], [3, 11]);
  assert.deepEqual([quests.downloads, quests.month], [15, "December 2025"]);
  assert.deepEqual(
    quests.earlier.map(({ name }) => name),
    ["old"],
  );
  const [ship, other] = quests.groups;
  assert.deepEqual([ship.name, ship.tiles[0].tool.line], ["Ship", "release-kit"]);
  assert.equal(ship.tiles[0].tool.members, 2);
  assert.deepEqual(
    other.tiles.map(({ tool, releases, weight }) => [tool.name, releases, weight]),
    [
      ["x", 1, 3.3],
      ["y", 1, 3.3],
    ],
  );
});

test("side quests: a small tool beside a big one is drawn at least a share of it", async () => {
  const registry = registryOf([
    published("release-big", { versions: undated(..."0123456789") }),
    published("release-small", { versions: undated("1.0.0") }),
  ]);
  const [ship] = (await profileWith({ registry })).sideQuests().groups;
  assert.deepEqual(
    ship.tiles.map(({ tool, weight }) => [tool.name, weight]),
    [
      ["release-big", 10],
      ["release-small", 4],
    ],
  );
});

test("side quests: nightlies and release candidates are not releases", async () => {
  const versions = undated("0.0.0-stage", "1.0.0", "1.1.0-nightly.0", "1.1.0-rc.1", "1.1.0");
  const registry = registryOf([published("a", { versions })]);
  assert.equal((await profileWith({ registry })).sideQuests().releases, 2);
});

test("side quests: monthly releases are the stable ones of the last full month", async () => {
  const versions = {
    "1.0.0": "2025-11-30",
    "1.1.0": "2025-12-01",
    "1.2.0": "2025-12-31",
    "1.3.0-rc.1": "2025-12-31",
    "1.3.0": "2026-01-01",
  };
  const registry = registryOf([published("a", { versions })]);
  const quests = (await profileWith({ registry })).sideQuests();
  assert.deepEqual([quests.monthlyReleases, quests.releases], [2, 4]);
});

test("side quests: a plugin's releases count for its tool", async () => {
  const versions = { "1.0.0": "2025-12-02", "1.1.0": "2025-12-20" };
  const registry = registryOf([
    published("kit", { versions }),
    published("@kit/plugin", { versions: { "1.0.0": "2025-12-10" } }),
  ]);
  const quests = (await profileWith({ registry })).sideQuests();
  assert.deepEqual([quests.tools, quests.monthlyReleases, quests.releases], [1, 3, 3]);
});

test("side quests: one missing figure leaves the total out", async () => {
  const registry = registryOf([published("a"), published("b", { downloads: undefined })]);
  assert.equal((await profileWith({ registry })).sideQuests().downloads, undefined);
});

test("side quests: a refresh without any figure fails", async () => {
  const registry = { ...registryOf(packages), downloadsIn: down };
  await assert.rejects(profileOn({ registry }, saved).live.npm(), /down/);
});

test("contributions: every repository with the lines merged there and the years it spans", async () => {
  const host = memoryHost({
    pullRequests: [...pullRequests, ...recentPullRequests],
    repositories,
    calendar,
  });
  const { repos, figures } = (await profileWith({ host })).contributions();
  const rows = repos.map(({ repo, from, to, merged, review, added, removed }) => ({
    repo,
    years: `${from}–${to}`,
    prs: [merged, review],
    lines: [added, removed],
  }));
  assert.deepEqual(rows, [
    { repo: "a/new", years: "2025–2026", prs: [0, 2], lines: [0, 0] },
    { repo: "a/big", years: "2025–2025", prs: [3, 1], lines: [30, 6] },
    { repo: "a/small", years: "2025–2025", prs: [1, 0], lines: [1, 1] },
    { repo: "employer/app", years: "2025–2025", prs: [1, 0], lines: [5, 0] },
  ]);
  assert.deepEqual(figures, { added: 36, removed: 7, projects: 4, from: 2025, to: 2026 });
});

test("contributions: recent work by repository, the latest activity first", async () => {
  const host = memoryHost({
    pullRequests: [...pullRequests, ...recentPullRequests],
    repositories,
    calendar,
  });
  const { repos } = (await profileWith({ host })).contributions();
  const threads = repos.map(({ repo, about, threads }) => [
    repo,
    about,
    threads.map(({ status, title }) => `${status}: ${title}`),
  ]);
  assert.deepEqual(threads, [
    ["a/new", "New", ["review: Add it", "review: Parse"]],
    ["a/big", "A tool", ["merged: Keep the range", "review: Share it"]],
    ["a/small", "A tool", []],
    ["employer/app", "A tool", []],
  ]);
});

test("contributions: an issue one reported folds into the pull request that closes it", async () => {
  const host = memoryHost({
    pullRequests: [...pullRequests, ...recentPullRequests],
    repositories,
    calendar,
  });
  const { repos } = (await profileWith({ host })).contributions();
  const [added, parsed] = repos[0].threads;
  assert.deepEqual(added.reported, [{ number: "5", url: "https://github.com/a/new/issues/5" }]);
  assert.deepEqual(parsed.reported, []);
});

test("contributions: own work is left out even when the host returns it", async () => {
  const host = memoryHost({
    pullRequests: [...pullRequests, ...recentPullRequests],
    repositories,
    calendar,
  });
  const careless = {
    ...host,
    mergedPullRequests: () => host.mergedPullRequests({ author: "me", outside: [] }),
    openPullRequests: () => host.openPullRequests({ author: "me", outside: [] }),
  };
  const { repos } = (await profileWith({ host: careless })).contributions();
  assert.deepEqual(repos.map(({ repo }) => repo).sort(), [
    "a/big",
    "a/new",
    "a/small",
    "employer/app",
  ]);
});

test("contributions: the calendar's total is the last full year's", async () => {
  const { calendar: year } = (await profileWith()).contributions();
  assert.deepEqual(year, { year: 2025, total: 1234 });
  assert.deepEqual(profileOn(allDown, saved).contributions().calendar, { year: 2024, total: 900 });
});

test("articles and skills are given as they are", async () => {
  const profile = await profileWith();
  assert.deepEqual(profile.articles(), [article]);
  assert.deepEqual(profile.skills(), [skill]);
});

test("a build shows the saved data, even with every source down", () => {
  const profile = profileOn(allDown, saved);
  const [kept] = profile.contributions().repos;
  assert.deepEqual(
    [kept.repo, kept.about, kept.added, kept.removed, kept.from],
    ["a/saved", "Saved", 3, 4, 2025],
  );
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
  assert.deepEqual(repos["a/big"], { about: "A tool" });
});

test("contributions: only what is shown is saved", async () => {
  const { prs, repos, lines } = await profileOn({}, saved).live.github();
  const shown = ["a/small", "a/big", "a/big", "employer/app"];
  assert.deepEqual(
    prs.map(({ repo }) => repo),
    shown,
  );
  assert.deepEqual(Object.keys(repos), [...new Set(shown)]);
  assert.deepEqual(
    Object.keys(lines),
    prs.map(({ url }) => url),
  );
});

test("contributions: stale pull requests and other people's issues are not saved", async () => {
  const host = memoryHost({
    pullRequests: [...pullRequests, ...recentPullRequests],
    repositories,
    calendar,
  });
  const { open, closes } = await profileOn({ host }, saved).live.github();
  assert.deepEqual(
    open.map(({ url }) => url.split("/").at(-1)),
    ["91", "92", "93"],
  );
  assert.deepEqual(closes, { "https://github.com/a/new/pull/92": [mine(5).url] });
});

test("saved data of the wrong shape stops the build", () => {
  const run = { now: new Date(), snapshots: { ...saved, npm: [{}] } };
  assert.throws(() => createProfile({ settings, run }));
});
