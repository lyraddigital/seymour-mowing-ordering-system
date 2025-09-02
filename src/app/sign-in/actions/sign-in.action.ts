"use server";

import { redirect } from "next/navigation";

import { serverFormAction } from "@/app/core/actions";
import { pagePaths } from "@/app/core/configuration";
import { getUserByUsername } from "@/app/core/data";
import { FormActionState } from "@/app/core/validators";

import { pageErrors } from "@/app/sign-in/constants";
import { checkPassword } from "@/app/sign-in/lib";
import { createSession } from "@/app/sign-in/services";
import { Credentials } from "@/app/sign-in/types";
import { validateSignIn } from "@/app/sign-in/validators";

export default async function signInWithCredentials(
  _: FormActionState<Credentials> | undefined,
  formData: FormData
): Promise<FormActionState<Credentials> | undefined> {
  return await serverFormAction(
    formData,
    validateSignIn,
    async (credentials) => {
      if (!credentials) {
        throw new Error("No credentials provided");
      }      

      const user = await getUserByUsername(credentials.username);

      if (!user) {
        throw new Error("User not found");
      }      

      const hasPasswordMatched = await checkPassword(
        credentials.password,
        user.hashedPassword
      );

      if (!hasPasswordMatched) {
        throw new Error("Invalid password");
      }

      await createSession(user.username, credentials.rememberMe);

      redirect(pagePaths.dashboard);
    },
    pageErrors.genericError
  );
}
