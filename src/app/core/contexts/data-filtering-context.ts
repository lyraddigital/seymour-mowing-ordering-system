import { createContext } from "react";

export type DataPagingOptions = {
    pageNumber: number;
    pageSize: number;
}

export type DataFilteringOptions = {
  paging: DataPagingOptions;
  setPageNumber: (pageNumber: number) => void;
  setPageSize: (pageSize: number) => void;
  isDataLoading: boolean;
  totalCount: number;
  data: unknown[];
}

const DataFilteringContext = createContext<DataFilteringOptions>({} as DataFilteringOptions);

export default DataFilteringContext;