import type { Props } from "../domain/plan.ts";
import { destinationOf, deviceOf, sourceOf } from "../domain/plan.ts";

// Turns what the visitor does on the page into planned events. Reads the page as it is: sections by
// id, links by address. Runs only between a yes and a no.

type Track = (name: string, props: Props) => void;
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};
const sectionOf = (el: Element) => el.closest("section[id], footer[id]")?.id ?? "hero";

export const watchVisitor = (track: Track): (() => void) => {
  const life = new AbortController();
  const on = { signal: life.signal };

  track("page_viewed", {
    source: sourceOf(hostOf(document.referrer), location.hostname),
    device: deviceOf(innerWidth),
  });

  // Reading time: the sections across the middle of the screen, while the tab is in front.
  const since = new Map<string, number>(),
    total = new Map<string, number>();
  const pause = (id: string) => {
    const from = since.get(id);
    if (from !== undefined) total.set(id, (total.get(id) ?? 0) + performance.now() - from);
    since.delete(id);
  };
  const inView = new Set<string>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const {
        target: { id },
        isIntersecting,
      } of entries) {
        if (isIntersecting) {
          inView.add(id);
          if (!document.hidden) since.set(id, performance.now());
        } else {
          inView.delete(id);
          pause(id);
        }
      }
    },
    { rootMargin: "-45% 0px -54% 0px" },
  );
  document.querySelectorAll("main section[id], main footer[id]").forEach((el) => io.observe(el));
  const report = () => {
    for (const id of [...since.keys()]) pause(id);
    for (const [section, ms] of total) {
      // A section scrolled past was not read.
      if (ms >= 2000)
        track("section_read", { section, seconds: Math.min(3600, Math.round(ms / 1000)) });
    }
    total.clear();
  };
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) report();
      else for (const id of inView) since.set(id, performance.now());
    },
    on,
  );
  addEventListener("pagehide", report, on);

  // Without a name of its own, what was explored is its section.
  const explored = (el: Element, action: string, item = sectionOf(el)) =>
    track("content_explored", { section: sectionOf(el), action, item });
  const click = (e: MouseEvent) => {
    const el = e.target instanceof Element ? e.target : undefined;
    if (!el || e.button === 2) return;
    const link = el.closest<HTMLAnchorElement>("a[href]");
    if (link && /^https?:$/.test(link.protocol) && link.origin !== location.origin) {
      track("link_followed", {
        section: sectionOf(link),
        ...destinationOf(link.hostname, link.pathname),
      });
    }
    if (e.button !== 0) return;
    const tool = el
      .closest<HTMLElement>("button[aria-expanded='true']")
      ?.closest<HTMLElement>("[data-tool]")?.dataset.tool;
    if (tool) explored(el, "open-tool", tool);
    const copy = el.closest("[data-copy]");
    if (copy) explored(copy, "copy-command");
    // Only in a section: the privacy dialog is not content.
    const opener = el.closest("section[id] [data-open-dialog]");
    if (opener) explored(opener, "open-details");
  };
  document.addEventListener("click", click, on);
  document.addEventListener("auxclick", click, on);
  // `toggle` does not bubble; capture sees it.
  document.addEventListener(
    "toggle",
    (e) => {
      if (e.target instanceof HTMLDetailsElement && e.target.open)
        explored(e.target, "open-details");
    },
    { ...on, capture: true },
  );

  return () => {
    life.abort();
    io.disconnect();
  };
};
