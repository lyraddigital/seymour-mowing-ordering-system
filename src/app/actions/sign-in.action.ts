"use server";

import { redirect } from "next/navigation";

import { Credentials, FormActionState } from "@/app/types";
import { validateSignIn } from "@/app/validators";

export default async function signInWithCredentials(
  _: FormActionState<Credentials> | undefined,
  formData: FormData
): Promise<FormActionState<Credentials> | undefined> {
  const validationResult = validateSignIn(formData);

  if (!validationResult.success) {
    return {
      data: validationResult.data,
      validationResult: validationResult,
    };
  }

  // Perform saving the session to DynamoDb here and catch an exception if it occurs.

  redirect("/");
}
