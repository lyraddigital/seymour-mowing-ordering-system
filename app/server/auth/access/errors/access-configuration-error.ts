export class AccessConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessConfigurationError";
  }
}
