
import { TableHead, TableRow, TableCell, LinearProgress } from "@mui/material";

import { TableColumnHeadingOptions } from "@/app/core/types";

interface DataTableHeaderProps {
  isLoading?: boolean;
  ref: React.Ref<HTMLTableSectionElement>;
  headerConfigurations: TableColumnHeadingOptions[];        
};

export default function DataTableHeader({ isLoading, ref, headerConfigurations }: DataTableHeaderProps) {
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
