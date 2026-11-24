import type { Choice, Status } from "../domain/consent.ts";
import type { Props } from "../domain/plan.ts";
import type { AnalyticsProvider } from "../ports/AnalyticsProvider.ts";
import type { ConsentStore } from "../ports/ConsentStore.ts";
import type { PrivacySignal } from "../ports/PrivacySignal.ts";
import { choose, statusOf } from "../domain/consent.ts";
import { toEvent } from "../domain/plan.ts";

export type Needs = {
  store: ConsentStore;
  signal: PrivacySignal;
  now: () => number;
  // Called on a yes only, so the provider's code is not even downloaded before.
  provider: () => Promise<AnalyticsProvider>;
};

type Session = { running: Promise<AnalyticsProvider | undefined>; over: boolean };

export const createAnalytics = ({ store, signal, now, provider }: Needs) => {
  let status: Status = "unasked";
  // A new session on each yes. A provider that finishes loading after a no finds its session over.
  let session: Session | undefined;
  const listeners: ((status: Status) => void)[] = [];
  // A provider that fails never breaks the page.
  const quietly = (act: () => void) => {
    try {
      act();
    } catch {
      /* analytics is never worth an error */
    }
  };

  const follow = () => {
    const next = statusOf(store.read(), now(), signal.objects());
    if (next === "granted" && !session) {
      const mine: Session = { running: Promise.resolve(undefined), over: false };
      session = mine;
      mine.running = provider()
        .then((p) => {
          if (mine.over) return;
          quietly(() => p.start());
          return p;
        })
        .catch(() => undefined);
    }
    if (next !== "granted" && session) {
      const old = session;
      session = undefined;
      old.over = true;
      void old.running.then((p) => quietly(() => p?.stop()));
    }
    const changed = next !== status;
    status = next;
    if (changed) for (const l of listeners) l(status);
  };

  return {
    start() {
      store.onChange(follow);
      follow();
    },
    status: () => status,
    choose(choice: Choice) {
      store.write(choose(choice, now()));
      follow();
    },
    // Called at once with the current status, then on every change.
    onStatus(listener: (status: Status) => void) {
      listeners.push(listener);
      listener(status);
    },
    track(name: string, props: Props) {
      const event = toEvent(name, props),
        mine = session;
      if (event && mine)
        void mine.running.then((p) => {
          if (!mine.over) quietly(() => p?.track(event));
        });
    },
  };
};
export type Analytics = ReturnType<typeof createAnalytics>;
