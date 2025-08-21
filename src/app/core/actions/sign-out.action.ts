"use server";

import { pagePaths } from "@/app/core/configuration";
import { deleteSession } from "@/app/core/services";

import { emptyServerFormAction } from "./server-form.action";

export default async function signOut(): Promise<void> {
  await emptyServerFormAction(async () => {
    await deleteSession();
  }, pagePaths.signIn);
}
