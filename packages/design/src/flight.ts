// An easter egg: press a name marked `data-egg="🎟️"` and its emoji pops out of it, travels left to
// right to the element marked `data-egg-to` in its `data-egg-row` (the dates), lands there and
// the dates answer. A row marked `data-egg-row="perch"` has room above: the emoji travels and
// lands on top of the text. A row marked `data-egg-row="beside"` is tight: it stops just in
// front of the dates, never crossing them, so they stay readable. Otherwise it lands on the
// year itself, which dims under it.
//
// The journey has three acts, as Disney's animators taught (Thomas & Johnston, "The Illusion of
// Life"): anticipation (the name gives, the emoji pops out and leans back), action (the motion
// of its domain, eased in and out, on arcs, with squash and stretch where something has mass),
// follow-through (a soft spring on landing, a still moment, then it lifts away). The arrival
// makes the dates answer, so the landing reads as the cause (Michotte).
//
// Each domain moves its own way (`data-egg-motion`), see `motions` below. Unknown or missing:
// `glide`.
//
// Duration follows time spent there (`data-egg-since`, `data-egg-until`, "YYYY" or "YYYY-MM",
// no end meaning today), on a log scale: we judge durations by ratio (Weber–Fechner). This is a
// moment of delight the visitor asked for, not a transition in their way, so it takes its time:
// six months travel for 1.4 s, six years for 2.8 s, each a little over 3 to 5 s in all.
//
// Every pose is computed per frame and handed to the Web Animations API as linear keyframes:
// transform and opacity only, on an absolutely placed layer, so nothing else moves.

import "./styles/flight.css";

export type EggMotion =
  | "glide"
  | "ticket"
  | "drive"
  | "roll"
  | "pay"
  | "pulse"
  | "beam"
  | "float"
  | "bounce"
  | "fizz"
  | "climb"
  | "voyage";

const still = matchMedia("(prefers-reduced-motion: reduce)");
const live = new WeakMap<HTMLElement, HTMLElement>();

type Point = { x: number; y: number };
type Pose = { x: number; y: number; r: number; sx: number; sy: number; o: number };
// Left along the way: `at` is the share of the journey, placed where the emoji is then.
type Mark = {
  at: number;
  kind: "year" | "trail" | "bubble" | "drop" | "puff";
  dx?: number;
  dy?: number;
};
type Path = {
  // The pose at `t`, the share of the travel time: from the start at rest to the end at rest.
  pose: (t: number) => Pose;
  marks?: Mark[];
  trace?: "line" | "beam"; // a line drawn behind it
  smear?: boolean; // two fainter copies a frame behind
  facing?: 1 | -1; // -1 mirrors an emoji drawn facing left
  pace?: number; // longer or shorter than the others
};
type Journey = {
  from: Point;
  to: Point;
  months: number;
  weight: number;
  room: number; // how far above it may rise
  ahead: number; // 1 to the right
  radius: number;
};

const clamp = (v: number, lo = 0, hi = 1) => Math.min(Math.max(v, lo), hi);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const along = (a: Point, b: Point, t: number): Point => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});
// Perlin's smootherstep: no speed and no acceleration at either end.
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const smootherSpeed = (t: number) => (30 * t * t * (1 - t) * (1 - t)) / 1.875; // peaks at 1
const bell = (u: number, at: number, width: number) => Math.exp(-(((u - at) / width) ** 2));
const DEG = 180 / Math.PI;

// A critically damped spring from rest, normalised to land exactly at the end.
const OMEGA = 6;
const REST = 1 - (1 + OMEGA) * Math.exp(-OMEGA);
const glide = (t: number) => (1 - (1 + OMEGA * t) * Math.exp(-OMEGA * t)) / REST;
const glideSpeed = (t: number) => OMEGA * t * Math.exp(1 - OMEGA * t); // peaks at 1

// Springs by damping ratio and response, as in Apple's "Designing Fluid Interfaces" (WWDC 2018).
const spring = (damping: number, response: number) => {
  const w0 = (2 * Math.PI) / response;
  const wd = w0 * Math.sqrt(1 - damping * damping);
  const decay = damping * w0;
  const top = Math.atan(wd / decay) / wd;
  const peak = Math.exp(-decay * top) * Math.sin(wd * top);
  return {
    // Released from 1 at rest: how far it still is from 0.
    release: (s: number) =>
      Math.exp(-decay * s) * (Math.cos(wd * s) + (decay / wd) * Math.sin(wd * s)),
    // Struck at rest: the knock, its first peak at about 1.
    knock: (s: number) => (Math.exp(-decay * s) * Math.sin(wd * s)) / peak,
  };
};
const settle = spring(0.42, 0.36);
const pop = spring(0.55, 0.42);

// Progress under a speed profile: speeds up, keeps its speed, slows down, as a vehicle does.
const profile = (speed: (t: number) => number) => {
  const steps = 240;
  const sums = [0];
  for (let i = 1; i <= steps; i++) sums.push(sums[i - 1] + speed((i - 0.5) / steps));
  const all = sums[steps];
  return (t: number) => {
    const at = clamp(t) * steps;
    const i = Math.min(Math.floor(at), steps - 1);
    return lerp(sums[i], sums[i + 1], at - i) / all;
  };
};
const ramps = (up: number, down: number) => (t: number) =>
  Math.max(Math.min(smoother(clamp(t / up)), smoother(clamp((1 - t) / down))), 0.02);

// A bow from one point to the other, `lift` above the higher of the two at its top.
const arc = (from: Point, to: Point, lift: number, early = 0.25, late = 0.75) => {
  const dx = to.x - from.x;
  const [a, b, c, d] = [
    from,
    { x: from.x + dx * early, y: from.y - lift * 1.33 },
    { x: from.x + dx * late, y: to.y - lift * 1.33 },
    to,
  ];
  return {
    at(t: number): Point {
      const u = 1 - t;
      const [k0, k1, k2, k3] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
      return {
        x: k0 * a.x + k1 * b.x + k2 * c.x + k3 * d.x,
        y: k0 * a.y + k1 * b.y + k2 * c.y + k3 * d.y,
      };
    },
    // The tilt of the path, in degrees, signed so that climbing leans back.
    lean(t: number, ahead: number) {
      const u = 1 - t;
      const [k0, k1, k2] = [3 * u * u, 6 * u * t, 3 * t * t];
      const sx = k0 * (b.x - a.x) + k1 * (c.x - b.x) + k2 * (d.x - c.x);
      const sy = k0 * (b.y - a.y) + k1 * (c.y - b.y) + k2 * (d.y - c.y);
      return ahead * Math.atan2(sy, Math.abs(sx) + 1e-6) * DEG;
    },
  };
};

const still1 = (at: Point): Pose => ({ ...at, r: 0, sx: 1, sy: 1, o: 1 });

// One motion per domain. Each starts and ends at rest, at scale 1.
const motions: Record<EggMotion, (j: Journey) => Path> = {
  // Anything: one continuous glide on a critically damped spring, swelling as it comes closer
  // to the viewer, leaning into its path and stretching with its speed (motion smear).
  glide({ from, to, weight, room, ahead }) {
    const path = arc(from, to, Math.min(14 + 24 * weight, room), 0.3, 0.78);
    const swell = 0.22 + 0.2 * weight;
    return {
      smear: true,
      pose(t) {
        const p = glide(t);
        const speed = glideSpeed(t);
        const size = 1 + swell * Math.sin(Math.PI * p) ** 1.4;
        const stretch = 0.16 * speed;
        return {
          ...path.at(p),
          r: clamp(path.lean(p, ahead) * 0.7, -22, 22) * clamp(speed * 1.6),
          sx: size * (1 + stretch),
          sy: size * (1 - stretch * 0.55),
          o: 1,
        };
      },
    };
  },

  // Tickets: a slip of paper carried on the air. It flutters, turning edge-on and back.
  ticket({ from, to, weight, room, ahead }) {
    const path = arc(from, to, Math.min(18 + 14 * weight, room));
    const flutters = 2 + Math.round(2 * weight);
    return {
      pose(t) {
        const p = smoother(t);
        const { x, y } = path.at(p);
        const calm = Math.sin(Math.PI * p);
        const phase = 2 * Math.PI * flutters * p;
        return {
          x,
          y: y + 3 * calm * Math.sin(phase),
          r: ahead * 16 * calm * Math.sin(phase),
          sx: 1 - 0.4 * calm * (1 - Math.abs(Math.cos(phase))),
          sy: 1 + 0.04 * calm,
          o: 1,
        };
      },
    };
  },

  // Mobility: drives along the line. Pulls away (the nose lifts), cruises over small bumps,
  // brakes (the nose dips) and parks, with a puff of dust as it leaves.
  drive: (j) => road(j, -1),
  // A cart: the same road, pushed rather than driven, facing the way it goes.
  roll: (j) => road(j, 1),

  // Payroll: money with wings. Each wing beat lifts it a little, and it drops a coin for every
  // year of payslips on the way.
  pay({ from, to, months, weight, room, ahead }) {
    const path = arc(from, to, Math.min(16 + 16 * weight, room));
    const years = clamp(Math.round(months / 12), 1, 8);
    const beats = 5 + Math.round(4 * weight);
    return {
      marks: Array.from({ length: years - 1 }, (_, k) => ({
        at: (k + 1) / years,
        kind: "drop",
        dy: 8,
      })),
      pose(t) {
        const p = smoother(t);
        const { x, y } = path.at(p);
        const calm = Math.sin(Math.PI * p) ** 0.5;
        const phase = 2 * Math.PI * beats * p;
        return {
          x,
          y: y - 2.5 * calm * Math.sin(phase),
          r: path.lean(p, ahead) * 0.4,
          sx: 1 - 0.05 * calm * Math.cos(phase),
          sy: 1 + 0.08 * calm * Math.cos(phase),
          o: 1,
        };
      },
    };
  },

  // Health: rides a heartbeat. It moves at the steady speed of an ECG strip and draws the trace
  // behind it, P, QRS and T, swelling on each beat.
  pulse({ from, to, weight, room }) {
    const beats = 2 + Math.round(2 * weight);
    const height = Math.min(16, room);
    const progress = profile(ramps(0.1, 0.1));
    const wave = (u: number) =>
      -0.14 * bell(u, 0.18, 0.06) +
      0.12 * bell(u, 0.36, 0.03) -
      bell(u, 0.43, 0.04) +
      0.32 * bell(u, 0.5, 0.035) -
      0.24 * bell(u, 0.7, 0.07);
    return {
      trace: "line",
      pose(t) {
        const p = progress(t);
        const u = (clamp((p - 0.06) / 0.88) * beats) % 1;
        const swell = 1 + 0.16 * bell(u, 0.44, 0.06);
        const { x, y } = along(from, to, p);
        return { x, y: y + height * wave(u), r: 0, sx: swell, sy: swell, o: 1 };
      },
    };
  },

  // Lighting: the bulb flickers on, then crosses leaving a streak of light behind it.
  beam({ from, to, room }) {
    const path = arc(from, to, Math.min(8, room));
    const flicker = [1, 0.3, 1, 0.45, 0.9, 1];
    return {
      trace: "beam",
      pose(t) {
        const lit = t < 0.18 ? flicker[Math.floor((t / 0.18) * flicker.length)] : 1;
        const p = smoother(clamp((t - 0.14) / 0.86));
        const glow = 1 + 0.1 * Math.sin(Math.PI * p);
        return { ...path.at(p), r: 0, sx: glow, sy: glow, o: lit };
      },
    };
  },

  // A lantern: rises first, then drifts on the breeze, swaying, and comes down gently.
  float({ from, to, weight, room, ahead }) {
    const path = arc(from, to, Math.min(22 + 10 * weight, room), 0.04, 0.7);
    const sways = 1.5 + weight;
    const progress = profile(ramps(0.3, 0.4));
    return {
      pace: 1.2,
      pose(t) {
        const p = progress(t);
        const { x, y } = path.at(p);
        const calm = Math.sin(Math.PI * p);
        const phase = 2 * Math.PI * sways * p;
        return {
          x: x + 2 * calm * Math.sin(phase),
          y: y + 2 * calm * Math.cos(phase * 2),
          r: ahead * 7 * calm * Math.sin(phase),
          sx: 1,
          sy: 1,
          o: 1,
        };
      },
    };
  },

  // Sport: kicked. Hops lower and shorter each time, as a real ball does (each bounce keeps
  // e² of its height and e of its time), squashes on the ground and rolls as it goes.
  bounce({ from, to, room, ahead, radius }) {
    const e = 0.55;
    const hops = 4;
    const height = Math.min(26, room);
    const times = Array.from({ length: hops }, (_, i) => e ** i);
    const sum = times.reduce((a, b) => a + b);
    const starts = times.map((_, i) => times.slice(0, i).reduce((a, b) => a + b, 0) / sum);
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const turns = Math.max(Math.round(((distance / radius) * DEG) / 360), 1) * 360;
    return {
      pose(t) {
        const p = 1 - (1 - t) ** 1.6;
        const i = Math.max(
          starts.findLastIndex((s) => t >= s),
          0,
        );
        const s = clamp((t - starts[i]) / (times[i] / sum));
        const top = height * e ** (2 * i);
        const ground = 1 - clamp(Math.min(s, 1 - s) / 0.1);
        const squash = 0.2 * ground * (top / height);
        const { x, y } = along(from, to, p);
        return {
          x,
          y: y - top * 4 * s * (1 - s),
          r: ahead * turns * p,
          sx: 1 + squash,
          sy: 1 - squash,
          o: 1,
        };
      },
    };
  },

  // Testing: a flask shaken as it goes, bubbling.
  fizz({ from, to, weight, room, ahead }) {
    const path = arc(from, to, Math.min(10, room));
    const shakes = 5 + Math.round(3 * weight);
    return {
      marks: [0.12, 0.28, 0.44, 0.6, 0.76].map((at, k) => ({
        at,
        kind: "bubble",
        dx: (k % 2 ? -1 : 1) * 3,
        dy: -9,
      })),
      pose(t) {
        const p = smoother(t);
        const shake = Math.sin(Math.PI * p) * Math.sin(2 * Math.PI * shakes * p);
        return {
          ...path.at(p),
          r: ahead * 12 * shake,
          sx: 1,
          sy: 1 + 0.04 * Math.abs(shake),
          o: 1,
        };
      },
    };
  },

  // A degree: a stair, one step per year, each rising then sliding and leaving a mark, the
  // emoji growing a little with each; then the cap is thrown and comes down on the dates.
  climb({ from, to, months, room, ahead }) {
    const years = clamp(Math.round(months / 12), 1, 8);
    const steps = 0.7; // of the time; the throw is the rest
    const rise = Math.min(room * 0.45, 4 * years);
    const top = { x: lerp(from.x, to.x, 0.62), y: Math.min(from.y, to.y) - rise };
    const stop = (k: number) => ({
      x: lerp(from.x, top.x, k / years),
      y: lerp(from.y, top.y, k / years),
    });
    const grown = 1 + 0.18; // at the top of the stair
    const lift = Math.max(room - rise, 10);
    const span = steps / years;
    return {
      pace: 1.25,
      marks: Array.from({ length: years }, (_, k) => ({
        at: (k + 0.72) * span,
        kind: "year",
        dy: 10,
      })),
      pose(t) {
        if (t < steps) {
          const k = Math.min(Math.floor(t / span), years - 1);
          const u = (t - k * span) / span;
          const moving = clamp(u / 0.72);
          const up = smoother(clamp(moving / 0.6)); // rise first, then slide: a stair, not a hop
          const over = smoother(clamp((moving - 0.12) / 0.88));
          const speed = moving < 1 ? smootherSpeed(clamp((moving - 0.12) / 0.88)) : 0;
          const beat = u > 0.72 ? Math.sin(Math.PI * clamp((u - 0.72) / 0.28)) : 0;
          const [a, b] = [stop(k), stop(k + 1)];
          const size = lerp(1, grown, (k + over) / years) * (1 + 0.1 * beat);
          return {
            x: lerp(a.x, b.x, over),
            y: lerp(a.y, b.y, up),
            r: ahead * 8 * speed,
            sx: size * (1 + 0.06 * beat),
            sy: size * (1 - 0.06 * beat),
            o: 1,
          };
        }
        // The throw: ballistic, so steady across and a parabola up and down, turning once.
        const q = (t - steps) / (1 - steps);
        const size = lerp(grown, 1, smoother(q));
        return {
          x: lerp(top.x, to.x, q),
          y: lerp(top.y, to.y, q) - lift * 4 * q * (1 - q),
          r: ahead * 360 * smoother(q),
          sx: size,
          sy: size,
          o: 1,
        };
      },
    };
  },

  // Abroad: a long-haul flight. Takes off slowly, climbs high (it grows, closer to us), leaves
  // a dotted route behind it as on a map, and comes down slowly.
  voyage({ from, to, weight, room, ahead }) {
    const path = arc(from, to, Math.min(40, room));
    const dots = 10 + Math.round(4 * weight);
    return {
      pace: 1.1,
      marks: Array.from({ length: dots - 1 }, (_, k) => ({ at: (k + 1) / dots, kind: "trail" })),
      pose(t) {
        const p = smoother(t);
        const size = 1 + 0.28 * Math.sin(Math.PI * p);
        return { ...path.at(p), r: path.lean(p, ahead) * 0.5, sx: size, sy: size, o: 1 };
      },
    };
  },
};

function road({ from, to, weight, ahead }: Journey, facing: 1 | -1): Path {
  const [up, down] = [0.3, 0.32];
  const progress = profile(ramps(up, down));
  const bumps = 3 + Math.round(3 * weight);
  return {
    facing,
    marks: [
      { at: 0.01, kind: "puff", dx: -ahead * 10, dy: 7 },
      { at: 0.08, kind: "puff", dx: -ahead * 12, dy: 6 },
    ],
    pose(t) {
      const p = progress(t);
      const pull = t < up ? smootherSpeed(t / up) : 0;
      const brake = t > 1 - down ? smootherSpeed((1 - t) / down) : 0;
      const cruise = 1 - Math.max(pull, brake);
      const { x, y } = along(from, to, p);
      return {
        x,
        y: y - 1.6 * cruise * Math.abs(Math.sin(Math.PI * bumps * p)),
        r: ahead * (6 * brake - 5 * pull),
        sx: 1,
        sy: 1 - 0.03 * brake,
        o: 1,
      };
    },
  };
}

// Months between two "YYYY" or "YYYY-MM", the first and the last both counted.
const monthOf = (text: string) => {
  const [year, month = 1] = text.split("-").map(Number);
  return year * 12 + month - 1;
};
const monthsOf = (el: HTMLElement) => {
  const { eggSince, eggUntil } = el.dataset;
  if (!eggSince) return 12;
  const now = new Date();
  const end = eggUntil ? monthOf(eggUntil) : now.getFullYear() * 12 + now.getMonth();
  return Math.max(end - monthOf(eggSince) + (eggUntil?.includes("-") || !eggUntil ? 1 : 0), 1);
};
// Six months is 0, six years is 1.
const weightOf = (months: number) => clamp(Math.log2(Math.max(months, 3) / 6) / Math.log2(12));

const EMERGE = 360;

// Before the journey: it pops out of the name on a spring, then leans back, ready to go.
const emerge = (from: Point, u: number, ahead: number): Pose => {
  const size = 1 - pop.release((u * EMERGE) / 1000) * (1 - u);
  const ready = u > 0.68 ? Math.sin(Math.PI * clamp((u - 0.68) / 0.32)) : 0;
  return {
    x: from.x,
    y: from.y + 6 * (1 - smoother(u)),
    r: -ahead * 5 * ready,
    sx: size * (1 + 0.05 * ready),
    sy: size * (1 - 0.08 * ready),
    o: smoother(clamp(u / 0.4)),
  };
};

// After landing: a soft knock, a still moment, then it lifts away and fades.
const afterLanding = (to: Point, ms: number, hold: number): Pose => {
  const s = ms / 1000;
  if (s < 0.5) {
    const knock = settle.knock(s);
    return { ...to, r: 3 * knock, sx: 1 + 0.12 * knock, sy: 1 - 0.1 * knock, o: 1 };
  }
  const fade = smoother(clamp((ms - 500 - hold) / 380));
  const size = 1 - 0.15 * fade;
  return { x: to.x, y: to.y - 8 * fade, r: 0, sx: size, sy: size, o: 1 - fade };
};

const span = (className: string, parent: Element) => {
  const el = document.createElement("span");
  el.className = className;
  parent.append(el);
  return el;
};

const transformOf = ({ x, y, r, sx, sy }: Pose, half: Point) =>
  `translate(${(x - half.x).toFixed(2)}px, ${(y - half.y).toFixed(2)}px) rotate(${r.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;

// Samples a motion at 60 frames a second into linear keyframes.
const framesOf = (total: number) => Math.min(Math.max(Math.round((total / 1000) * 60), 24), 360);
const play = (el: HTMLElement, pose: (ms: number) => Pose, total: number, delay = 0) => {
  const count = framesOf(total);
  const half = { x: el.offsetWidth / 2, y: el.offsetHeight / 2 };
  const frames = Array.from({ length: count + 1 }, (_, i) => {
    const now = pose((total * i) / count);
    return { transform: transformOf(now, half), opacity: Number(now.o.toFixed(3)) };
  });
  return el.animate(frames, { duration: total, delay, easing: "linear", fill: "both" });
};

// What a mark does once dropped, by kind.
const markFrames: Record<Mark["kind"], { frames: Keyframe[]; duration: number; easing: string }> = {
  year: {
    frames: [
      { opacity: 0, transform: "scale(0.3)" },
      { opacity: 0.8, transform: "scale(1)", offset: 0.15 },
      { opacity: 0, transform: "scale(0.6)" },
    ],
    duration: 1100,
    easing: "ease-out",
  },
  drop: {
    frames: [
      { opacity: 0, transform: "scale(0.4)" },
      { opacity: 0.9, transform: "scale(1)", offset: 0.15 },
      { opacity: 0, transform: "translateY(16px) scale(0.7)" },
    ],
    duration: 900,
    easing: "cubic-bezier(0.4, 0, 1, 1)",
  },
  bubble: {
    frames: [
      { opacity: 0, transform: "scale(0.4)" },
      { opacity: 0.8, transform: "translateY(-4px) scale(1)", offset: 0.2 },
      { opacity: 0, transform: "translate(2px, -20px) scale(0.8)" },
    ],
    duration: 1000,
    easing: "ease-out",
  },
  puff: {
    frames: [
      { opacity: 0.55, transform: "scale(0.3)" },
      { opacity: 0, transform: "translateY(-5px) scale(1.9)" },
    ],
    duration: 800,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  trail: { frames: [], duration: 0, easing: "ease-out" }, // stays until the landing, see below
};

// The text itself, not the box it sits in (a grid cell can be wider).
const textBox = (el: Element) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
};

const fly = (trigger: HTMLElement) => {
  const row = trigger.closest<HTMLElement>("[data-egg-row]");
  const emoji = trigger.dataset.egg;
  if (!row || !emoji) return;
  live.get(row)?.remove();

  const host = span("cv-fly-host", row);
  host.setAttribute("aria-hidden", "true");
  live.set(row, host);
  const glyph = () => {
    const el = span("cv-fly", host);
    el.textContent = emoji;
    return el;
  };

  const box = row.getBoundingClientRect();
  const name = textBox(trigger);
  const target = row.querySelector<HTMLElement>("[data-egg-to]");
  const dates = target && textBox(target);
  const main = glyph();
  const half = { x: main.offsetWidth / 2, y: main.offsetHeight / 2 };
  const middle = (r: DOMRect) => r.top + r.height / 2 - box.top;
  // Dates wrapped under the name have no room above them: it lands beside them instead.
  const perch = row.dataset.eggRow === "perch";
  const perchTo = perch && !!dates && dates.top < name.bottom - 2;
  // A tight row: it stops in front of the dates, never on them.
  const beside = row.dataset.eggRow === "beside";
  // Centres, in the row's own coordinates.
  const from = perch
    ? { x: name.right - box.left - half.x * 0.4, y: name.top - box.top - half.y + 6 }
    : { x: name.right - box.left + 6 + half.x, y: middle(name) };
  const to = !dates
    ? { x: box.width - parseFloat(getComputedStyle(row).paddingRight) - half.x, y: from.y }
    : perchTo
      ? { x: dates.left + dates.width / 2 - box.left, y: dates.top - box.top - half.y + 1 }
      : perch
        ? { x: dates.right - box.left + 6 + half.x, y: middle(dates) }
        : beside
          ? { x: Math.max(dates.left - box.left - 4 - half.x, from.x + 8), y: middle(dates) }
          : { x: dates.left + dates.width / 2 - box.left, y: middle(dates) };
  const distance = Math.hypot(from.x - to.x, from.y - to.y);

  // Cleans up once landed, unless a newer press has already replaced this flight.
  const done = (anim: Animation) => {
    void anim.finished
      .then(() => {
        if (live.get(row) !== host) return;
        host.remove();
        live.delete(row);
      })
      .catch(() => {});
  };

  if (still.matches || distance < 8) {
    // No travel: the emoji shows up on the dates, then fades.
    done(
      play(
        main,
        (ms) => ({ ...still1(to), o: clamp(Math.min(ms / 200, (1400 - ms) / 300)) }),
        1400,
      ),
    );
    return;
  }

  const ahead = Math.sign(to.x - from.x) || 1;
  const months = monthsOf(trigger);
  const weight = weightOf(months);
  const room = Math.max(Math.min(from.y, to.y) - half.y + (perch ? 24 : 12), 6);
  const asked = trigger.dataset.eggMotion ?? "";
  const motion: EggMotion = asked in motions ? (asked as EggMotion) : "glide";
  const path = motions[motion]({
    from,
    to,
    months,
    weight,
    room,
    ahead,
    radius: half.x,
  });
  const travel = Math.round((1400 + 1400 * weight) * (path.pace ?? 1));
  const landAt = EMERGE + travel;
  const hold = 520 + 320 * weight;
  const total = landAt + 500 + hold + 380;
  const facing = path.facing ?? 1;
  const turned = path.pose(1).r; // a spin that ends on whole turns lands as it is
  const pose = (ms: number): Pose => {
    const now =
      ms < EMERGE
        ? emerge(from, ms / EMERGE, ahead)
        : ms < landAt
          ? path.pose((ms - EMERGE) / travel)
          : afterLanding(to, ms - landAt, hold);
    return { ...now, r: ms < landAt ? now.r : now.r + turned, sx: now.sx * facing };
  };

  // Anticipation: the name gives under the press, then springs back as the emoji leaves it.
  trigger.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(0.94)", offset: 0.3 },
      { transform: "scale(1)" },
    ],
    { duration: 420, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
  );

  // A smear: two fainter copies a frame behind, gone before the landing.
  if (path.smear) {
    [0.28, 0.12].forEach((strength, i) => {
      const ghost = glyph();
      host.prepend(ghost);
      play(
        ghost,
        (ms) => {
          const now = pose(ms);
          const fade = ms < EMERGE ? 0 : 1 - smoother(clamp((ms - EMERGE) / (travel * 0.85)));
          return { ...now, o: now.o * strength * fade };
        },
        landAt,
        (i + 1) * 18,
      );
    });
  }

  // A line drawn behind it, its tip kept under the emoji.
  if (path.trace) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "cv-fly-trace");
    svg.dataset.kind = path.trace;
    svg.setAttribute("width", String(box.width));
    svg.setAttribute("height", String(box.height));
    const line = document.createElementNS(ns, "polyline");
    const steps = 400;
    const points = Array.from({ length: steps + 1 }, (_, i) => path.pose(i / steps));
    const lengths = [0];
    points.forEach((p, i) => {
      if (i)
        lengths.push(lengths[i - 1] + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y));
    });
    const length = lengths[steps];
    line.setAttribute("points", points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "));
    line.style.strokeDasharray = `${length} ${length}`;
    svg.append(line);
    host.prepend(svg);
    const count = framesOf(travel);
    line.animate(
      Array.from({ length: count + 1 }, (_, i) => ({
        strokeDashoffset: length - lengths[Math.round((i / count) * steps)],
      })),
      { duration: travel, delay: EMERGE, easing: "linear", fill: "both" },
    );
    svg.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 600,
      delay: landAt + 500 + hold * 0.5,
      easing: "ease-in",
      fill: "forwards",
    });
  }

  // Marks dropped along the way.
  (path.marks ?? []).forEach(({ at, kind, dx = 0, dy = 0 }) => {
    const { x, y } = path.pose(at);
    const dot = span("cv-fly-mark", host);
    dot.dataset.kind = kind;
    dot.style.translate = `${x + dx}px ${y + dy}px`;
    host.prepend(dot); // under the emoji
    const delay = EMERGE + at * travel;
    if (kind === "trail") {
      const duration = landAt + 500 + hold * 0.5 - delay + 500;
      dot.animate(
        [
          { opacity: 0, transform: "scale(0.4)" },
          { opacity: 0.7, transform: "scale(1)", offset: Math.min(240 / duration, 0.5) },
          { opacity: 0.7, transform: "scale(1)", offset: 1 - 500 / duration },
          { opacity: 0, transform: "scale(0.6)" },
        ],
        { duration, delay, easing: "ease-out" },
      );
      return;
    }
    const { frames, duration, easing } = markFrames[kind];
    dot.animate(frames, { duration, delay, easing });
  });

  // On arrival the dates answer: a ring spreads from the landing, and the dates light up and
  // give a little, or, under the emoji, step back while it rests on them.
  const ring = span("cv-fly-ring", host);
  ring.style.translate = `${to.x}px ${to.y}px`;
  ring.animate(
    [
      { opacity: 0.55, transform: "scale(0.35)" },
      { opacity: 0, transform: "scale(1.8)" },
    ],
    { duration: 700, delay: landAt, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  );
  if (target) {
    const accent = getComputedStyle(row).getPropertyValue("--accent").trim();
    if (perchTo || perch || beside) {
      target.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.06)", color: accent, offset: 0.25 },
          { color: accent, offset: 0.7 },
          { transform: "scale(1)" },
        ],
        { duration: 500 + hold, delay: landAt, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    } else {
      const stay = 500 + hold + 380;
      target.animate(
        [
          { opacity: 1 },
          { opacity: 0.15, offset: 200 / stay },
          { opacity: 0.15, offset: (500 + hold) / stay },
          { opacity: 1 },
        ],
        { duration: stay, delay: landAt, easing: "ease-out" },
      );
    }
  }

  host.append(main); // the real one travels above its trail and marks
  done(play(main, pose, total));
};

document.addEventListener("click", (event) => {
  const { target } = event;
  const trigger = target instanceof Element ? target.closest<HTMLElement>("[data-egg]") : null;
  if (trigger) fly(trigger);
});
