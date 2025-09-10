
import { TableCell, SxProps, Theme, useTheme, useMediaQuery } from "@mui/material";

import {
  TableColumnContentOptions,
  TableColumnHiddenDemensionOptions,
  TableColumnHiddenOptions,
  TableColumnWidthDimensionOptions,
  TableColumnWidthOptions
} from "@/app/core/types";

interface DataTableCellProps<T> {  
  data: T;
  content: TableColumnContentOptions<T>;
  hiddenConfiguration: TableColumnHiddenOptions | undefined;
  widthConfiguration: TableColumnWidthOptions | undefined;
};

function getWidthValue(
    widthConfiguration: TableColumnWidthOptions | undefined,
    isMediumDevice: boolean,
    isLargeDevice: boolean,
    isExtraLargeDevice: boolean
): string | number | undefined {
    const hasWidthConfiguration = !!widthConfiguration; 

    if (!hasWidthConfiguration) {
        return undefined;
    }

    const isIndividualValue = typeof widthConfiguration === "string" || typeof widthConfiguration === "number";

    if (isIndividualValue) {
        return widthConfiguration;
    } 
            
    const options = (widthConfiguration as TableColumnWidthDimensionOptions);

    return (isMediumDevice && options.md) ? options.md :
           (isLargeDevice && options.lg) ? options.lg :
           (isExtraLargeDevice && options.xl) ? options.xl : undefined;        
}

function isCellHidden(
    hiddenConfiguration: TableColumnHiddenOptions | undefined,
    isMediumDevice: boolean,
    isLargeDevice: boolean,
    isExtraLargeDevice: boolean
): boolean {
    const hasHiddenConfiguration = !!hiddenConfiguration;            

    if (!hasHiddenConfiguration) {
        return false;
    }
    
    const isHiddenFlagBoolean = typeof hiddenConfiguration === "boolean";                                                

    return isHiddenFlagBoolean ? hiddenConfiguration : (
        (isMediumDevice && !!(hiddenConfiguration as TableColumnHiddenDemensionOptions).md) ||
        (isLargeDevice && !!(hiddenConfiguration as TableColumnHiddenDemensionOptions).lg) ||
        (isExtraLargeDevice && !!(hiddenConfiguration as TableColumnHiddenDemensionOptions).xl)
    );
}

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
    let sx: SxProps<Theme> = {
        width: getWidthValue(widthConfiguration, isMediumDevice, isLargeDevice, isExtraLargeDevice)
    };      

    return !shouldHideColumn && (    
        <TableCell sx={sx}>
            {<content.body data={data} />}
        </TableCell>
    );
}
