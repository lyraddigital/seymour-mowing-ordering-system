import { createContext } from "react-router";

import type { CurrentUser } from "../principal/types/current-user";

export const currentUserContext = createContext<CurrentUser>();
