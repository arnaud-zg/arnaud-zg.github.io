// The whiteboard over the frozen fight: arrows or a tap pick, Space answers, a colleague replies.
import type { Answer, Choice, Exercise } from "../../challenge/domain/exercise.ts";
import type { Key } from "../../input/domain/controls.ts";
import type { MissionLabels } from "../domain/labels.ts";
import type { Placed } from "../domain/layout.ts";
import { column } from "../domain/layout.ts";
import * as art from "./canvas.draw.ts";
import { figureHeight, paintFigure } from "./canvas.figures.ts";
import { drawPlaced } from "./canvas.layout.ts";
import { GOLD, INK } from "./canvas.sprites.ts";
import { drawText, wrap } from "./pixel.font.ts";

export type Board = {
  readonly ctx: CanvasRenderingContext2D;
  readonly size: () => { readonly W: number; readonly H: number };
  readonly frame: (box: { x: number; y: number; w: number; h: number }) => void;
  readonly labels: MissionLabels;
  readonly touch: boolean;
  readonly sound: { tick: () => void; press: () => void; nope: () => void };
  readonly say: (text: string) => void;
  readonly done: (answers: readonly Answer[]) => void;
};

type Reply = { readonly choice: Choice | undefined; readonly t: number };
type Pt = { readonly x: number; readonly y: number };
const READ = 0.6; // a reply can be dismissed after this long, never by accident

export class Whiteboard {
  private step = 0;
  private cursor = 0;
  private t = 0;
  private reply: Reply | undefined;
  private readonly answers: Answer[] = [];
  private rows: { readonly top: number; readonly bottom: number }[] = [];

  constructor(
    private readonly exercise: Exercise,
    private readonly board: Board,
  ) {
    this.speak();
  }

  private current() {
    return this.exercise.steps.at(this.step);
  }

  private speak() {
    const step = this.current();
    if (!step) return;
    const choices = step.choices.map((c, i) => `${i + 1}: ${c.text}`).join(". ");
    this.board.say(`${this.exercise.speaker}: ${this.exercise.intro} ${step.ask} ${choices}`);
  }

  tick(dt: number) {
    this.t += dt;
    if (this.reply) {
      this.reply = { ...this.reply, t: this.reply.t + dt };
      return;
    }
    if (this.t >= this.exercise.time) this.answer(undefined);
  }

  press(key: Key) {
    if (this.reply) return this.carryOn(key);
    const step = this.current();
    if (!step) return;
    const count = step.choices.length;
    if (step.arrows && (key === "left" || key === "right"))
      return this.pick(key === "left" ? 0 : 1);
    if (key === "up" || key === "left") return this.move((this.cursor + count - 1) % count);
    if (key === "down" || key === "right") return this.move((this.cursor + 1) % count);
    if (key === "fire" || key === "jump" || key === "start") this.pick(this.cursor);
  }

  tap(at: Pt) {
    if (this.reply) return this.carryOn("start");
    const row = this.rows.findIndex((r) => at.y >= r.top && at.y <= r.bottom);
    if (row >= 0) this.pick(row);
  }

  private move(to: number) {
    this.cursor = to;
    this.board.sound.tick();
  }

  private pick(index: number) {
    const choice = this.current()?.choices.at(index);
    if (!choice) return;
    this.cursor = index;
    this.answer(choice);
  }

  private answer(choice: Choice | undefined) {
    this.answers.push({ choice, seconds: this.t });
    this.reply = { choice, t: 0 };
    const quiz = this.exercise.kind === "quiz";
    const missed = quiz && choice?.right !== true;
    (missed ? this.board.sound.nope : this.board.sound.press)();
    this.board.say(`${this.verdict().text}. ${choice?.says ?? this.board.labels.timeoutSays}`);
  }

  private carryOn(key: Key) {
    const go = key === "fire" || key === "jump" || key === "start";
    if (!go || !this.reply || this.reply.t < READ) return;
    this.reply = undefined;
    this.t = 0;
    this.cursor = 0;
    this.step++;
    if (this.step < this.exercise.steps.length) return this.speak();
    this.board.done(this.answers);
  }

  private verdict() {
    const L = this.board.labels;
    const choice = this.reply?.choice;
    if (!choice) return { text: L.timeout, ink: INK.khaki };
    if (this.exercise.kind === "decision") return { text: L.decided, ink: GOLD };
    return choice.right ? { text: L.correct, ink: GOLD } : { text: L.wrong, ink: INK.rust };
  }

  draw() {
    const { ctx } = this.board;
    const { W, H } = this.board.size();
    const step = this.current();
    if (!step) return;
    ctx.globalAlpha = 0.55;
    art.rect(ctx, 0, 0, W, H, INK.soot);
    ctx.globalAlpha = 1;
    const width = W - 28;
    const L = this.board.labels;
    const head = this.exercise.kind === "quiz" ? L.whiteboard : L.designReview;
    const reply = this.reply;
    const choiceBoxes = step.choices.map((c) => ({
      kind: "box" as const,
      height: wrap(c.text, width - 12).length * 10 + 4,
    }));
    const hint = this.board.touch ? L.pickTouch : L.pickKeys;
    const left = Math.max(0, Math.ceil(this.exercise.time - this.t));
    const { placed } = column({
      pieces: [
        { kind: "text", text: `${head} · ${this.exercise.title}`, max: 1 },
        this.step === 0
          ? {
              kind: "text",
              text: `${this.exercise.speaker}: ${this.exercise.intro}`,
              max: 1,
              optional: true,
            }
          : undefined,
        // The figure is needed to answer: the intro goes before it does.
        step.figure ? { kind: "box", height: figureHeight(step.figure) } : undefined,
        { kind: "text", text: reply ? this.verdict().text : step.ask, max: 2 },
        ...(reply
          ? [
              { kind: "text" as const, text: reply.choice?.says ?? L.timeoutSays, max: 1 },
              {
                kind: "text" as const,
                text: this.board.touch ? L.tap : L.resume,
                max: 1,
                optional: true,
              },
            ]
          : [
              ...choiceBoxes,
              {
                kind: "text" as const,
                text: `${L.standup} ${left}S · ${hint}`,
                max: 1,
                optional: true,
              },
            ]),
      ],
      top: 12,
      bottom: H - 12,
      width,
      gap: 5,
    });
    const shown = placed.filter((p) => p !== undefined);
    const first = shown.at(0);
    const last = shown.at(-1);
    if (!first || !last) return;
    this.board.frame({ x: 6, y: first.y - 6, w: W - 12, h: last.y + last.height - first.y + 12 });
    const [title, intro, figure, ask, ...rest] = placed;
    const look = { align: "left" } as const;
    drawPlaced({ ctx, placed: title, x: 14, ink: GOLD, look });
    drawPlaced({ ctx, placed: intro, x: 14, ink: INK.khaki, look });
    if (figure && step.figure)
      paintFigure({ ctx, figure: step.figure, area: { x: 14, y: figure.y, w: width }, t: this.t });
    drawPlaced({ ctx, placed: ask, x: 14, ink: reply ? this.verdict().ink : INK.goldLight, look });
    if (reply) return this.drawReply(rest);
    this.drawChoices({ placed: rest, width, step: step.choices, left });
  }

  private drawReply(rest: readonly (Placed | undefined)[]) {
    const { ctx } = this.board;
    const [says, prompt] = rest;
    drawPlaced({ ctx, placed: says, x: 14, ink: INK.sandLight, look: { align: "left" } });
    if ((this.reply?.t ?? 0) > READ && Math.floor((this.reply?.t ?? 0) * 2) % 2 === 0)
      drawPlaced({ ctx, placed: prompt, x: 14, ink: GOLD, look: { align: "left" } });
    // The stack gives way for two seconds, then the reply shows through again.
    if (this.reply?.choice?.gag === "overflow" && this.reply.t < 2.4) this.overflow(this.reply.t);
  }

  private drawChoices({
    placed,
    width,
    step,
    left,
  }: {
    placed: readonly (Placed | undefined)[];
    width: number;
    step: readonly Choice[];
    left: number;
  }) {
    const { ctx } = this.board;
    this.rows = [];
    step.forEach((choice, i) => {
      const box = placed.at(i);
      if (!box) return;
      this.rows.push({ top: box.y - 2, bottom: box.y + box.height + 2 });
      const on = i === this.cursor;
      art.rect(ctx, 12, box.y - 1, width + 4, box.height, on ? INK.mortar : INK.soot);
      if (on && Math.floor(this.t * 4) % 2 === 0) drawText(ctx, ">", 14, box.y + 1, 1, GOLD);
      wrap(choice.text, width - 12).forEach((line, l) =>
        drawText(ctx, line, 22, box.y + 1 + l * 10, 1, on ? INK.goldLight : INK.sandLight),
      );
    });
    const timer = placed.at(step.length);
    if (timer)
      drawPlaced({
        ctx,
        placed: timer,
        x: 14,
        ink: left <= 5 ? INK.rust : INK.khaki,
        look: { align: "left" },
      });
  }

  // The wrong base case: frames pile up until the stack gives way.
  private overflow(t: number) {
    const { ctx } = this.board;
    const { W, H } = this.board.size();
    const frames = Math.min(Math.floor(t / 0.05), Math.floor(H / 9));
    art.rect(ctx, 0, 0, W, Math.min(H, frames * 9 + 4), INK.soot);
    for (let i = 0; i < frames; i++)
      drawText(ctx, `COUNTDOWN(${-i - 1})`, 6, 2 + i * 9, 1, i % 2 ? INK.stone : INK.khaki);
    if (frames < Math.floor(H / 9)) return;
    const text = this.board.labels.stackOverflow;
    art.rect(ctx, 0, H / 2 - 14, W, 34, INK.soot);
    drawText(
      ctx,
      text,
      W / 2,
      H / 2 - 8,
      Math.max(1, Math.min(3, Math.floor((W - 16) / (text.length * 6)))),
      INK.rust,
      {
        outline: INK.soot,
        align: "center",
      },
    );
  }
}
