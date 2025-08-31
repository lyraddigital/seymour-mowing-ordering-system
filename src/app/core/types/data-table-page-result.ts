type DataTablePageResult<T> = {
  items: T[];
  lastEvaluatedKey?: Record<string, unknown>;
};

export default DataTablePageResult;
