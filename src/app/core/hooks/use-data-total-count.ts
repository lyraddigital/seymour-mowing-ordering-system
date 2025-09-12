import { useContext } from "react";

import { DataFilteringContext } from "@/app/core/contexts";

export default function useDataTotalCount() {
  const { totalCount } = useContext(DataFilteringContext);

  return totalCount;
}

