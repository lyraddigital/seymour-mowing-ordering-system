import { useContext } from "react";

import { DataFilteringContext, DataFilteringOptions } from "@/app/core/contexts";

export default function useDataPaging() {
  const { paging, setPageNumber, setPageSize } = useContext(DataFilteringContext);

  return { ...paging, setPageNumber, setPageSize };
}