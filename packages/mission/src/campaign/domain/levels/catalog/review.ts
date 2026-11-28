// What the reviewer says under each row of the review after a map, by how it went.
import type { ReviewId, Verdict } from "../../../../combat/domain/score.ts";

export const REVIEW = {
  coverage: {
    praise: "COVERAGE GREEN. THE CI BADGE IS PROUD.",
    meh: "TESTED THE HAPPY PATH. MOSTLY.",
    roast: "SHIPPED ON VIBES.",
  },
  incidents: {
    praise: "ZERO INCIDENTS. ON-CALL SLEPT ALL NIGHT.",
    meh: "ONE POSTMORTEM. BLAMELESS, THEY SAID.",
    roast: "THE PAGER KNOWS YOUR NAME NOW.",
  },
  leadTime: {
    praise: "SHIPPED BEFORE THE STANDUP ENDED.",
    meh: "ON TIME, IF YOU SQUINT.",
    roast: "THIS SPRINT HAS BECOME A MARATHON.",
  },
  knowledge: {
    praise: "EVERY SKILL PICKED UP. EVEN READ THE DOCS.",
    meh: "SOME SKILLS LEFT IN THE BACKLOG.",
    roast: "LEARNING? NEXT QUARTER, MAYBE.",
  },
  quality: {
    praise: "CLEAN CODE. THE REVIEWER IS SPEECHLESS.",
    meh: "LGTM, WITH A FEW NITS.",
    roast: "REQUEST CHANGES. MANY OF THEM.",
  },
  combo: {
    praise: "FLOW STATE. DO NOT DISTURB.",
    meh: "A FEW GOOD STREAKS.",
    roast: "CONTEXT SWITCHING ALL DAY.",
  },
  interest: {
    praise: "NO DEBT. WHO ARE YOU?",
    meh: "A LITTLE DEBT. IT'S IN THE BACKLOG.",
    roast: "THE INTEREST IS DUE. IT ALWAYS IS.",
  },
} as const satisfies { [K in ReviewId]: { [V in Verdict]: string } };
