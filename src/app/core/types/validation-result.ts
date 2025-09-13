type ValidationResult = {
  success: boolean;
  errors?: {
    messages: string[];
    fields: string[];
  };
};

export default ValidationResult;
