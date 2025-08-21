import { redirect } from "next/navigation";

import { pagePaths } from "@/app/core/configuration";

export default function Home() {
  redirect(pagePaths.dashboard);
}
