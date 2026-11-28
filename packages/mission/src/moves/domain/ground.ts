// A turned phone moves the ground line: what stood on it moves too, never left buried.
export const followGround = ({ height, from, to }: { height: number; from: number; to: number }) =>
  height + to - from;

// A foe of a locked wave stays where the hero can reach it.
export const keptInLock = ({
  x,
  width,
  left,
  right,
}: {
  x: number;
  width: number;
  left: number;
  right: number;
}) => Math.max(left, Math.min(right - width, x));

// How long a foe of a locked wave may stay out of reach before the wave brings it back.
export const STRANDED = 2.5;
