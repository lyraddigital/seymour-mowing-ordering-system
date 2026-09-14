export class AccessAuthenticationError extends Error {
  constructor() {
    super("A valid Cloudflare Access assertion is required.");
    this.name = "AccessAuthenticationError";
  }
}
