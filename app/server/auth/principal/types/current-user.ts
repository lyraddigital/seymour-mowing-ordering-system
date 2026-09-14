import type { UserRole } from "../../authorization/types/user-role";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};
