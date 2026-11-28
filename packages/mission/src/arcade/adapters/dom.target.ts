// An event's target is any EventTarget: only an element can be asked what it sits in.
export const closestTo = ({
  target,
  selector,
}: {
  target: EventTarget | null;
  selector: string;
}) => (target instanceof Element ? target.closest(selector) : null);
