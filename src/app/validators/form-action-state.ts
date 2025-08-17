import { ValidationResult } from "@/app/validators";

import Credentials from "../types/credentials";

type FormActionState<T> = {
  hasServerError?: boolean;
  data?: Credentials;
  serverErrorMessage?: string;
  validationResult?: ValidationResult<T>;
};

export default FormActionState;
