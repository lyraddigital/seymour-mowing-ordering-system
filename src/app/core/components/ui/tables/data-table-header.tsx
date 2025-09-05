
import { TableHead, TableRow, TableCell, LinearProgress } from "@mui/material";

interface DataTableHeaderProps {
  columns: string[];
  isLoading?: boolean;
  ref: React.Ref<HTMLTableSectionElement>;
}

export default function DataTableHeader({ columns, isLoading, ref }: DataTableHeaderProps) {
  return (
    <TableHead ref={ref}>
      <TableRow sx={{
        backgroundColor: 'primary.main',
        "& .MuiTableCell-root": {
          color: 'primary.contrastText'
        }
      }}>
        {columns.map((col, idx) => (
          <TableCell key={idx}>{col}</TableCell>
        ))}
      </TableRow>
      {isLoading && (
        <TableRow>
          <TableCell colSpan={columns.length} sx={{ p: 0 }}>
            <LinearProgress color="secondary" />
          </TableCell>
        </TableRow>
      )}
    </TableHead>
  );
}
