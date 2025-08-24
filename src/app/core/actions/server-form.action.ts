import { NEXT_REDIRECT_EXCEPTION_MESSAGE } from "@/app/core/configuration";
import { FormActionState, ValidatorFn } from "@/app/core/validators";

export default async function serverFormAction<T>(
  formData: FormData,
  validatorFn: ValidatorFn<T>,
  processingFn: (data?: T) => Promise<void>
): Promise<FormActionState<T> | undefined> {
  const validationResult = validatorFn(formData);

  if (!validationResult.success) {
    return {
      data: validationResult?.data,
      validationResult: validationResult,
    };
  }

  try {
    await processingFn(validationResult?.data);
  } catch (e) {
    return handleServerFormError(e, {
      hasServerError: true,
      serverErrorMessage: (e as Error).message,
      data: validationResult?.data,
    });
  }
}

export async function emptyServerFormAction(
  processingFn: () => Promise<void>
): Promise<FormActionState<void> | undefined> {
  try {
    await processingFn();
  } catch (e) {
    return handleServerFormError(e, {
      hasServerError: true,
      serverErrorMessage: (e as Error).message,
    });
  }
}

function handleServerFormError<T>(
  error: unknown,
  formActionState: FormActionState<T>
): FormActionState<T> {
  if ((error as Error)?.message === NEXT_REDIRECT_EXCEPTION_MESSAGE) {
    throw error;
  }

  return formActionState;
}
