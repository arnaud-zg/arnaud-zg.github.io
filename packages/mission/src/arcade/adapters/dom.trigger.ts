import type { CodeKey } from "../../input/domain/code.ts";
import type { MissionData } from "../domain/mission.ts";
import { keyOf, pushCode, swipeOf } from "../../input/domain/code.ts";

// Waits for the Konami code, typed or swiped (see code.ts), or a press on [data-mission-start],
// then loads the mission. Until then this listener is all the page carries of it.

const source = document.querySelector<HTMLScriptElement>("script[data-mission]");
if (source) {
  let history: CodeKey[] = [];
  let loading = false;
  const launch = async () => {
    if (loading) return;
    loading = true;
    try {
      const data = JSON.parse(source.textContent) as MissionData;
      const { start } = await import("./canvas.game.ts");
      start(data);
    } finally {
      loading = false;
    }
  };
  const push = (key: CodeKey | undefined) => {
    if (!key) return;
    const next = pushCode(history, key);
    history = next.history;
    if (next.done) void launch();
  };
  addEventListener("keydown", (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.target as Element | null)?.closest("input, textarea, select, [contenteditable]")) return;
    push(keyOf(e.key));
  });
  let from: { x: number; y: number } | undefined;
  addEventListener(
    "touchstart",
    (e) => {
      const p = e.changedTouches.item(0);
      from = e.touches.length === 1 && p ? { x: p.clientX, y: p.clientY } : undefined;
    },
    { passive: true },
  );
  addEventListener(
    "touchend",
    (e) => {
      const p = e.changedTouches.item(0);
      if (from && p && !e.touches.length) push(swipeOf(p.clientX - from.x, p.clientY - from.y));
      from = undefined;
    },
    { passive: true },
  );
  document.addEventListener("click", (e) => {
    if ((e.target as Element | null)?.closest("[data-mission-start]")) void launch();
  });
}
