// The whole profile, as a site uses it. Only the network is faked.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { TestContext } from "node:test";

import { createProfile } from "../src/composition.ts";

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
  package: { name, version: "1.0.0", date: "2025-12-01", description: `${name}: how`, ...more },
});
const history = (releases: number) => ({
  versions: Object.fromEntries(["0.0.0", ...Array(releases).keys()].map((v) => [v, {}])),
});
const pull = (repo: string, title: string, id: number) => ({
  repository_url: `https://api.github.com/repos/${repo}`,
  title,
  html_url: `https://github.com/${repo}/pull/${id}`,
  closed_at: "2025-01-01",
});
const answers: Record<string, unknown> = {
  "https://registry.npmjs.org/-/v1/search": {
    objects: [
      published("release-kit"),
      published("@release-kit/plugin"),
      published("x"),
      published("y"),
      published("old", { date: "2020-01-01" }),
      published("parked", { version: "0.0.0" }),
      published("held", { description: "Coming soon" }),
    ],
  },
  "https://registry.npmjs.org/release-kit": history(8),
  "https://registry.npmjs.org/x": history(1),
  "https://registry.npmjs.org/y": history(1),
  "https://registry.npmjs.org/old": history(1),
  "https://api.npmjs.org/downloads/point/2025-12-01:2025-12-31/release-kit,x,y,old": {
    "release-kit": { downloads: 10 },
    x: { downloads: 2 },
    y: { downloads: 3 },
    old: null,
  },
  "https://api.github.com/search/issues": {
    items: [
      pull("a/small", "fix(core): one", 1),
      pull("a/big", "fix: two", 2),
      pull("a/big", "feat: three", 3),
      pull("a/big", "fix: typo", 4),
      pull("a/big", "docs: five", 5),
      pull("a/unknown", "fix: six", 6),
      pull("a/sandbox", "fix: seven", 7),
      pull("mine/own", "fix: eight", 8),
      pull("employer/app", "feat: nine", 9),
    ],
  },
  "https://api.github.com/repos/a/small/pulls/1": { additions: 1, deletions: 1 },
  "https://api.github.com/repos/a/big/pulls/2": { additions: 10, deletions: 2 },
  "https://api.github.com/repos/a/big/pulls/3": { additions: 10, deletions: 2 },
  "https://api.github.com/repos/employer/app/pulls/9": { additions: 5, deletions: 0 },
  ...Object.fromEntries(
    ["a/small", "a/big", "mine/own", "employer/app"].map((repo) => [
      `https://api.github.com/repos/${repo}`,
      { stargazers_count: 100, description: "🚀 A tool (fast). More" },
    ]),
  ),
  "https://api.github.com/repos/a/unknown": { stargazers_count: 1, description: null },
  "https://raw.githubusercontent.com/me/skills/HEAD/README.md":
    "| Do it | [`do-it`](./do) |\n| Go out | [`go`](https://go.dev) |\ntext",
  "https://me.substack.com/feed": `<item><title><![CDATA[Q &amp; A]]></title>
    <description>Why ?</description><link>https://me.dev/1</link>
    <pubDate>Wed, 05 Nov 2025 10:00:00 GMT</pubDate>
    <enclosure url="https://images.dev/a?w=2000" /></item>`,
};
const snapshots = {
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

// `asked` lists the calls; a source left out of `known` is down.
const profileFrom = (t: TestContext, { known = answers, strict = false } = {}) => {
  const asked: string[] = [];
  t.mock.method(console, "warn", () => {});
  t.mock.method(globalThis, "fetch", (url: string) => {
    asked.push(url);
    const answer = known[url] ?? known[url.split("?")[0]];
    if (answer === undefined) return Promise.resolve(new Response("", { status: 503 }));
    return Promise.resolve(
      new Response(typeof answer === "string" ? answer : JSON.stringify(answer)),
    );
  });
  const run = { strict, now: new Date("2026-01-15"), snapshots };
  return { asked, ...createProfile({ settings, run }) };
};

test("career: experience counts full-time jobs, newest first, with promotions", (t) => {
  const career = profileFrom(t).career();
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

test("side quests: plugins join their tool, parked ones are left out, old ones move to earlier", async (t) => {
  const quests = await profileFrom(t).sideQuests();
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

test("side quests: downloads that fail are retried once, then left out", async (t) => {
  const known = Object.fromEntries(
    Object.entries(answers).filter(([url]) => !url.includes("/downloads/")),
  );
  const profile = profileFrom(t, { known });
  const { tools, downloads } = await profile.sideQuests();
  assert.deepEqual([tools, downloads], [3, undefined]);
  assert.equal(profile.asked.filter((url) => url.includes("/downloads/")).length, 2);
});

test("side quests: one missing figure leaves the total out", async (t) => {
  const url = "https://api.npmjs.org/downloads/point/2025-12-01:2025-12-31/release-kit,x,y,old";
  const known = { ...answers, [url]: { "release-kit": { downloads: 10 }, x: null } };
  assert.equal((await profileFrom(t, { known }).sideQuests()).downloads, undefined);
});

test("contributions: other people's projects with reach, largest first", async (t) => {
  const about = "A tool";
  assert.deepEqual(await profileFrom(t).contributions(), [
    { repo: "a/big", about, added: 20, removed: 4, kinds: "1 fix · 1 feature" },
    { repo: "employer/app", about, added: 5, removed: 0, kinds: "1 feature" },
    { repo: "a/small", about, added: 1, removed: 1, kinds: "1 fix" },
  ]);
});

test("articles: the feed is decoded, with a small cover", async (t) => {
  assert.deepEqual(await profileFrom(t).articles(), [
    {
      title: "Q & A",
      subtitle: "Why",
      url: "https://me.dev/1",
      date: "2025-11-05",
      image: "https://images.dev/a?w=720&h=480&fit=crop",
    },
  ]);
});

test("skills: each row of the table, linked", async (t) => {
  assert.deepEqual(await profileFrom(t).skills(), [
    { name: "do-it", use: "Do it", href: "https://github.com/me/skills/blob/HEAD/do" },
    { name: "go", use: "Go out", href: "https://go.dev" },
  ]);
});

const broken = Object.fromEntries(Object.keys(answers).map((url) => [url, { oops: 1 }]));
for (const [state, known] of [
  ["down", {}],
  ["answering nonsense", broken],
] as const) {
  test(`a source ${state} gives its saved data`, async (t) => {
    const profile = profileFrom(t, { known });
    assert.deepEqual(await profile.contributions(), [
      { repo: "a/saved", about: "Saved", added: 3, removed: 4, kinds: "1 fix" },
    ]);
    assert.equal((await profile.skills())[0].name, "saved");
    assert.deepEqual(await profile.articles(), []);
    assert.equal((await profile.sideQuests()).tools, 0);
  });
  test(`a source ${state} stops a strict run`, async (t) => {
    const profile = profileFrom(t, { known, strict: true });
    await assert.rejects(profile.contributions(), /no live data/);
    await assert.rejects(profile.skills(), /no live data/);
    await assert.rejects(profile.articles(), /no live data/);
    await assert.rejects(profile.sideQuests(), /no live data/);
  });
}

test("a refresh asks again for what is saved", async (t) => {
  const profile = profileFrom(t);
  const { prs, repos } = await profile.live.github();
  assert.deepEqual([prs.length, repos["a/big"]], [8, { stars: 100, about: "A tool" }]);
  assert.equal((await profile.live.npm())[0].name, "release-kit");
});

test("saved data of the wrong shape stops the build", () => {
  const run = { strict: false, now: new Date(), snapshots: { ...snapshots, npm: [{}] } };
  assert.throws(() => createProfile({ settings, run }));
});
