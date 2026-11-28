// Where words and boxes go on a stage of any size, in stage pixels; the pixel font is monospaced.
export const FONT = { advance: 6, height: 7 } as const;

const glyphs = (text: string) => [...text.normalize("NFD").replace(/[̀-ͯ]/g, "")];

export const widthOf = ({ text, scale = 1 }: { text: string; scale?: number }) =>
  Math.max(0, glyphs(text).length * FONT.advance - 1) * scale;

const perLine = (width: number) => Math.max(1, Math.floor((width + 1) / FONT.advance));

// A word longer than a line is cut, so nothing ever runs off the stage.
const piecesOf = (word: string, per: number): string[] => {
  const chars = glyphs(word);
  if (chars.length <= per) return [word];
  return [chars.slice(0, per).join(""), ...piecesOf(chars.slice(per).join(""), per)];
};

export const linesOf = ({ text, width }: { text: string; width: number }) => {
  const per = perLine(width);
  const lines: string[] = [];
  for (const word of text.split(" ").flatMap((w) => piecesOf(w, per))) {
    const last = lines.at(-1);
    const joined = last === undefined ? word : `${last} ${word}`;
    if (last !== undefined && glyphs(joined).length <= per) {
      lines[lines.length - 1] = joined;
      continue;
    }
    lines.push(word);
  }
  return lines;
};

export type Fitted = { readonly scale: number; readonly lines: readonly string[] };

// As big as fits on one line, up to `max`; too long even at 1, it wraps at 1.
export const fitText = ({ text, width, max }: { text: string; width: number; max: number }) => {
  const scale = Math.max(1, Math.min(max, Math.floor(width / Math.max(1, widthOf({ text })))));
  const fitted: Fitted =
    widthOf({ text, scale }) <= width
      ? { scale, lines: [text] }
      : { scale: 1, lines: linesOf({ text, width }) };
  return fitted;
};

const LEADING = 3; // between two lines of one text, per unit of scale

export const heightOf = ({ scale, lines }: Fitted) =>
  lines.length * FONT.height * scale + Math.max(0, lines.length - 1) * LEADING * scale;

export const lineStep = (scale: number) => (FONT.height + LEADING) * scale;

// A screen is a column of words or boxes; optional ones go first, absent ones (undefined) take no room.
export type Piece =
  | {
      readonly kind: "text";
      readonly text: string;
      readonly max: number;
      readonly optional?: boolean;
    }
  | { readonly kind: "box"; readonly height: number; readonly optional?: boolean };

export type Placed = Fitted & { readonly y: number; readonly height: number };

type Frame = {
  readonly top: number;
  readonly bottom: number;
  readonly width: number;
  readonly gap: number;
};

const sizeOf = ({ piece, cap, width }: { piece: Piece; cap: number; width: number }) => {
  if (piece.kind === "box") return { scale: 1, lines: [], height: piece.height };
  const fitted = fitText({ text: piece.text, width, max: Math.min(piece.max, cap) });
  return { ...fitted, height: heightOf(fitted) };
};

const totalOf = ({
  sizes,
  gap,
}: {
  sizes: readonly ({ height: number } | undefined)[];
  gap: number;
}) => {
  const shown = sizes.filter((s) => s !== undefined);
  return shown.reduce((sum, s) => sum + s.height, 0) + Math.max(0, shown.length - 1) * gap;
};

const placeAll = ({
  sizes,
  frame,
}: {
  sizes: readonly ((Fitted & { height: number }) | undefined)[];
  frame: Frame;
}) => {
  const room = frame.bottom - frame.top;
  let y = frame.top + Math.max(0, Math.floor((room - totalOf({ sizes, gap: frame.gap })) / 2));
  return sizes.map((size) => {
    if (!size) return undefined;
    const placed: Placed = { ...size, y };
    y += size.height + frame.gap;
    return placed;
  });
};

type Pieces = readonly (Piece | undefined)[];

const biggest = (pieces: Pieces) =>
  Math.max(1, ...pieces.map((p) => (p?.kind === "text" ? p.max : 1)));

// The pieces, top to bottom, centred in the room: smaller first, then without the optional ones.
export const column = ({ pieces, ...frame }: Frame & { pieces: Pieces }) => {
  const room = frame.bottom - frame.top;
  const measure = (kept: Pieces, cap: number) =>
    kept.map((piece) => piece && sizeOf({ piece, cap, width: frame.width }));
  for (let cap = biggest(pieces); cap >= 1; cap--) {
    const sizes = measure(pieces, cap);
    if (totalOf({ sizes, gap: frame.gap }) <= room)
      return { placed: placeAll({ sizes, frame }), fits: true };
  }
  let kept: Pieces = pieces;
  for (const index of pieces.map((_, i) => i).reverse()) {
    if (!pieces[index]?.optional) continue;
    kept = kept.map((piece, i) => (i === index ? undefined : piece));
    const sizes = measure(kept, 1);
    if (totalOf({ sizes, gap: frame.gap }) <= room)
      return { placed: placeAll({ sizes, frame }), fits: true };
  }
  return { placed: placeAll({ sizes: measure(kept, 1), frame }), fits: false };
};

// Rows of known heights cut into pages that each fit the room; a row taller than the room gets one alone.
export const pagesOf = ({ heights, room }: { heights: readonly number[]; room: number }) => {
  const pages: number[][] = [];
  let used = Infinity;
  heights.forEach((height, index) => {
    const page = pages.at(-1);
    if (page && used + height <= room) {
      page.push(index);
      used += height;
      return;
    }
    pages.push([index]);
    used = height;
  });
  return pages;
};

// The boss's bar beside the HUD when it fits, else under it; banners always below the bar.
export type Zones = {
  readonly bar: {
    readonly name: number;
    readonly line: number;
    readonly bottom: number;
    readonly width: number;
  };
  readonly banner: number;
  readonly goOn: number;
};
const BAR = { width: 130, name: 10, line: 4 } as const;

export const zonesOf = ({
  width,
  height,
  hud,
}: {
  width: number;
  height: number;
  hud: { right: number; bottom: number };
}): Zones => {
  const barWidth = Math.min(BAR.width, width - 24);
  const beside = (width - barWidth) / 2 >= hud.right + 6;
  const name = beside ? 4 : hud.bottom + 4;
  const bottom = name + BAR.name + BAR.line + 4;
  const banner = Math.max(bottom + 6, Math.round(height * 0.24));
  return {
    bar: { name, line: name + BAR.name + 2, bottom, width: barWidth },
    banner,
    goOn: Math.max(banner + lineStep(3) + 4, Math.round(height * 0.45)),
  };
};
