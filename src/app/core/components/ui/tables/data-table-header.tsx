import { TableHead, TableRow, TableCell, LinearProgress, useTheme, useMediaQuery } from "@mui/material";

import { useDataLoading } from "@/app/core/hooks";
import {
  TableColumnHeadingOptions,
  TableColumnHiddenOptions
} from "@/app/core/types";
import { isCellHidden } from "@/app/core/lib/util/table-helpers";

interface DataTableHeaderProps {
  ref: React.Ref<HTMLTableSectionElement>;
  headerConfigurations: TableColumnHeadingOptions[];        
  hiddenConfiguration?: (TableColumnHiddenOptions | undefined)[];
};

export default function DataTableHeader({
  ref,
  headerConfigurations,
  hiddenConfiguration
}: DataTableHeaderProps) {
  const theme = useTheme();
  const isDataLoading = useDataLoading();
  const isMediumDevice = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLargeDevice = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
  const isExtraLargeDevice = useMediaQuery(theme.breakpoints.up('xl'));
  const headersToDisplay = headerConfigurations.filter((hc, idx) => {
    return !hiddenConfiguration || !isCellHidden(
      hiddenConfiguration[idx],
      isMediumDevice,
      isLargeDevice,
      isExtraLargeDevice
    );
  });

  return (
    <TableHead ref={ref}>
      <TableRow sx={{
        backgroundColor: 'primary.main',
        "& .MuiTableCell-root": {
          color: 'primary.contrastText'
        }
      }}>
        {headersToDisplay.map((header, idx) => (
            <TableCell key={idx}>{header?.text}</TableCell>
          ))}
      </TableRow>
      {isDataLoading && (
        <TableRow>
          <TableCell colSpan={headersToDisplay.length} sx={{ p: 0 }}>
            <LinearProgress color="secondary" />
          </TableCell>
        </TableRow>
      )}
    </TableHead>
  );
}
