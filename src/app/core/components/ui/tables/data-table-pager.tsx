import { TablePagination } from "@mui/material";

import { useDataPaging, useDataTotalCount } from "@/app/core/hooks";

export default function DataTablePager() {
  const { pageNumber, pageSize, setPageNumber, setPageSize } = useDataPaging();
  const totalCount = useDataTotalCount();

  const handlePageChange = async (_: React.MouseEvent | null, newPageNumber: number) => {
    setPageNumber(newPageNumber + 1);
  };

  const handleRowsPerPageChange = async (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): Promise<void> => {
    const newPageSize = Number(event.target.value);    
    setPageSize(newPageSize);    
  };

  return (
    <TablePagination 
      color="orange"
      component="div"
      count={totalCount}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      page={pageNumber - 1}
      rowsPerPage={pageSize}
    />
  );
}
