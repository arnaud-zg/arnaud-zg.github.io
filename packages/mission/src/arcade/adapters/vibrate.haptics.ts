// The phone's buzzer, if any (none on iPhones); silent when muted or motion is reduced.
export const hapticsOf = ({ allowed }: { allowed: () => boolean }) => ({
  buzz: (pattern: readonly number[]) => {
    if (!allowed() || typeof navigator.vibrate !== "function") return;
    navigator.vibrate([...pattern]);
  },
});
