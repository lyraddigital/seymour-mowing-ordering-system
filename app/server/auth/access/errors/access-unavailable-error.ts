export class AccessUnavailableError extends Error {
  constructor() {
    super("Cloudflare Access verification is temporarily unavailable.");
    this.name = "AccessUnavailableError";
  }
}
