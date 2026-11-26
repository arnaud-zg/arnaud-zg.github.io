// An easter egg: press a name marked `data-egg="🎟️"` and its emoji travels to it from the element
// marked `data-egg-from` in its `data-egg-row` (the dates), or else from the row's far end.
// A row marked `data-egg-row="perch"` has room above the name: the emoji lands on top of it.
//
// Two motions, one per kind (`data-egg-kind`):
// - work: one continuous glide. A critically damped spring carries it (no hop, no bounce), it
//   swells as it comes closer to the viewer, leans into its path and stretches with its speed,
//   with a short trail behind it (motion smear), then settles on the name with a soft spring.
// - study: a climb, one step per year. Each step rises then slides, rests for a beat and leaves
//   a mark, and the emoji grows a little with every year until it settles on the name.
// The arrival makes the name answer, so the landing reads as the cause (Michotte).
//
// Duration follows time spent there (`data-egg-since`, `data-egg-until`, "YYYY" or "YYYY-MM",
// no end meaning today), on a log scale: we judge durations by ratio (Weber–Fechner), so six
// months take about half a second and six years a little over one, never a slog.
//
// Every pose is computed per frame and handed to the Web Animations API as linear keyframes:
// transform and opacity only, on an absolutely placed layer, so nothing else moves.

import "./styles/flight.css";

const still = matchMedia("(prefers-reduced-motion: reduce)");
const live = new WeakMap<HTMLElement, HTMLElement>();

type Point = { x: number; y: number };
type Pose = { x: number; y: number; r: number; sx: number; sy: number; o: number };
type Motion = {
  landAt: number;
  total: number;
  at: (ms: number) => Pose;
  marks: (Point & { at: number })[];
};

const clamp = (v: number, lo = 0, hi = 1) => Math.min(Math.max(v, lo), hi);
// Perlin's smootherstep: no speed and no acceleration at either end.
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const smootherSpeed = (t: number) => (30 * t * t * (1 - t) * (1 - t)) / 1.875; // peaks at 1

// A critically damped spring from rest, normalised to land exactly at the end.
const OMEGA = 6;
const REST = 1 - (1 + OMEGA) * Math.exp(-OMEGA);
const glide = (t: number) => (1 - (1 + OMEGA * t) * Math.exp(-OMEGA * t)) / REST;
const glideSpeed = (t: number) => OMEGA * t * Math.exp(1 - OMEGA * t); // peaks at 1

// Springs by damping ratio and response, as in Apple's "Designing Fluid Interfaces".
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

const cubic = (a: Point, b: Point, c: Point, d: Point, t: number): Point => {
  const u = 1 - t;
  const [k0, k1, k2, k3] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return {
    x: k0 * a.x + k1 * b.x + k2 * c.x + k3 * d.x,
    y: k0 * a.y + k1 * b.y + k2 * c.y + k3 * d.y,
  };
};
const cubicSlope = (a: Point, b: Point, c: Point, d: Point, t: number): Point => {
  const u = 1 - t;
  const [k0, k1, k2] = [3 * u * u, 6 * u * t, 3 * t * t];
  return {
    x: k0 * (b.x - a.x) + k1 * (c.x - b.x) + k2 * (d.x - c.x),
    y: k0 * (b.y - a.y) + k1 * (c.y - b.y) + k2 * (d.y - c.y),
  };
};
const DEG = 180 / Math.PI;

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

const rest = (to: Point, scale = 1): Pose => ({ ...to, r: 0, sx: scale, sy: scale, o: 1 });

// After landing: a soft knock, a still moment, then it lifts away and fades.
const afterLanding = (
  to: Point,
  landAt: number,
  hold: number,
  ms: number,
  scale?: (s: number) => number,
): Pose => {
  const s = (ms - landAt) / 1000;
  if (s < 0.5) {
    const knock = settle.knock(s);
    const size = scale ? scale(s) : 1;
    return {
      ...to,
      r: 3 * knock,
      sx: size * (1 + 0.12 * knock),
      sy: size * (1 - 0.1 * knock),
      o: 1,
    };
  }
  const fade = smoother(clamp((ms - landAt - 500 - hold) / 300));
  return {
    x: to.x,
    y: to.y - 8 * fade,
    r: 0,
    sx: 1 - 0.15 * fade,
    sy: 1 - 0.15 * fade,
    o: 1 - fade,
  };
};

// Six months is 0, six years is 1.
const weightOf = (months: number) => clamp(Math.log2(Math.max(months, 3) / 6) / Math.log2(12));

const work = (from: Point, to: Point, months: number, headroom: number): Motion => {
  const weight = weightOf(months);
  const landAt = Math.round(520 + 700 * weight);
  const hold = 300 + 200 * weight;
  const dx = to.x - from.x;
  const lift = Math.min(14 + 24 * weight, headroom);
  const c1 = { x: from.x + dx * 0.3, y: from.y - lift * 1.15 };
  const c2 = { x: from.x + dx * 0.78, y: to.y - lift * 0.85 };
  const swell = 0.22 + 0.2 * weight; // closer to the viewer mid-flight
  const ahead = Math.sign(dx) || 1;
  return {
    landAt,
    total: landAt + 800 + hold,
    marks: [],
    at(ms) {
      if (ms >= landAt) return afterLanding(to, landAt, hold, ms);
      const t = clamp(ms / landAt);
      const p = glide(t);
      const speed = glideSpeed(t);
      const { x, y } = cubic(from, c1, c2, to, p);
      const slope = cubicSlope(from, c1, c2, to, p);
      const lean = clamp(
        ahead * Math.atan2(slope.y, Math.abs(slope.x) + 1e-6) * DEG * 0.7,
        -22,
        22,
      );
      const enter = smoother(clamp(t / 0.16));
      const size = (0.55 + 0.45 * enter) * (1 + swell * Math.sin(Math.PI * p) ** 1.4);
      const stretch = 0.16 * speed;
      return {
        x,
        y,
        r: lean * clamp(speed * 1.6),
        sx: size * (1 + stretch),
        sy: size * (1 - stretch * 0.55),
        o: enter,
      };
    },
  };
};

const study = (from: Point, to: Point, months: number): Motion => {
  const years = clamp(Math.round(months / 12), 1, 8);
  const step = 330 - 14 * years;
  const landAt = Math.round((years - 0.28) * step); // no rest on the last step: it lands
  const hold = 260 + 40 * years;
  const ahead = Math.sign(to.x - from.x) || 1;
  const stop = (k: number) => ({
    x: from.x + ((to.x - from.x) * k) / years,
    y: from.y + ((to.y - from.y) * k) / years,
  });
  const grown = (k: number) => 0.78 + (0.32 * k) / years; // ends a touch large, then settles
  return {
    landAt,
    total: landAt + 800 + hold,
    marks: Array.from({ length: years - 1 }, (_, k) => ({ ...stop(k + 1), at: (k + 0.72) * step })),
    at(ms) {
      if (ms >= landAt)
        return afterLanding(to, landAt, hold, ms, (s) => 1 + 0.1 * settle.release(s));
      const k = Math.min(Math.floor(ms / step), years - 1);
      const u = (ms - k * step) / step;
      const [a, b] = [stop(k), stop(k + 1)];
      const moving = clamp(u / 0.72);
      // Rise first, then slide: a stair, not a hop.
      const rise = smoother(clamp(moving / 0.6));
      const slide = smoother(clamp((moving - 0.12) / 0.88));
      const speed = moving < 1 ? smootherSpeed(clamp((moving - 0.12) / 0.88)) : 0;
      const beat = u > 0.72 && k < years - 1 ? Math.sin(Math.PI * clamp((u - 0.72) / 0.28)) : 0;
      const size = grown(k + slide) * (1 + 0.12 * beat);
      const enter = smoother(clamp(ms / 140));
      return {
        x: a.x + (b.x - a.x) * slide,
        y: a.y + (b.y - a.y) * rise,
        r: ahead * 8 * speed,
        sx: size * (0.6 + 0.4 * enter) * (1 + 0.06 * beat),
        sy: size * (0.6 + 0.4 * enter) * (1 - 0.06 * beat),
        o: enter,
      };
    },
  };
};

const span = (className: string, parent: HTMLElement) => {
  const el = document.createElement("span");
  el.className = className;
  parent.append(el);
  return el;
};

// Samples a motion at 60 frames a second into linear keyframes.
const play = (el: HTMLElement, pose: (ms: number) => Pose, total: number, delay = 0) => {
  const count = Math.min(Math.max(Math.round((total / 1000) * 60), 24), 180);
  const half = { x: el.offsetWidth / 2, y: el.offsetHeight / 2 };
  const frames = Array.from({ length: count + 1 }, (_, i) => {
    const { x, y, r, sx, sy, o } = pose((total * i) / count);
    return {
      transform: `translate(${(x - half.x).toFixed(2)}px, ${(y - half.y).toFixed(2)}px) rotate(${r.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`,
      opacity: Number(o.toFixed(3)),
    };
  });
  return el.animate(frames, { duration: total, delay, easing: "linear", fill: "both" });
};

const fly = (trigger: HTMLElement) => {
  const row = trigger.closest<HTMLElement>("[data-egg-row]");
  const emoji = trigger.dataset.egg;
  if (!row || !emoji) return;
  live.get(row)?.remove();

  const host = span("cv-fly-host", row);
  host.setAttribute("aria-hidden", "true");
  live.set(row, host);
  const glyph = (className = "cv-fly") => {
    const el = span(className, host);
    el.textContent = emoji;
    return el;
  };

  const box = row.getBoundingClientRect();
  const name = trigger.getBoundingClientRect();
  const source = row.querySelector<HTMLElement>("[data-egg-from]")?.getBoundingClientRect();
  const main = glyph();
  const half = { x: main.offsetWidth / 2, y: main.offsetHeight / 2 };
  const perch = row.dataset.eggRow === "perch";
  const middle = name.top + name.height / 2 - box.top;
  // Centres, in the row's own coordinates.
  const to = perch
    ? { x: name.right - box.left - half.x * 0.4, y: name.top - box.top - half.y + 6 }
    : { x: name.right - box.left + 6 + half.x, y: middle };
  const from = source
    ? { x: source.left + source.width / 2 - box.left, y: source.top + source.height / 2 - box.top }
    : { x: box.width - parseFloat(getComputedStyle(row).paddingRight) - half.x, y: middle };
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
    // No travel: the emoji shows up on the name, then fades.
    done(
      play(main, (ms) => ({ ...rest(to), o: clamp(Math.min(ms / 160, (900 - ms) / 240)) }), 900),
    );
    return;
  }

  const months = monthsOf(trigger);
  const motion =
    trigger.dataset.eggKind === "study"
      ? study(from, to, months)
      : work(from, to, months, Math.max((Math.min(from.y, to.y) - half.y * 0.4) / 0.8, 4));

  // Work leaves a smear: two fainter copies a frame behind, gone before the landing.
  if (trigger.dataset.eggKind !== "study") {
    [0.28, 0.12].forEach((strength, i) => {
      const ghost = glyph();
      host.prepend(ghost);
      const fade = (ms: number) => strength * (1 - smoother(clamp(ms / (motion.landAt * 0.85))));
      play(
        ghost,
        (ms) => ({ ...motion.at(ms), o: motion.at(ms).o * fade(ms) }),
        motion.landAt,
        (i + 1) * 18,
      );
    });
  }

  // Study leaves a mark at each year it rests on.
  motion.marks.forEach((mark, k) => {
    const dot = span("cv-fly-mark", host);
    dot.style.translate = `${mark.x}px ${mark.y}px`;
    dot.animate(
      [
        { opacity: 0, transform: "scale(0.3)" },
        { opacity: 0.8, transform: "scale(1)", offset: 0.15 },
        { opacity: 0, transform: "scale(0.6)" },
      ],
      {
        duration: 640 + 80 * (motion.marks.length - k),
        delay: mark.at,
        easing: "ease-out",
      },
    );
  });

  // On arrival the name answers: a ring spreads from the landing, the name gives a little.
  const ring = span("cv-fly-ring", host);
  ring.style.translate = `${to.x}px ${to.y}px`;
  ring.animate(
    [
      { opacity: 0.55, transform: "scale(0.35)" },
      { opacity: 0, transform: "scale(1.7)" },
    ],
    { duration: 620, delay: motion.landAt, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  );
  trigger.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.04)", offset: 0.3 },
      { transform: "scale(1)" },
    ],
    { duration: 420, delay: motion.landAt, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  );

  host.append(main); // the real one travels above its trail and marks
  done(play(main, motion.at, motion.total));
};

document.addEventListener("click", (event) => {
  const { target } = event;
  const trigger = target instanceof Element ? target.closest<HTMLElement>("[data-egg]") : null;
  if (trigger) fly(trigger);
});
