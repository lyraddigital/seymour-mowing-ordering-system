import ValidationResult from "./validation-result";

type FormActionState<T> = {
  data?: T;
  hasServerError?: boolean;
  serverErrorMessage?: string;
  validationResult?: ValidationResult;
};

export default FormActionState;
