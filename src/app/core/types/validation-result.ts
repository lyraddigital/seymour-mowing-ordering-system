export type ValidationResultErrors = {
  messages: string[];
  fields: string[];
}

type ValidationResult = {
  success: boolean;
  errors?: ValidationResultErrors;
};

export default ValidationResult;
