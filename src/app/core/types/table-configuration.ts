import { ComponentType } from "react";

export type TableColumnContentOptions<T> = {
    body: ComponentType<{ data: T }>;
}

export type TableColumnHeadingOptions<T> = {
    text?: string;
}

export type TableColumnHiddenDemensionOptions = {
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
}

export type TableColumnWidthDimensionOptions = {
    md?: number | string;
    lg?: number | string;
    xl?: number | string;
}

export type TableColumnHiddenOptions = boolean | TableColumnHiddenDemensionOptions;

export type TableColumnWidthOptions = number | string | TableColumnWidthDimensionOptions;

type TableColumnConfiguration<T> = {
    content: TableColumnContentOptions<T>;
    header: TableColumnHeadingOptions<T>;
    hidden?: TableColumnHiddenOptions;
    maxWidth?: TableColumnWidthOptions;
    minWidth?: TableColumnWidthOptions;
    width?: TableColumnWidthOptions;
}

type TableConfiguration<T> = {
    columns: TableColumnConfiguration<T>[];
};

export default TableConfiguration;