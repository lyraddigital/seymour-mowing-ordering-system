"use server";

import { signIn } from "../auth";
import { Credentials } from "../types";

export default async function signInWithCredentials(formData: FormData) {
  const credentials = {
    username: formData.get("username"),
    password: formData.get("password"),
  } as Credentials;

  await signIn("credentials", {
    username: credentials.username,
    password: credentials.password,
    redirect: false,
  });
}
