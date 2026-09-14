export class UserNotProvisionedError extends Error {
  constructor() {
    super("No internal Seymour user matches the authenticated identity.");
    this.name = "UserNotProvisionedError";
  }
}
