// What the portfolio shows, in one place. Data is fetched at build time; this file decides
// what to keep. Edit it, rebuild, done.

export default {
  github: {
    user: "arnaud-zg",
    // Organisations I run. Work on their repos never counts as an open-source contribution.
    // Public organisations are also read from GitHub at build time and excluded automatically.
    ownOrgs: ["airmelon-studio", "contraband-corp", "crispy-best", "semaphore-corporation", "Solfanto", "hangry-community", "imagette"],
    // Organisations to keep even though I am a member (my employer's open source counts).
    keepOrgs: ["doctolib"],
  },
  npm: {
    maintainer: "arnaud-zg",
  },
  substack: {
    feed: "https://arnaudzg.substack.com/feed",
  },
} as const;
