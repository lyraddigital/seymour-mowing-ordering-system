import ValidationResult from "./validation-result";

type ValidationResponse<T> = {
  data?: T;
  validationResult: ValidationResult;
};

export default ValidationResponse;