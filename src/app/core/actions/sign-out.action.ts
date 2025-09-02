"use server";

import { redirect } from "next/navigation";

import { pagePaths } from "@/app/core/configuration";
import { deleteSession } from "@/app/core/services";

import { emptyServerFormAction } from "./server-form.action";

export default async function signOut(): Promise<void> {
  await emptyServerFormAction(async () => {
    await deleteSession();
    redirect(pagePaths.signIn);
  }, "Issue while trying to sign out. Please try again later.");
}
