import { useState } from "react";

import { DataTablePageResult } from "@/app/core/types";

type DataTablePagerProps<T> = {
  initialLastEvaluatedKey?: Record<string, unknown>;
  getPageDataRoute: string;
  pageSize: number;
  setData: (items: T[]) => void;
};

export default function DataTablePager<T>({ initialLastEvaluatedKey, getPageDataRoute, pageSize, setData }: DataTablePagerProps<T>) {
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<Record<string, unknown> | undefined>(initialLastEvaluatedKey);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prevKeys, setPrevKeys] = useState<Record<string, unknown>[]>([]);

  const getPagedData = async (key: unknown): Promise<DataTablePageResult<T>> => {
    const res = await fetch(`${getPageDataRoute}?pageSize=${pageSize}&key=${encodeURIComponent(JSON.stringify(key))}`);
    return await res.json() as DataTablePageResult<T>;
  };

  const handleNext = async () => {
    if (!lastEvaluatedKey) return;

    setIsLoading(true);
    const result = await getPagedData(lastEvaluatedKey);

    setData(result.items);
    setPrevKeys([...prevKeys, lastEvaluatedKey]);
    setLastEvaluatedKey(result.lastEvaluatedKey);
    setIsLoading(false);
  };

  const handlePrev = async () => {
    if (prevKeys.length === 0) return;
    
    setIsLoading(true);

    const prev = [...prevKeys];
    const key = prev.pop();    

    const result = await getPagedData(key);

    setData(result.items);
    setPrevKeys(prev);
    setLastEvaluatedKey(result.lastEvaluatedKey);
    setIsLoading(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
      {prevKeys.length > 0 && <button onClick={handlePrev} disabled={isLoading}>Previous</button>}
      {lastEvaluatedKey && <button onClick={handleNext} disabled={isLoading}>Next</button>}
    </div>
  );
}
