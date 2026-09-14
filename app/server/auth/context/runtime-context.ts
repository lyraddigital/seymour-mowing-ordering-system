import { createContext } from "react-router";

export const runtimeContext = createContext<{
  env: Env;
  ctx: ExecutionContext;
}>();
