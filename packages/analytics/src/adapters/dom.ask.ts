// The question and the privacy dialog, found by their data attributes. They know nothing of providers.
import type { Analytics } from "../application/analytics.ts";

export const bindAsk = (analytics: Analytics) => {
  const ask = document.querySelector<HTMLElement>("[data-analytics-ask]");
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-analytics-choice]");
  buttons.forEach((b) =>
    b.addEventListener("click", () =>
      analytics.choose(b.dataset.analyticsChoice === "granted" ? "granted" : "refused"),
    ),
  );

  // Asked once the visitor is past the first screen, so it never greets anyone.
  let engaged = false;
  const show = () => {
    if (ask) ask.hidden = !(engaged && analytics.status() === "unasked");
  };
  const past = () => {
    if (scrollY < innerHeight * 0.8) return;
    removeEventListener("scroll", past);
    engaged = true;
    show();
  };
  addEventListener("scroll", past, { passive: true });
  past();

  analytics.onStatus((status) => {
    show();
    // Only where the choice stays on show; the question itself suggests no answer.
    buttons.forEach((b) => {
      if (b.hasAttribute("aria-pressed"))
        b.setAttribute("aria-pressed", String(b.dataset.analyticsChoice === status));
    });
  });
};
