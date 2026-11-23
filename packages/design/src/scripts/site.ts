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
  const night = root.dataset.theme === "dark";
  for (const sw of switches) {
    // The label names the action, so there is no pressed state on top of it.
    sw.setAttribute("aria-label", night ? "Switch to day" : "Switch to night");
  }
};
const apply = (theme: string) => { root.dataset.theme = theme; paint(); };
paint();
const still = matchMedia("(prefers-reduced-motion: reduce)");
// The new sky spreads from the switch; without view transitions the page just changes.
let skies = 0;
const spread = (from: HTMLElement, theme: string) => {
  if (still.matches || !document.startViewTransition) return apply(theme);
  const r = from.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  root.style.setProperty("--sky-x", `${x}px`);
  root.style.setProperty("--sky-y", `${y}px`);
  root.style.setProperty("--sky-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
  root.classList.add("theming");
  const mine = ++skies;
  const done = () => { if (mine === skies) root.classList.remove("theming"); };
  const change = document.startViewTransition(() => apply(theme));
  change.ready.catch(() => {});
  change.finished.then(done, done);
};
switches.forEach((sw) => sw.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  spread(sw, next);
}));
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) apply(e.matches ? "dark" : "light");
});

// The theme may have changed on another page or site, in another tab or before going back.
const sync = () => { const t = localStorage.getItem("theme"); if (t && t !== root.dataset.theme) apply(t); };
addEventListener("storage", sync);
addEventListener("pageshow", sync);

// Closing: fade first, then close. Done here rather than in CSS because only Chrome keeps a closing
// dialog or popover on screen while it fades.
const leave = (el: HTMLElement, close: () => void) => {
  if (el.classList.contains("is-leaving")) return;
  if (still.matches) return close();
  el.classList.add("is-leaving");
  setTimeout(() => { close(); el.classList.remove("is-leaving"); }, 220);
};

// Menu: the button toggles it; a link, a click outside or Escape closes it.
const menu = document.querySelector<HTMLElement>("#site-menu");
const menuButton = document.querySelector<HTMLButtonElement>("[popovertarget='site-menu']");
if (menu && menuButton) {
  // Without this script the browser's own popover behaviour still works.
  menu.popover = "manual";
  menuButton.removeAttribute("popovertarget");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-controls", menu.id);
  const isOpen = () => menu.matches(":popover-open");
  const hide = () => {
    if (!isOpen()) return;
    menuButton.setAttribute("aria-expanded", "false");
    leave(menu, () => menu.hidePopover());
  };
  menuButton.addEventListener("click", () => {
    if (isOpen()) return hide();
    menu.showPopover();
    menuButton.setAttribute("aria-expanded", "true");
  });
  menu.querySelectorAll("[data-menu-link]").forEach((a) => a.addEventListener("click", hide));
  document.addEventListener("click", (e) => { const t = e.target as Node; if (!menu.contains(t) && !menuButton.contains(t)) hide(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { hide(); menuButton.focus(); } });
  // Widening past the phone layout leaves no button to close it with.
  matchMedia("(min-width: 961px)").addEventListener("change", (e) => { if (e.matches && isOpen()) menu.hidePopover(); });
}

// Expandable rows: browsers that cannot animate to an automatic height in CSS get it here.
if (!CSS.supports("interpolate-size", "allow-keywords")) {
  document.querySelectorAll<HTMLDetailsElement>("main details").forEach((row) => {
    const summary = row.querySelector("summary");
    let running: Animation | undefined;
    summary?.addEventListener("click", (e) => {
      if (still.matches) return;
      e.preventDefault();
      const opening = !row.open || row.dataset.closing !== undefined;
      const from = row.offsetHeight;
      running?.cancel();
      delete row.dataset.closing;
      if (opening) row.open = true;
      else row.dataset.closing = "";
      const to = opening ? row.offsetHeight : summary.offsetHeight + parseFloat(getComputedStyle(row).paddingTop);
      row.style.overflow = "clip";
      running = row.animate({ height: [`${from}px`, `${to}px`] }, { duration: 420, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
      running.onfinish = () => {
        if (!opening) row.open = false;
        delete row.dataset.closing;
        row.style.overflow = "";
      };
    });
  });
}

// Header: once the hero is behind us, switch it to the frosted bar.
const head = document.querySelector<HTMLElement>(".masthead");
const hero = document.querySelector<HTMLElement>(".hero");
if (head && hero && !("solid" in head.dataset)) {
  new IntersectionObserver(([e]) => head.classList.toggle("is-scrolled", !e.isIntersecting), { rootMargin: "-72px 0px 0px 0px" }).observe(hero);
}

// Header: mark the section in the middle of the screen.
const links = [...document.querySelectorAll<HTMLAnchorElement>(".nav-wide a")].filter((a) => a.hash && a.pathname === location.pathname);
const spy = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const link = links.find((a) => a.hash === `#${e.target.id}`);
    if (e.isIntersecting) link?.setAttribute("aria-current", "true");
    else link?.removeAttribute("aria-current");
  }
}, { rootMargin: "-45% 0px -54% 0px" });
for (const a of links) {
  const section = document.getElementById(a.hash.slice(1));
  if (section) spy.observe(section);
}

// Dialogs: open from their button, close on the close button, Escape or a click outside.
document.querySelectorAll<HTMLButtonElement>("[data-open-dialog]").forEach((btn) => {
  const dialog = document.getElementById(btn.dataset.openDialog!) as HTMLDialogElement | null;
  if (!dialog) return;
  btn.addEventListener("click", () => dialog.showModal());
  if (dialog.dataset.ready !== undefined) return;
  dialog.dataset.ready = "";
  const close = () => leave(dialog, () => dialog.close());
  dialog.querySelector("[data-close-dialog]")?.addEventListener("click", close);
  dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
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
      btn.classList.add("is-done");
    } catch {
      btn.textContent = "Not copied";
    }
    setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("is-done"); }, 1600);
  });
});

export {};
