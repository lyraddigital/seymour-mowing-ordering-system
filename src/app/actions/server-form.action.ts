import { redirect } from "next/navigation";

import { FormActionState, ValidatorFn } from "@/app/validators";

export default async function serverFormAction<T>(
  formData: FormData,
  validatorFn: ValidatorFn<T>,
  redirectPath: string | undefined,
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
    return {
      hasServerError: true,
      serverErrorMessage: (e as { message: string }).message,
      data: validationResult?.data,
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }
}
