import { createContext } from "react-router";

import type { AccessIdentity } from "../access/types/access-identity";

export const accessIdentityContext = createContext<AccessIdentity>();
