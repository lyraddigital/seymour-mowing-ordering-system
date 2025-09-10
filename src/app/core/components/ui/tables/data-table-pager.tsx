import { TablePagination } from "@mui/material";
import { useState } from "react";

import { PagedData } from "@/app/core/types";

type DataTablePagerProps<T> = {
  getPageDataRoute: string;
  pageSize: number;
  totalCount: number;
  setData: (items: T[]) => void;
  setIsLoading: (isLoading: boolean) => void;
};

export default function DataTablePager<T>({ getPageDataRoute, pageSize, totalCount, setData, setIsLoading }: DataTablePagerProps<T>) {  
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(pageSize);
  const [count, setCount] = useState<number>(totalCount);

  const updatePagedData = async (newPageNumber: number, newRowsPerPage: number): Promise<void> => {
    setIsLoading(true);

    const response = await fetch(`${getPageDataRoute}?pageNumber=${newPageNumber}&pageSize=${newRowsPerPage}`);
    const result = await response.json() as PagedData<T>;

    setData(result.items);
    setPageNumber(newPageNumber);
    setRowsPerPage(newRowsPerPage);
    setCount(result.totalCount);
    setIsLoading(false);
  };

  const handlePageChange = async (_: React.MouseEvent | null, newPageNumber: number) => {
    await updatePagedData(newPageNumber + 1, rowsPerPage);
  };

  const handleRowsPerPageChange = async (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): Promise<void> => {
    const newRowsPerPage = Number(event.target.value);

    await updatePagedData(1, newRowsPerPage);    
  };

  return (
    <TablePagination 
      color="orange"
      component="div"
      count={count}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      page={pageNumber - 1}
      rowsPerPage={rowsPerPage}
    />
  );
}
