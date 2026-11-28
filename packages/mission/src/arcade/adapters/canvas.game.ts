// The secret mission, loaded only once the Konami code is in (see trigger.ts). An arcade
// campaign over the dimmed page, drawn on a small canvas scaled up pixel for pixel.
//
// The run: a power-on badge, the title, character select, then the three maps of levels/, one per
// chapter of the career, in the order the clock draws (see orderMaps). Finishing one, at any
// rank, unlocks the next; all three earn a congratulation. Each map has its briefing,
// checkpoints, mid-boss and boss; its crates hold the chapter's skills and unlock its weapons.
// One hit and you are down; three lives, then a continue. The difficulty follows the player
// (rules.ts), never the score. Every message stops the game until Space carries on.
// Reduced motion gets the loadout, still.
import type { Chapter, Pickup } from "../../campaign/domain/loadout.ts";
import type { Attack, FoeKind, MapEvent, MissionMap, Spawn } from "../../campaign/domain/map.ts";
import type { WeaponId } from "../../combat/domain/weapons.ts";
import type { Deck, Key } from "../../input/domain/controls.ts";
import type { Move } from "../../moves/domain/combos.ts";
import type { Piece } from "../domain/layout.ts";
import type { MissionData } from "../domain/mission.ts";
import type { Played } from "./web.share.ts";
import { FOES } from "../../campaign/domain/levels/catalog/foes.ts";
import { loreOf } from "../../campaign/domain/levels/catalog/lore.ts";
import { POINTS } from "../../campaign/domain/levels/catalog/points.ts";
import { MAPS, MOMENTS, ODDS } from "../../campaign/domain/levels/index.ts";
import { orderMaps, pickMap } from "../../campaign/domain/map.ts";
import { chainAfter, multiplierOf, rankOf } from "../../combat/domain/score.ts";
import { weaponOf, WEAPONS } from "../../combat/domain/weapons.ts";
import {
  afterDeath,
  floorOf,
  HEAT,
  heatToward,
  mercyOf,
  nextAttack,
  spotOf,
  Spots,
  toughen,
  Tracker,
  tuningOf,
} from "../../director/domain/director.ts";
import { deckOf, keyOf, playable, scaleOf, STRIP } from "../../input/domain/controls.ts";
import { Combos, ENERGY, inputOf, MOVES } from "../../moves/domain/combos.ts";
import { followGround, keptInLock, STRANDED } from "../../moves/domain/ground.ts";
import { HITSTOP, JUMP, Jumper, pullToward, sideOf, stopFor } from "../../moves/domain/motion.ts";
import { column, fitText, heightOf, pagesOf, zonesOf } from "../domain/layout.ts";
import * as art from "./canvas.draw.ts";
import { drawPlaced } from "./canvas.layout.ts";
import { ARM, GOLD, HERO, INK, paper, sprites } from "./canvas.sprites.ts";
import { closestTo } from "./dom.target.ts";
import css from "./mission.css?inline";
import {
  drawText,
  fitScale,
  GLYPH_H,
  glyphSvg,
  glyphWords,
  textWidth,
  wrap,
} from "./pixel.font.ts";
import { fill, messageRun, scoreCard, shareRun } from "./web.share.ts";
import { Sound } from "./webaudio.sound.ts";

type Phase =
  | "boot"
  | "title"
  | "select"
  | "brief"
  | "play"
  | "warning"
  | "fall"
  | "continue"
  | "over"
  | "clear"
  | "still";
type Pt = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };
type Foe = {
  kind: FoeKind;
  x: number;
  y: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  t: number;
  flash: number;
  facing: 1 | -1;
  state: "walk" | "aim" | "fall";
  timer: number;
  ground: boolean;
  lock: number;
  hopped: boolean;
  away: number; // seconds out of the hero's reach, in a locked wave
};
type Hero = {
  x: number;
  feet: number;
  vy: number;
  ground: boolean;
  facing: 1 | -1;
  angle: number;
  crouch: boolean;
  moving: boolean;
  weapon: WeaponId;
  ammo: number;
  bombs: number;
  cooldown: number;
  recoil: number;
  flash: number;
  slash: number;
  inv: number;
  dead: number;
  dash: number; // seconds of a dash left
  roll: number; // seconds of a dodge roll left
  rollDir: 1 | -1;
  guard: boolean;
  running: boolean;
  dashed: Set<object>;
};
type Shot = {
  kind: "shot" | "pellet" | "rocket" | "flame" | "bomb" | "wave";
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  life: number;
  hits: Set<object>;
  bounces: number;
};
type Hostile = {
  kind: "bullet" | "brick" | "shell" | "bomb";
  x: number;
  y: number;
  vx: number;
  vy: number;
  grav: number;
};
type Part = Pt & {
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  grav: number;
};
type Boom = Pt & {
  r: number;
  t: number;
  dur: number;
  lobes: { dx: number; dy: number; r: number }[];
};
type Note = Pt & { text: string; t: number; color: string };
type Banner = { title: string; big?: boolean; t: number; dur: number };
type Crate = {
  p: Pickup | undefined;
  weapon: WeaponId;
  x: number;
  y: number;
  seed: number;
  floor: number;
}; // floor < 0: still falling
type Item = {
  kind: "weapon" | "bombs" | "life";
  p?: Pickup;
  weapon?: WeaponId;
  x: number;
  y: number;
  vy: number;
  t: number;
  floor: number;
};
type Mate = { x: number; feet: number; state: "bound" | "free"; t: number; gift: "bombs" | "life" };
type Turret = {
  x: number;
  hp: number;
  t: number;
  next: number;
  telegraph: number;
  mode: "shell" | "burst";
  burst: number;
  flash: number;
  lock: number;
  max: number;
};
type Boss = {
  x: number;
  hop: number;
  vy: number;
  hp: number;
  phase: number;
  state: "drop" | "idle" | "roar" | Attack;
  t: number;
  flash: number;
  count: number;
  crateGiven: boolean;
  max: number; // its health at the start, set by the heat it met
  last: Attack | undefined;
};
type Sweep = { y: number; charge: number; fire: number; t: number };
type Wave = { x: number; speed: number };
type Cube = Pt & { vx: number; vy: number; color: string };
type Alert = { side: 1 | -1; t: number }; // a foe coming in from off screen
type Row = { height: number; step: number; draw: (y: number) => void }; // a debrief line, shown once `revealed` passes `step`
type Queued = {
  at: number;
  spawn?: FoeKind;
  from?: "right" | "left";
  lock: number;
  chute?: boolean;
  extra?: boolean;
};

const GROUND = 24; // the ground strip, in stage pixels
const SPEED = 74;
const GRAVITY = 560;
const BOSS = { w: 44, h: 48 };
const SELECT_TIME = 20;
const READ = 0.8; // a message can be dismissed after this long: it is never skipped by accident
const CHROME = ["#ffffff", "#e6ecf5", "#b8c4d6", "#8a98b0", "#5a6680", "#c9d4e6", "#ffffff"];
const STARS = { common: "★", special: "★★", rare: "★★★" };
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const ease = (p: number) => 1 - (1 - p) ** 3;
const overlap = (a: Box, b: Box) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
// The visible area, not innerWidth: a page wider than the phone widens the window past the screen.
const visibleArea = () => {
  const view = window.visualViewport;
  if (!view) return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  return { left: view.offsetLeft, top: view.offsetTop, width: view.width, height: view.height };
};
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch = () => matchMedia("(pointer: coarse)").matches;

let open = false;
export const start = (data: MissionData) => {
  if (open) return;
  open = true;
  const now = new Date();
  new Mission(
    data,
    orderMaps(MAPS, ODDS, MOMENTS, now),
    pickMap(MAPS, ODDS, MOMENTS, now).note,
    () => (open = false),
  );
};

type EndWords = { title: string; note: string };
const paintEndButton = ({ button, words }: { button: HTMLButtonElement; words: EndWords }) => {
  button.setAttribute("aria-label", `${words.title}. ${words.note.toLowerCase()}`);
  button.innerHTML = `<span class="op-end-title">${glyphWords(words.title)}</span><span class="op-end-note">${glyphWords(words.note)}</span>`;
};

const SPEAKER = '<path d="M4 9h4l5-4v14l-5-4H4z" />';
const ICONS = {
  on: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">${SPEAKER}<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>`,
  off: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">${SPEAKER}<path d="m17 9 5 6m0-6-5 6" /></svg>`,
  close:
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>',
  pause:
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>',
};

class Mission {
  private readonly L: MissionData["labels"];
  private readonly root = document.createElement("div");
  private readonly canvas = document.createElement("canvas");
  private readonly ctx: CanvasRenderingContext2D;
  private readonly live = document.createElement("p");
  private readonly end = document.createElement("div");
  private readonly pad = document.createElement("div");
  private readonly card = document.createElement("div");
  private readonly toast = document.createElement("p");
  private readonly mute = document.createElement("button");
  private readonly playBtn = document.createElement("button");
  private readonly pauseBtn = document.createElement("button");
  private readonly sp = sprites();
  private readonly sound = new Sound();
  private readonly before =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  private readonly listening = new AbortController(); // every listener the mission adds, gone on close
  private readonly inerted: Element[] = [];
  private readonly overflow = document.documentElement.style.overflow;
  private readonly off: (() => void)[] = [];
  private readonly started = new Date();
  private groundImg = document.createElement("canvas");
  private raf = 0;
  private last = 0;
  private said = 0;
  private toasted = 0;

  // The stage: S screen pixels per stage pixel, W × H stage pixels.
  private S = 3;
  private deck: Deck = deckOf(1, 1, false); // where the touch controls sit, off the stage
  private W = 320;
  private H = 200;
  private get gy() {
    return this.H - GROUND;
  }

  // The campaign
  private map: MissionMap;
  private stage = 0;
  private played: Played[] = [];
  private picked = false; // the engineer is chosen once a run
  private phase: Phase = "boot";
  private pt = 0;
  private t = 0;
  private paused = false;
  private reading = 0; // > 0: a message is up and the game waits; seconds it has been up
  private failed = false;
  private held = new Set<Key>();
  private shake = 0;
  // The level
  private camX = 0;
  private lockAt: number | undefined;
  private lockId = 0;
  private cleared = 0;
  private ev = 0;
  private queue: Queued[] = [];
  private crateIndex = 0;
  private crates: Crate[] = [];
  private items: Item[] = [];
  private mates: Mate[] = [];
  private foes: Foe[] = [];
  private shots: Shot[] = [];
  private hostiles: Hostile[] = [];
  private parts: Part[] = [];
  private booms: Boom[] = [];
  private notes: Note[] = [];
  private banners: Banner[] = [];
  private cubes: Cube[] = [];
  private waves: Wave[] = [];
  private alerts: Alert[] = [];
  private sweep: Sweep | undefined;
  private turret: Turret | undefined;
  private boss: Boss | undefined;
  // The hero and the run
  private hero = this.freshHero();
  private lives = 2;
  private continues = 0;
  private heat: number = HEAT.start;
  private tracker = new Tracker(); // what the player does, for the difficulty
  private countdown = 0;
  private score = 0;
  private kills = 0;
  private freed = 0;
  private seconds = 0;
  private got: Pickup[] = [];
  private here = { deaths: 0, fired: 0, landed: 0, freed: 0 }; // this map's, for its rank
  private chain = 0;
  private lastKill = -9;
  private energy = 50; // pays for the special moves
  private readonly combos = new Combos();
  private jumper = new Jumper();
  private stop = 0; // seconds of hit-stop left: the world holds still on a heavy blow
  private spots = new Spots(); // where the player has died on this map, for the help it gives
  private mercy = mercyOf(0); // what the next return brings
  private found = new Set<string>(); // the secret moves found this run, never told beforehand
  // The intro and the debrief
  private cursor = 0;
  private nope = 0;
  private chosen = -1;
  private stamps: Pt[] = [];
  private typed = 0;
  private revealed = 0;
  private endRoom = 0; // stage pixels the end buttons cover at the foot of the stage
  private briefPage = 0;
  private tooSmall = false; // a stage under the floor: the hero says sorry instead of playing

  constructor(
    private readonly data: MissionData,
    private readonly order: readonly MissionMap[],
    private readonly note: string | undefined,
    private readonly done: () => void,
  ) {
    const first = order.at(0);
    if (!first) throw new Error("No mission map");
    this.map = first;
    this.L = data.labels;
    this.ctx = paper(this.canvas);
    this.mount();
    this.resize();
    this.sound.start();
    this.go(reduced() ? "still" : "boot");
    this.say(
      reduced() ? this.loadoutWords() : `${this.L.boot}. ${this.map.title}. ${this.L.press}.`,
    );
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private freshHero(): Hero {
    return {
      x: -HERO.w,
      feet: 0,
      vy: 0,
      ground: true,
      facing: 1,
      angle: 0,
      crouch: false,
      moving: false,
      weapon: "pistol",
      ammo: Infinity,
      bombs: 10,
      cooldown: 0,
      recoil: 0,
      flash: 0,
      slash: 0,
      inv: 0,
      dead: 0,
      dash: 0,
      roll: 0,
      rollDir: 1,
      guard: false,
      running: false,
      dashed: new Set<object>(),
    };
  }

  // The chapter a map tells: map i of the story, chapter i of the site.
  private chapter(map = this.map): Chapter {
    return this.data.chapters.at(MAPS.indexOf(map)) ?? { title: map.title, line: "", pickups: [] };
  }
  private allPickups() {
    return MAPS.flatMap((m) => this.chapter(m).pickups);
  }
  private isLast() {
    return this.stage >= this.order.length - 1;
  }

  // ── The page around it ─────────────────────────────────────────────────────────────────────
  private mount() {
    const { root, canvas, live, end, mute, card, toast, L } = this;
    root.className = "op";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", L.dialog);
    root.tabIndex = -1;
    canvas.className = "op-canvas";
    canvas.setAttribute("aria-hidden", "true");
    live.className = "op-sr";
    live.setAttribute("aria-live", "polite");
    card.className = "op-card";
    card.hidden = true;
    card.setAttribute("aria-hidden", "true"); // the live region says it
    toast.className = "op-toast";
    toast.hidden = true;
    toast.setAttribute("aria-hidden", "true");

    const tools = document.createElement("div");
    tools.className = "op-tools";
    mute.className = "op-btn op-icon";
    mute.dataset.look = "dark";
    mute.type = "button";
    this.paintMute();
    mute.addEventListener("click", () => this.toggleMute());
    const close = this.button(L.close, () => this.close(), "dark");
    close.classList.add("op-icon");
    close.innerHTML = ICONS.close;
    this.pauseBtn.className = "op-btn op-icon";
    this.pauseBtn.dataset.look = "dark";
    this.pauseBtn.type = "button";
    this.pauseBtn.hidden = true;
    this.pauseBtn.innerHTML = ICONS.pause;
    this.pauseBtn.setAttribute("aria-label", L.keyPause.toLowerCase());
    this.pauseBtn.addEventListener("click", () => this.pause(!this.paused));
    tools.append(this.pauseBtn, mute, close);

    end.className = "op-end";
    end.hidden = true;
    this.playBtn.className = "op-btn op-end-btn";
    this.playBtn.dataset.end = "play";
    this.playBtn.type = "button";
    this.playBtn.addEventListener("click", () => this.onward());
    const share = { title: L.share, note: touch() ? L.shareNote : L.shareNoteDesktop };
    end.append(
      this.playBtn,
      this.endButton({ kind: "share", words: share, fn: () => void this.shareScore() }),
    );
    if (this.data.contact)
      end.append(
        this.endButton({
          kind: "message",
          words: { title: L.message, note: L.messageNote },
          fn: () => void this.messageMe(),
        }),
      );
    end.append(
      this.endButton({
        kind: "exit",
        words: { title: L.exit, note: L.exitNote },
        fn: () => this.close(),
      }),
    );
    this.mountPad();
    root.append(this.styleTag(), canvas, tools, card, this.pad, end, toast, live);
    for (const el of document.body.children)
      if (!el.hasAttribute("inert")) {
        el.setAttribute("inert", "");
        this.inerted.push(el);
      }
    document.body.append(root);
    document.documentElement.style.overflow = "hidden";
    root.focus({ preventScroll: true });

    const { signal } = this.listening;
    window.addEventListener("resize", () => this.resize(), { signal });
    window.visualViewport?.addEventListener("resize", () => this.resize(), { signal });
    window.visualViewport?.addEventListener("scroll", () => this.resize(), { signal });
    window.addEventListener("keydown", (e) => this.keydown(e), { capture: true, signal });
    window.addEventListener(
      "keyup",
      (e) => {
        const k = keyOf(e.key);
        if (k) this.release(k);
      },
      { signal },
    );
    window.addEventListener("blur", () => this.pause(true), { signal });
    document.addEventListener("visibilitychange", () => document.hidden && this.pause(true), {
      signal,
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault(), { signal });
    // The pointer never aims, as on a cabinet: it moves the screens on, and carries on after a message.
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        e.preventDefault();
        if (this.reading || this.paused) return this.press("start");
        const box = canvas.getBoundingClientRect();
        if (!this.fighting())
          this.menu({ x: (e.clientX - box.left) / this.S, y: (e.clientY - box.top) / this.S });
      },
      { signal },
    );
  }

  // The touch deck, beside or under the stage, never over it: a thumbstick that follows the
  // left thumb, resting in the middle of its side until touched, and four buttons for the right.
  private mountPad() {
    const { pad, L } = this;
    pad.className = "op-pad";
    pad.hidden = true;
    pad.setAttribute("aria-hidden", "true");
    const stick = document.createElement("div");
    stick.className = "op-stick";
    const ring = document.createElement("div");
    ring.className = "op-ring is-idle";
    const hint = document.createElement("span");
    hint.className = "op-hint";
    hint.innerHTML = glyphSvg(L.keyMove);
    const knob = document.createElement("div");
    knob.className = "op-knob";
    ring.append(knob);
    stick.append(ring, hint);
    let origin: (Pt & { id: number }) | undefined;
    const steer = (e: PointerEvent) => {
      if (!origin || e.pointerId !== origin.id) return;
      const dx = e.clientX - origin.x,
        dy = e.clientY - origin.y;
      const n = Math.hypot(dx, dy);
      const k = n > 34 ? 34 / n : 1;
      knob.style.translate = `${dx * k}px ${dy * k}px`;
      const set = (key: Key, on: boolean) => {
        if (on && !this.held.has(key) && !this.special(key)) this.tap(key); // a flick counts in a combo, and twice runs
        if (on) this.held.add(key);
        else this.held.delete(key);
      };
      set("left", dx < -14);
      set("right", dx > 14);
      set("up", dy < -20);
      set("down", dy > 20);
    };
    const release = (e: PointerEvent) => {
      if (!origin || e.pointerId !== origin.id) return;
      origin = undefined;
      ring.classList.add("is-idle");
      ring.style.left = ring.style.top = "";
      knob.style.translate = "0 0";
      for (const k of ["left", "right", "up", "down"] as const) this.held.delete(k);
    };
    stick.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (this.reading) return this.press("start");
      stick.setPointerCapture(e.pointerId);
      const box = stick.getBoundingClientRect();
      origin = { x: e.clientX, y: e.clientY, id: e.pointerId };
      ring.classList.remove("is-idle");
      ring.style.left = `${e.clientX - box.left}px`;
      ring.style.top = `${e.clientY - box.top}px`;
      knob.style.translate = "0 0";
    });
    stick.addEventListener("pointermove", steer);
    stick.addEventListener("pointerup", release);
    stick.addEventListener("pointercancel", release);

    const buttons = document.createElement("div");
    buttons.className = "op-buttons";
    for (const [key, text, label] of [
      ["fire", L.keyFire, L.fire],
      ["bomb", L.keyBomb, L.throw],
      ["guard", L.keyGuard, L.guard],
      ["jump", L.keyJump, L.jump],
    ] as const) {
      const b = document.createElement("button");
      b.className = "op-btn op-key";
      b.dataset.key = key;
      b.type = "button";
      b.tabIndex = -1;
      b.setAttribute("aria-label", label);
      b.innerHTML = glyphSvg(text);
      const up = () => this.release(key);
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        this.press(key);
      });
      b.addEventListener("pointerup", up);
      b.addEventListener("pointercancel", up);
      b.addEventListener("contextmenu", (e) => e.preventDefault());
      buttons.append(b);
    }
    pad.append(stick, buttons);
  }

  private styleTag() {
    const style = document.createElement("style");
    style.textContent = css; // here, not in the page: the stage's styles arrive with the stage
    return style;
  }

  private button(label: string, fn: () => void, look?: string) {
    const b = document.createElement("button");
    b.className = "op-btn";
    b.type = "button";
    if (look) b.dataset.look = look;
    b.setAttribute("aria-label", label);
    b.innerHTML = glyphSvg(label);
    b.addEventListener("click", fn);
    return b;
  }

  // A button under the debrief says what it does, in two lines that wrap with the room it has.
  private endButton({ kind, words, fn }: { kind: string; words: EndWords; fn: () => void }) {
    const b = document.createElement("button");
    b.className = "op-btn op-end-btn";
    b.dataset.look = "dark";
    b.dataset.end = kind;
    b.type = "button";
    paintEndButton({ button: b, words });
    b.addEventListener("click", fn);
    return b;
  }

  private paintMute() {
    const { mute, sound, L } = this;
    mute.innerHTML = sound.muted ? ICONS.off : ICONS.on;
    mute.setAttribute("aria-label", sound.muted ? L.unmute : L.mute);
  }
  private toggleMute() {
    this.sound.toggle();
    this.paintMute();
  }

  // Spoken by screen readers. The region exists before its first words, or they are lost.
  private say(text: string) {
    window.clearTimeout(this.said);
    this.said = window.setTimeout(() => (this.live.textContent = text), 150);
  }

  private flashToast(text: string) {
    this.toast.innerHTML = glyphWords(text);
    this.toast.hidden = false;
    window.clearTimeout(this.toasted);
    this.toasted = window.setTimeout(() => (this.toast.hidden = true), 3400);
    this.say(text);
  }

  private close() {
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.said);
    window.clearTimeout(this.toasted);
    this.listening.abort();
    this.off.forEach((f) => f());
    this.sound.stop();
    this.inerted.forEach((el) => el.removeAttribute("inert"));
    document.documentElement.style.overflow = this.overflow;
    this.root.remove();
    this.before?.focus({ preventScroll: true });
    this.done();
  }

  // The stage fills what the touch deck leaves (controls.ts, deckOf), scaled pixel for pixel.
  private resize() {
    const before = { ground: this.gy, width: this.W };
    const view = visibleArea();
    Object.assign(this.root.style, {
      left: `${view.left}px`,
      top: `${view.top}px`,
      width: `${view.width}px`,
      height: `${view.height}px`,
    });
    this.deck = deckOf(view.width, view.height, touch());
    this.tooSmall = !playable(this.stageSize());
    if (this.tooSmall) this.deck = deckOf(view.width, view.height, false); // no deck to say sorry
    const { stage, mode, size } = this.deck;
    this.S = scaleOf(stage.w, stage.h);
    this.W = Math.ceil(stage.w / this.S);
    this.H = Math.ceil(stage.h / this.S);
    const { canvas, S, W, H } = this;
    canvas.style.left = `${stage.x}px`;
    this.root.dataset.deck = mode;
    this.root.style.setProperty("--op-deck", `${size}px`);
    this.root.style.setProperty("--op-deck-under", `${mode === "bottom" ? size : 0}px`);
    this.pad.hidden = mode === "none" || this.phase === "still" || this.tooSmall;
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${W * S}px`;
    canvas.style.height = `${H * S}px`;
    this.root.style.setProperty("--op-px", `${Math.min(S, 3)}px`);
    this.root.style.setProperty("--op-px-small", `${Math.min(S, 3) * 0.75}px`);
    this.root.style.setProperty("--op-deck-side", `${mode === "side" ? size : 0}px`);
    this.root.style.setProperty("--op-s", `${S}px`);
    this.ctx.imageSmoothingEnabled = false;
    this.paintMap();
    this.measureEnd();
    if (this.tooSmall) this.say(`${this.L.tooSmallTitle} ${this.L.tooSmall}`);
    if (before.ground === this.gy && before.width === this.W) return;
    this.followGround(before.ground);
    this.pause(true); // a turned phone: nothing hits the hero while they find their grip again
  }

  // The stage the deck leaves, in stage pixels.
  private stageSize() {
    const { stage } = this.deck;
    const scale = scaleOf(stage.w, stage.h);
    return { width: Math.ceil(stage.w / scale), height: Math.ceil(stage.h / scale) };
  }

  // The ground line moved: everything that stood on it, or flew above it, moves with it.
  private followGround(from: number) {
    const move = (height: number) => followGround({ height, from, to: this.gy });
    const { hero } = this;
    hero.feet = move(hero.feet);
    for (const thing of [
      ...this.foes,
      ...this.shots,
      ...this.hostiles,
      ...this.parts,
      ...this.booms,
      ...this.notes,
      ...this.cubes,
    ])
      thing.y = move(thing.y);
    for (const crate of this.crates)
      [crate.y, crate.floor] = [move(crate.y), crate.floor < 0 ? crate.floor : move(crate.floor)];
    for (const item of this.items) [item.y, item.floor] = [move(item.y), move(item.floor)];
    for (const mate of this.mates) mate.feet = move(mate.feet);
    if (this.sweep) this.sweep.y = move(this.sweep.y);
  }

  private paintMap() {
    this.root.style.setProperty("--op-dim", this.map.theme.dim);
    this.groundImg = art.ground(this.W, this.map.length, this.map.theme);
    this.camX = Math.min(this.camX, Math.max(0, (this.lockAt ?? this.map.length) - this.W));
  }

  // ── Sharing the result ─────────────────────────────────────────────────────────────────────
  private result() {
    return {
      played: this.played,
      score: this.score,
      skills: this.got.length,
      total: this.allPickups().length,
    };
  }
  private async shareScore() {
    const url = `${location.origin}${location.pathname}`;
    const text = fill(this.L.shareText, this.L, this.result(), url);
    const card = scoreCard(this.L, this.result(), url, {
      menu: this.map.theme.menu,
      plate: this.map.theme.plate[1],
    });
    const how = await shareRun(text, card, touch());
    if (how === "image") this.flashToast(this.L.imageCopied);
    if (how === "text") this.flashToast(this.L.copied);
  }
  private async messageMe() {
    const contact = this.data.contact;
    if (!contact) return;
    const url = `${location.origin}${location.pathname}`;
    if (await messageRun(fill(this.L.messageText, this.L, this.result(), url), contact.href))
      this.flashToast(this.L.copied);
  }

  // ── Input ──────────────────────────────────────────────────────────────────────────────────
  private keydown(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (k === "escape") {
      e.preventDefault();
      return this.close();
    }
    if (k === "tab") return this.trap(e);
    const onControl = closestTo({ target: e.target, selector: "button, a" });
    if (onControl && (k === "enter" || k === " ")) return;
    if (k === "m") return this.toggleMute();
    const key = keyOf(e.key);
    if (!key) return;
    e.preventDefault();
    if (e.repeat) return;
    this.press(key);
  }

  private press(key: Key) {
    this.held.add(key);
    const go = key === "start" || key === "jump" || key === "fire";
    // A message is up: Enter, Space or a tap carries on, once it has been read.
    if (this.reading) {
      if (go && this.reading > READ) this.carryOnReading();
      return;
    }
    if (this.paused) {
      if (go || key === "pause") this.pause(false);
      return;
    }
    if (!this.fighting()) {
      if (this.phase === "select" && (key === "left" || key === "right"))
        return this.move(key === "left" ? -1 : 1);
      if (go) this.menu(undefined);
      return;
    }
    if (key === "pause") return this.pause(true);
    if (this.special(key)) return;
    this.tap(key);
    if (key === "fire") return this.fire(false);
    if (key === "jump") return this.jump();
    if (key === "bomb") return this.throwBomb();
  }

  // A key let go. Letting go of jump on the way up makes a short hop; a touch button is always
  // tapped quickly, so on touch a jump keeps its full height.
  private release(key: Key) {
    this.held.delete(key);
    if (key === "jump" && this.fighting() && this.deck.mode === "none")
      this.hero.vy = this.jumper.release(this.hero.vy);
  }

  // Tab stays on the mission's own controls while it is open.
  private trap(e: KeyboardEvent) {
    const all = [...this.root.querySelectorAll("button:not([tabindex='-1']), a")].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.offsetParent !== null,
    );
    const first = all.at(0);
    if (!first) return;
    const at = all.findIndex((el) => el === document.activeElement);
    const next = e.shiftKey ? (at <= 0 ? all.length - 1 : at - 1) : (at + 1) % all.length;
    e.preventDefault();
    (all.at(next) ?? first).focus();
  }

  private pause(on: boolean) {
    if (!this.fighting() || this.paused === on) return;
    this.paused = on;
    this.held.clear();
    this.sound.music(on ? undefined : this.map.music, Boolean(this.boss));
    this.say(on ? this.L.paused : "");
  }

  private fighting() {
    return this.phase === "play" || this.phase === "warning" || this.phase === "fall";
  }

  // Space, a button or a tap outside the fight: moves the screens on.
  private menu(at: Pt | undefined) {
    switch (this.phase) {
      case "boot":
        return this.go("title");
      case "title":
        this.sound.press();
        return this.go(this.picked ? "brief" : "select");
      case "select":
        if (at) {
          const card = this.cardAt(at);
          if (card === undefined) return;
          this.cursor = card;
        }
        return this.confirm();
      case "brief":
        return this.carryOnBrief();
      case "continue":
        return this.carryOn();
      case "clear":
        if (!this.end.hidden) this.onward();
        return;
      default:
    }
  }

  // ── Phases ─────────────────────────────────────────────────────────────────────────────────
  private go(phase: Phase) {
    this.phase = phase;
    this.pt = 0;
    this.pad.hidden = this.deck.mode === "none" || phase === "still" || this.tooSmall; // the deck stays put
    this.pauseBtn.hidden = !this.fighting() || !touch();
    if (phase === "title") this.stamps = [];
    if (phase === "select")
      this.say(
        `${this.L.select}. ${this.L.hero}. ${this.L.heroLine}. Three more, ${this.L.locked.toLowerCase()}.`,
      );
    if (phase === "brief") {
      this.resetMap();
      const c = this.chapter();
      this.say(
        [
          `${this.L.chapter} ${MAPS.indexOf(this.map) + 1}: ${c.title}. ${c.line}.`,
          this.map.title,
          ...this.map.briefing,
          this.L.controls,
          this.L.pressGo,
        ].join(" "),
      );
    }
    if (phase === "still" || phase === "clear") this.showEnd(phase);
  }

  // After a debrief: the next map once this one is finished, or a new campaign.
  private onward() {
    this.end.hidden = true;
    this.measureEnd();
    if (this.failed || this.isLast()) {
      Object.assign(this, {
        failed: false,
        played: [],
        score: 0,
        kills: 0,
        freed: 0,
        seconds: 0,
        got: [],
        lives: 2,
        continues: 0,
        heat: HEAT.start,
        tracker: new Tracker(),
        found: new Set<string>(),
      });
      this.loadMap(0);
      this.go("title");
      return;
    }
    this.loadMap(this.stage + 1);
    this.go("title"); // the next operation, unlocked, opens on its own title card
  }

  private loadMap(stage: number) {
    this.stage = stage;
    const map = this.order.at(stage);
    if (map) this.map = map;
    this.camX = 0;
    this.paintMap();
  }

  // A new map: the level back to its start; the run (score, lives, skills found) carries on.
  private resetMap() {
    Object.assign(this, {
      camX: 0,
      lockAt: undefined,
      ev: 0,
      queue: [],
      crateIndex: 0,
      crates: [],
      items: [],
      mates: [],
      foes: [],
      shots: [],
      hostiles: [],
      parts: [],
      booms: [],
      notes: [],
      banners: [],
      cubes: [],
      waves: [],
      sweep: undefined,
      turret: undefined,
      boss: undefined,
      revealed: 0,
      typed: 0,
      briefPage: 0,
      cleared: 0,
      chain: 0,
      lastKill: -9,
      energy: 50,
      alerts: [],
      stop: 0,
      jumper: new Jumper(),
      spots: new Spots(),
      mercy: mercyOf(0),
    });
    const bombs = this.hero.bombs;
    this.hero = this.freshHero();
    this.hero.feet = this.gy;
    if (this.stage > 0) this.hero.bombs = Math.max(bombs, 6);
    this.here = { deaths: 0, fired: 0, landed: 0, freed: 0 };
    this.end.hidden = true;
    this.sound.music(undefined);
  }

  private briefLines() {
    const w = Math.min(this.W - 16, 280) - 14;
    const hh = String(this.started.getHours()).padStart(2, "0"),
      mm = String(this.started.getMinutes()).padStart(2, "0");
    const c = this.chapter();
    return {
      w,
      title: this.map.title,
      head: [
        ...wrap(`${this.L.chapter} ${MAPS.indexOf(this.map) + 1}/${MAPS.length} · ${c.title}`, w),
        ...wrap(c.line, w),
      ],
      lines: [`${hh}:${mm} · ${this.map.time}`, ...this.map.briefing.flatMap((l) => wrap(l, w))],
    };
  }

  private startPlay() {
    this.go("play");
    this.hero.x = Math.max(this.hero.x, 20);
    this.banners.push({ title: this.L.go, big: true, t: 0, dur: 1.1 });
    this.sound.go();
    this.sound.music(this.map.music);
  }

  // Character select: one card is the hero, three are locked.
  private cards() {
    const gap = 4;
    const cw = Math.min(54, Math.floor((this.W - 16 - gap * 3) / 4)),
      ch = Math.round(cw * 1.45);
    const x0 = Math.round((this.W - (cw * 4 + gap * 3)) / 2),
      y0 = Math.round(this.H * 0.28);
    return Array.from({ length: 4 }, (_, i) => ({ x: x0 + i * (cw + gap), y: y0, w: cw, h: ch }));
  }
  private cardAt(p: Pt) {
    const i = this.cards().findIndex(
      (c) => p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h,
    );
    return i < 0 ? undefined : i;
  }
  private move(dir: number) {
    if (this.chosen >= 0) return;
    this.cursor = (this.cursor + dir + 4) % 4;
    this.sound.tick();
    this.say(this.cursor === 0 ? `${this.L.hero}. ${this.L.heroLine}.` : this.L.locked);
  }
  private confirm() {
    if (this.chosen >= 0) return;
    if (this.cursor !== 0) {
      this.nope = 0.4;
      this.sound.empty();
      this.say(this.L.locked);
      return;
    }
    this.chosen = 0;
    this.pt = 0;
    this.sound.stamp();
    this.sound.press();
    this.say(`${this.L.hero}. ${this.L.ready}`);
  }

  // ── A message: the game stops until it has been read ───────────────────────────────────────
  private showCard(p: Pickup, weapon: WeaponId) {
    const { card, L } = this;
    const name = L[weapon === "pistol" ? "rapid" : weapon];
    const pickups = this.chapter().pickups;
    const line = (text: string, size: string) =>
      `<span class="op-line" data-size="${size}">${glyphWords(text)}</span>`;
    const lore = loreOf(p.name);
    card.innerHTML = [
      p.marks.length ? `<span class="op-marks">${p.marks.join(" ")}</span>` : "",
      line(p.name.toUpperCase(), "big"),
      line(this.fact(p).split(" · ")[0] ?? "", "mid"),
      line(p.places.join(", ").toUpperCase(), "mid"),
      line(`${L.unlocked}: ${name}`, "gold"),
      lore ? line(lore.toUpperCase(), "lore") : "",
      line(`${L.skills} ${pickups.indexOf(p) + 1}/${pickups.length}`, "dim"),
      `<span class="op-carry">${glyphWords(touch() ? L.tap : L.resume)}</span>`,
    ].join("");
    card.hidden = false;
    this.reading = 0.001;
    this.held.clear();
    this.say(
      `${p.name}: ${this.fact(p, true)}. ${L.unlocked.toLowerCase()}: ${name.toLowerCase()}. ${lore ?? ""} ${touch() ? L.tap : L.resume}`,
    );
  }
  private carryOnReading() {
    this.reading = 0;
    this.card.hidden = true;
    this.hero.inv = Math.max(this.hero.inv, 0.6); // a breath to find your feet again
  }

  // ── Frame ──────────────────────────────────────────────────────────────────────────────────
  private frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.step(dt);
    const paint = this.tooSmall ? () => this.drawTooSmall() : () => this.draw();
    paint();
    this.raf = requestAnimationFrame(this.frame);
  };

  // One tick of the clock: a message waits to be read, a heavy blow holds, or the world moves.
  private step(dt: number) {
    if (this.reading) {
      this.reading += dt;
      this.card.classList.toggle("is-ready", this.reading > READ);
      return;
    }
    if (this.stop > 0) {
      this.stop -= dt;
      return;
    }
    if (!this.paused && this.phase !== "still" && !this.tooSmall) this.update(dt);
  }

  private update(dt: number) {
    this.t += dt;
    this.pt += dt;
    this.shake = Math.max(0, this.shake - dt * 18);
    this.nope = Math.max(0, this.nope - dt);
    switch (this.phase) {
      case "boot":
        return this.updateBoot(dt);
      case "title":
        return this.updateTitle();
      case "select":
        if (this.chosen >= 0 && this.pt > 1.3) {
          this.chosen = -1;
          this.picked = true;
          this.go("brief");
        } else if (this.chosen < 0 && this.pt > SELECT_TIME) {
          this.cursor = 0; // the clock runs out: the one who can go, goes
          this.confirm();
        }
        return;
      case "brief":
        this.updateHero(dt);
        if (this.typed < this.briefChars()) {
          const before = Math.floor(this.typed);
          this.typed += 34 * dt;
          if (Math.floor(this.typed) !== before && before % 2 === 0) this.sound.type();
        }
        return;
      case "continue":
        this.countdown -= dt;
        if (Math.ceil(this.countdown) !== Math.ceil(this.countdown + dt)) this.sound.tick();
        if (this.countdown <= 0) {
          this.go("over");
          this.sound.gameOver();
          this.say(this.L.failed);
        }
        return;
      case "over":
        if (this.pt > 3) {
          this.failed = true;
          this.played.push({ title: this.map.title, rank: "-" });
          this.go("clear");
        }
        return;
      case "clear":
        this.updateHero(dt);
        this.effects(dt);
        return;
      default:
        this.seconds += dt;
        this.energy = Math.min(ENERGY.max, this.energy + ENERGY.regen * dt);
        this.adjust(dt);
        this.level();
        this.updateHero(dt);
        this.updateFoes(dt);
        this.updateTurret(dt);
        this.updateBoss(dt);
        this.updateShots(dt);
        this.updateHostiles(dt);
        this.updateThings(dt);
        this.effects(dt);
        if (this.phase === "warning" && this.pt > 2.4) this.bossIn();
        if (this.phase === "fall" && this.pt > 3.8) {
          this.played.push({ title: this.map.title, rank: this.rank() });
          this.go("clear");
          this.sound.fanfare();
        }
    }
  }

  // The difficulty follows the player: a little above what they have shown lately (rules.ts).
  private floor() {
    return floorOf(this.played.length, this.seconds / 60);
  }
  private adjust(dt: number) {
    this.tracker.tick(dt);
    this.heat = heatToward(this.heat, this.tracker.skill(), this.floor(), dt);
  }
  private tune() {
    return tuningOf(this.heat);
  }

  private updateBoot(dt: number) {
    const n = this.L.boot.length;
    const crossed = (at: number) => this.pt >= at && this.pt - dt < at;
    for (let i = 0; i < n; i++)
      if (this.L.boot[i] !== " " && crossed(0.3 + i * 0.11)) this.sound.letter(i);
    const done = 0.3 + n * 0.11 + 0.15;
    if (crossed(done)) {
      this.sound.chime();
      this.shake = 2;
    }
    if (crossed(done + 0.5)) this.sound.shine();
    if (this.pt > done + 2.4) this.go("title");
  }

  private updateTitle() {
    const shots = 6;
    const k = Math.floor((this.pt - 0.3) / 0.16);
    if (k >= 0 && k < shots && this.stamps.length <= k) {
      this.stamps.push({ x: rand(0.08, 0.92), y: rand(0.15, 0.85) });
      this.sound.shoot(true);
      this.shake = 2;
    }
    if (this.stamps.length === shots && this.pt > 0.3 + shots * 0.16 + 0.1) {
      this.stamps.push({ x: -1, y: -1 }); // the name has slammed on
      this.sound.stamp();
      this.shake = 4;
    }
  }

  // ── The level ──────────────────────────────────────────────────────────────────────────────
  private level() {
    const { W, map } = this;
    for (let e = map.events.at(this.ev); e && e.at <= this.camX + W; e = map.events.at(this.ev)) {
      this.ev++;
      this.fireEvent(e);
    }
    const due = this.queue.filter((q) => q.at <= this.t);
    if (due.length) {
      this.queue = this.queue.filter((q) => q.at > this.t);
      for (const q of due) {
        if (q.chute) this.placeCrate(Math.round(this.camX + rand(W * 0.45, W - 20)), -16, true);
        else if (q.spawn) this.spawnFoe(q.spawn, q.from ?? "right", q.lock, q.extra === true);
      }
    }
    // A lock opens once its wave, its crates and its turret are down.
    if (this.lockAt !== undefined && this.phase === "play" && !this.boss) {
      const id = this.lockId;
      const busy =
        this.queue.some((q) => q.lock === id) ||
        this.foes.some((f) => f.lock === id) ||
        this.turret?.lock === id ||
        this.crates.some((c) => c.floor < 0);
      if (!busy) {
        this.lockAt = undefined;
        this.cleared = this.t;
      }
    }
    // The camera follows, never back, never past a lock.
    const stop = (this.lockAt ?? map.length) - W;
    this.camX = Math.max(0, Math.min(stop, Math.max(this.camX, this.hero.x - W * 0.38)));
  }

  private fireEvent(e: MapEvent) {
    const { gy } = this;
    switch (e.kind) {
      case "crate":
        return this.placeCrate(e.x, gy - (e.h ?? 0) - 10, false);
      case "mate":
        this.mates.push({ x: e.x, feet: gy - (e.h ?? 0), state: "bound", t: 0, gift: e.gift });
        return;
      case "spawn":
        return this.enqueue(e.spawn, -1);
      case "lock": {
        const id = ++this.lockId;
        this.lockAt = e.x;
        e.wave.forEach((s) => this.enqueue(s, id));
        for (let i = 0; i < (e.chutes ?? 0); i++)
          this.queue.push({ at: this.t + 2 + i * 3, lock: id, chute: true });
        if (e.turret !== undefined) {
          const hp = toughen(this.map.turret.hp, this.tune().boss);
          this.turret = {
            x: e.turret,
            hp,
            max: hp,
            t: 0,
            next: 1.5,
            telegraph: 0,
            mode: "shell",
            burst: 0,
            flash: 0,
            lock: id,
          };
          this.say(this.map.turret.name);
        }
        return;
      }
      case "boss":
        this.lockAt = this.map.length;
        this.go("warning");
        this.sound.music(undefined);
        this.sound.warn();
        this.banners = [];
        this.say(this.map.warning);
    }
  }

  // A wave's foes come at the map's pace, spread out a little more for a player at ease.
  private enqueue(s: Spawn, lock: number) {
    const pace = this.tune().pace;
    for (let i = 0; i < (s.n ?? 1); i++)
      this.queue.push({
        at: this.t + ((s.delay ?? 0) + i * (s.gap ?? 1)) * pace,
        spawn: s.foe,
        from: s.from,
        lock,
      });
  }

  private placeCrate(x: number, y: number, chute: boolean) {
    const p = this.chapter().pickups.at(this.crateIndex);
    const weapon = weaponOf(this.map.loot, this.crateIndex);
    this.crateIndex++;
    this.crates.push({ p, weapon, x, y, seed: rand(0, 6), floor: chute ? -1 : y });
  }

  private spawnFoe(kind: FoeKind, from: "right" | "left", lock: number, extra: boolean) {
    const x = from === "left" ? this.camX - 16 : this.camX + this.W + 6;
    const tough = this.tune().tough;
    const spec = FOES[kind];
    const size = {
      w: spec.width,
      h: spec.height,
      hp: spec.toughens ? toughen(spec.health, tough) : spec.health,
    };
    // One from behind is called out at the edge it comes from.
    if (from === "left" && !extra) {
      this.alerts.push({ side: -1, t: 0 });
      this.sound.tick();
    }
    const y = kind === "drone" ? -10 : this.gy - size.h;
    this.foes.push({
      kind,
      x,
      y,
      vy: 0,
      ...size,
      t: 0,
      flash: 0,
      facing: from === "left" ? 1 : -1,
      state: "walk",
      timer: rand(1, 2),
      ground: kind !== "drone",
      lock,
      hopped: false,
      away: 0,
    });
    // At ease, the player meets one more now and then.
    if (!extra && Math.random() < this.tune().extra)
      this.queue.push({ at: this.t + 0.7, spawn: kind, from, lock, extra: true });
  }

  // ── The hero ───────────────────────────────────────────────────────────────────────────────
  private heroBox(): Box {
    const h = this.hero.crouch ? 13 : 18;
    return { x: this.hero.x + 4, y: this.hero.feet - h, w: 8, h };
  }

  private floorUnder(x: number, before: number, after: number) {
    for (const p of this.map.platforms) {
      const top = this.gy - p.h;
      if (x >= p.x - 2 && x <= p.x + p.w + 2 && before <= top + 0.5 && after >= top) return top;
    }
    return after >= this.gy ? this.gy : undefined;
  }

  private onLedge(x: number, feet: number) {
    return this.map.platforms.some(
      (p) => feet === this.gy - p.h && x >= p.x - 2 && x <= p.x + p.w + 2,
    );
  }

  // A press waits a moment for the ground (motion.ts); the jump itself starts in updateHero.
  private jump() {
    if (this.hero.dead <= 0) this.jumper.press(this.t);
  }

  // Down and jump on a ledge drops through it; otherwise, a jump.
  private leap() {
    const { hero } = this;
    if (hero.ground && this.held.has("down") && this.onLedge(hero.x + 8, hero.feet)) {
      hero.feet += 1; // under the ledge's top: it no longer holds the hero
      hero.ground = false;
      hero.vy = 20;
      this.jumper.fall();
      return;
    }
    hero.vy = -JUMP.speed;
    hero.ground = false;
    this.sound.jump();
  }

  private updateHero(dt: number) {
    const { hero, gy, held } = this;
    hero.recoil -= dt;
    hero.flash -= dt;
    hero.slash -= dt;
    hero.inv -= dt;
    hero.cooldown -= dt;
    hero.moving = false;
    if (this.phase === "brief" || this.phase === "clear") {
      hero.feet = gy;
      hero.crouch = false;
      if (this.phase === "brief" && hero.x < 20) {
        hero.x = Math.min(20, hero.x + 46 * dt);
        hero.moving = true;
      }
      hero.angle = this.phase === "clear" ? -Math.PI / 2 : 0;
      return;
    }
    if (hero.dead > 0) {
      hero.dead -= dt;
      hero.vy += GRAVITY * dt;
      hero.feet = Math.min(gy, hero.feet + hero.vy * dt);
      if (hero.dead <= 0) this.respawn();
      return;
    }
    hero.roll -= dt;
    hero.crouch = (hero.ground && held.has("down")) || hero.roll > 0;
    hero.guard = hero.ground && held.has("guard") && hero.dash <= 0 && hero.roll <= 0; // shots from the front glance off
    const dir = (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);
    if (dir && hero.roll <= 0) hero.facing = sideOf(dir);
    if (!dir || hero.guard || hero.crouch) hero.running = false;
    if (hero.roll > 0) hero.x += hero.rollDir * 190 * dt;
    if (dir && !hero.crouch && !hero.guard) {
      hero.x += dir * SPEED * (hero.running ? 1.7 : 1) * dt;
      hero.moving = true;
      if (hero.running && hero.ground && Math.random() < 0.5)
        this.parts.push({
          x: hero.x + 8 - dir * 6,
          y: hero.feet - 1,
          vx: -dir * 20,
          vy: -10,
          life: 0.3,
          max: 0.3,
          color: this.map.theme.ground.light,
          size: 2,
          grav: 40,
        });
    }
    if (hero.dash > 0) this.dashing(dt);
    hero.x = Math.max(this.camX + 2, Math.min(this.camX + this.W - 16, hero.x));
    // The turret and the boss are solid: no walking through them.
    if (this.turret && hero.x > this.turret.x - 14 && hero.x < this.turret.x + 30)
      hero.x = this.turret.x - 14;
    if (this.boss && hero.x > this.boss.x - 12) hero.x = this.boss.x - 12;
    if (hero.ground && hero.feet < gy && !this.onLedge(hero.x + 8, hero.feet)) hero.ground = false;
    this.jumper.ground(hero.ground, this.t);
    if (hero.roll <= 0 && this.jumper.take(this.t, hero.ground)) this.leap();
    if (!hero.ground) {
      const before = hero.feet;
      hero.vy = Math.min(300, hero.vy + GRAVITY * dt);
      hero.feet += hero.vy * dt;
      const floor = hero.vy >= 0 ? this.floorUnder(hero.x + 8, before, hero.feet) : undefined;
      if (floor !== undefined) {
        hero.feet = floor;
        hero.vy = 0;
        hero.ground = true;
      }
    }
    // Aim as on a cabinet: up aims up, down in the air aims down, otherwise ahead.
    hero.angle = held.has("up")
      ? -Math.PI / 2
      : held.has("down") && !hero.ground
        ? Math.PI / 2
        : hero.facing === 1
          ? 0
          : Math.PI;
    if (held.has("fire")) this.fire(true);
  }

  private shoulder(): Pt {
    const { hero } = this;
    const top = hero.feet - (hero.crouch ? HERO.crouchH : HERO.h) + 2;
    const x = hero.facing === 1 ? hero.x + HERO.shoulder.x : hero.x + HERO.w - HERO.shoulder.x;
    return { x, y: top + (hero.crouch ? HERO.crouchShoulder : HERO.shoulder.y) };
  }

  // The closest thing to shoot at, for rockets that home in.
  private nearest(from: Pt): Pt | undefined {
    let best: Pt | undefined,
      d = 220;
    const consider = (x: number, y: number) => {
      const dd = Math.hypot(x - from.x, y - from.y);
      if (dd < d) [best, d] = [{ x, y }, dd];
    };
    for (const e of this.foes) if (e.state !== "fall") consider(e.x + e.w / 2, e.y + e.h / 2);
    if (this.turret) consider(this.turret.x + 18, this.gy - 14);
    if (this.boss) consider(this.boss.x + BOSS.w / 2, this.gy - BOSS.h / 2 - this.boss.hop);
    return best;
  }

  // A press fires once; holding fires on: the pistol slowly, the pickups at their own pace.
  private fire(held: boolean) {
    const { hero } = this;
    if (hero.dead > 0 || hero.cooldown > 0) return;
    const reach: Box = {
      x: hero.facing === 1 ? hero.x + 10 : hero.x - 8,
      y: hero.feet - 18,
      w: 14,
      h: 18,
    };
    const near = this.foes.find(
      (f) => f.state !== "fall" && f.kind !== "drone" && overlap(reach, f),
    );
    if (near) {
      hero.slash = 0.18;
      hero.cooldown = 0.28;
      this.sound.slash();
      this.hurtFoe(near, 3, true);
      return;
    }
    const w = WEAPONS[hero.weapon];
    const s = this.shoulder();
    const dx = Math.cos(hero.angle),
      dy = Math.sin(hero.angle);
    hero.cooldown = held && hero.weapon === "pistol" ? 0.3 : w.cooldown;
    hero.recoil = 0.05;
    hero.flash = 0.05;
    this.here.fired++;
    this.tracker.observe("shot");
    const kind =
      hero.weapon === "spread"
        ? "pellet"
        : hero.weapon === "rocket"
          ? "rocket"
          : hero.weapon === "flame"
            ? "flame"
            : "shot";
    for (let i = 0; i < w.pellets; i++) {
      const a =
        hero.angle +
        (w.pellets > 1
          ? -w.spread + (2 * w.spread * i) / (w.pellets - 1)
          : rand(-w.spread, w.spread));
      this.shots.push({
        kind,
        x: s.x + dx * 11,
        y: s.y + dy * 11,
        vx: Math.cos(a) * w.speed,
        vy: Math.sin(a) * w.speed - (kind === "flame" ? 10 : 0),
        dmg: w.damage,
        life: w.life,
        hits: new Set(),
        bounces: 0,
      });
    }
    if (kind === "pellet") this.sound.pellets();
    else if (kind === "rocket") this.sound.rocket();
    else if (kind === "flame") this.sound.flame();
    else this.sound.shoot(hero.weapon === "rapid");
    if (hero.weapon !== "pistol" && --hero.ammo <= 0) {
      hero.weapon = "pistol";
      hero.ammo = Infinity;
      this.sound.empty();
    }
  }

  // Forward twice, quickly: run, as in the brawlers. It lasts while the direction is held.
  private lastTap: { key: Key | ""; at: number } = { key: "", at: -9 };
  private tap(key: Key) {
    if (key !== "left" && key !== "right") return;
    if (this.lastTap.key === key && this.t - this.lastTap.at < 0.28) this.hero.running = true;
    this.lastTap = { key, at: this.t };
  }

  // A key that completes a special move, with energy enough, fires it instead of itself.
  private special(key: Key) {
    const input = inputOf(key, this.hero.facing);
    const move =
      input && this.fighting() && this.hero.dead <= 0
        ? this.combos.press(input, this.t)
        : undefined;
    if (!move || this.energy < move.cost) return false;
    this.energy -= move.cost;
    this.tracker.observe("special");
    this.found.add(move.id);
    this.perform(move);
    return true;
  }

  private perform(move: Move) {
    const { hero, L } = this;
    const f = hero.facing;
    this.banners.push({ title: L[move.id], t: 0, dur: 1.2 });
    this.say(L[move.id]);
    this.shake = Math.max(this.shake, 3);
    if (move.id === "dash") {
      hero.dash = 0.28;
      hero.dashed = new Set();
      hero.inv = Math.max(hero.inv, 0.45);
      this.sound.slash();
    } else if (move.id === "rollback") {
      // A roll away, low and untouchable, still facing the threat.
      const held = (this.held.has("right") ? 1 : 0) - (this.held.has("left") ? 1 : 0);
      hero.rollDir = sideOf(held || -f);
      hero.facing = sideOf(-hero.rollDir);
      hero.roll = 0.34;
      hero.inv = Math.max(hero.inv, 0.42);
      hero.running = false;
      this.sound.jump();
    } else if (move.id === "blast") {
      const s = this.shoulder();
      this.shots.push({
        kind: "wave",
        x: s.x + f * 10,
        y: s.y,
        vx: f * 230,
        vy: 0,
        dmg: 5,
        life: 1.4,
        hits: new Set(),
        bounces: 0,
      });
      this.sound.pellets();
      this.sound.charge();
    } else {
      // Bombs rain ahead, one after another.
      for (let i = 0; i < 5; i++)
        this.shots.push({
          kind: "bomb",
          x: hero.x + 8 + f * (34 + i * 26),
          y: -12 - i * 14,
          vx: 0,
          vy: 60,
          dmg: 7,
          life: 4,
          hits: new Set(),
          bounces: 1,
        });
      this.sound.warn();
    }
  }

  // The dash: a rush forward, untouchable, cutting through all it crosses.
  private dashing(dt: number) {
    const { hero } = this;
    hero.dash -= dt;
    hero.x += hero.facing * 260 * dt;
    const path: Box = { x: hero.x - 2, y: hero.feet - 18, w: 20, h: 18 };
    for (const f of [...this.foes])
      if (!hero.dashed.has(f) && f.state !== "fall" && overlap(path, f)) {
        hero.dashed.add(f);
        this.hurtFoe(f, 4, true);
      }
    this.parts.push({
      x: hero.x + 8 - hero.facing * 8,
      y: hero.feet - rand(2, 16),
      vx: -hero.facing * 40,
      vy: 0,
      life: 0.25,
      max: 0.25,
      color: INK.goldLight,
      size: 2,
      grav: 0,
    });
  }

  private throwBomb() {
    const { hero } = this;
    if (hero.dead > 0 || hero.bombs <= 0) return;
    hero.bombs--;
    const s = this.shoulder();
    this.shots.push({
      kind: "bomb",
      x: s.x,
      y: s.y - 2,
      vx: hero.facing * 100,
      vy: -150,
      dmg: 9,
      life: 2,
      hits: new Set(),
      bounces: 0,
    });
    this.sound.toss();
  }

  private kill() {
    const { hero } = this;
    if (hero.dead > 0 || hero.inv > 0 || this.phase === "fall") return;
    hero.dead = 1.5;
    hero.vy = -120;
    this.here.deaths++;
    this.chain = 0;
    this.tracker.observe("death");
    this.heat = afterDeath(this.heat, this.floor());
    // Stuck in one spot: the game helps (rules.ts, mercyOf).
    this.mercy = mercyOf(
      this.spots.die(spotOf(this.lockAt === undefined ? undefined : this.lockId, this.camX)),
    );
    if (this.mercy.calm) this.heat = this.floor();
    this.stop = stopFor(this.stop, HITSTOP.heavy);
    this.sound.death();
    this.shake = 6;
    this.burst(hero.x + 8, hero.feet - 9, 18, ["#8e949e", "#263a66", "#f1bf91", INK.soot], 110);
    this.boomAt(hero.x + 8, hero.feet - 9, 10, 0.5);
  }

  private respawn() {
    if (this.lives <= 0) {
      this.go("continue");
      this.countdown = 9.99;
      this.held.clear();
      this.sound.music(undefined);
      this.say(`${this.L.continue} 9`);
      return;
    }
    this.lives--;
    this.spawnHero();
    this.say(`${this.L.down} ${this.lives + 1} ${this.L.livesLeft}.`);
  }

  private spawnHero() {
    Object.assign(this.hero, {
      x: this.camX + 24,
      feet: -10,
      vy: 0,
      ground: false,
      weapon: "pistol",
      ammo: Infinity,
      bombs: 10,
      inv: this.mercy.safe,
      dead: 0,
      dash: 0,
      roll: 0,
    });
    this.jumper = new Jumper();
    if (this.mercy.supply) this.supplyDrop();
    this.mercy = mercyOf(0);
  }

  // A weapon from the map's loot, falling where the hero comes back. It holds no skill.
  private supplyDrop() {
    const loot = this.map.loot;
    const weapon = loot.at(Math.floor(Math.random() * loot.length)) ?? "rapid";
    this.items.push({
      kind: "weapon",
      weapon,
      x: this.camX + 58,
      y: -14,
      vy: 0,
      t: 0,
      floor: this.gy - 9,
    });
    this.banners.push({ title: this.L.supply, t: 0, dur: 1.4 });
    this.say(this.L.supply);
  }

  private carryOn() {
    this.continues++;
    this.lives = 2;
    this.go("play");
    this.spawnHero();
    this.sound.music(this.map.music, Boolean(this.boss));
    this.say(`${this.L.credits} ${this.continues}.`);
  }

  // ── What can be hit ────────────────────────────────────────────────────────────────────────
  private hitAt(b: Box): object | undefined {
    const foe = this.foes.find((f) => f.state !== "fall" && overlap(b, f));
    if (foe) return foe;
    const crate = this.crates.find((c) =>
      overlap(b, { x: c.x - 3, y: c.y - (c.floor < 0 ? 10 : 0), w: 18, h: c.floor < 0 ? 21 : 11 }),
    );
    if (crate) return crate;
    const mate = this.mates.find(
      (m) => m.state === "bound" && overlap(b, { x: m.x, y: m.feet - 12, w: 12, h: 12 }),
    );
    if (mate) return mate;
    if (this.turret && overlap(b, { x: this.turret.x, y: this.gy - 22, w: 36, h: 22 }))
      return this.turret;
    const boss = this.boss;
    if (
      boss &&
      boss.state !== "drop" &&
      overlap(b, { x: boss.x, y: this.gy - BOSS.h - boss.hop, w: BOSS.w, h: BOSS.h })
    )
      return boss;
    return undefined;
  }

  private damage(target: object, dmg: number, at: Pt) {
    const foe = this.foes.find((f) => f === target);
    if (foe) return this.hurtFoe(foe, dmg, false);
    const crate = this.crates.find((c) => c === target);
    if (crate) return this.openCrate(crate);
    const mate = this.mates.find((m) => m === target);
    if (mate) return this.freeMate(mate);
    const tu = this.turret;
    if (tu && target === tu) {
      tu.hp -= dmg;
      tu.flash = 0.05;
      this.burst(at.x, at.y, 3, [INK.goldLight, INK.stoneLight], 50);
      if (tu.hp <= 0) this.turretDown();
      return;
    }
    const b = this.boss;
    if (b && target === b) {
      b.hp -= dmg;
      b.flash = 0.05;
      this.score += Math.round(dmg * POINTS.bossHit);
      this.burst(at.x, at.y, 3, [INK.goldLight, ...this.map.theme.debris.slice(0, 2)], 50);
      this.sound.hit();
      if (b.hp <= 0) this.bossDown();
    }
  }

  private hurtFoe(f: Foe, dmg: number, melee: boolean) {
    f.hp -= dmg;
    f.flash = 0.06;
    // A blow at close quarters knocks the foe back; a robot staggers.
    if (melee && f.kind !== "drone") {
      f.x += this.hero.facing * 12;
      if (f.kind === "robot") [f.state, f.timer] = ["walk", Math.max(f.timer, 0.6)];
    }
    if (f.hp > 0) return;
    const base = FOES[f.kind].points;
    this.stop = stopFor(
      this.stop,
      f.kind === "bug" ? HITSTOP.kill : HITSTOP.heavy * (melee ? 1.3 : 1),
    );
    this.chain = chainAfter(this.chain, this.t - this.lastKill);
    this.lastKill = this.t;
    const mult = multiplierOf(this.chain) * (melee ? POINTS.melee : 1);
    this.score += base * mult;
    this.kills++;
    this.tracker.observe("kill");
    this.energy = Math.min(ENERGY.max, this.energy + ENERGY.perKill);
    this.notes.push({
      x: f.x + f.w / 2,
      y: f.y - 4,
      text: mult > 1 ? `${base * mult} X${mult}` : String(base),
      t: 0,
      color: mult > 1 ? INK.gold : INK.goldLight,
    });
    if (f.kind === "drone") {
      f.state = "fall";
      f.vy = -40;
      this.sound.hit();
      return;
    }
    this.foes = this.foes.filter((o) => o !== f);
    if (f.kind === "bug") {
      this.burst(f.x + 5, f.y + 3, 10, [...this.map.theme.bug, INK.soot], 70);
      this.sound.squash();
    } else {
      this.burst(f.x + 7, f.y + 8, 16, [...this.map.theme.robot, INK.soot, INK.ember], 110);
      this.boomAt(f.x + 7, f.y + 8, 8, 0.45);
      this.sound.boom();
    }
  }

  private openCrate(c: Crate) {
    this.crates = this.crates.filter((o) => o !== c);
    this.score += POINTS.crate;
    this.burst(c.x + 6, c.y + 5, 16, [INK.khaki, "#d29a55", "#8a5a2b", INK.soot], 90);
    this.boomAt(c.x + 6, c.y + 5, 7, 0.35);
    this.items.push({
      kind: "weapon",
      p: c.p,
      weapon: c.weapon,
      x: c.x + 1,
      y: c.y,
      vy: -90,
      t: 0,
      floor: c.floor < 0 ? this.gy - 9 : c.floor + 1,
    });
    this.sound.crate();
  }

  private freeMate(m: Mate) {
    m.state = "free";
    m.t = 0;
    this.freed++;
    this.here.freed++;
    this.score += POINTS.mate;
    this.sound.free();
    this.notes.push({ x: m.x + 6, y: m.feet - 22, text: "1000", t: 0, color: INK.goldLight });
  }

  private collect(it: Item) {
    const { hero, L } = this;
    this.items = this.items.filter((o) => o !== it);
    if (it.kind === "bombs") {
      hero.bombs += 5;
      this.banners.push({ title: L.moreBombs, t: 0, dur: 1.4 });
      this.sound.pickup();
      return;
    }
    if (it.kind === "life") {
      this.lives++;
      this.banners.push({ title: L.oneUp, t: 0, dur: 1.6 });
      this.sound.oneUp();
      this.say(L.oneUp);
      return;
    }
    const weapon = it.weapon ?? "rapid";
    hero.weapon = weapon;
    hero.ammo = WEAPONS[weapon].ammo;
    this.score += POINTS.weapon;
    this.sound.pickup();
    if (it.p) {
      this.got.push(it.p);
      this.showCard(it.p, weapon);
    } else
      this.banners.push({ title: `${L[weapon === "pistol" ? "rapid" : weapon]}!`, t: 0, dur: 1.6 });
  }

  private fact(p: Pickup, spoken = false) {
    const to = p.to === null ? this.L.now : p.to === p.from ? "" : String(p.to);
    const years = to
      ? `${p.from}${spoken ? "–" : "-"}${spoken ? to.toLowerCase() : to}`
      : String(p.from);
    return `${years} · ${p.places.join(", ")}`;
  }

  // ── Foes ───────────────────────────────────────────────────────────────────────────────────
  private updateFoes(dt: number) {
    const { hero, gy } = this;
    const tune = this.tune();
    const hb = this.heroBox();
    const hx = hero.x + 8;
    let aiming = this.foes.filter((f) => f.state === "aim").length;
    for (const f of this.foes) {
      f.t += dt;
      f.flash -= dt;
      const dx = hx - (f.x + f.w / 2);
      if (f.state === "fall") {
        f.vy += 300 * dt;
        f.y += f.vy * dt;
        if (f.y + f.h >= gy) {
          f.hp = -99;
          this.boomAt(f.x + 7, gy - 4, 9, 0.45);
          this.burst(f.x + 7, gy - 3, 12, [...this.map.theme.robot, INK.ember], 90);
          this.sound.boom();
        }
        continue;
      }
      if (f.kind === "bug") {
        f.facing = dx < 0 ? -1 : 1;
        f.x += f.facing * 28 * tune.bug * (this.boss && this.boss.phase >= 3 ? 1.25 : 1) * dt;
        if (f.ground && !f.hopped && Math.abs(dx) < 36 && Math.random() < dt * 2) {
          f.vy = -130;
          f.ground = false;
          f.hopped = true;
        }
        if (!f.ground) {
          f.vy += GRAVITY * dt;
          f.y += f.vy * dt;
          if (f.y + f.h >= gy) {
            f.y = gy - f.h;
            f.ground = true;
          }
        }
        if (hero.dead <= 0 && overlap(hb, f)) this.kill();
      } else if (f.kind === "robot") {
        f.facing = dx < 0 ? -1 : 1;
        const dist = Math.abs(dx);
        const inView = f.x > this.camX - 4 && f.x < this.camX + this.W - 10;
        f.timer -= dt;
        if (f.state === "walk") {
          f.x += f.facing * (dist > 110 ? 1 : dist < 55 ? -1 : 0) * 30 * dt;
          // Only so many take aim at once: the others wait their turn.
          if (f.timer <= 0 && inView && hero.dead <= 0) {
            if (aiming < tune.shooters) {
              [f.state, f.timer] = ["aim", tune.warn];
              aiming++;
            } else f.timer = rand(0.2, 0.5);
          }
        } else if (f.timer <= 0) {
          const from = { x: f.facing === 1 ? f.x + 17 : f.x - 3, y: f.y + 9 };
          if (Math.random() < 0.25) this.lob(from, { x: hx, y: gy }, "shell", 1);
          else this.aimAt(from, 125 * tune.bullet);
          this.sound.enemyShot();
          [f.state, f.timer] = ["walk", rand(1.3, 2.1) / tune.fire];
        }
      } else {
        const cruise = gy - 58 + Math.sin(f.t * 2 + f.x * 0.01) * 8;
        f.y += Math.sign(cruise - f.y) * Math.min(Math.abs(cruise - f.y), 50 * dt);
        f.x += Math.sign(dx) * Math.min(Math.abs(dx), 40 * dt);
        f.timer -= dt;
        if (Math.abs(dx) < 12 && f.timer <= 0) {
          this.hostiles.push({ kind: "bomb", x: f.x + 6, y: f.y + 6, vx: 0, vy: 10, grav: 300 });
          f.timer = 1.7 / tune.fire;
        }
      }
    }
    this.bringBackStranded(dt);
    this.foes = this.foes.filter(
      (f) => f.hp > -99 && f.x > this.camX - 80 && f.x < this.camX + this.W + 80,
    );
  }

  // A locked wave never waits on a foe the hero cannot reach: one out of reach too long walks back in.
  private bringBackStranded(dt: number) {
    if (this.lockAt === undefined) return;
    const reach = { left: this.camX + 4, right: this.camX + this.W - 4, top: 0, bottom: this.gy };
    for (const foe of this.foes.filter((f) => f.lock === this.lockId && f.state !== "fall")) {
      const inReach =
        foe.x >= reach.left &&
        foe.x + foe.w <= reach.right &&
        foe.y >= reach.top &&
        foe.y + foe.h <= reach.bottom + 1;
      foe.away = inReach ? 0 : foe.away + dt;
      if (foe.away < STRANDED) continue;
      foe.x = keptInLock({ x: foe.x, width: foe.w, ...reach });
      if (foe.kind !== "drone") foe.y = this.gy - foe.h;
      foe.away = 0;
    }
  }

  // A shot straight at the hero, at their waist, or lower when they crouch.
  private aimAt(from: Pt, speed: number) {
    const tx = this.hero.x + 8 - from.x,
      ty = this.hero.feet - (this.hero.crouch ? 6 : 11) - from.y;
    // At ease, the aim strays a little: standing still is not always a hit.
    const j = this.tune().jitter;
    const a = Math.atan2(ty, tx) + rand(-j, j);
    this.hostiles.push({
      kind: "bullet",
      x: from.x,
      y: from.y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      grav: 0,
    });
  }

  // A projectile thrown in an arc to land at `to` in `T` seconds.
  private lob(from: Pt, to: Pt, kind: Hostile["kind"], T: number) {
    const g = 260;
    this.hostiles.push({
      kind,
      x: from.x,
      y: from.y,
      vx: (to.x - from.x) / T,
      vy: (to.y - from.y) / T - 0.5 * g * T,
      grav: g,
    });
  }

  private updateTurret(dt: number) {
    const tu = this.turret;
    if (!tu) return;
    tu.flash -= dt;
    if (tu.x > this.camX + this.W - 20) return;
    tu.t += dt;
    const tune = this.tune();
    if (tu.telegraph > 0) {
      tu.telegraph -= dt;
      if (tu.telegraph <= 0) {
        if (tu.mode === "shell") {
          this.lob(
            { x: tu.x + 10, y: this.gy - 26 },
            { x: this.hero.x + 8 + rand(-8, 8), y: this.gy },
            "shell",
            1.15,
          );
          this.sound.thud();
        } else tu.burst = 3;
      }
    }
    if (tu.burst > 0 && tu.t > tu.next - 1) {
      tu.burst--;
      tu.next = tu.t + 1.12;
      this.aimAt({ x: tu.x + 6, y: this.gy - 22 }, 150 * tune.bullet);
      this.sound.enemyShot();
    }
    if (tu.t > tu.next && tu.telegraph <= 0 && tu.burst <= 0) {
      tu.mode = tu.mode === "shell" ? "burst" : "shell";
      tu.telegraph = tune.warn;
      tu.next = tu.t + 2.3 / tune.fire;
    }
  }

  private turretDown() {
    const tu = this.turret;
    if (!tu) return;
    this.turret = undefined;
    this.score += POINTS.turret;
    this.shake = 6;
    this.stop = stopFor(this.stop, HITSTOP.boss);
    for (let i = 0; i < 4; i++)
      window.setTimeout(
        () => this.boomAt(tu.x + rand(4, 32), this.gy - rand(4, 20), rand(8, 12), 0.6),
        i * 120,
      );
    this.sound.boom(true);
    this.burst(tu.x + 18, this.gy - 12, 26, [...this.map.theme.robot, INK.ember, INK.gold], 130);
    this.placeCrate(tu.x + 2, -16, true);
    this.placeCrate(tu.x + 24, -40, true);
    this.notes.push({ x: tu.x + 18, y: this.gy - 30, text: "5000", t: 0, color: INK.gold });
  }

  // ── The boss ───────────────────────────────────────────────────────────────────────────────
  private bossIn() {
    this.go("play");
    this.boss = {
      x: this.map.length - BOSS.w - 10,
      hop: 160,
      vy: 1,
      hp: toughen(this.map.boss.hp, this.tune().boss),
      phase: 1,
      state: "drop",
      t: 0,
      flash: 0,
      count: 0,
      crateGiven: false,
      max: 1,
      last: undefined,
    };
    this.boss.max = this.boss.hp;
    this.sound.music(this.map.music, true);
    this.say(this.map.boss.name);
  }

  private updateBoss(dt: number) {
    const b = this.boss;
    if (this.phase === "fall") {
      if (b && this.pt < 1.5 && Math.random() < dt * 10) {
        this.boomAt(b.x + rand(4, BOSS.w - 4), this.gy - rand(4, BOSS.h - 4), rand(7, 12), 0.55);
        this.shake = Math.max(this.shake, 3);
        this.sound.boom();
      }
      if (b && this.pt >= 1.5) this.split(b);
      return;
    }
    if (!b) return;
    b.t += dt;
    b.flash -= dt;
    const { gy } = this;
    const spec = this.map.boss;
    const phase = spec.phases.reduce((n, p, i) => (b.hp / b.max <= p.below ? i + 1 : n), 1);
    const stage = spec.phases.at(phase - 1) ?? spec.phases.at(0);
    if (phase > b.phase && b.state !== "drop") {
      [b.phase, b.state, b.t] = [phase, "roar", 0];
      this.sweep = undefined;
      this.sound.roar();
      this.shake = 8;
      this.stop = stopFor(this.stop, HITSTOP.boss);
      this.banners.push({ title: this.L.enraged, t: 0, dur: 1.4 });
      this.say(this.L.enraged);
      if (!b.crateGiven) {
        b.crateGiven = true;
        this.placeCrate(this.camX + this.W * 0.3, -16, true);
      }
    }
    const rest = () => ([b.state, b.t] = ["idle", 0]);
    const shock = () => {
      this.sound.thud();
      this.shake = Math.max(this.shake, 6);
      const speed = 110 + phase * 20;
      this.waves.push({ x: b.x - 2, speed });
      if (phase >= 3)
        window.setTimeout(
          () => this.boss && this.waves.push({ x: b.x - 2, speed: speed * 0.7 }),
          450,
        );
      for (let i = 0; i < 10; i++)
        this.parts.push({
          x: b.x + rand(0, BOSS.w),
          y: gy - 1,
          vx: rand(-40, 40),
          vy: rand(-40, -10),
          life: 0.5,
          max: 0.5,
          color: this.map.theme.ground.light,
          size: 2,
          grav: 60,
        });
    };
    switch (b.state) {
      case "drop":
      case "hop":
        b.vy += 300 * dt;
        b.hop = Math.max(0, b.hop - b.vy * dt);
        if (b.hop === 0) {
          b.vy = 0;
          shock();
          rest();
        }
        break;
      case "roar":
        if (b.t > 1.2) rest();
        break;
      case "idle":
        if (stage && b.t > stage.rest * this.tune().rest) {
          const pick =
            nextAttack(stage.attacks, b.last, this.tune().repeat, Math.random()) ?? "hop";
          [b.state, b.t, b.count, b.last] = [pick, 0, 0, pick];
          if (pick === "hop") [b.vy, b.hop] = [-(115 + phase * 10), 0.01];
          if (pick === "sweepLow" || pick === "sweepHigh") {
            this.sweep = {
              y: pick === "sweepLow" ? gy - 16 : gy - 29,
              charge: Math.max(0.55, 0.95 - phase * 0.05 - (this.heat - 1) * 0.2),
              fire: 0.55,
              t: 0,
            };
            this.sound.charge();
          }
        }
        break;
      case "volley": {
        const n = 2 + phase;
        if (b.count < n && b.t > 0.5 + b.count * 0.16) {
          b.count++;
          this.lob(
            { x: b.x + 10, y: gy - BOSS.h + 25 },
            { x: this.hero.x + 8 + rand(-28, 28), y: gy },
            "brick",
            rand(0.9, 1.3),
          );
          this.sound.toss();
        }
        if (b.count >= n && b.t > 0.6 + n * 0.16) rest();
        break;
      }
      case "sweepLow":
      case "sweepHigh":
        if (!this.sweep) rest();
        break;
      case "spawn":
        if (b.count < 2 && b.t > 0.3 + b.count * 0.4) {
          b.count++;
          this.foes.push({
            kind: "bug",
            x: b.x - 6,
            y: gy - 6,
            vy: -60,
            w: 10,
            h: 6,
            hp: 1,
            t: 0,
            flash: 0,
            facing: -1,
            state: "walk",
            timer: 0,
            ground: false,
            lock: -1,
            hopped: true,
            away: 0,
          });
        }
        if (b.t > 1.2) rest();
        break;
    }
    // The beam: a warning line, then the fire. Crouch under the low one, stay down for the high.
    const sw = this.sweep;
    if (sw) {
      sw.t += dt;
      if (sw.t > sw.charge + sw.fire) this.sweep = undefined;
      else if (sw.t > sw.charge) {
        const hb = this.heroBox();
        if (hb.y < sw.y + 2 && hb.y + hb.h > sw.y - 2 && hb.x < b.x) this.kill();
      }
    }
    if (overlap(this.heroBox(), { x: b.x + 2, y: gy - BOSS.h - b.hop, w: BOSS.w - 4, h: BOSS.h }))
      this.kill();
  }

  private bossDown() {
    this.go("fall");
    this.stop = stopFor(this.stop, HITSTOP.boss);
    this.score += POINTS.boss;
    this.sweep = undefined;
    this.waves = [];
    this.hostiles = [];
    this.sound.music(undefined);
    this.foes.forEach((f) => this.burst(f.x + 5, f.y + 3, 6, [INK.soot, INK.ember]));
    this.foes = [];
  }

  private split(b: Boss) {
    const cx = b.x + BOSS.w / 2,
      cy = this.gy - BOSS.h / 2;
    this.boomAt(cx, cy, 24, 1.1);
    for (const [i, [dx, dy]] of (
      [
        [-14, -12],
        [14, -6],
        [-8, 12],
        [12, 14],
      ] as const
    ).entries())
      window.setTimeout(() => this.boomAt(cx + dx, cy + dy, 13, 0.7), 90 * (i + 1));
    this.burst(cx, cy, 30, [...this.map.theme.debris, INK.gold], 140);
    const colors = this.map.theme.debris;
    for (let i = 0; i < 12; i++)
      this.cubes.push({
        x: cx - 3 + rand(-10, 10),
        y: cy + rand(-14, 14),
        vx: rand(-110, 50),
        vy: rand(-170, -60),
        color: colors.at(i % colors.length) ?? INK.violet,
      });
    this.banners.push({ title: this.map.boss.split, t: 0, dur: 2.6 });
    this.shake = 8;
    this.sound.boom(true);
    this.say(this.map.boss.split);
    this.boss = undefined;
  }

  // ── Shots, hostile fire, things on the ground ─────────────────────────────────────────────
  private updateShots(dt: number) {
    const { gy } = this;
    for (const s of this.shots) {
      s.life -= dt;
      if (s.kind === "rocket") {
        const target = this.nearest(s);
        if (target) {
          const now = Math.atan2(s.vy, s.vx);
          const want = Math.atan2(target.y - s.y, target.x - s.x);
          const a =
            now +
            Math.max(
              -4 * dt,
              Math.min(4 * dt, Math.atan2(Math.sin(want - now), Math.cos(want - now))),
            );
          const v = Math.min(260, Math.hypot(s.vx, s.vy) + 200 * dt);
          [s.vx, s.vy] = [Math.cos(a) * v, Math.sin(a) * v];
        }
        if (Math.random() < 0.6)
          this.parts.push({
            x: s.x,
            y: s.y,
            vx: rand(-8, 8),
            vy: rand(-8, 8),
            life: 0.3,
            max: 0.3,
            color: INK.stoneLight,
            size: 1,
            grav: 0,
          });
      }
      if (s.kind === "bomb") s.vy += 420 * dt;
      if (s.kind === "flame") s.vy -= 30 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const size = s.kind === "flame" ? 4 : s.kind === "wave" ? 9 : 2;
      const hit = this.hitAt({ x: s.x - size / 2, y: s.y - size / 2, w: size, h: size });
      if (s.kind === "bomb") {
        if (s.y >= gy - 1 && !hit && s.bounces === 0)
          [s.y, s.vy, s.vx, s.bounces] = [gy - 1, s.vy * -0.35, s.vx * 0.6, 1];
        else if (hit || s.y >= gy - 1 || s.life <= 0) {
          this.blast(s.x, Math.min(s.y, gy - 2), 22, s.dmg);
          s.life = 0;
        }
        continue;
      }
      if (hit && !s.hits.has(hit)) {
        s.hits.add(hit);
        this.here.landed++;
        this.tracker.observe("hit");
        this.damage(hit, s.dmg, s);
        // A hit robot is pushed back a little, and a drone nudged.
        const foe = this.foes.find((f) => f === hit);
        if (foe && foe.kind !== "bug") foe.x += Math.sign(s.vx) * (s.kind === "shot" ? 0.8 : 2);
        if (s.kind === "rocket") this.blast(s.x, s.y, 10, 0);
        if (s.kind !== "flame" && s.kind !== "wave") s.life = 0;
      }
      if (s.y > gy + 2 && s.kind !== "flame" && s.kind !== "wave") {
        if (s.kind === "rocket") this.blast(s.x, s.y, 10, 2);
        s.life = 0;
      }
    }
    this.shots = this.shots.filter(
      (s) => s.life > 0 && s.x > this.camX - 20 && s.x < this.camX + this.W + 20 && s.y > -40,
    );
  }

  // An explosion of ours: it harms foes, the turret and the boss, frees and opens what it reaches.
  private blast(x: number, y: number, r: number, dmg: number) {
    this.boomAt(x, y, Math.max(8, r * 0.6), 0.5);
    this.shake = Math.max(this.shake, 3);
    this.sound.boom();
    if (!dmg) return;
    const area = { x: x - r, y: y - r, w: r * 2, h: r * 2 };
    for (const f of [...this.foes])
      if (f.state !== "fall" && overlap(area, f)) this.hurtFoe(f, dmg, false);
    for (const c of [...this.crates])
      if (overlap(area, { x: c.x, y: c.y, w: 12, h: 11 })) this.openCrate(c);
    for (const m of this.mates)
      if (m.state === "bound" && overlap(area, { x: m.x, y: m.feet - 12, w: 12, h: 12 }))
        this.freeMate(m);
    if (this.turret && overlap(area, { x: this.turret.x, y: this.gy - 22, w: 36, h: 22 }))
      this.damage(this.turret, dmg, { x, y });
    const b = this.boss;
    if (b && overlap(area, { x: b.x, y: this.gy - BOSS.h - b.hop, w: BOSS.w, h: BOSS.h }))
      this.damage(b, dmg, { x, y });
  }

  private updateHostiles(dt: number) {
    const { gy, hero } = this;
    const hb = this.heroBox();
    for (const h of this.hostiles) {
      h.vy += h.grav * dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      if (hero.dead <= 0 && overlap(hb, { x: h.x - 1.5, y: h.y - 1.5, w: 3, h: 3 })) {
        const front = Math.sign(h.vx) === -hero.facing;
        if (hero.guard && front && h.kind !== "shell" && h.kind !== "bomb") {
          this.burst(h.x, h.y, 5, [INK.white, "#a8e4ff"], 60); // blocked
          this.tracker.observe("block");
          this.sound.hit();
        } else this.kill();
        h.y = 9999;
      }
      if (h.y >= gy - 1 && h.y < 9000) {
        if (h.kind === "shell" || h.kind === "bomb") {
          this.boomAt(h.x, gy - 4, 10, 0.45);
          this.sound.boom();
          if (Math.abs(hero.x + 8 - h.x) < 13 && hero.feet > gy - 14) this.kill();
        } else if (h.kind === "brick") this.burst(h.x, gy - 2, 6, [...this.map.theme.volley], 50);
        h.y = 9999;
      }
    }
    this.hostiles = this.hostiles.filter(
      (h) => h.y < 9000 && h.x > this.camX - 30 && h.x < this.camX + this.W + 30,
    );
    // Shockwaves run along the ground, towards the hero; only the air is safe.
    for (const w of this.waves) {
      w.x -= w.speed * dt;
      if (Math.random() < 0.7)
        this.parts.push({
          x: w.x,
          y: gy - 1,
          vx: rand(-10, 10),
          vy: rand(-50, -20),
          life: 0.3,
          max: 0.3,
          color: this.map.theme.ground.light,
          size: 2,
          grav: 200,
        });
      if (hero.ground && hero.feet >= gy - 0.5 && Math.abs(hero.x + 8 - w.x) < 6) this.kill();
    }
    this.waves = this.waves.filter((w) => w.x > this.camX - 10);
  }

  private updateThings(dt: number) {
    const { gy } = this;
    for (const c of this.crates) {
      if (c.floor >= 0) continue;
      c.y += (this.H / 12) * dt;
      c.x += Math.sin(this.t * 1.8 + c.seed) * 3 * dt;
      if (c.y >= gy - 10) {
        c.y = gy - 10;
        c.floor = c.y;
        for (let i = 0; i < 5; i++)
          this.parts.push({
            x: c.x + 6 + rand(-4, 4),
            y: gy - 1,
            vx: rand(-30, 30),
            vy: rand(-26, -6),
            life: 0.5,
            max: 0.5,
            color: this.map.theme.ground.light,
            size: 2,
            grav: 40,
          });
      }
    }
    const hb = this.heroBox();
    for (const it of [...this.items]) {
      it.t += dt;
      if (it.y < it.floor || it.vy < 0) {
        it.vy += 300 * dt;
        it.y = Math.min(it.floor, it.y + it.vy * dt);
        if (it.y >= it.floor) it.vy = 0;
      }
      // Once it rests, it drifts to a hero close by.
      if (it.vy === 0 && this.hero.dead <= 0 && Math.abs(it.y + 9 - this.hero.feet) < 24)
        it.x = pullToward(it.x + 4.5, this.hero.x + 8, dt) - 4.5;
      if (this.hero.dead <= 0 && overlap(hb, { x: it.x, y: it.y, w: 9, h: 9 })) this.collect(it);
    }
    // A skill waits for the player; the rest goes after a while.
    this.items = this.items.filter((it) => it.p || it.t < 12);
    for (const a of this.alerts) a.t += dt;
    this.alerts = this.alerts.filter((a) => a.t < 1.4);
    for (const m of this.mates) {
      m.t += dt;
      if (m.state === "free" && m.t > 0.8 && m.t - dt <= 0.8)
        this.items.push({
          kind: m.gift,
          x: m.x + 2,
          y: m.feet - 14,
          vy: -80,
          t: 0,
          floor: m.feet - 9,
        });
      if (m.state === "free" && m.t > 1.2) m.x -= 70 * dt;
    }
    this.mates = this.mates.filter((m) => m.x > this.camX - 30);
  }

  private effects(dt: number) {
    const { gy } = this;
    for (const p of this.parts) {
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > gy && p.grav > 100) [p.y, p.vy, p.vx] = [gy, p.vy * -0.3, p.vx * 0.5];
      p.life -= dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const c of this.cubes) {
      c.vy += 300 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.y > gy - 6) {
        [c.y, c.vy, c.vx] = [gy - 6, c.vy * -0.42, c.vx * 0.7];
        if (Math.abs(c.vy) < 20) c.vy = 0;
      }
    }
    for (const b of this.booms) b.t += dt;
    this.booms = this.booms.filter((b) => b.t < b.dur);
    for (const n of this.notes) n.t += dt;
    this.notes = this.notes.filter((n) => n.t < 0.9);
    const banner = this.banners.at(0);
    if (banner && (banner.t += dt) > banner.dur) this.banners.shift();
    else if (banner && this.banners.length > 1 && banner.t > 0.9) this.banners.shift();
  }

  private burst(x: number, y: number, n: number, colors: readonly string[], speed = 70) {
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI, 0),
        v = rand(speed * 0.3, speed);
      const max = rand(0.4, 0.9);
      this.parts.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: max,
        max,
        color: colors.at(i % colors.length) ?? INK.soot,
        size: Math.random() < 0.3 ? 2 : 1,
        grav: 260,
      });
    }
  }

  private boomAt(x: number, y: number, r: number, dur: number) {
    const lobes = Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 + rand(-0.4, 0.4);
      return {
        dx: Math.cos(a) * r * 0.45,
        dy: Math.sin(a) * r * 0.4 - r * 0.1,
        r: r * rand(0.45, 0.65),
      };
    });
    this.booms.push({ x, y, r, t: 0, dur, lobes });
  }

  // ── The debrief ────────────────────────────────────────────────────────────────────────────
  private rank() {
    const { deaths, fired, landed } = this.here;
    const pickups = this.chapter().pickups;
    const skills = pickups.filter((p) => this.got.includes(p)).length;
    return rankOf({
      cleared: !this.failed,
      continues: this.continues,
      deaths,
      skills,
      total: pickups.length,
      accuracy: landed / Math.max(1, fired),
    });
  }
  private stats() {
    const secs = Math.round(this.seconds);
    return [
      [this.L.score, String(this.score).padStart(7, "0")],
      [this.L.skills, `${this.got.length}/${this.allPickups().length}`],
      [this.L.kills, String(this.kills)],
      [this.L.mates, String(this.freed)],
      [this.L.deaths, String(this.here.deaths)],
      [this.L.credits, String(this.continues)],
      [this.L.secrets, `${this.found.size}/${MOVES.length}`],
      [this.L.time, `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`],
    ] as const;
  }
  private loadoutWords() {
    return MAPS.map((m) => {
      const c = this.chapter(m);
      return [c.title, ...c.pickups.map((p) => `${p.name}: ${this.fact(p, true)}`)].join(". ");
    }).join(". ");
  }
  private headline() {
    return this.failed ? this.L.failed : this.isLast() ? this.L.congrats : this.L.clear;
  }

  private showEnd(phase: Phase) {
    const play =
      phase === "still"
        ? this.L.playAnyway
        : this.failed || this.isLast()
          ? this.L.replay
          : this.L.next;
    const note =
      phase === "still"
        ? this.L.playAnywayNote
        : this.failed || this.isLast()
          ? this.L.replayNote
          : this.L.nextNote
              .replace("{n}", String(this.stage + 2))
              .replace("{total}", String(this.order.length));
    paintEndButton({ button: this.playBtn, words: { title: play, note } });
    this.root.querySelector(".op-list")?.remove();
    if (phase === "still") {
      const list = document.createElement("ul");
      list.className = "op-sr op-list";
      for (const p of this.allPickups()) {
        const li = document.createElement("li");
        li.textContent = `${p.marks.join(" ")} ${p.name}: ${this.fact(p, true)}`;
        list.append(li);
      }
      this.root.append(list);
      this.end.hidden = false;
      this.measureEnd();
      this.playBtn.focus({ preventScroll: true });
      return;
    }
    window.setTimeout(() => {
      if (this.phase !== phase) return;
      this.end.hidden = false;
      this.measureEnd();
      this.playBtn.focus({ preventScroll: true });
    }, 2600);
    const spoken = this.stats()
      .map(([k, v]) => `${k.toLowerCase()} ${v}`)
      .join(", ");
    const tail = this.failed ? "" : this.isLast() ? this.L.congratsLine : this.L.nextUnlocked;
    this.say(`${this.headline()}. ${spoken}. ${this.L.rank.toLowerCase()} ${this.rank()}. ${tail}`);
  }

  // ── Drawing ────────────────────────────────────────────────────────────────────────────────
  private draw() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    if (this.phase === "boot") return this.drawBoot();
    if (this.phase === "title") return this.drawTitle();
    if (this.phase === "select") return this.drawSelect();
    ctx.save();
    if (this.shake > 0 && !reduced())
      ctx.translate(
        Math.round(rand(-this.shake, this.shake)),
        Math.round(rand(-this.shake, this.shake)),
      );
    this.drawWorld();
    ctx.restore();
    if (this.fighting() || this.phase === "continue") {
      this.hud();
      if (!touch()) this.keyStrip();
    }
    if (this.phase === "play") this.drawAlerts();
    this.drawFoeBar();
    if (this.phase === "brief") this.briefing();
    if (this.phase === "warning") this.warning();
    if (
      this.phase === "play" &&
      this.lockAt === undefined &&
      this.cleared > 0 &&
      this.t - this.cleared < 3 &&
      Math.floor(this.t * 3) % 2 === 0
    )
      drawText(ctx, this.L.goOn, W - 10, this.zones().goOn, 2, GOLD, {
        outline: INK.soot,
        align: "right",
      });
    if (!this.reading) this.banner();
    if (this.phase === "continue") this.drawContinue();
    if (this.phase === "over") this.bigText(this.L.failed, INK.rust);
    if (this.phase === "clear") this.debrief();
    if (this.phase === "still") this.loadout();
    if (this.paused) this.drawPaused();
    if (this.reading) {
      ctx.globalAlpha = 0.45;
      art.rect(ctx, 0, 0, W, H, INK.soot); // the world waits behind the message
      ctx.globalAlpha = 1;
    }
  }

  // A foe coming from off screen: a blinking mark at that edge, at its height.
  private drawAlerts() {
    const { ctx, W, gy } = this;
    for (const a of this.alerts) {
      if (Math.floor(a.t * 8) % 2) continue;
      const x = a.side === -1 ? 3 : W - 12;
      art.block(ctx, x, gy - 26, 9, 11, INK.rust);
      drawText(ctx, "!", x + 5, gy - 24, 1, INK.goldLight, { outline: INK.soot, align: "center" });
      const tip = a.side === -1 ? x - 2 : x + 10;
      art.rect(ctx, tip, gy - 22, 2, 3, INK.rust);
    }
  }

  // The keys, always in sight while playing: one row of keycaps along the ground.
  private keycap(x: number, y: number, key: string) {
    const w = textWidth(key) + 6;
    art.block(this.ctx, x, y, w, 9, INK.sandLight);
    art.rect(this.ctx, x, y + 8, w, 1, INK.khaki);
    drawText(this.ctx, key, x + 3, y + 1, 1, INK.soot);
    return w;
  }
  private keyStrip() {
    const { ctx, W, H, L } = this;
    const width = (keys: readonly (readonly [string, string])[]) =>
      keys.reduce((n, [k, l]) => n + textWidth(k) + 9 + textWidth(l) + 8, -8);
    const all = STRIP.map(([k, l]) => [k, L[l]] as const);
    // On a narrow stage the hints a player learns first go last: aim, crouch, pause.
    let keys = all;
    for (const drop of [L.keyAim, L.keyCrouch, L.keyPause])
      if (width(keys) > W - 8) keys = keys.filter(([, l]) => l !== drop);
    let x = Math.round((W - width(keys)) / 2);
    const y = H - 13;
    ctx.globalAlpha = 0.8;
    art.rect(ctx, 0, y - 3, W, 16, INK.soot);
    ctx.globalAlpha = 1;
    for (const [k, l] of keys) {
      x += this.keycap(x, y, k) + 3;
      x += drawText(ctx, l, x, y + 1, 1, INK.sandLight) + 8;
    }
  }

  private drawWorld() {
    const { ctx, W, gy, t, map } = this;
    const cam = Math.round(this.camX);
    for (const l of map.theme.layers) art.layer(ctx, l, cam, W, gy, t);
    ctx.save();
    ctx.translate(-cam, 0);
    for (const p of map.props)
      if (p.x > cam - 50 && p.x < cam + W + 10) art.prop(ctx, p.kind, p.x, gy, t);
    ctx.drawImage(
      this.groundImg,
      cam,
      0,
      W,
      this.groundImg.height,
      cam,
      gy,
      W,
      this.groundImg.height,
    );
    for (const p of map.platforms)
      if (p.x + p.w > cam && p.x < cam + W) art.ledge(ctx, p.x, gy - p.h, p.w, gy, map.theme.ledge);
    for (const m of this.mates) {
      art.mate(ctx, m.x, m.feet, m.state === "free", m.t);
      if (m.state === "bound" && Math.floor(t * 2) % 2 === 0)
        drawText(ctx, this.L.help, m.x + 6, m.feet - 22, 1, INK.goldLight, {
          outline: INK.soot,
          align: "center",
        });
    }
    for (const c of this.crates) this.drawCrate(c);
    for (const it of this.items) this.drawItem(it);
    if (this.turret) {
      const tu = this.turret;
      const a = Math.atan2(this.hero.feet - 10 - (gy - 22), this.hero.x + 8 - (tu.x + 18));
      art.turret(
        ctx,
        tu.x,
        gy,
        map.theme,
        t,
        Math.min(-0.15, a < 0 ? a : -Math.PI + 0.15),
        tu.telegraph > 0,
        tu.flash > 0,
      );
    }
    for (const f of this.foes) {
      if (f.kind === "bug") art.bug(ctx, f.x, f.y, f.facing, map.theme, f.t, f.flash > 0);
      else if (f.kind === "robot")
        art.robot(
          ctx,
          f.x,
          f.y,
          f.facing,
          map.theme,
          f.t,
          f.state === "aim",
          f.state === "walk",
          f.flash > 0,
        );
      else art.drone(ctx, f.x, f.y, map.theme, f.t, f.flash > 0);
    }
    if (this.boss) this.drawBoss(this.boss);
    for (const c of this.cubes) {
      art.block(ctx, c.x, c.y, 6, 6, c.color);
      ctx.globalAlpha = 0.45;
      art.rect(ctx, c.x, c.y, 6, 1, INK.white);
      ctx.globalAlpha = 1;
    }
    this.drawHero();
    this.drawShots();
    for (const h of this.hostiles) {
      if (h.kind === "bullet") {
        art.disc(ctx, h.x, h.y, 2, INK.soot);
        art.rect(ctx, h.x - 1, h.y - 1, 2, 2, Math.floor(t * 20) % 2 ? INK.goldLight : INK.ember);
      } else if (h.kind === "brick") art.block(ctx, h.x - 2, h.y - 1, 4, 3, map.theme.volley[0]);
      else art.block(ctx, h.x - 1, h.y - 1, 3, 3, h.kind === "shell" ? INK.mortar : INK.soot);
    }
    for (const w of this.waves)
      for (let i = 0; i < 4; i++)
        art.rect(ctx, w.x - i * 2, gy - 5 + i, 2, 5 - i, map.theme.ground.light);
    if (this.sweep) this.drawSweep(this.sweep);
    for (const p of this.parts) {
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 2);
      art.rect(ctx, p.x, p.y, p.size, p.size, p.color);
    }
    ctx.globalAlpha = 1;
    for (const b of this.booms) this.drawBoom(b);
    for (const n of this.notes)
      drawText(ctx, n.text, n.x, n.y - n.t * 16, 1, n.color, {
        outline: INK.soot,
        align: "center",
      });
    ctx.restore();
  }

  private blit(img: HTMLCanvasElement, x: number, y: number, flip = false, scale = 1) {
    const { ctx } = this;
    if (!flip)
      return ctx.drawImage(
        img,
        Math.round(x),
        Math.round(y),
        img.width * scale,
        img.height * scale,
      );
    ctx.save();
    ctx.translate(Math.round(x) + img.width * scale, Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
    ctx.restore();
  }

  private drawCrate(c: Crate) {
    const { ctx } = this;
    const x = Math.round(c.x),
      y = Math.round(c.y);
    if (c.floor < 0) {
      ctx.drawImage(this.sp.chute.img, x - 3, y - 10);
      art.line(ctx, x - 2, y - 6, x, y, INK.soot);
      art.line(ctx, x + 13, y - 6, x + 11, y, INK.soot);
    }
    ctx.drawImage(this.sp.crate.img, x, y);
    drawText(ctx, WEAPONS[c.weapon].letter, x + 6, y + 2, 1, INK.goldLight, {
      outline: INK.soot,
      align: "center",
    });
  }

  private drawItem(it: Item) {
    if (!it.p && it.t > 9 && Math.floor(it.t * 8) % 2) return; // about to vanish
    const bob = it.vy === 0 ? Math.round(Math.sin(it.t * 5)) : 0;
    const letter =
      it.kind === "bombs" ? "B" : it.kind === "life" ? "1" : WEAPONS[it.weapon ?? "rapid"].letter;
    art.box(this.ctx, it.x, it.y + bob, it.kind === "life" ? INK.violetLight : INK.gold);
    drawText(this.ctx, letter, it.x + 5, it.y + bob + 1, 1, INK.soot, { align: "center" });
  }

  private drawHero() {
    const { ctx, hero, t } = this;
    if (hero.inv > 0 && Math.floor(t * 16) % 2 === 0 && hero.dead <= 0) return;
    const sheet = hero.crouch
      ? this.sp.crouch
      : !hero.ground
        ? this.sp.hero.at(3)
        : hero.moving
          ? this.sp.hero.at(1 + (Math.floor(t * 10) % 2))
          : this.sp.hero.at(0);
    if (!sheet) return;
    const back = hero.recoil > 0 ? -hero.facing : 0;
    const x = Math.round(hero.x + back),
      y = Math.round(hero.feet - sheet.h + 2);
    if (hero.dead > 0) {
      ctx.save();
      ctx.translate(x + 8, y + 10);
      ctx.rotate(hero.facing * -Math.min(1.5, (1.5 - hero.dead) * 3));
      ctx.drawImage(Math.floor(t * 12) % 2 ? sheet.flash : sheet.img, -8, -10);
      ctx.restore();
      return;
    }
    this.blit(sheet.img, x, y, hero.facing === -1);
    const s = this.shoulder();
    const sx = s.x + back,
      sy = s.y;
    const dx = Math.cos(hero.angle),
      dy = Math.sin(hero.angle);
    ctx.fillStyle = INK.soot;
    ARM.forEach((_, i) =>
      ctx.fillRect(Math.round(sx + dx * i) - 1, Math.round(sy + dy * i) - 1, 4, 4),
    );
    ARM.forEach((color, i) =>
      art.rect(
        ctx,
        sx + dx * i,
        sy + dy * i,
        2,
        2,
        i > 6 && hero.weapon !== "pistol" ? INK.gold : color,
      ),
    );
    if (hero.flash > 0) {
      art.disc(ctx, sx + dx * 12, sy + dy * 12, 3, INK.gold);
      art.disc(ctx, sx + dx * 12, sy + dy * 12, 1.5, INK.goldLight);
    }
    if (hero.guard) {
      // A shield of light in front, flickering.
      const gx = x + (hero.facing === 1 ? 15 : -1);
      for (let i = 0; i < 16; i++)
        art.rect(
          ctx,
          gx + Math.round(Math.sin(i * 0.4) * 1.5) * hero.facing,
          y + 3 + i,
          1,
          1,
          (i + Math.floor(t * 20)) % 3 ? "#a8e4ff" : INK.white,
        );
    }
    if (hero.slash > 0)
      for (let i = 0; i < 9; i++) {
        const a = -1.2 + i * 0.3;
        art.rect(
          ctx,
          x + 8 + hero.facing * (8 + Math.cos(a) * 8),
          y + 10 + Math.sin(a) * 8,
          2,
          2,
          i % 2 ? INK.white : INK.goldLight,
        );
      }
  }

  private drawShots() {
    const { ctx, t } = this;
    for (const s of this.shots) {
      if (s.kind === "flame") {
        const p = 1 - s.life / WEAPONS.flame.life;
        art.disc(
          ctx,
          s.x,
          s.y,
          1 + p * 4,
          p < 0.4 ? INK.goldLight : p < 0.7 ? INK.gold : INK.ember,
        );
      } else if (s.kind === "rocket") {
        art.block(ctx, s.x - 2, s.y - 1, 4, 2, INK.stoneLight);
        art.rect(
          ctx,
          s.x - 3 - Math.sign(s.vx) * 2,
          s.y - 1,
          2,
          2,
          Math.floor(t * 20) % 2 ? INK.gold : INK.ember,
        );
      } else if (s.kind === "bomb") art.block(ctx, s.x - 1, s.y - 1, 3, 3, INK.olive);
      else if (s.kind === "wave") {
        // a crescent of energy, flickering
        const f = Math.sign(s.vx);
        for (let i = -5; i <= 5; i++)
          art.rect(
            ctx,
            s.x - f * Math.abs(i) * 0.6,
            s.y + i,
            3,
            1,
            Math.abs(i) < 2 ? INK.white : Math.floor(t * 20 + i) % 2 ? INK.goldLight : "#a8e4ff",
          );
      } else {
        art.rect(ctx, s.x, s.y, 2, 2, INK.goldLight);
        art.rect(ctx, s.x - s.vx * 0.012, s.y - s.vy * 0.012, 1, 1, INK.gold);
      }
    }
  }

  private drawBoss(b: Boss) {
    art.boss(
      this.ctx,
      this.map.boss.art,
      Math.round(b.x),
      Math.round(this.gy - BOSS.h + 1 - b.hop),
      {
        hurt: 1 - b.hp / b.max,
        phase: b.phase,
        t: this.t,
        flash: b.flash > 0,
        mouth: b.state === "volley" && b.t < 0.5 && Math.floor(this.t * 12) % 2 === 0,
        eye: Boolean(this.sweep) && Math.floor(this.t * 14) % 2 === 0,
      },
    );
  }

  private drawSweep(sw: Sweep) {
    const { ctx, map } = this;
    const b = this.boss;
    if (!b) return;
    const from = b.x + 4,
      to = this.camX;
    const [core, edge] = map.theme.sweep;
    if (sw.t < sw.charge) {
      if (Math.floor(this.t * 16) % 2) art.rect(ctx, to, sw.y, from - to, 1, edge);
      art.disc(ctx, from, sw.y, 1 + (sw.t / sw.charge) * 3, core);
      return;
    }
    art.rect(ctx, to, sw.y - 3, from - to, 6, edge);
    art.rect(ctx, to, sw.y - 1, from - to, 2, core);
    for (let x = to; x < from; x += 7)
      art.rect(ctx, x + (Math.floor(this.t * 40) % 7), sw.y - 4 + (x % 3), 2, 1, core);
    art.disc(ctx, from, sw.y, 5, core);
  }

  private drawBoom(b: Boom) {
    const { ctx } = this;
    const p = b.t / b.dur;
    const grow = 0.4 + 0.6 * ease(Math.min(1, p * 2.2));
    if (p < 0.12) return art.disc(ctx, b.x, b.y, b.r * grow * 0.9, INK.white);
    if (p < 0.55) {
      const hot = p < 0.3;
      for (const l of b.lobes)
        art.disc(ctx, b.x + l.dx * grow, b.y + l.dy * grow, l.r * grow, hot ? INK.gold : INK.ember);
      art.disc(ctx, b.x, b.y, b.r * grow * 0.5, hot ? INK.goldLight : INK.gold);
      if (!hot)
        for (const l of b.lobes)
          art.disc(ctx, b.x + l.dx * grow * 0.6, b.y + l.dy * grow * 0.6, l.r * 0.35, INK.gold);
      return;
    }
    const q = (p - 0.55) / 0.45;
    for (const l of b.lobes)
      art.dither(
        ctx,
        b.x + l.dx * (1 + q * 0.6),
        b.y + l.dy - q * b.r * 0.8,
        l.r * (1 - q * 0.5),
        q < 0.5 ? INK.mortar : INK.soot,
        q,
      );
  }

  // A framed box of the soot field, edged in the map's plate, riveted in gold.
  private frame3(x: number, y: number, w: number, h: number) {
    const { ctx } = this;
    const [, light, dark] = this.map.theme.plate;
    ctx.globalAlpha = 0.94;
    art.rect(ctx, x, y, w, h, INK.soot);
    ctx.globalAlpha = 1;
    for (const [c, i] of [
      [light, 0],
      [dark, 2],
    ] as const) {
      art.rect(ctx, x + i, y + i, w - i * 2, 1, c);
      art.rect(ctx, x + i, y + h - 1 - i, w - i * 2, 1, c);
      art.rect(ctx, x + i, y + i, 1, h - i * 2, c);
      art.rect(ctx, x + w - 1 - i, y + i, 1, h - i * 2, c);
    }
    for (const [rx, ry] of [
      [2, 2],
      [w - 3, 2],
      [2, h - 3],
      [w - 3, h - 3],
    ] as const)
      art.rect(ctx, x + rx, y + ry, 1, 1, INK.gold);
  }

  private drawPaused() {
    const { ctx, W, L } = this;
    const { placed } = column({
      pieces: [
        { kind: "text", text: L.paused, max: 5 },
        { kind: "text", text: touch() ? L.tap : L.resume, max: 1 },
      ],
      top: this.zones().bar.bottom,
      bottom: this.gy,
      width: W - 16,
      gap: 8,
    });
    const [title, hint] = placed;
    const first = title ?? hint;
    const last = hint ?? title;
    if (!first || !last) return;
    ctx.globalAlpha = 0.6;
    art.rect(ctx, 0, first.y - 6, W, last.y + last.height - first.y + 12, INK.soot);
    ctx.globalAlpha = 1;
    drawPlaced({
      ctx,
      placed: title,
      x: W / 2,
      ink: GOLD,
      look: { outline: INK.soot, align: "center" },
    });
    drawPlaced({
      ctx,
      placed: hint,
      x: W / 2,
      ink: INK.sandLight,
      look: { outline: INK.soot, align: "center" },
    });
  }

  private bigText(text: string, ink: string) {
    const { ctx, W, H } = this;
    const s = fitScale(text, W - 16, 5);
    ctx.globalAlpha = 0.6;
    art.rect(ctx, 0, H * 0.36 - 6, W, GLYPH_H * s + 12, INK.soot);
    ctx.globalAlpha = 1;
    drawText(ctx, text, W / 2, H * 0.36, s, ink === INK.goldLight ? GOLD : ink, {
      outline: INK.soot,
      align: "center",
    });
  }

  // ── Intro screens ──────────────────────────────────────────────────────────────────────────
  // The power-on badge of a made-up system: letters fall in and lock, chrome shines, a line types.
  private drawBoot() {
    const { ctx, W, H, L, pt } = this;
    art.rect(ctx, 0, 0, W, H, "#000000");
    const text = L.boot;
    const s = fitScale(text, W - 24, 5);
    const w = textWidth(text, s);
    const x0 = Math.round((W - w) / 2),
      y0 = Math.round(H * 0.38);
    const done = 0.3 + text.length * 0.11 + 0.15;
    [...text].forEach((ch, i) => {
      const at = 0.3 + i * 0.11;
      if (pt < at) return;
      const p = Math.min(1, (pt - at) / 0.22);
      const y = y0 - (i % 2 ? -1 : 1) * (1 - ease(p)) * H * 0.4;
      drawText(
        ctx,
        ch,
        x0 + i * 6 * s,
        y,
        s,
        p < 1 ? INK.white : CHROME,
        p < 1 ? {} : { outline: "#1a2440" },
      );
    });
    const sweep = (pt - done - 0.5) / 0.6;
    if (sweep > 0 && sweep < 1) {
      ctx.save();
      ctx.beginPath();
      const sx = x0 - 20 + sweep * (w + 40);
      ctx.moveTo(sx, y0 - 4);
      ctx.lineTo(sx + 8, y0 - 4);
      ctx.lineTo(sx + 2, y0 + GLYPH_H * s + 4);
      ctx.lineTo(sx - 6, y0 + GLYPH_H * s + 4);
      ctx.clip();
      drawText(ctx, text, x0, y0, s, INK.white);
      ctx.restore();
    }
    if (pt > done) {
      const bw = Math.round((w + 16) * ease(Math.min(1, (pt - done) / 0.4)));
      art.rect(ctx, (W - bw) / 2, y0 + GLYPH_H * s + 6, bw, 2, INK.rust);
      art.rect(ctx, (W - bw) / 2, y0 + GLYPH_H * s + 9, bw, 1, INK.gold);
    }
    if (pt > done + 0.4)
      drawText(
        ctx,
        L.bootLine.slice(0, Math.floor((pt - done - 0.4) * 30)),
        W / 2,
        y0 + GLYPH_H * s + 16,
        1,
        "#b8c4d6",
        { align: "center" },
      );
  }

  // The title as a column (layout.ts): on a short stage the small print goes first.
  private drawTitle() {
    const { ctx, W, H, L, pt, map } = this;
    const [base, light, dark] = map.theme.plate;
    art.rect(ctx, 0, 0, W, H, map.theme.menu);
    for (const l of map.theme.layers) art.layer(ctx, l, this.t * 20, W, H - 10, this.t);
    art.rect(ctx, 0, H - 10, W, 10, map.theme.ground.base);
    const colon = map.title.indexOf(":");
    const lead = colon < 0 ? "" : map.title.slice(0, colon + 1);
    const word = colon < 0 ? map.title : map.title.slice(colon + 1).trim();
    const s = fitScale(word, W - 40, 6);
    const pw = textWidth(word, s) + 24,
      ph = GLYPH_H * s + 20;
    const hero = this.sp.hero.at(0);
    const note = this.stage > 0 ? L.nextUnlocked : (this.note ?? "");
    const chapterLine = `${L.chapter} ${MAPS.indexOf(map) + 1} · ${this.chapter().title}`;
    const text = (t: string, max: number, optional = false): Piece => ({
      kind: "text",
      text: t,
      max,
      optional,
    });
    const { placed } = column({
      pieces: [
        text(`${STARS[map.rarity]} ${L[map.rarity]}`, 1),
        note ? text(note, 1, true) : undefined,
        { kind: "box", height: Math.max(GLYPH_H * 2, hero ? hero.h * 2 - 4 : 0) },
        { kind: "box", height: ph },
        text(chapterLine, 2),
        text(map.time, 1, true),
        touch() && H > W ? text(L.rotate, 1, true) : undefined,
        text(touch() ? L.tapStart : L.press, 2),
        text(L.coin, 1, true),
      ],
      top: 6,
      bottom: H - 12,
      width: W - 16,
      gap: 5,
    });
    const [rarity, top, leadRow, plate, chapter, time, rotate, press, coin] = placed;
    const look = { outline: INK.soot, align: "center" } as const;
    drawPlaced({
      ctx,
      placed: rarity,
      x: W / 2,
      ink: map.rarity === "rare" ? INK.gold : INK.sandLight,
      look,
    });
    drawPlaced({ ctx, placed: top, x: W / 2, ink: INK.goldLight, look });
    const px = Math.round((W - pw) / 2),
      py = plate?.y ?? Math.round(H * 0.3);
    art.block(ctx, px, py, pw, ph, base);
    art.rect(ctx, px, py, pw, 2, light);
    art.rect(ctx, px, py + ph - 3, pw, 3, dark);
    for (let i = 0; i < pw - 6; i += 14) {
      art.rect(ctx, px + 4 + i, py + 4, 2, 2, light);
      art.rect(ctx, px + 4 + i, py + ph - 7, 2, 2, dark);
    }
    for (const h of this.stamps) {
      if (h.x < 0) continue;
      const hx = px + h.x * pw,
        hy = py + h.y * ph;
      art.disc(ctx, hx, hy, 3, dark);
      art.disc(ctx, hx, hy, 1.5, INK.soot);
      art.rect(ctx, hx - 3, hy - 3, 1, 1, light);
    }
    const slam = 0.3 + 6 * 0.16 + 0.1;
    if (pt > slam) {
      const big = pt - slam < 0.06 ? 1 : 0;
      drawText(ctx, word, W / 2, py + 10 - big * 3, s + big, GOLD, {
        outline: INK.soot,
        shadow: INK.rust,
        align: "center",
      });
    }
    if (lead && leadRow && pt > slam + 0.2) {
      const ls = fitScale(lead, pw - (hero ? 34 : 0), 2);
      drawText(ctx, lead, px + 4, leadRow.y + leadRow.height - GLYPH_H * ls, ls, INK.sandLight, {
        outline: INK.soot,
      });
    }
    if (pt > slam + 0.4) {
      drawPlaced({ ctx, placed: chapter, x: W / 2, ink: light, look });
      drawPlaced({ ctx, placed: time, x: W / 2, ink: INK.sandLight, look });
    }
    if (pt <= slam + 0.6) return;
    drawPlaced({ ctx, placed: rotate, x: W / 2, ink: INK.goldLight, look });
    if (hero) this.blit(hero.img, px + pw - 30, py - hero.h * 2 + 4, true, 2);
    if (Math.floor(this.t * 2) % 2 === 0)
      drawPlaced({ ctx, placed: press, x: W / 2, ink: GOLD, look });
    drawPlaced({ ctx, placed: coin, x: W / 2, ink: INK.sandLight, look: { align: "center" } });
    const lowest = (coin ?? press)?.y ?? H;
    if (W >= 200 && lowest < H - 34)
      drawText(ctx, `${L.credits} 03`, W - 8, H - 22, 1, INK.sandLight, {
        outline: INK.soot,
        align: "right",
      });
  }

  // Four cards, one hero; the cursor blinks, the clock counts down.
  private drawSelect() {
    const { ctx, W, H, L, map } = this;
    const [base, light, dark] = map.theme.plate;
    art.rect(ctx, 0, 0, W, H, map.theme.menu);
    for (let y = 0; y < H; y += 4) art.rect(ctx, 0, y, W, 1, dark);
    drawText(ctx, L.select, W / 2, H * 0.1, fitScale(L.select, W - 16, 2), GOLD, {
      outline: INK.soot,
      shadow: INK.rust,
      align: "center",
    });
    const left = Math.max(0, Math.ceil(SELECT_TIME - this.pt));
    if (this.chosen < 0)
      drawText(
        ctx,
        String(left).padStart(2, "0"),
        W - 8,
        H * 0.1 + 18,
        2,
        left <= 5 ? INK.rust : INK.goldLight,
        { outline: INK.soot, align: "right" },
      );
    const hero = this.sp.hero.at(0);
    const cards = this.cards();
    cards.forEach((c, i) => {
      const x =
        c.x + (this.nope > 0 && i === this.cursor ? Math.round(Math.sin(this.nope * 60) * 2) : 0);
      const picked = this.chosen === i;
      art.block(ctx, x, c.y, c.w, c.h, i === 0 ? base : dark);
      art.rect(ctx, x, c.y, c.w, 1, light);
      art.rect(ctx, x + 2, c.y + 2, c.w - 4, c.h - 16, INK.soot);
      const scale = c.w >= 40 ? 2 : 1;
      if (hero) {
        const hx = x + (c.w - hero.w * scale) / 2,
          hy = c.y + c.h - 16 - hero.h * scale;
        if (i === 0)
          this.blit(
            picked && Math.floor(this.pt * 10) % 2 ? hero.flash : hero.img,
            hx,
            hy,
            false,
            scale,
          );
        else {
          ctx.globalAlpha = 0.35;
          this.blit(hero.flash, hx, hy, i % 2 === 1, scale);
          ctx.globalAlpha = 1;
          art.padlock(ctx, x + c.w / 2 - 4, c.y + (c.h - 16) / 2 - 4, INK.stoneLight);
        }
      }
      drawText(
        ctx,
        i === 0 ? L.hero : "???",
        x + c.w / 2,
        c.y + c.h - 11,
        1,
        i === 0 ? INK.goldLight : INK.stone,
        { align: "center" },
      );
      if (i === this.cursor && (Math.floor(this.t * 4) % 2 === 0 || picked)) {
        const g = picked ? INK.white : INK.gold;
        art.rect(ctx, x - 3, c.y - 3, c.w + 6, 1, g);
        art.rect(ctx, x - 3, c.y + c.h + 2, c.w + 6, 1, g);
        art.rect(ctx, x - 3, c.y - 3, 1, c.h + 6, g);
        art.rect(ctx, x + c.w + 2, c.y - 3, 1, c.h + 6, g);
        drawText(ctx, "1P", x + c.w / 2, c.y - 12, 1, INK.rust, {
          outline: INK.soot,
          align: "center",
        });
      }
    });
    const card = cards.at(0);
    const below = card ? card.y + card.h + 14 : H * 0.7;
    const line = this.chosen >= 0 ? L.ready : this.cursor === 0 ? L.heroLine : L.locked;
    const ink = this.chosen >= 0 ? GOLD : this.cursor === 0 ? INK.sandLight : INK.rust;
    drawText(ctx, line, W / 2, below, fitScale(line, W - 16, this.chosen >= 0 ? 3 : 1), ink, {
      outline: INK.soot,
      align: "center",
    });
    if (this.chosen < 0)
      drawText(ctx, touch() ? "TAP" : "← →  ·  SPACE", W / 2, below + 16, 1, INK.sand, {
        align: "center",
      });
  }

  // The briefing waits for Space; on a short stage it comes in pages.
  private briefPages() {
    const { w, title, head, lines } = this.briefLines();
    const ts = fitScale(title, w, 2);
    const all = [...head, ...lines];
    const box = 9 + GLYPH_H * ts + 8 + 4;
    const room = this.H - Math.round(this.H * 0.06) - box - 30;
    const pages = pagesOf({ heights: all.map(() => GLYPH_H + 5), room });
    return { w, title, ts, all, headCount: head.length, pages };
  }
  private briefChars() {
    const { title, all, pages } = this.briefPages();
    const page = pages.at(this.briefPage) ?? [];
    return (
      (this.briefPage === 0 ? title.length : 0) + page.map((i) => all.at(i) ?? "").join("").length
    );
  }
  private carryOnBrief() {
    if (this.typed < this.briefChars()) {
      this.typed = this.briefChars();
      return;
    }
    if (this.briefPage < this.briefPages().pages.length - 1) {
      this.briefPage++;
      this.typed = 0;
      return;
    }
    this.startPlay();
  }

  private briefing() {
    const { ctx, W, H, L } = this;
    const { w, title, ts, all, headCount, pages } = this.briefPages();
    const page = pages.at(this.briefPage) ?? [];
    const bw = w + 14,
      bx = Math.round((W - bw) / 2),
      by = Math.round(H * 0.06);
    const bh = 9 + GLYPH_H * ts + 8 + page.length * (GLYPH_H + 5) + 4;
    this.frame3(bx, by, bw, bh);
    let left = Math.floor(this.typed);
    const cut = (s: string) => {
      const shown = s.slice(0, Math.max(0, left));
      left -= s.length;
      return shown;
    };
    drawText(ctx, this.briefPage === 0 ? cut(title) : title, bx + 7, by + 8, ts, GOLD, {
      outline: INK.soot,
    });
    let y = by + 8 + GLYPH_H * ts + 8;
    for (const i of page) {
      const ink = i < headCount ? INK.goldLight : i === headCount ? INK.gold : INK.sandLight;
      drawText(ctx, cut(all.at(i) ?? ""), bx + 7, y, 1, ink);
      y += GLYPH_H + 5;
    }
    if (this.typed < this.briefChars()) return;
    const last = this.briefPage >= pages.length - 1;
    const cy = last ? this.briefHelp(by + bh + 8) : by + bh + 8;
    if (Math.floor(this.t * 2) % 2 !== 0) return;
    const more = `${touch() ? "TAP" : "ENTER"} · ${L.more} ${this.briefPage + 1}/${pages.length}`;
    const go = last ? (touch() ? L.tap : L.pressGo) : more;
    drawText(ctx, go, W / 2, cy + 2, fitScale(go, W - 16, 2), GOLD, {
      outline: INK.soot,
      align: "center",
    });
  }

  // Under the briefing, the controls, when the stage has room for them; returns where it ends.
  private briefHelp(top: number) {
    const { ctx, W, H, L } = this;
    if (touch()) {
      const lines = wrap(L.touch, W - 24);
      if (top + lines.length * 10 + 22 > H) return top;
      lines.forEach((l, i) =>
        drawText(ctx, l, W / 2, top + i * 10, 1, INK.sandLight, {
          outline: INK.soot,
          align: "center",
        }),
      );
      return top + lines.length * 10 + 4;
    }
    const entries = STRIP.map(([k, label]) => ({ k, text: L[label] }));
    const rows = Math.ceil(entries.length / 2);
    const cw = Math.min(W - 16, 280),
      cx = Math.round((W - cw) / 2);
    const ch = 14 + rows * 11 + 4;
    if (top + ch + 26 > H) return top;
    this.frame3(cx, top, cw, ch);
    drawText(ctx, L.controlsTitle, cx + 7, top + 6, 1, INK.gold);
    entries.forEach(({ k, text }, i) => {
      const kx = cx + 7 + (i % 2) * Math.floor((cw - 14) / 2),
        ky = top + 17 + Math.floor(i / 2) * 11;
      drawText(ctx, text, kx + this.keycap(kx, ky, k) + 4, ky + 1, 1, INK.sandLight);
    });
    return top + ch + 10;
  }

  private warning() {
    const { ctx, W, H, t } = this;
    const y = Math.round(H * 0.36),
      h = 25;
    ctx.globalAlpha = 0.9;
    art.rect(ctx, 0, y, W, h, INK.rust);
    ctx.globalAlpha = 1;
    // Hazard stripes, as diagonal runs of five pixels.
    const run = Math.floor(t * 24) % 10;
    for (const sy of [y, y + h - 4])
      for (let r = 0; r < 4; r++)
        for (let x = -((r + run) % 10); x < W; x += 10) art.rect(ctx, x, sy + r, 5, 1, INK.gold);
    if (Math.floor(t * 4) % 2 === 0 || reduced()) {
      const s = fitScale(this.map.warning, W - 16, 2);
      drawText(
        ctx,
        this.map.warning,
        W / 2,
        y + Math.round((h - GLYPH_H * s) / 2),
        s,
        INK.goldLight,
        { outline: INK.soot, align: "center" },
      );
    }
  }

  private drawContinue() {
    const { ctx, W, H, L } = this;
    ctx.globalAlpha = 0.7;
    art.rect(ctx, 0, 0, W, H, INK.soot);
    ctx.globalAlpha = 1;
    const { placed } = column({
      pieces: [
        { kind: "text", text: L.continue, max: 3 },
        { kind: "text", text: String(Math.max(0, Math.ceil(this.countdown))), max: 8 },
        { kind: "text", text: touch() ? L.tap : L.press, max: 1, optional: true },
      ],
      top: Math.min(48, Math.round(H * 0.2)), // under the HUD, still in sight
      bottom: H - 8,
      width: W - 16,
      gap: 10,
    });
    const [title, count, prompt] = placed;
    drawPlaced({
      ctx,
      placed: title,
      x: W / 2,
      ink: GOLD,
      look: { outline: INK.soot, align: "center" },
    });
    drawPlaced({
      ctx,
      placed: count,
      x: W / 2,
      ink: INK.goldLight,
      look: { outline: INK.soot, shadow: INK.rust, align: "center" },
    });
    if (Math.floor(this.t * 2) % 2 === 0)
      drawPlaced({
        ctx,
        placed: prompt,
        x: W / 2,
        ink: INK.sandLight,
        look: { outline: INK.soot, align: "center" },
      });
  }

  private hudLines() {
    const { hero, L } = this;
    const arms =
      hero.weapon === "pistol"
        ? `${L.arms} P --`
        : `${L.arms} ${WEAPONS[hero.weapon].letter} ${String(Math.ceil(hero.ammo)).padStart(3, "0")}`;
    const top = `${L.score} ${String(this.score).padStart(7, "0")}`;
    const mid = `${arms}  ${L.bombs} ${String(hero.bombs).padStart(2, "0")}`;
    return { top, mid, width: Math.max(textWidth(top), textWidth(mid)) + 10 };
  }
  private zones() {
    return zonesOf({
      width: this.W,
      height: this.H,
      hud: { right: this.hudLines().width + 2, bottom: 44 },
    });
  }

  private hud() {
    const { ctx, L } = this;
    const look = { outline: INK.soot };
    const { top, mid, width: w } = this.hudLines();
    ctx.globalAlpha = 0.9;
    art.rect(ctx, 2, 2, w, 33, INK.soot);
    ctx.globalAlpha = 1;
    drawText(ctx, top, 6, 5, 1, INK.sandLight, look);
    drawText(ctx, mid, 6, 14, 1, INK.gold, look);
    // Lives: a small head each, hair and headphones.
    for (let i = 0; i < this.lives; i++) {
      const x = 6 + i * 8;
      art.block(ctx, x, 23, 6, 6, "#f1bf91");
      art.rect(ctx, x, 23, 6, 2, "#3a2620");
      art.rect(ctx, x - 1, 25, 1, 2, "#4b4f5a");
      art.rect(ctx, x + 4, 25, 1, 1, INK.soot);
    }
    const pickups = this.chapter().pickups;
    drawText(
      ctx,
      `${L.skills} ${pickups.filter((p) => this.got.includes(p)).length}/${pickups.length}`,
      10 + Math.max(3, this.lives) * 8,
      23,
      1,
      INK.sandLight,
      look,
    );
    if (this.chain >= 2 && this.t - this.lastKill < 1.6)
      drawText(ctx, `X${multiplierOf(this.chain)}`, w + 8, 12, 2, GOLD, look);
    // Energy, for the special moves: it fills with time and with each kill.
    const full = this.energy >= Math.max(...MOVES.map((m) => m.cost));
    const lx = 6 + textWidth(L.energy) + 3,
      bw = w - textWidth(L.energy) - 12;
    art.rect(ctx, 2, 35, w, 8, INK.soot);
    drawText(ctx, L.energy, 6, 35, 1, INK.sand);
    art.rect(ctx, lx, 37, bw, 3, INK.mortar);
    art.rect(
      ctx,
      lx,
      37,
      Math.round((bw * this.energy) / ENERGY.max),
      3,
      full && Math.floor(this.t * 6) % 2 ? INK.goldLight : "#3f9fd0",
    );
  }

  // The boss's health while it fights, or else the turret's once it is in sight.
  private drawFoeBar() {
    if (this.boss && this.phase === "play")
      return this.bar(this.map.boss.name, this.boss.hp / this.boss.max);
    const tu = this.turret;
    if (tu && tu.x < this.camX + this.W && this.fighting())
      this.bar(this.map.turret.name, tu.hp / tu.max);
  }

  private bar(name: string, hp: number) {
    const { ctx, W } = this;
    const { bar } = this.zones();
    const x = Math.round((W - bar.width) / 2),
      y = bar.line;
    const fitted = fitText({ text: name, width: W - 16, max: 1 });
    drawText(ctx, fitted.lines.at(0) ?? name, W / 2, bar.name, 1, INK.goldLight, {
      outline: INK.soot,
      align: "center",
    });
    art.rect(ctx, x - 2, y - 2, bar.width + 4, 8, INK.soot);
    art.rect(ctx, x - 1, y - 1, bar.width + 2, 6, INK.gold);
    art.rect(ctx, x, y, bar.width, 4, INK.soot);
    art.rect(ctx, x, y, Math.max(0, Math.round(bar.width * hp)), 4, INK.rust);
    art.rect(ctx, x, y, Math.max(0, Math.round(bar.width * hp)), 1, INK.ember);
  }

  private banner() {
    const b = this.banners.at(0);
    if (!b) return;
    const { ctx, W, H } = this;
    if (b.t > b.dur - 0.3 && Math.floor(b.t * 16) % 2) return;
    const fitted = fitText({ text: b.title, width: W - 16, max: b.big ? 7 : 3 });
    const pop = b.t < 0.07 && fitted.lines.length === 1 ? 1 : 0;
    const top = Math.max(this.zones().banner, b.big ? Math.round(H * 0.3) : 0) - pop * 3;
    drawPlaced({
      ctx,
      placed: { ...fitted, scale: fitted.scale + pop, y: top, height: heightOf(fitted) },
      x: W / 2,
      ink: GOLD,
      look: { outline: INK.soot, shadow: INK.rust, align: "center" },
    });
  }

  // The debrief: what was done, the rank, the chapter's skills (the missed ones dimmed), and
  // what comes next. Rows come in pages when the stage is short; the end buttons stay clear.
  private debrief() {
    const { W, L } = this;
    const bw = Math.min(W - 16, 270),
      bx = Math.round((W - bw) / 2);
    const inner = bw - 16;
    const pickups = this.chapter().pickups;
    const stats = this.stats();
    const loadout = this.flow(
      pickups.map((p, i) => ({
        text: p.name.toUpperCase() + (i < pickups.length - 1 ? " ·" : ""),
        on: this.got.includes(p),
      })),
      inner,
    );
    const tail = this.failed ? "" : this.isLast() ? L.congratsLine : L.nextUnlocked;
    const rows: Row[] = [
      ...stats.map(([k, v], i) =>
        this.statRow({ key: k, value: v, step: i, box: { left: bx + 8, right: bx + bw - 8 } }),
      ),
      this.rankRow({ step: stats.length, left: bx + 8, right: bx + bw - 8 }),
      this.textRow({ text: L.loadout, step: stats.length + 1, x: bx + 8, ink: INK.khaki }),
      ...loadout.map((line) => this.flowRow({ line, step: stats.length + 1, x: bx + 8 })),
      ...(tail ? wrap(tail, inner) : []).map((text) =>
        this.textRow({ text, step: stats.length + 1, x: W / 2, ink: INK.gold, align: "center" }),
      ),
    ];
    const step = Math.floor(this.pt / 0.28);
    if (step > this.revealed && this.revealed < stats.length + 2) {
      this.revealed = step;
      this.sound.tick();
    }
    this.pagedBox({
      box: { x: bx, w: bw },
      head: this.headline(),
      sub: `${this.map.title} · ${this.chapter().title}`,
      rows,
    });
  }

  // Reduced motion: every chapter's skills, still, in pages when they do not fit.
  private loadout() {
    const { W } = this;
    const bw = Math.min(W - 16, 270),
      bx = Math.round((W - bw) / 2);
    const rows = MAPS.map((m) => this.chapter(m)).flatMap((c) => [
      this.textRow({ text: c.title, step: -1, x: bx + 8, ink: INK.gold }),
      ...this.flow(
        c.pickups.map((p, i) => ({
          text: p.name.toUpperCase() + (i < c.pickups.length - 1 ? " ·" : ""),
          on: true,
        })),
        bw - 16,
      ).map((line) => this.flowRow({ line, step: -1, x: bx + 8 })),
    ]);
    this.pagedBox({ box: { x: bx, w: bw }, head: this.L.loadout, sub: "", rows });
  }

  // A framed box with as many rows as fit above the end buttons; more, and pages take turns.
  private pagedBox({
    box,
    head,
    sub,
    rows,
  }: {
    box: { x: number; w: number };
    head: string;
    sub: string;
    rows: Row[];
  }) {
    const { ctx, W, H } = this;
    const inner = box.w - 16;
    const ts = fitScale(head, inner, 2);
    const subs = sub ? wrap(sub, inner) : [];
    const headHeight = 9 + GLYPH_H * ts + 6 + subs.length * 10 + 4;
    const top = Math.max(6, Math.round(H * 0.04));
    const room = H - this.endRoom - top - headHeight - 24;
    const pages = pagesOf({ heights: rows.map((r) => r.height), room });
    const index = this.pageShown({ pages, rows });
    const page = pages.at(index) ?? [];
    const marker = pages.length > 1 ? 10 : 0;
    const bh = headHeight + page.reduce((n, i) => n + (rows.at(i)?.height ?? 0), 0) + 8 + marker;
    this.frame3(box.x, top, box.w, bh);
    drawText(ctx, head, W / 2, top + 9, ts, this.failed ? INK.rust : GOLD, {
      outline: INK.soot,
      align: "center",
    });
    subs.forEach((l, i) =>
      drawText(ctx, l, W / 2, top + 9 + GLYPH_H * ts + 6 + i * 10, 1, INK.khaki, {
        align: "center",
      }),
    );
    let y = top + headHeight;
    for (const i of page) {
      const row = rows.at(i);
      if (!row) continue;
      if (this.revealed > row.step) row.draw(y);
      y += row.height;
    }
    if (pages.length > 1)
      drawText(ctx, `${index + 1}/${pages.length}`, box.x + box.w - 8, top + bh - 9, 1, INK.khaki, {
        align: "right",
      });
  }

  // While the rows come in, the page holding the newest; once all are in, the pages take turns.
  private pageShown({ pages, rows }: { pages: number[][]; rows: Row[] }) {
    if (pages.length < 2) return 0;
    const lastStep = Math.max(0, ...rows.map((r) => r.step));
    const settled = (lastStep + 1) * 0.28 + 2.5;
    if (this.phase === "clear" && this.pt < settled) {
      const newest = rows.findLastIndex((r) => this.revealed > r.step);
      return Math.max(
        0,
        pages.findIndex((p) => p.includes(newest)),
      );
    }
    return Math.floor(Math.max(0, this.pt - settled) / 4) % pages.length;
  }

  private statRow({
    key,
    value,
    step,
    box,
  }: {
    key: string;
    value: string;
    step: number;
    box: { left: number; right: number };
  }): Row {
    return {
      height: 10,
      step,
      draw: (y) => {
        drawText(this.ctx, key, box.left, y, 1, INK.sand);
        drawText(this.ctx, value, box.right, y, 1, INK.goldLight, { align: "right" });
      },
    };
  }
  private rankRow({ step, left, right }: { step: number; left: number; right: number }): Row {
    return {
      height: GLYPH_H * 2 + 10,
      step,
      draw: (y) => {
        drawText(this.ctx, this.L.rank, left, y + 6, 1, INK.sand);
        drawText(this.ctx, this.rank(), right, y + 2, 2, GOLD, {
          outline: INK.soot,
          align: "right",
        });
      },
    };
  }
  private textRow({
    text,
    step,
    x,
    ink,
    align = "left",
  }: {
    text: string;
    step: number;
    x: number;
    ink: string;
    align?: "left" | "center";
  }): Row {
    return { height: 10, step, draw: (y) => drawText(this.ctx, text, x, y, 1, ink, { align }) };
  }
  private flowRow({
    line,
    step,
    x,
  }: {
    line: { text: string; on: boolean }[];
    step: number;
    x: number;
  }): Row {
    return {
      height: 10,
      step,
      draw: (y) => {
        let at = x;
        for (const it of line)
          at += drawText(this.ctx, it.text, at, y, 1, it.on ? INK.sandLight : INK.stoneDark) + 6;
      },
    };
  }

  // Lays words of two inks into lines no wider than `width`.
  private flow(items: { text: string; on: boolean }[], width: number) {
    const lines: { text: string; on: boolean }[][] = [];
    let used = Infinity;
    for (const it of items) {
      const w = textWidth(it.text) + 6;
      const cur = lines.at(-1);
      if (!cur || used + w > width + 6) {
        lines.push([it]);
        used = w;
      } else {
        cur.push(it);
        used += w;
      }
    }
    return lines;
  }

  // Without a touch deck the end buttons cover the stage's foot, so the debrief keeps clear of it.
  private measureEnd() {
    this.endRoom =
      this.deck.mode === "none" && !this.end.hidden
        ? Math.ceil(this.end.offsetHeight / this.S) + 4
        : 0;
  }

  // Under the floor (controls.ts, playable): the hero, and a word to say sorry.
  private drawTooSmall() {
    const { ctx, W, H, L } = this;
    art.rect(ctx, 0, 0, W, H, this.map.theme.menu);
    const hero = this.sp.hero.at(0);
    const heroHeight = hero ? hero.h * 2 : 0;
    const { placed } = column({
      pieces: [
        { kind: "text", text: `${L.hero}:`, max: 1 },
        { kind: "text", text: L.tooSmallTitle, max: 3 },
        { kind: "text", text: L.tooSmall, max: 1 },
      ],
      top: Math.max(14, H - heroHeight - 190), // the bubble stays near the one who speaks
      bottom: H - heroHeight - 18,
      width: W - 28,
      gap: 6,
    });
    const shown = placed.filter((p) => p !== undefined);
    const first = shown.at(0);
    const last = shown.at(-1);
    if (first && last) {
      const top = first.y - 7,
        bottom = last.y + last.height + 7;
      this.frame3(6, top, W - 12, bottom - top);
      art.rect(ctx, 24, bottom, 6, 3, INK.soot);
      art.rect(ctx, 24, bottom + 3, 3, 3, INK.soot);
    }
    const [speaker, title, words] = placed;
    drawPlaced({ ctx, placed: speaker, x: W / 2, ink: INK.khaki });
    drawPlaced({
      ctx,
      placed: title,
      x: W / 2,
      ink: GOLD,
      look: { outline: INK.soot, align: "center" },
    });
    drawPlaced({ ctx, placed: words, x: W / 2, ink: INK.sandLight });
    if (hero) this.blit(hero.img, 14, H - heroHeight - 6, false, 2);
  }
}
