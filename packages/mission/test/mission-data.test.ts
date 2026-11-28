import assert from "node:assert/strict";
import test from "node:test";

import { missionDataOf } from "../src/arcade/adapters/zod.data.ts";
import { missionLabels } from "../src/arcade/domain/labels.ts";

const chapter = {
  title: "THE EARLY YEARS",
  line: "INTERNSHIPS",
  pickups: [{ name: "PHP", places: ["Acme"], marks: ["✨"], from: 2013, to: null }],
};

test("the page's data is read once it has the mission's shape", () => {
  const data = missionDataOf(
    JSON.stringify({
      chapters: [chapter],
      labels: { hero: "ARNAUD" },
      contact: { href: "#", label: "Hi" },
    }),
  );
  assert.ok(data);
  assert.equal(data.chapters.at(0)?.pickups.at(0)?.to, null);
  assert.equal(data.labels.hero, "ARNAUD");
  assert.equal(data.labels.boot, missionLabels.boot, "a word left out keeps its default");
  assert.deepEqual(data.contact, { href: "#", label: "Hi" });
});

test("a word the mission does not know is dropped", () => {
  const data = missionDataOf(JSON.stringify({ chapters: [], labels: { nope: "x" } }));
  assert.equal(data !== undefined && "nope" in data.labels, false);
});

test("data of the wrong shape, or no JSON at all, never starts the mission", () => {
  assert.equal(missionDataOf(JSON.stringify({ chapters: [{ title: 1 }], labels: {} })), undefined);
  assert.equal(
    missionDataOf(JSON.stringify({ chapters: [chapter], labels: { hero: 7 } })),
    undefined,
  );
  assert.equal(missionDataOf("{ not json"), undefined);
});
