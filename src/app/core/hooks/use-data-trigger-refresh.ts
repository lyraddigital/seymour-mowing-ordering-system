import { useContext } from "react";

import { DataRefreshContext } from "@/app/core/contexts";

export default function useDataTriggerRefresh(): (() => void) | undefined {
  const dataRefresh = useContext(DataRefreshContext);
  return dataRefresh?.triggerRefresh;
}
