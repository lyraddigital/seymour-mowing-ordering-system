'use client';

import { PropsWithChildren, useCallback, useEffect, useState } from "react";

import { DataFilteringContext, DataPagingOptions } from "@/app/core/contexts";
import { useDataRefreshKey, useUpdateQueryString } from "@/app/core/hooks";
import { PagedData } from "@/app/core/types";

type DataFilteringProviderProps<T> = PropsWithChildren & {
  getPageDataRoute: string;
  initialData: T[];
  paging: DataPagingOptions;
  totalCount: number;
};

export default function DataFilteringProvider<T>({ children, getPageDataRoute, initialData, paging, totalCount }: DataFilteringProviderProps<T>) {
  const updateQueryString = useUpdateQueryString();
  const refreshKey = useDataRefreshKey();
  const [pageNumber, setPageNumber] = useState<number>(paging.pageNumber);
  const [pageSize, setPageSize] = useState<number>(paging.pageSize);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [data, setData] = useState<T[]>(initialData);
  const [count, setCount] = useState<number>(totalCount);
  const defaultPaging: DataPagingOptions = { pageNumber, pageSize };

  const fetchNewData = useCallback(async (newPageNumber: number, newPageSize: number) => {
    setIsDataLoading(true);

    const response = await fetch(`${getPageDataRoute}?pageNumber=${newPageNumber}&pageSize=${newPageSize}`);
    const result = await response.json() as PagedData<T>;

    setData(result.items);
    setCount(result.totalCount);
    setIsDataLoading(false);
  }, [setIsDataLoading, setData, setCount, getPageDataRoute]);

  const updatePageNumber = useCallback(async (newPageNumber: number) => {
    updateQueryString({ key: 'pageNumber', value: newPageNumber });
    setPageNumber(newPageNumber);

    await fetchNewData(newPageNumber, pageSize);
  }, [updateQueryString, setPageNumber, fetchNewData, pageSize]);

  const updatePageSize = useCallback(async (newPageSize: number) => {
    updateQueryString(
      { key: 'pageSize', value: newPageSize },
      { key: 'pageNumber', value: 1 }
    );

    setPageSize(newPageSize);
    setPageNumber(1);
    
    await fetchNewData(1, newPageSize);
  }, [updateQueryString, setPageSize, setPageNumber, fetchNewData]);

  useEffect(() => {
    if (refreshKey) {
      (async () => {        
        await updatePageNumber(1);
      })();
    }    
  }, [refreshKey, updatePageNumber]);

  return (
    <DataFilteringContext.Provider value={{
      paging: defaultPaging,
      setPageNumber: updatePageNumber,
      setPageSize: updatePageSize,
      isDataLoading,
      totalCount: count,
      data
    }}>
      {children}
    </DataFilteringContext.Provider>
  );
}
