import type {
  CompletedJobPeriod,
  DashboardDto,
  ScheduledJobPeriod,
  UnpaidInvoiceFilter
} from "@shared";
import { getMockDashboard } from "@/lib/mocks/dashboard";

export type GetDashboardParams = {
  scheduledPeriod?: ScheduledJobPeriod;
  completedPeriod?: CompletedJobPeriod;
  invoiceFilter?: UnpaidInvoiceFilter;
};

export async function getDashboard(
  params: GetDashboardParams = {}
): Promise<DashboardDto> {
  const mode = process.env.NEXT_PUBLIC_API_MODE;

  if (mode === "mock") {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getMockDashboard(params);
  }

  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured");
  }

  const searchParams = new URLSearchParams();

  if (params.scheduledPeriod) {
    searchParams.set("scheduledPeriod", params.scheduledPeriod);
  }

  if (params.completedPeriod) {
    searchParams.set("completedPeriod", params.completedPeriod);
  }

  if (params.invoiceFilter) {
    searchParams.set("invoiceFilter", params.invoiceFilter);
  }

  const response = await fetch(`${baseUrl}/dashboard?${searchParams.toString()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load dashboard");
  }

  return response.json() as Promise<DashboardDto>;
}