// The colleagues met on the way walk in, act by their behaviour, and walk off. Never shot.
import type { Behaviour, ColleagueId } from "../../campaign/domain/levels/catalog/colleagues.ts";
import type { ExerciseId } from "../../campaign/domain/levels/catalog/exercises.ts";
import { COLLEAGUES } from "../../campaign/domain/levels/catalog/colleagues.ts";
import { linesOf } from "../domain/layout.ts";
import * as art from "./canvas.draw.ts";
import { INK } from "./canvas.sprites.ts";
import { drawText, textWidth } from "./pixel.font.ts";

export type Office = {
  readonly hero: () => { readonly x: number; readonly alive: boolean };
  readonly view: () => { readonly camX: number; readonly W: number; readonly gy: number };
  readonly context: () => string;
  readonly inDebt: () => boolean;
  readonly review: (id: ExerciseId) => void;
  readonly reviewing: () => boolean;
  readonly nit: (nit: { x: number; y: number; text: string }) => void;
  readonly scope: (extra: number) => void;
  readonly say: (text: string) => void;
};

type State = "wait" | "act" | "leave" | "gone";
type Walker = {
  id: ColleagueId;
  x: number;
  t: number;
  state: State;
  thrown: number;
  next: number;
  heard: number;
};
const SAYS_FOR = 3.5; // seconds a colleague talks once in sight, unless acting
type Step = (args: { walker: Walker; dt: number }) => void;

const NIT_EVERY = 1.6;

export class Colleagues {
  private walkers: Walker[] = [];

  constructor(private readonly office: Office) {}

  add({ id, x }: { id: ColleagueId; x: number }) {
    this.walkers.push({ id, x, t: 0, state: "wait", thrown: 0, next: 0.8, heard: 0 });
  }

  clear() {
    this.walkers = [];
  }

  update(dt: number) {
    for (const walker of this.walkers) {
      walker.t += dt;
      if (this.inSight(walker)) walker.heard += dt;
      this.steps[COLLEAGUES[walker.id].behaviour]({ walker, dt });
      if (walker.state === "leave") this.walkOff({ walker, dt });
    }
    this.walkers = this.walkers.filter((w) => w.state !== "gone");
  }

  private readonly steps: { readonly [K in Behaviour]: Step } = {
    // Stops the hero for a code review once they are close, and leaves once it is done.
    review: ({ walker }) => {
      const spec = COLLEAGUES[walker.id];
      if (walker.state === "wait" && this.near(walker) && "review" in spec) {
        walker.state = "act";
        this.office.review(spec.review);
        return;
      }
      if (walker.state === "act" && !this.office.reviewing()) this.leave(walker);
    },
    // In sight, throws a nit every so often, then leaves once out of nits.
    nag: ({ walker, dt }) => {
      const spec = COLLEAGUES[walker.id];
      const nits: readonly string[] = "nits" in spec ? spec.nits : [];
      if (walker.state === "wait" && this.inSight(walker)) walker.state = "act";
      if (walker.state !== "act") return;
      walker.next -= dt;
      if (walker.next > 0) return;
      const { gy } = this.office.view();
      this.office.nit({
        x: walker.x,
        y: gy - 14,
        text: nits.at(walker.thrown % nits.length) ?? "NIT",
      });
      walker.thrown++;
      walker.next = NIT_EVERY;
      if (walker.thrown >= Math.min(4, nits.length)) this.leave(walker);
    },
    // Walks into the fight and grows it: two more foes, right now, small thing.
    scope: ({ walker }) => {
      const spec = COLLEAGUES[walker.id];
      if (walker.state === "wait" && this.inSight(walker)) {
        walker.state = "act";
        walker.t = 0;
        this.office.scope("extra" in spec ? spec.extra : 0);
        return;
      }
      if (walker.state === "act" && walker.t > 2.4) this.leave(walker);
    },
  };

  private near(walker: Walker) {
    const hero = this.office.hero();
    return hero.alive && Math.abs(hero.x + 8 - walker.x) < 16;
  }

  private inSight(walker: Walker) {
    const { camX, W } = this.office.view();
    return walker.x > camX + 10 && walker.x < camX + W - 10;
  }

  private leave(walker: Walker) {
    walker.state = "leave";
    walker.t = 0;
    this.office.say(COLLEAGUES[walker.id].leave);
  }

  private walkOff({ walker, dt }: { walker: Walker; dt: number }) {
    walker.x += 40 * dt;
    const { camX, W } = this.office.view();
    if (walker.x > camX + W + 20) walker.state = "gone";
  }

  // What a colleague says, in a bubble over their head, cut to the stage.
  private words(walker: Walker) {
    const spec = COLLEAGUES[walker.id];
    if (walker.state === "leave") return walker.t < 1.8 ? spec.leave : "";
    if (walker.state === "wait" && walker.heard > SAYS_FOR) return "";
    if (walker.state === "act" && spec.behaviour === "nag") return ""; // the nits do the talking
    const line = this.office.inDebt() ? spec.inDebt : spec.arrive;
    return line.replace("{context}", this.office.context());
  }

  draw({ ctx, t }: { ctx: CanvasRenderingContext2D; t: number }) {
    const { gy, camX, W } = this.office.view();
    for (const walker of this.walkers) {
      const spec = COLLEAGUES[walker.id];
      art.colleague(ctx, {
        x: walker.x - 5,
        feet: gy,
        shirt: spec.shirt,
        hair: spec.hair,
        t,
        walking: walker.state === "leave",
      });
      const said = this.words(walker);
      if (!said || !this.inSight(walker)) continue;
      // A bubble of two short lines at most, over the head, kept on the stage.
      const lines = linesOf({ text: said, width: Math.min(W - 16, 150) }).slice(0, 2);
      const width = Math.max(...lines.map((l) => textWidth(l))) + 6;
      const height = lines.length * 9 + 3;
      const left = Math.round(
        Math.max(camX + 4, Math.min(camX + W - width - 4, walker.x - width / 2)),
      );
      const top = gy - 22 - height;
      art.block(ctx, left, top, width, height, INK.white);
      art.rect(ctx, walker.x - 1, gy - 22, 2, 2, INK.white);
      lines.forEach((line, i) => drawText(ctx, line, left + 3, top + 2 + i * 9, 1, INK.soot));
    }
  }
}
