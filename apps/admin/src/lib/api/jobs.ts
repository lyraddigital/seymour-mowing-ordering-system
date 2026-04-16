import type { JobListDto } from "@shared";
import { mockJobs } from "@/lib/mocks/jobs";

export async function getJobs(): Promise<JobListDto> {
  const mode = process.env.NEXT_PUBLIC_API_MODE;

  if (mode === "mock") {
    return mockJobs;
  }

  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/jobs`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load jobs");
  }

  return response.json() as Promise<JobListDto>;
}