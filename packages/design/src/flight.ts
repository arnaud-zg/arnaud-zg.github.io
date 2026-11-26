// An easter egg: press a name marked `data-egg="🎟️"` and its emoji flies to it, in a small arc,
// from the element marked `data-egg-from` in its `data-egg-row`, or else from the row's far end.
// A row marked `data-egg-row="perch"` has room above the name: the emoji lands on top of it.
// Transform and opacity only, on an absolutely placed layer: nothing else moves.

const still = matchMedia("(prefers-reduced-motion: reduce)");
const live = new WeakMap<HTMLElement, HTMLElement>();
const LAND = 300;

const span = (className: string, parent: HTMLElement) => {
  const el = document.createElement("span");
  el.className = className;
  parent.append(el);
  return el;
};

// Three layers so each moves on its own curve: across, up and down, then the glyph itself.
const layer = (layerHost: HTMLElement, emoji: string) => {
  const across = span("cv-fly", layerHost);
  across.setAttribute("aria-hidden", "true");
  const arc = span("cv-fly-arc", across);
  const glyph = span("cv-fly-glyph", arc);
  glyph.textContent = emoji;
  return { across, arc, glyph };
};

const fly = (trigger: HTMLElement) => {
  const row = trigger.closest<HTMLElement>("[data-egg-row]");
  const emoji = trigger.dataset.egg;
  if (!row || !emoji) return;
  live.get(row)?.remove();

  const host = span("cv-fly-host", row);
  host.setAttribute("aria-hidden", "true");
  live.set(row, host);

  const box = row.getBoundingClientRect();
  const name = trigger.getBoundingClientRect();
  const from = row.querySelector<HTMLElement>("[data-egg-from]")?.getBoundingClientRect();
  const main = layer(host, emoji);
  const half = main.glyph.offsetWidth / 2;
  const tall = main.glyph.offsetHeight;
  const perch = row.dataset.eggRow === "perch";
  const y = name.top + name.height / 2 - box.top - tall / 2;
  const endY = perch ? name.top - box.top - tall + 6 : y;
  const endX = perch ? name.right - box.left - half * 1.4 : name.right - box.left + 6;
  const startX = from
    ? from.left + from.width / 2 - box.left - half
    : box.width - parseFloat(getComputedStyle(row).paddingRight) - half * 2;
  const distance = Math.max(startX - endX, 0);

  // Cleans up once landed, unless a newer tap has already replaced this flight.
  const done = (anims: Animation[]) => {
    void Promise.all(anims.map((a) => a.finished))
      .then(() => {
        if (live.get(row) !== host) return;
        host.remove();
        live.delete(row);
      })
      .catch(() => {});
  };

  if (still.matches || distance < 8) {
    // No flight: the emoji shows up beside the name, then fades.
    main.across.style.transform = `translate(${endX}px, ${endY}px)`;
    done([
      main.glyph.animate(
        [
          { opacity: 0, transform: "scale(0.85)" },
          { opacity: 1, transform: "scale(1)", offset: 0.25 },
          { opacity: 1, transform: "scale(1)", offset: 0.7 },
          { opacity: 0, transform: "scale(1)" },
        ],
        { duration: 700, easing: "ease-out", fill: "both" },
      ),
    ]);
    return;
  }

  const time = Math.round(Math.min(Math.max(360 + distance * 0.45, 460), 720));
  // Higher for a longer flight, but the arc stays within the row.
  const lift = Math.max(Math.min(8 + distance * 0.08, 28, (y + endY) / 2), 8);
  const flight = (part: ReturnType<typeof layer>, delay: number, ghost: number) => [
    part.across.animate(
      [
        { transform: `translate(${startX}px, ${y}px)` },
        { transform: `translate(${endX}px, ${endY}px)` },
      ],
      { duration: time, delay, easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "both" },
    ),
    // Nose up on the climb, down on the descent.
    part.arc.animate(
      [
        { transform: "translateY(0) rotate(0deg)", easing: "cubic-bezier(0.3, 0.6, 0.5, 1)" },
        {
          transform: `translateY(${-lift}px) rotate(14deg)`,
          offset: 0.45,
          easing: "cubic-bezier(0.5, 0, 0.7, 0.4)",
        },
        { transform: "translateY(0) rotate(-8deg)", offset: 0.92 },
        { transform: "translateY(0) rotate(0deg)" },
      ],
      { duration: time, delay, fill: "both" },
    ),
    ghost
      ? part.glyph.animate(
          [
            { opacity: 0, transform: "scale(0.6)" },
            { opacity: ghost, transform: "scale(0.85)", offset: 0.2 },
            { opacity: 0, transform: "scale(0.7)" },
          ],
          { duration: time, delay, fill: "both" },
        )
      : part.glyph.animate(
          [
            { opacity: 0, transform: "scale(0.5)" },
            { opacity: 1, transform: "scale(1.05)", offset: 0.15 },
            { opacity: 1, transform: "scale(1)", offset: time / (time + LAND + 260) },
            // Lands: squashes, springs back, then fades where it stopped.
            {
              opacity: 1,
              transform: "scale(1.25, 0.78)",
              offset: (time + 90) / (time + LAND + 260),
            },
            {
              opacity: 1,
              transform: "scale(0.92, 1.1)",
              offset: (time + 190) / (time + LAND + 260),
            },
            { opacity: 1, transform: "scale(1)", offset: (time + LAND) / (time + LAND + 260) },
            { opacity: 0, transform: "scale(1) translateY(-4px)" },
          ],
          { duration: time + LAND + 260, delay, easing: "linear", fill: "both" },
        ),
  ];

  // A short trail: two fainter copies a beat behind, gone before the landing.
  const trail = [0.35, 0.15].flatMap((ghost, i) => flight(layer(host, emoji), (i + 1) * 45, ghost));
  host.append(main.across); // the real one flies on top of its trail
  done([...flight(main, 0, 0), ...trail]);
};

document.addEventListener("click", (event) => {
  const { target } = event;
  const trigger = target instanceof Element ? target.closest<HTMLElement>("[data-egg]") : null;
  if (trigger) fly(trigger);
});
