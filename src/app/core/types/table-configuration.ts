import { ComponentType } from "react";

export type TableColumnAlignmentOptions = "left" | "right" | "center" | undefined;

export type TableColumnContentOptions<T> = {
    body: ComponentType<{ data: T }>;
}

export type TableColumnHeadingOptions = {
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

export type TableColumnHiddenOptions = boolean | TableColumnHiddenDemensionOptions | undefined;

export type TableColumnWidthOptions = number | string | TableColumnWidthDimensionOptions | undefined;

type TableColumnConfiguration<T> = {
    alignment?: TableColumnAlignmentOptions;
    content: TableColumnContentOptions<T>;
    header: TableColumnHeadingOptions
    hidden?: TableColumnHiddenOptions;
    width?: TableColumnWidthOptions;
}

type TableConfiguration<T> = {
    columns: TableColumnConfiguration<T>[];
};

export default TableConfiguration;