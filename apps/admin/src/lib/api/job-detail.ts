import type { JobDetailDto } from "@shared";
import { getMockJobDetail } from "@/lib/mocks/job-detail";

export async function getJobDetail(id: string): Promise<JobDetailDto> {
  const mode = process.env.NEXT_PUBLIC_API_MODE;

  if (mode === "mock") {
    const job = getMockJobDetail(id);

    if (!job) {
      throw new Error(`Job not found for id: ${id}`);
    }

    return job;
  }

  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/jobs/${id}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load job");
  }

  return response.json() as Promise<JobDetailDto>;
}