"use server";

import { getUserByUsername } from "@/app/data";
import { checkPassword } from "@/app/lib";
import { createSession } from "@/app/services";
import { Credentials } from "@/app/types";
import { FormActionState, validateSignIn } from "@/app/validators";

import serverFormAction from "./server-form.action";

const serverErrorMessage =
  "Issue while signing in. Please check your username and password and try again.";

export default async function signInWithCredentials(
  _: FormActionState<Credentials> | undefined,
  formData: FormData
): Promise<FormActionState<Credentials> | undefined> {
  return await serverFormAction(
    formData,
    validateSignIn,
    "/",
    async (credentials) => {
      if (!credentials) {
        throw new Error(serverErrorMessage);
      }

      const user = await getUserByUsername(credentials.username);

      if (!user) {
        throw new Error(serverErrorMessage);
      }

      const hasPasswordMatched = await checkPassword(
        credentials.password,
        user.hashedPassword
      );

      if (!hasPasswordMatched) {
        throw new Error(serverErrorMessage);
      }

      await createSession(user.username);
    }
  );
}
