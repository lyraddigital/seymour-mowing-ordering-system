'use client';

import { PropsWithChildren, useState } from "react";

import { DataFilteringContext, DataPagingOptions } from "@/app/core/contexts";
import { useUpdateQueryString } from "@/app/core/hooks";
import { PagedData } from "@/app/core/types";

type DataFilteringProviderProps<T> = PropsWithChildren & {
  getPageDataRoute: string;
  initialData: T[];
  paging: DataPagingOptions;
  totalCount: number;
};

export default function DataFilteringProvider<T>({ children, getPageDataRoute, initialData, paging, totalCount }: DataFilteringProviderProps<T>) {
  const updateQueryString = useUpdateQueryString();
  const [pageNumber, setPageNumber] = useState<number>(paging.pageNumber);
  const [pageSize, setPageSize] = useState<number>(paging.pageSize);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [data, setData] = useState<T[]>(initialData);
  const [count, setCount] = useState<number>(totalCount);
  const defaultPaging: DataPagingOptions = { pageNumber, pageSize };

  const fetchNewData = async(newPageNumber: number, newPageSize: number) => {
    setIsDataLoading(true);

    const response = await fetch(`${getPageDataRoute}?pageNumber=${newPageNumber}&pageSize=${newPageSize}`);
    const result = await response.json() as PagedData<T>;

    setData(result.items);
    setCount(result.totalCount);
    setIsDataLoading(false);
  }

  const updatePageNumber = async (newPageNumber: number) => {
    updateQueryString('pageNumber', newPageNumber);
    setPageNumber(newPageNumber);

    await fetchNewData(newPageNumber, pageSize);
  }

  const updatePageSize = async (newPageSize: number) => {    
    updateQueryString('pageSize', newPageSize);
    updateQueryString('pageNumber', 1);

    setPageSize(newPageSize);
    setPageNumber(1);
    
    await fetchNewData(1, newPageSize);
  }

  return (
    <DataFilteringContext.Provider value={{
      paging: defaultPaging,
      setPageNumber: updatePageNumber,
      setPageSize: updatePageSize,
      isDataLoading,
      totalCount: count,
      data: initialData
    }}>
      {children}
    </DataFilteringContext.Provider>
  );
}
