// Sharing a run: the words, a score card to go with them, and where they go. LinkedIn takes no
// image and no private message from a link, so: on a phone, the system's share sheet with the
// card; elsewhere, the card on the clipboard and a LinkedIn post opened with the words in it.
import type { MissionLabels } from "./labels";
import { drawText, fitScale, GLYPH_H } from "./font.ts";
import { GOLD, INK, paper } from "./sprites.ts";

export type Played = { readonly title: string; readonly rank: string }; // rank "-": not cleared
export type Result = {
  readonly played: readonly Played[];
  readonly score: number;
  readonly skills: number;
  readonly total: number;
};

// "OPERATION: DEEP DIVE (rank A), OPERATION: SHIP IT (game over)"
export const playedLine = (L: MissionLabels, r: Result) =>
  r.played
    .map(
      (p) =>
        `${p.title} (${p.rank === "-" ? L.failed.toLowerCase() : L.rankOf.replace("{rank}", p.rank)})`,
    )
    .join(", ");

export const fill = (template: string, L: MissionLabels, r: Result, url: string) =>
  template
    .replace("{played}", playedLine(L, r))
    .replace("{score}", r.score.toLocaleString("en-GB"))
    .replace("{skills}", String(r.skills))
    .replace("{total}", String(r.total))
    .replace("{host}", new URL(url).host)
    .replace("{url}", url);

// A 1200 × 630 card, the size a post shows: every operation played, its rank, the score.
export const scoreCard = (
  L: MissionLabels,
  r: Result,
  url: string,
  colors: { menu: string; plate: string },
) => {
  const W = 300,
    H = 158;
  const small = document.createElement("canvas");
  small.width = W;
  small.height = H;
  const ctx = paper(small);
  ctx.fillStyle = colors.menu;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = colors.plate;
  ctx.fillRect(6, 6, W - 12, 1);
  ctx.fillRect(6, H - 7, W - 12, 1);
  drawText(ctx, L.dialog.toUpperCase(), W / 2, 14, 1, INK.sand, { align: "center" });
  const score = `${r.score.toLocaleString("en-GB")} ${L.score}`;
  drawText(ctx, score, W / 2, 28, fitScale(score, W - 24, 3), GOLD, {
    outline: INK.soot,
    shadow: INK.rust,
    align: "center",
  });
  let y = 28 + GLYPH_H * 3 + 12;
  for (const p of r.played) {
    drawText(ctx, p.title, 18, y, 1, INK.sandLight);
    drawText(
      ctx,
      p.rank === "-" ? L.failed : `${L.rank} ${p.rank}`,
      W - 18,
      y,
      1,
      p.rank === "-" ? INK.rust : INK.gold,
      { align: "right" },
    );
    y += 11;
  }
  drawText(ctx, `${L.skills} ${r.skills}/${r.total}`, W / 2, y + 4, 1, INK.goldLight, {
    align: "center",
  });
  drawText(ctx, new URL(url).host.toUpperCase(), W / 2, H - 17, 1, INK.sand, { align: "center" });
  const big = document.createElement("canvas");
  big.width = W * 4;
  big.height = H * 4;
  const out = paper(big);
  out.imageSmoothingEnabled = false;
  out.drawImage(small, 0, 0, big.width, big.height);
  return new Promise<Blob | null>((done) => big.toBlob(done, "image/png"));
};

export type Shared = "shared" | "image" | "text" | "none";

export const shareRun = async (
  text: string,
  card: Promise<Blob | null>,
  coarse: boolean,
): Promise<Shared> => {
  const blob = await card;
  const file = blob ? new File([blob], "secret-mission.png", { type: "image/png" }) : undefined;
  if (coarse && file && "canShare" in navigator && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ text, files: [file] });
      return "shared";
    } catch {
      return "none"; // dismissed
    }
  }
  let copied: Shared = "none";
  try {
    if (blob && "ClipboardItem" in window) {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      copied = "image";
    } else {
      await navigator.clipboard.writeText(text);
      copied = "text";
    }
  } catch {
    copied = "none";
  }
  window.open(
    `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener",
  );
  return copied;
};

// The message for a private one: on the clipboard, and the profile opened to paste it.
export const messageRun = async (text: string, profile: string) => {
  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch {
    copied = false;
  }
  window.open(profile, "_blank", "noopener");
  return copied;
};
