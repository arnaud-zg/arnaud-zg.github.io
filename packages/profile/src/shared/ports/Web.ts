export interface Web {
  text(url: string): Promise<string>;
  // Unknown on purpose: each adapter parses what it reads.
  json(url: string): Promise<unknown>;
}
