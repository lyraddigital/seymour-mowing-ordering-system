import { redirect } from "next/navigation";
import { pagePaths } from "./configuration";

export default function Home() {
  redirect(pagePaths.dashboard);
}
