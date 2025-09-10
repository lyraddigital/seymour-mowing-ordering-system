import DatasourcePageOptions from "./datasource-page-options";
import PagedData from "./paged-data";

type DatasourceInitialAsyncFn<T> = (options?: { paging?: DatasourcePageOptions }) => Promise<PagedData<T>>;

export default DatasourceInitialAsyncFn;