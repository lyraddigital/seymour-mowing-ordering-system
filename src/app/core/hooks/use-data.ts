import { useContext } from "react";

import { DataFilteringContext } from "@/app/core/contexts";

export default function useData<T>() {
  const { data } = useContext(DataFilteringContext);

  return data as T[];
}



