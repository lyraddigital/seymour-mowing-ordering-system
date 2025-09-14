import { ValidationResultErrors } from "./validation-result";

 type FormActionState<T> = {
  isSuccessful: boolean;
  data?: T;
  error?: string | ValidationResultErrors;
};

export default FormActionState;
