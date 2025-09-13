import { TableHead, TableRow, TableCell, LinearProgress, useTheme, useMediaQuery } from "@mui/material";

import { useDataLoading } from "@/app/core/hooks";
import {
  TableColumnAlignmentOptions,
  TableColumnHeadingOptions,
  TableColumnHiddenOptions
} from "@/app/core/types";
import { isCellHidden } from "@/app/core/lib/util/table-helpers";

interface DataTableHeaderProps {
  ref: React.Ref<HTMLTableSectionElement>;
  headerConfigurations: TableColumnHeadingOptions[];        
  alignmentConfigurations?: TableColumnAlignmentOptions[];
  hiddenConfigurations?: TableColumnHiddenOptions[];
};

export default function DataTableHeader({
  ref,
  alignmentConfigurations,
  headerConfigurations,
  hiddenConfigurations
}: DataTableHeaderProps) {
  const theme = useTheme();
  const isDataLoading = useDataLoading();
  const isMediumDevice = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLargeDevice = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
  const isExtraLargeDevice = useMediaQuery(theme.breakpoints.up('xl'));
  const headersToDisplay = headerConfigurations.filter((_, idx) => {
    return !hiddenConfigurations || !isCellHidden(
      hiddenConfigurations[idx],
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
        {headersToDisplay.map((header, idx) => {
          const alignment = !!alignmentConfigurations && 
            alignmentConfigurations[idx] ? alignmentConfigurations[idx]: 'left';

          return (
            <TableCell key={idx} align={alignment}>
              {header?.text}
            </TableCell>
          );
        })}
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
