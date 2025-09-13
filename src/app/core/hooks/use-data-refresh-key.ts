import { useContext } from "react";

import { DataRefreshContext } from "@/app/core/contexts";

export default function useDataRefreshKey(): number | undefined {
  const dataRefresh = useContext(DataRefreshContext);
  return dataRefresh?.refreshKey;
}
