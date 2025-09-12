import { Box, CircularProgress } from "@mui/material";
import { ComponentType, Suspense } from "react";

import { DatasourceInitialAsyncFn, PagedData, SearchParams } from "@/app/core/types";

import DataFilteringProvider from "./data-filtering-provider";

type DatasourceProviderProps<T> = {
    getPageDataRoute: string;
    initialSourceFn: DatasourceInitialAsyncFn<T>;
    ResultComponent: ComponentType<{ data: PagedData<T> }>;
    querySearchParams?: SearchParams;
};

async function DatasourceAsync<T>({ getPageDataRoute, initialSourceFn, ResultComponent, querySearchParams }: DatasourceProviderProps<T>) {
    const queryParams = await querySearchParams;
    const pageSize = !!queryParams?.pageSize ? Number(queryParams.pageSize): 5;    
    const pageNumber = !!queryParams?.pageNumber ? Number(queryParams.pageNumber): 1;
    const filterOptions = { paging: { pageSize, pageNumber } };
    const result = await initialSourceFn(filterOptions);    

    return (
        <DataFilteringProvider
            initialData={result.items}
            getPageDataRoute={getPageDataRoute}
            paging={filterOptions.paging}
            totalCount={result.totalCount}
        >
            <ResultComponent data={result} />
        </DataFilteringProvider>
    );
}

export default function DatasourceProvider<T>({ getPageDataRoute, initialSourceFn, ResultComponent, querySearchParams }: DatasourceProviderProps<T>) {
    return (    
        <>
            <Suspense fallback={(
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            )}>
                <DatasourceAsync
                    getPageDataRoute={getPageDataRoute}
                    initialSourceFn={initialSourceFn}
                    ResultComponent={ResultComponent}
                    querySearchParams={querySearchParams} />
            </Suspense>
        </>
    );
}
