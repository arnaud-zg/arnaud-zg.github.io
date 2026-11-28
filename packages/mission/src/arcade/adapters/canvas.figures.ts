// The whiteboard's drawings, one painter per kind: a tree, lockers, nested calls, a race.
import type { Figure, Racer } from "../../challenge/domain/exercise.ts";
import { workOf } from "../../challenge/domain/exercise.ts";
import * as art from "./canvas.draw.ts";
import { INK } from "./canvas.sprites.ts";
import { drawText, textWidth } from "./pixel.font.ts";

type Ctx = CanvasRenderingContext2D;
type Area = { readonly x: number; readonly y: number; readonly w: number };
type Painter<F> = {
  readonly height: (figure: F) => number;
  readonly paint: (args: { ctx: Ctx; figure: F; area: Area; t: number }) => void;
};
type Kind = Figure["kind"];
type Of<K extends Kind> = Extract<Figure, { kind: K }>;

// A line of pixels from one point to another, so nothing is smoothed.
const pixelLine = ({
  ctx,
  from,
  to,
  color,
}: {
  ctx: Ctx;
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
}) => {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1);
  for (let i = 0; i <= steps; i++)
    art.rect(
      ctx,
      Math.round(from.x + ((to.x - from.x) * i) / steps),
      Math.round(from.y + ((to.y - from.y) * i) / steps),
      1,
      1,
      color,
    );
};

const NODE = { w: 15, h: 9 } as const;
const treeSpot = ({ index, area }: { index: number; area: Area }) => {
  const depth = Math.floor(Math.log2(index + 1));
  const slot = index + 1 - 2 ** depth;
  return {
    x: Math.round(area.x + (area.w * (slot + 0.5)) / 2 ** depth),
    y: area.y + 2 + depth * 18,
  };
};

const tree: Painter<Of<"tree">> = {
  height: () => 2 + 2 * 18 + NODE.h + 2,
  paint: ({ ctx, figure, area }) => {
    figure.values.forEach((_, index) => {
      if (index === 0) return;
      const parent = treeSpot({ index: Math.floor((index - 1) / 2), area });
      const child = treeSpot({ index, area });
      const lit = figure.path.includes(index) && figure.path.includes(Math.floor((index - 1) / 2));
      pixelLine({
        ctx,
        from: { x: parent.x, y: parent.y + NODE.h },
        to: { x: child.x, y: child.y },
        color: lit ? INK.gold : INK.stone,
      });
    });
    figure.values.forEach((value, index) => {
      const spot = treeSpot({ index, area });
      const here = figure.path.at(-1) === index;
      const lit = figure.path.includes(index);
      art.block(
        ctx,
        spot.x - NODE.w / 2,
        spot.y,
        NODE.w,
        NODE.h,
        here ? INK.gold : lit ? INK.khaki : INK.mortar,
      );
      drawText(ctx, String(value), spot.x, spot.y + 1, 1, here ? INK.soot : INK.sandLight, {
        align: "center",
      });
    });
  },
};

const lockers: Painter<Of<"lockers">> = {
  height: () => 12 + 26,
  paint: ({ ctx, figure, area }) => {
    const gap = 4;
    const w = Math.floor((area.w - gap * (figure.lockers - 1)) / figure.lockers);
    const waiting = figure.items.filter((item) => item.locker === undefined);
    waiting.forEach((item, i) =>
      drawText(ctx, `${item.key} ?`, area.x + area.w - i * 40, area.y, 1, INK.goldLight, {
        align: "right",
      }),
    );
    for (let n = 0; n < figure.lockers; n++) {
      const x = area.x + n * (w + gap);
      art.block(ctx, x, area.y + 10, w, 26, INK.mortar);
      drawText(ctx, String(n), x + 2, area.y + 12, 1, INK.khaki);
      figure.items
        .filter((item) => item.locker === n)
        .forEach((item, i) =>
          drawText(
            ctx,
            item.key,
            x + w / 2,
            area.y + 21 + i * 8 - (i > 0 ? 4 : 0),
            1,
            INK.sandLight,
            { align: "center" },
          ),
        );
    }
  },
};

const dolls: Painter<Of<"dolls">> = {
  height: (figure) => figure.labels.length * 11 + 4,
  paint: ({ ctx, figure, area }) => {
    figure.labels.forEach((label, i) => {
      const inset = i * 6;
      const top = area.y + i * 11;
      const h = (figure.labels.length - i) * 11 + 4 - i * 2;
      art.rect(ctx, area.x + inset, top, area.w - inset * 2, 1, INK.khaki);
      art.rect(ctx, area.x + inset, top, 1, h, INK.khaki);
      art.rect(ctx, area.x + area.w - inset - 1, top, 1, h, INK.khaki);
      art.rect(ctx, area.x + inset, top + h - 1, area.w - inset * 2, 1, INK.khaki);
      drawText(
        ctx,
        label,
        area.x + inset + 3,
        top + 2,
        1,
        i === figure.labels.length - 1 ? INK.goldLight : INK.sandLight,
      );
    });
  },
};

// n climbs to a million in three seconds; each bar is the work its curve does, on a log scale.
const RACE = { seconds: 3, top: 1_000_000 } as const;
const raceBar = ({ racer, n, room }: { racer: Racer; n: number; room: number }) => {
  const most = Math.log10(workOf({ grows: "square", n: RACE.top }));
  return Math.max(1, Math.round((room * Math.log10(workOf({ grows: racer.grows, n }) + 1)) / most));
};

const race: Painter<Of<"race">> = {
  height: (figure) => 10 + figure.racers.length * 10,
  paint: ({ ctx, figure, area, t }) => {
    const n = Math.round(RACE.top ** Math.min(1, t / RACE.seconds));
    drawText(ctx, `N ${n.toLocaleString("en-GB")}`, area.x + area.w, area.y, 1, INK.khaki, {
      align: "right",
    });
    const labelWidth = Math.max(...figure.racers.map((r) => textWidth(r.label))) + 6;
    const room = Math.max(10, area.w - labelWidth);
    figure.racers.forEach((racer, i) => {
      const y = area.y + 10 + i * 10;
      drawText(ctx, racer.label, area.x, y, 1, INK.sandLight);
      art.rect(
        ctx,
        area.x + labelWidth,
        y + 1,
        raceBar({ racer, n, room }),
        5,
        i === 0 ? INK.gold : i === 1 ? INK.rust : INK.goldLight,
      );
    });
  },
};

const PAINTERS: { readonly [K in Kind]: Painter<Of<K>> } = { tree, lockers, dolls, race };

// Indexed by a generic kind, the table hands each figure its own painter, with no cast.
const heightWith = <K extends Kind>(kind: K, figure: Of<K>) => PAINTERS[kind].height(figure);
const paintWith = <K extends Kind>(
  kind: K,
  args: { ctx: Ctx; figure: Of<K>; area: Area; t: number },
) => PAINTERS[kind].paint(args);

export const figureHeight = (figure: Figure) => heightWith(figure.kind, figure);
export const paintFigure = (args: { ctx: Ctx; figure: Figure; area: Area; t: number }) =>
  paintWith(args.figure.kind, args);
