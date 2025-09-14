import { useActionState } from "react";

import { FormActionState } from "@/app/core/types"
import {
  ActionStateFn,
  validateAndSubmit,
  ValidatorFn,
} from "@/app/core/validators";

export default function useFormAction<T>(
  validateFn: ValidatorFn<T>,
  serverFn?: ActionStateFn<T>
): [
  state: FormActionState<T> | undefined,
  dispatch: (payload: FormData) => void,
  boolean
] {
  const formActionFn = validateAndSubmit(validateFn, serverFn);
  return useActionState(formActionFn, undefined,);
}
