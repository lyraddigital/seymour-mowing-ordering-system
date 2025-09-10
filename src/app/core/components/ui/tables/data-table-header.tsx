
import { TableHead, TableRow, TableCell, LinearProgress } from "@mui/material";

import { TableColumnHeadingOptions } from "@/app/core/types";

interface DataTableHeaderProps<T> {
  isLoading?: boolean;
  ref: React.Ref<HTMLTableSectionElement>;
  headerConfigurations: TableColumnHeadingOptions<T>[];        
};

export default function DataTableHeader<T>({ isLoading, ref, headerConfigurations }: DataTableHeaderProps<T>) {
  return (
    <TableHead ref={ref}>
      <TableRow sx={{
        backgroundColor: 'primary.main',
        "& .MuiTableCell-root": {
          color: 'primary.contrastText'
        }
      }}>
        {headerConfigurations.map((header, idx) => (
          <TableCell key={idx}>{header?.text}</TableCell>
        ))}
      </TableRow>
      {isLoading && (
        <TableRow>
          <TableCell colSpan={headerConfigurations.length} sx={{ p: 0 }}>
            <LinearProgress color="secondary" />
          </TableCell>
        </TableRow>
      )}
    </TableHead>
  );
}
