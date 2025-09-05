import { useContext } from "react";

import { DataRefreshContext, DataRefresh } from "@/app/core/contexts";

export default function useDataRefresh(): DataRefresh {
  return useContext(DataRefreshContext);
}
