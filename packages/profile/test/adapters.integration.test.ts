// One contract per port: the in-memory adapter and the live one, on a web in memory, must agree.
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { TestContext } from "node:test";

import { memoryFeed } from "../src/articles/adapters/memory.feed.ts";
import { substackFeed } from "../src/articles/adapters/substack.feed.ts";
import { githubHost } from "../src/contributions/adapters/github.host.ts";
import { memoryHost } from "../src/contributions/adapters/memory.host.ts";
import { memoryRegistry } from "../src/quests/adapters/memory.registry.ts";
import { npmRegistry } from "../src/quests/adapters/npm.registry.ts";
import { ghWeb } from "../src/shared/adapters/gh.web.ts";
import { memoryWeb } from "../src/shared/adapters/memory.web.ts";
import { Month } from "../src/shared/domain/Month.ts";
import { memorySkills } from "../src/skills/adapters/memory.skills.ts";
import { readmeSkills } from "../src/skills/adapters/readme.skills.ts";

const kit = {
  name: "kit",
  version: "1.0.0",
  date: "2025-12-01",
  description: "A kit",
  keywords: ["k"],
  href: "https://www.npmjs.com/package/kit",
};
const other = { ...kit, name: "other", href: "https://www.npmjs.com/package/other" };
const month = Month.of("2025-12");
const POINT = "https://api.npmjs.org/downloads/point/2025-12-01:2025-12-31";
const npmAnswers = {
  "https://registry.npmjs.org/-/v1/search": {
    objects: [
      { package: { ...kit, date: "2025-12-01T10:00:00Z", href: undefined } },
      { package: { ...other, links: { npm: other.href } } },
    ],
  },
  "https://registry.npmjs.org/kit": {
    versions: { "0.9.0": {}, "1.0.0": {} },
    time: { "0.9.0": "2025-11-01T10:00:00Z", "1.0.0": "2025-12-01T10:00:00Z" },
  },
  [`${POINT}/kit,other`]: { kit: { downloads: 7 }, other: null },
  [`${POINT}/kit`]: { downloads: 7 },
};
const versions = { "0.9.0": "2025-11-01", "1.0.0": "2025-12-01" };
const registries = {
  memory: memoryRegistry({
    maintainer: "me",
    packages: [
      { ...kit, versions, downloads: 7 },
      { ...other, versions },
    ],
  }),
  npm: npmRegistry(memoryWeb(npmAnswers)),
};
for (const [name, registry] of Object.entries(registries))
  test(`${name} registry: packages, their versions and the downloads it knows`, async () => {
    assert.deepEqual(await registry.publishedBy("me"), [kit, other]);
    assert.deepEqual(await registry.versionsOf("kit"), versions);
    const figures = new Map([["kit", 7]]);
    assert.deepEqual(await registry.downloadsIn({ month, names: ["kit", "other"] }), figures);
    assert.deepEqual(await registry.downloadsIn({ month, names: ["kit"] }), figures);
    await assert.rejects(registry.versionsOf("missing"));
  });

const pull = { repo: "a/b", title: "fix: it", url: "https://github.com/a/b/pull/1", date: "2025" };
const github = memoryWeb({
  "https://api.github.com/search/issues": {
    items: [
      {
        repository_url: "https://api.github.com/repos/a/b",
        title: pull.title,
        html_url: pull.url,
        closed_at: pull.date,
      },
    ],
  },
  "https://api.github.com/repos/a/b": { stargazers_count: 9, description: "B" },
  "https://api.github.com/repos/a/b/pulls/1": { additions: 3, deletions: 1 },
});
const hosts = {
  memory: memoryHost({
    pullRequests: [
      { ...pull, author: "me", lines: [3, 1] },
      { ...pull, repo: "mine/c", author: "me", lines: [1, 1] },
    ],
    repositories: { "a/b": { stars: 9, description: "B" } },
  }),
  github: githubHost(github),
};
for (const [name, host] of Object.entries(hosts))
  test(`${name} host: pull requests outside, their repository and lines`, async () => {
    assert.deepEqual(await host.mergedPullRequests({ author: "me", outside: ["mine"] }), [pull]);
    assert.deepEqual(await host.repository("a/b"), { stars: 9, description: "B" });
    assert.deepEqual(await host.linesOf(pull.url), [3, 1]);
    await assert.rejects(host.repository("a/missing"));
    await assert.rejects(host.linesOf("https://github.com/a/b/pull/404"));
  });

const url = "https://me.dev/feed";
const xml = `<item><title><![CDATA[Q &amp; A]]></title>
  <description>Why ?</description><link>https://me.dev/1</link>
  <pubDate>Wed, 05 Nov 2025 10:00:00 GMT</pubDate>
  <enclosure url="https://images.dev/a?w=2000" /></item>`;
const article = {
  title: "Q & A",
  subtitle: "Why",
  url: "https://me.dev/1",
  date: "2025-11-05",
  image: "https://images.dev/a?w=2000",
};
const substack = substackFeed({ web: memoryWeb({ [url]: xml }), url });
for (const [name, feed] of Object.entries({ memory: memoryFeed([article]), substack }))
  test(`${name} feed: articles, decoded`, async () => {
    assert.deepEqual(await feed.articles(), [article]);
  });
test("substack feed: a small cover", () => {
  assert.equal(substack.coverOf(article.image), "https://images.dev/a?w=720&h=480&fit=crop");
});

const README = "https://raw.githubusercontent.com/me/skills/HEAD/README.md";
const table = "| Do it | [`do-it`](./do) |\n| Go out | [`go`](https://go.dev) |\ntext";
const skills = [
  { name: "do-it", use: "Do it", href: "https://github.com/me/skills/blob/HEAD/do" },
  { name: "go", use: "Go out", href: "https://go.dev" },
];
const lists = {
  memory: memorySkills(skills),
  readme: readmeSkills({ web: memoryWeb({ [README]: table }), repo: "me/skills" }),
};
for (const [name, list] of Object.entries(lists))
  test(`${name} skills: each one, linked`, async () => {
    assert.deepEqual(await list.skills(), skills);
  });

test("npm registry: downloads that fail are asked once more", async () => {
  const web = memoryWeb(npmAnswers);
  let calls = 0;
  const flaky = {
    ...web,
    json: (asked: string) => {
      calls += 1;
      return calls === 1 ? Promise.reject(new Error("429")) : web.json(asked);
    },
  };
  const figures = await npmRegistry(flaky).downloadsIn({ month, names: ["kit"] });
  assert.deepEqual([figures.get("kit"), calls], [7, 2]);
});

test("an answer of the wrong shape is refused where it enters", async () => {
  const web = { text: () => Promise.resolve("oops"), json: () => Promise.resolve({ oops: 1 }) };
  await assert.rejects(npmRegistry(web).publishedBy("me"));
  await assert.rejects(npmRegistry(web).downloadsIn({ month, names: ["kit"] }));
  await assert.rejects(githubHost(web).mergedPullRequests({ author: "me", outside: [] }));
  await assert.rejects(githubHost(web).repository("a/b"));
  await assert.rejects(githubHost(web).linesOf(pull.url));
  await assert.rejects(substackFeed({ web, url }).articles(), /no articles/);
  await assert.rejects(readmeSkills({ web, repo: "me/skills" }).skills(), /no skills table/);
});

// Stands in for gh: an executable that answers one address and refuses the rest.
const fakeGh = (t: TestContext) => {
  const dir = mkdtempSync(join(tmpdir(), "gh-"));
  t.after(() => rmSync(dir, { recursive: true }));
  const file = join(dir, "gh");
  writeFileSync(
    file,
    `#!/bin/sh
if [ "$1 $2" = "api https://api.github.com/ok" ]; then echo '{"stars":9}'; exit 0; fi
echo "gh: API rate limit exceeded (HTTP 403)" >&2
exit 1
`,
  );
  chmodSync(file, 0o755);
  return file;
};

test("gh web: what gh answers, as text and as JSON", async (t) => {
  const web = ghWeb(fakeGh(t));
  assert.deepEqual(await web.json("https://api.github.com/ok"), { stars: 9 });
  assert.equal(await web.text("https://api.github.com/ok"), '{"stars":9}\n');
});

test("gh web: a refusal gives gh's own reason", async (t) => {
  await assert.rejects(ghWeb(fakeGh(t)).json("https://api.github.com/no"), {
    message: "gh: API rate limit exceeded (HTTP 403): https://api.github.com/no",
  });
});

test("gh web: a missing gh says so", async () => {
  await assert.rejects(ghWeb("/missing/gh").json("https://api.github.com/ok"), {
    message: "gh is not installed: https://cli.github.com",
  });
});
