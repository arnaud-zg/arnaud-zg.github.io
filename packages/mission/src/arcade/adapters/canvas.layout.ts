// Draws what the layout placed (see domain/layout.ts): each line of a text, one under the other.
import type { Placed } from "../domain/layout.ts";
import type { Ink, Look } from "./pixel.font.ts";
import { lineStep } from "../domain/layout.ts";
import { drawText } from "./pixel.font.ts";

export const drawPlaced = ({
  ctx,
  placed,
  x,
  ink,
  look = { align: "center" },
}: {
  ctx: CanvasRenderingContext2D;
  placed: Placed | undefined;
  x: number;
  ink: Ink;
  look?: Look;
}) => {
  if (!placed) return;
  placed.lines.forEach((line, i) =>
    drawText(ctx, line, x, placed.y + i * lineStep(placed.scale), placed.scale, ink, look),
  );
};
