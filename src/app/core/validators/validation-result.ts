type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: {
    messages: string[];
    fields: string[];
  };
};

export default ValidationResult;
