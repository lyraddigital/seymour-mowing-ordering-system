import { useActionState } from "react";

import {
  ActionStateFn,
  FormActionState,
  validateAndSubmit,
  ValidatorFn,
} from "@/app/validators";

export default function useFormAction<T>(
  validateFn: ValidatorFn<T>,
  serverFn?: ActionStateFn<T>
): [
  state: FormActionState<T> | undefined,
  dispatch: (payload: FormData) => void,
  boolean
] {
  const formActionFn = validateAndSubmit(validateFn, serverFn);
  return useActionState(formActionFn, undefined);
}
