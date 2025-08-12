"use server";

import { signIn } from "../auth";
import { Credentials } from "../types";

export default async function signInWithCredentials(credentials: Credentials) {
  await signIn("credentials", {
    username: credentials.username,
    password: credentials.password,
    redirect: false,
  });
}
