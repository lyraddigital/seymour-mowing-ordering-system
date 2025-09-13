import { createContext } from "react";

export type DataRefresh = {
  refreshKey: number;
  triggerRefresh: () => void;
}

const DataRefreshContext = createContext<DataRefresh | undefined>(undefined);

export default DataRefreshContext;