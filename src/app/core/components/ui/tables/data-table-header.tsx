
import { TableHead, TableRow, TableCell } from "@mui/material";

interface DataTableHeaderProps {
  columns: string[];
}

export default function DataTableHeader({ columns }: DataTableHeaderProps) {
  return (
    <TableHead>
      <TableRow>
        {columns.map((col, idx) => (
          <TableCell key={idx}>{col}</TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
