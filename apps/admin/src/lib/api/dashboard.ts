import type { DashboardDto } from "@shared";

import { mockDashboard } from "@/lib/mocks/dashboard";

export async function getDashboard(): Promise<DashboardDto> {
  const mode = process.env.NEXT_PUBLIC_API_MODE;

  if (mode === "mock") {
    return mockDashboard;
  }

  const baseUrl = process.env.API_BASE_URL;
  const response = await fetch(`${baseUrl}/dashboard`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load dashboard");
  }

  return response.json() as Promise<DashboardDto>;
}