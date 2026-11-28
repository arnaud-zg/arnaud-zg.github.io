// The whiteboard over the frozen fight: arrows or a tap pick, Space answers, a colleague replies.
import type { Answer, Choice, Exercise } from "../../challenge/domain/exercise.ts";
import type { Key } from "../../input/domain/controls.ts";
import type { MissionLabels } from "../domain/labels.ts";
import type { Placed } from "../domain/layout.ts";
import type { Ink } from "./pixel.font.ts";
import { column } from "../domain/layout.ts";
import * as art from "./canvas.draw.ts";
import { figureHeight, paintFigure } from "./canvas.figures.ts";
import { drawPlaced } from "./canvas.layout.ts";
import { GOLD, INK, TERM } from "./canvas.sprites.ts";
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
  readonly firstTime: boolean; // the run's first whiteboard: it says which keys to use
};

// A whiteboard in the office's colours, or a terminal: green on black.
type Skin = "whiteboard" | "terminal";
type Palette = {
  readonly title: Ink;
  readonly intro: string;
  readonly ask: Ink;
  readonly body: string;
  readonly row: string;
  readonly picked: string;
  readonly pickedText: string;
  readonly cursor: Ink;
  readonly timer: string;
};
const PALETTES = {
  whiteboard: {
    title: INK.khaki,
    intro: INK.sandLight,
    ask: GOLD,
    body: INK.sandLight,
    row: INK.soot,
    picked: INK.mortar,
    pickedText: INK.goldLight,
    cursor: GOLD,
    timer: INK.khaki,
  },
  terminal: {
    title: TERM.dim,
    intro: TERM.ink,
    ask: "#c4ffb8",
    body: TERM.ink,
    row: TERM.bg,
    picked: "#123a12",
    pickedText: "#c4ffb8",
    cursor: TERM.ink,
    timer: TERM.dim,
  },
} as const satisfies { [K in Skin]: Palette };

// The intro, typed: only as many characters as have been said so far.
const typedOut = (placed: Placed, count: number): Placed => {
  let left = count;
  const lines = placed.lines.map((line) => {
    const shown = line.slice(0, Math.max(0, left));
    left -= line.length + 1;
    return shown;
  });
  return { ...placed, lines };
};

type Reply = { readonly choice: Choice | undefined; readonly t: number };
type Pt = { readonly x: number; readonly y: number };
const READ = 0.6; // a reply can be dismissed after this long, never by accident
// The colleague speaks first, then the question and its answers come in: one thing at a time.
const TYPING = 70; // characters a second
const SETTLE = 0.25; // seconds between the last word and the question
const FADE = 0.2;

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

  // When the question shows: after the intro is typed out, on the first step only.
  private revealAt() {
    const intro = this.step === 0 ? `${this.exercise.speaker}: ${this.exercise.intro}`.length : 0;
    return intro / TYPING + SETTLE;
  }
  private revealed() {
    return this.t >= this.revealAt();
  }
  // Seconds on the standup timer: it starts once the question shows.
  private elapsed() {
    return Math.max(0, this.t - this.revealAt());
  }

  tick(dt: number) {
    this.t += dt;
    if (this.reply) {
      this.reply = { ...this.reply, t: this.reply.t + dt };
      return;
    }
    if (this.elapsed() >= this.exercise.time) this.answer(undefined);
  }

  press(key: Key) {
    if (this.reply) return this.carryOn(key);
    if (!this.revealed()) return this.skipIntro(key);
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
    if (!this.revealed()) return this.skipIntro("start");
    const row = this.rows.findIndex((r) => at.y >= r.top && at.y <= r.bottom);
    if (row >= 0) this.pick(row);
  }

  // Space, or a tap, finishes the intro at once rather than answering blind.
  private skipIntro(key: Key) {
    if (key === "fire" || key === "jump" || key === "start") this.t = this.revealAt();
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
    this.answers.push({ choice, seconds: this.elapsed() });
    this.reply = { choice, t: 0 };
    const quiz = this.exercise.kind !== "decision";
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
    const heads = { quiz: L.whiteboard, decision: L.designReview, incident: L.incident } as const;
    const head = `${this.skin() === "terminal" ? "$ " : ""}${heads[this.exercise.kind]}`;
    const reply = this.reply;
    const choiceBoxes = step.choices.map((c) => ({
      kind: "box" as const,
      height: wrap(c.text, width - 12).length * 10 + 4,
    }));
    const hint = this.board.touch ? L.pickTouch : L.pickKeys;
    const left = Math.max(0, this.exercise.time - this.elapsed());
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
              { kind: "box" as const, height: 3 }, // the standup timer, a bar that runs down
              this.board.firstTime
                ? { kind: "text" as const, text: hint, max: 1, optional: true }
                : undefined,
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
    this.box({ x: 6, y: first.y - 6, w: W - 12, h: last.y + last.height - first.y + 12 });
    const [title, intro, figure, ask, ...rest] = placed;
    const look = { align: "left" } as const;
    const p = this.palette();
    drawPlaced({ ctx, placed: title, x: 14, ink: p.title, look });
    drawPlaced({
      ctx,
      placed: intro && typedOut(intro, Math.floor(this.t * TYPING)),
      x: 14,
      ink: p.intro,
      look,
    });
    if (!this.revealed()) return;
    ctx.globalAlpha = Math.min(1, (this.t - this.revealAt()) / FADE);
    if (figure && step.figure)
      paintFigure({
        ctx,
        figure: step.figure,
        area: { x: 14, y: figure.y, w: width },
        t: this.elapsed(),
      });
    drawPlaced({ ctx, placed: ask, x: 14, ink: reply ? this.verdict().ink : p.ask, look });
    const after = reply
      ? () => this.drawReply(rest)
      : () => this.drawChoices({ placed: rest, width, step: step.choices, left });
    after();
    ctx.globalAlpha = 1;
  }

  private drawReply(rest: readonly (Placed | undefined)[]) {
    const { ctx } = this.board;
    const [says, prompt] = rest;
    const p = this.palette();
    drawPlaced({ ctx, placed: says, x: 14, ink: p.body, look: { align: "left" } });
    if ((this.reply?.t ?? 0) > READ && Math.floor((this.reply?.t ?? 0) * 2) % 2 === 0)
      drawPlaced({ ctx, placed: prompt, x: 14, ink: p.title, look: { align: "left" } });
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
    const p = this.palette();
    this.rows = [];
    step.forEach((choice, i) => {
      const box = placed.at(i);
      if (!box) return;
      this.rows.push({ top: box.y - 2, bottom: box.y + box.height + 2 });
      const on = i === this.cursor;
      art.rect(ctx, 12, box.y - 1, width + 4, box.height, on ? p.picked : p.row);
      if (on && Math.floor(this.t * 4) % 2 === 0) drawText(ctx, ">", 14, box.y + 1, 1, p.cursor);
      wrap(choice.text, width - 12).forEach((line, l) =>
        drawText(ctx, line, 22, box.y + 1 + l * 10, 1, on ? p.pickedText : p.body),
      );
    });
    const bar = placed.at(step.length);
    if (bar) {
      art.rect(ctx, 14, bar.y + 1, width, 1, p.row === TERM.bg ? TERM.dim : INK.stoneDark);
      art.rect(
        ctx,
        14,
        bar.y,
        Math.round((width * left) / this.exercise.time),
        3,
        left <= 5 ? INK.rust : p.timer,
      );
    }
    drawPlaced({
      ctx,
      placed: placed.at(step.length + 1),
      x: 14,
      ink: p.timer,
      look: { align: "left" },
    });
  }

  private skin(): Skin {
    return this.exercise.skin ?? "whiteboard";
  }
  private palette() {
    return PALETTES[this.skin()];
  }

  // A whiteboard gets the game's riveted frame; a terminal, a black screen with a cursor.
  private box(area: { x: number; y: number; w: number; h: number }) {
    if (this.skin() === "whiteboard") return this.board.frame(area);
    const { ctx } = this.board;
    art.rect(ctx, area.x, area.y, area.w, area.h, TERM.bg);
    art.rect(ctx, area.x, area.y, area.w, 1, TERM.dim);
    art.rect(ctx, area.x, area.y + area.h - 1, area.w, 1, TERM.dim);
    art.rect(ctx, area.x, area.y, 1, area.h, TERM.dim);
    art.rect(ctx, area.x + area.w - 1, area.y, 1, area.h, TERM.dim);
    if (Math.floor(this.t * 2) % 2 === 0)
      art.rect(ctx, area.x + area.w - 10, area.y + area.h - 9, 5, 6, TERM.ink);
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
