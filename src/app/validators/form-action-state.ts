import { ValidationResult } from "@/app/validators";

type FormActionState<T> = {
  hasServerError?: boolean;
  data?: T;
  serverErrorMessage?: string;
  validationResult?: ValidationResult<T>;
};

export default FormActionState;
