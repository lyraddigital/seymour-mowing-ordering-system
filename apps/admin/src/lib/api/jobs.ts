import type { JobListDto, JobListFilter } from "@shared";
import { getMockJobs } from "@/lib/mocks/jobs";

export type GetJobsParams = {
  filter?: JobListFilter;
};

export async function getJobs(
  params: GetJobsParams = {}
): Promise<JobListDto> {
  const mode = process.env.NEXT_PUBLIC_API_MODE;

  if (mode === "mock") {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getMockJobs(params);
  }

  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured");
  }

  const searchParams = new URLSearchParams();

  if (params.filter) {
    searchParams.set("filter", params.filter);
  }

  const response = await fetch(`${baseUrl}/jobs?${searchParams.toString()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load jobs");
  }

  return response.json() as Promise<JobListDto>;
}