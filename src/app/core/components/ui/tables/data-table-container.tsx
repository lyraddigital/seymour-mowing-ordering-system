'use client';

import { Box, Paper, Table, TableContainer } from "@mui/material";
import React, { useLayoutEffect, useRef, useState } from "react";

import { PagedData, TableConfiguration } from "@/app/core/types";

import DataTableBackdrop from "./data-table-backdrop";
import DataTableHeader from "./data-table-header";
import DataTableBody from "./data-table-body";
import DataTablePager from "./data-table-pager";

type DataTableContainerProps<T> = {
    getPageDataRoute: string;
    initialData: PagedData<T>;
    pageSize: number;
    tableConfiguration: TableConfiguration<T>;
};

function DataTableContainer<T>({ initialData, getPageDataRoute, pageSize, tableConfiguration }: DataTableContainerProps<T>) {
    const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
    const [data, setData] = useState<T[]>(initialData.items);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useLayoutEffect(() => {
        if (tableHeaderRef.current) {
            setHeaderHeight(tableHeaderRef.current.offsetHeight);
        }
    }, []);

    return (
        <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Box sx={{ position: "relative" }}>
                <Table>
                    <DataTableHeader
                        isLoading={isLoading}
                        ref={tableHeaderRef}
                        headerConfigurations={tableConfiguration.columns.map(c => c.header)}                        
                     />
                    <DataTableBody
                        data={data}
                        bodyConfiguration={tableConfiguration.columns.map(c => c.content)}
                        hiddenConfiguration={tableConfiguration.columns.map(c => c.hidden)}
                        widthConfiguration={tableConfiguration.columns.map(c => c.width)}
                    />
                </Table>
                <DataTablePager
                    getPageDataRoute={getPageDataRoute}
                    setData={setData}
                    setIsLoading={setIsLoading}
                    pageSize={pageSize}
                    totalCount={initialData.totalCount}
                />
                <DataTableBackdrop
                    isLoading={isLoading}
                    height={headerHeight}
                />
            </Box>            
        </TableContainer>
    );
}

export default DataTableContainer;