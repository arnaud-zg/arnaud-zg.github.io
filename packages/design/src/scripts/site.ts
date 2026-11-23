// Behaviour shared by every page. Each block does nothing when its element is absent.

// Pause looping star twinkles when their sky is off screen.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) e.target.classList.toggle("is-offscreen", !e.isIntersecting);
});
document.querySelectorAll("[data-loop]").forEach((el) => io.observe(el));

// Day and night: remember the choice and follow the system until one is made.
const root = document.documentElement;
const switches = document.querySelectorAll<HTMLButtonElement>("[data-theme-switch]");
const paint = () => {
  const night = root.dataset.theme === "night";
  for (const sw of switches) {
    // The label names the action, so there is no pressed state on top of it.
    sw.setAttribute("aria-label", night ? "Switch to day" : "Switch to night");
  }
};
const apply = (theme: string) => { root.dataset.theme = theme; paint(); };
paint();
switches.forEach((sw) => sw.addEventListener("click", () => {
  const next = root.dataset.theme === "night" ? "day" : "night";
  localStorage.setItem("theme", next);
  apply(next);
}));
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) apply(e.matches ? "night" : "day");
});

// The theme may have changed on another page or site, in another tab or before going back.
const sync = () => { const t = localStorage.getItem("theme"); if (t && t !== root.dataset.theme) apply(t); };
addEventListener("storage", sync);
addEventListener("pageshow", sync);

// Menu: a link to a section of this page closes it.
const menu = document.querySelector<HTMLElement>("#site-menu");
menu?.querySelectorAll("[data-menu-link]").forEach((a) => a.addEventListener("click", () => menu.hidePopover()));

// Header: once the hero is behind us, switch it to the frosted bar.
const head = document.querySelector<HTMLElement>(".masthead");
const hero = document.querySelector<HTMLElement>(".hero");
if (head && hero && !("solid" in head.dataset)) {
  new IntersectionObserver(([e]) => head.classList.toggle("is-scrolled", !e.isIntersecting), { rootMargin: "-72px 0px 0px 0px" }).observe(hero);
}

// Dialogs: open from their button, close on the close button or a click outside.
document.querySelectorAll<HTMLButtonElement>("[data-open-dialog]").forEach((btn) => {
  const dialog = document.getElementById(btn.dataset.openDialog!) as HTMLDialogElement | null;
  if (!dialog) return;
  btn.addEventListener("click", () => dialog.showModal());
  dialog.querySelector("[data-close-dialog]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
});

// A soft lantern light follows the pointer through the night sections.
const lantern = document.querySelector<HTMLElement>(".lantern");
if (lantern && matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let x = 0, y = 0, raf = 0;
  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => { lantern.style.translate = `${x}px ${y}px`; lantern.classList.add("is-on"); raf = 0; });
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => lantern.classList.remove("is-on"));
}

// Count the numbers up once, when they first come into view.
// The real number is in the HTML, so nothing is lost without JS or with reduced motion.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const counter = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      counter.unobserve(e.target);
      const el = e.target as HTMLElement, to = Number(el.dataset.count), start = performance.now(), ms = 1400;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        const v = Math.round(to * (1 - Math.pow(1 - t, 4)));
        el.textContent = "compact" in el.dataset && v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(v);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => counter.observe(el));
}

// Copy buttons next to a command.
document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.parentElement?.querySelector("[data-copy-text]")?.textContent ?? "");
      btn.textContent = "Copied";
    } catch {
      btn.textContent = "Not copied";
    }
    setTimeout(() => (btn.textContent = "Copy"), 1600);
  });
});

export {};
