import { NEXT_REDIRECT_EXCEPTION_MESSAGE } from "@/app/core/configuration";
import { ApplicationError } from "@/app/core/interfaces";
import { FormActionState } from "@/app/core/types";
import { ValidatorFn } from "@/app/core/validators";

export default async function serverFormAction<T>(
  formData: FormData,
  validatorFn: ValidatorFn<T>,
  processingFn: (data?: T) => Promise<void>,
  unknownErrorMessage: string
): Promise<FormActionState<T> | undefined> {
  const { data, validationResult } = validatorFn(formData);

  if (!validationResult.success) {
    return {
      isSuccessful: false,
      data,
      error: validationResult.errors,
    };
  }

  try {
    await processingFn(data);

    return {
      isSuccessful: true
    };
  } catch (e) {
    return handleServerFormError(e, unknownErrorMessage, {
      data,
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
    return handleServerFormError(e, unknownErrorMessage);
  }
}

function handleServerFormError<T>(
  error: unknown,
  unknownErrorMessage: string,
  formActionState?: Omit<FormActionState<T>, 'error' | 'isSuccessful'>
): FormActionState<T> {
  if ((error as Error)?.message === NEXT_REDIRECT_EXCEPTION_MESSAGE) {
    throw error;
  } else if (error instanceof ApplicationError) {
    console.error("Application error occurred:", error);

    return {
      ...(formActionState || {}),
      isSuccessful: false,
      error: (error as Error).message,
    };
  }

  console.error("An unknown error occurred: ", error);

  return {
    ...(formActionState || {}),
    isSuccessful: false,
    error: unknownErrorMessage,
  };
}
