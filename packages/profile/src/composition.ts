// Wires the ports to the live sources.
import type { Ports, ProfileSettings } from "./profile.ts";
import { substackFeed } from "./articles/adapters/substack.feed.ts";
import { githubHost } from "./contributions/adapters/github.host.ts";
import { profileOf } from "./profile.ts";
import { npmRegistry } from "./quests/adapters/npm.registry.ts";
import { fetchWeb } from "./shared/adapters/fetch.web.ts";
import { Snapshots } from "./shared/adapters/snapshots.ts";
import { readmeSkills } from "./skills/adapters/readme.skills.ts";

export type LiveRun = { now: Date; snapshots: unknown };

const AGENT = { "User-Agent": "portfolio-build" };

const livePorts = ({ skills, substack }: ProfileSettings): Ports => {
  const web = fetchWeb(AGENT);
  return {
    registry: npmRegistry(web),
    host: githubHost(fetchWeb({ ...AGENT, Accept: "application/vnd.github+json" })),
    feed: substackFeed({ web, url: substack.feed }),
    list: readmeSkills({ web, repo: skills.repo }),
  };
};

export const createProfile = ({ settings, run }: { settings: ProfileSettings; run: LiveRun }) => {
  const { now, snapshots } = run;
  const saved = Snapshots.parse(snapshots);
  return profileOf({ settings, ports: livePorts(settings), run: { now, saved } });
};
