export interface Web {
  text(url: string): Promise<string>;
  // Unknown on purpose: each adapter parses what it reads. With a body, the address is posted to.
  json(url: string, body?: Readonly<Record<string, string>>): Promise<unknown>;
}
