import ValidationResult from "./validation-result";

type FormActionState<T> = {
  hasServerError?: boolean;
  data?: T;
  serverErrorMessage?: string;
  validationResult?: ValidationResult<T>;
};

export default FormActionState;
