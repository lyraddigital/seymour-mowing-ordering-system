import { NEXT_REDIRECT_EXCEPTION_MESSAGE } from "@/app/core/configuration";
import { ApplicationError } from "@/app/core/interfaces";
import { FormActionState, ValidatorFn } from "@/app/core/validators";

export default async function serverFormAction<T>(
  formData: FormData,
  validatorFn: ValidatorFn<T>,
  processingFn: (data?: T) => Promise<void>,
  unknownErrorMessage: string
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
    return handleServerFormError(e, unknownErrorMessage, {
      hasServerError: true,
      data: validationResult?.data,
    });
  }
}

export async function emptyServerFormAction(
  processingFn: () => Promise<void>,
  unknownErrorMessage: string
): Promise<FormActionState<void> | undefined> {
  try {
    await processingFn();
  } catch (e) {
    return handleServerFormError(e, unknownErrorMessage, {
      hasServerError: true,
    });
  }
}

function handleServerFormError<T>(
  error: unknown,
  unknownErrorMessage: string,
  formActionState: FormActionState<T>
): FormActionState<T> {
  if ((error as Error)?.message === NEXT_REDIRECT_EXCEPTION_MESSAGE) {
    throw error;
  } else if (error instanceof ApplicationError) {
    console.error("Application error occurred:", error);

    return {
      ...formActionState,
      serverErrorMessage: (error as Error).message,
    };
  }

  console.error("An unknown error occurred: ", error);

  return {
    ...formActionState,
    serverErrorMessage: unknownErrorMessage,
  };
}
