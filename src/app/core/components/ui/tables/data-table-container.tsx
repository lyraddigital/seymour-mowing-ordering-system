'use client';

import { Box, Paper, Table, TableBody, TableContainer, TableRow } from "@mui/material";
import React, { useLayoutEffect, useRef, useState } from "react";

import { DataTablePageResult } from "@/app/core/types";

import DataTableBackdrop from "./data-table-backdrop";
import DataTableHeader from "./data-table-header";
import DataTablePager from "./data-table-pager";

type DataTableContainerProps<T> = {
    getPageDataRoute: string;
    initialData: DataTablePageResult<T>;
    headings: string[];
    pageSize: number;
    tableDataEntryComponent: React.ComponentType<{ data: T }>;
};

function DataTableContainer<T>({ initialData, getPageDataRoute, pageSize, tableDataEntryComponent: TableDataEntryComponent, headings }: DataTableContainerProps<T>) {
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
                        columns={headings}
                        isLoading={isLoading}
                        ref={tableHeaderRef}
                     />
                    <TableBody>
                        {data.map((item, idx) => (
                            <TableRow key={idx}>
                                <TableDataEntryComponent data={item} />
                            </TableRow>
                        ))}
                    </TableBody>
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