'use client';

import { Box, Paper, Table, TableContainer, useMediaQuery, useTheme } from "@mui/material";
import React, { useLayoutEffect, useRef, useState } from "react";

import { TableConfiguration } from "@/app/core/types";

import DataTableBackdrop from "./data-table-backdrop";
import DataTableHeader from "./data-table-header";
import DataTableBody from "./data-table-body";
import DataTablePager from "./data-table-pager";

type DataTableContainerProps<T> = {    
    tableConfiguration: TableConfiguration<T>;
};

function DataTableContainer<T>({ tableConfiguration }: DataTableContainerProps<T>) {
    const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
    const [headerHeight, setHeaderHeight] = useState(0);
    const theme = useTheme();
    const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'));

    useLayoutEffect(() => {
        if (tableHeaderRef.current) {
            setHeaderHeight(tableHeaderRef.current.offsetHeight);
        }
    }, []);

    return !isSmallDevice && (
        <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Box sx={{ position: "relative" }}>
                <Table>
                    <DataTableHeader
                        ref={tableHeaderRef}
                        headerConfigurations={tableConfiguration.columns.map(c => c.header)}
                        hiddenConfiguration={tableConfiguration.columns.map(c => c.hidden)}
                     />
                    <DataTableBody
                        bodyConfiguration={tableConfiguration.columns.map(c => c.content)}
                        hiddenConfiguration={tableConfiguration.columns.map(c => c.hidden)}
                        widthConfiguration={tableConfiguration.columns.map(c => c.width)}
                    />
                </Table>
                <DataTablePager />
                <DataTableBackdrop height={headerHeight} />
            </Box>            
        </TableContainer>
    );
}

export default DataTableContainer;