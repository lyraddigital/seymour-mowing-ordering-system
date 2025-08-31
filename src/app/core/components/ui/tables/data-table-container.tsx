'use client';

import { Paper, Table, TableBody, TableContainer, TableRow } from "@mui/material";
import React, { useState } from "react";

import { DataTablePageResult } from "@/app/core/types";

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
    const [data, setData] = useState<T[]>(initialData.items);

    return (
        <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Table>
                <DataTableHeader columns={headings} />
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
                pageSize={pageSize}
                initialLastEvaluatedKey={initialData.lastEvaluatedKey}
            />
        </TableContainer>
    );
}

export default DataTableContainer;