export class UserInactiveError extends Error {
  constructor() {
    super("The internal Seymour user is inactive.");
    this.name = "UserInactiveError";
  }
}
