import { createContext } from "react";

export type DataRefresh = {
  refreshKey: number;
  triggerRefresh: () => void;
}

const DataRefreshContext = createContext<DataRefresh>({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export default DataRefreshContext;