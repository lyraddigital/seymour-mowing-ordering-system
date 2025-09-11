
import { TableCell, SxProps, Theme, useTheme, useMediaQuery } from "@mui/material";

import { getWidthValue, isCellHidden } from "@/app/core/lib/util";
import {
  TableColumnContentOptions,
  TableColumnHiddenOptions,
  TableColumnWidthOptions
} from "@/app/core/types";

interface DataTableCellProps<T> {  
  data: T;
  content: TableColumnContentOptions<T>;
  hiddenConfiguration: TableColumnHiddenOptions | undefined;
  widthConfiguration: TableColumnWidthOptions | undefined;
};

export default function DataTableCell<T>({
  content,
  data,
  hiddenConfiguration,
  widthConfiguration
}: DataTableCellProps<T>) {
    const theme = useTheme();
    const isMediumDevice = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    const isLargeDevice = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
    const isExtraLargeDevice = useMediaQuery(theme.breakpoints.up('xl'));
    const shouldHideColumn = isCellHidden(hiddenConfiguration, isMediumDevice, isLargeDevice, isExtraLargeDevice);
    const sx: SxProps<Theme> = {
        width: getWidthValue(widthConfiguration, isMediumDevice, isLargeDevice, isExtraLargeDevice)
    };      

    return !shouldHideColumn && (    
        <TableCell sx={sx}>
            {<content.body data={data} />}
        </TableCell>
    );
}
