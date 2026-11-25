import type { Status } from "../domain/consent.ts";

export type StatusListener = (status: Status) => void;

export class StatusListeners {
  readonly #listeners: StatusListener[] = [];

  add(listener: StatusListener): void {
    this.#listeners.push(listener);
  }

  tell(status: Status): void {
    for (const listener of this.#listeners) listener(status);
  }
}
