import {  
  TableColumnHiddenDemensionOptions,
  TableColumnHiddenOptions,
  TableColumnWidthDimensionOptions,
  TableColumnWidthOptions
} from "@/app/core/types";

export function getWidthValue(
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

export function isCellHidden(
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