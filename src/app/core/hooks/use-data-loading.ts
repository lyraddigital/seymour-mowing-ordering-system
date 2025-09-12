import { useContext } from "react";

import { DataFilteringContext } from "@/app/core/contexts";

export default function useDataLoading() {
  const { isDataLoading } = useContext(DataFilteringContext);

  return isDataLoading;
}

