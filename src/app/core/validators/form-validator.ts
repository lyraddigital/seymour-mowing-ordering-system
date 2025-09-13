import { FormActionState, ValidationResponse } from "@/app/core/types";

export type ValidatorFn<T> = (formData: FormData) => ValidationResponse<T>;
export type ActionStateFn<T> = (
  prevState: FormActionState<T> | undefined,
  formData: FormData
) => Promise<FormActionState<T> | undefined>;

export default function validateAndSubmit<T>(
  validatorFn: ValidatorFn<T>,
  serverFn?: ActionStateFn<T>
): ActionStateFn<T> {
  return async (prevState, formData) => {
    const { data, validationResult } = validatorFn(formData);

    if (!validationResult.success) {
      return {
        data,
        validationResult: validationResult,
      } as FormActionState<T>;
    }

    if (serverFn) {
      return await serverFn(prevState, formData);
    }
  };
}
