// This site's profile: portfolio.config.ts and the saved data, given to @arnaud-zg/profile.
import { createProfile } from "@arnaud-zg/profile";

import config from "../portfolio.config";
import github from "./data/snapshots/github.json";
import npm from "./data/snapshots/npm.json";
import skills from "./data/snapshots/skills.json";
import substack from "./data/snapshots/substack.json";

export const profile = createProfile({
  settings: config,
  run: {
    strict: process.env.STRICT_DATA === "1",
    now: new Date(),
    snapshots: { github, npm, skills, substack },
  },
});
