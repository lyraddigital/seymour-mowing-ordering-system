type PagedData<T> = {
  items: T[];
  lastEvaluatedKey?: Record<string, unknown>;
};

export default PagedData;
