import { Box, CircularProgress } from "@mui/material";
import React, { ComponentType, Suspense } from "react";

import { DatasourceInitialAsyncFn, PagedData } from "@/app/core/types";

type DatasourceProviderProps<T> = {    
    initialSourceFn: DatasourceInitialAsyncFn<T>;
    ResultComponent: ComponentType<{ data: PagedData<T> }>;
};

async function DatasourceAsync<T>({ initialSourceFn, ResultComponent }: DatasourceProviderProps<T>) {
    const result = await initialSourceFn({ paging: { pageSize: 5, pageNumber: 1 } });

    return <ResultComponent data={result} />;
}

export default async function DatasourceProvider<T>({ initialSourceFn, ResultComponent }: DatasourceProviderProps<T>) {
  return (    
    <>
        <Suspense fallback={(
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        )}>
            <DatasourceAsync initialSourceFn={initialSourceFn} ResultComponent={ResultComponent} />
        </Suspense>
    </>
  );
}
