export class PermissionDeniedError extends Error {
  constructor() {
    super("Permission denied.");
    this.name = "PermissionDeniedError";
  }
}
