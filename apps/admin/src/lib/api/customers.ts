import type { CustomerListDto } from "@shared";
import { mockCustomers } from "@/lib/mocks/customers";

export async function getCustomers(): Promise<CustomerListDto> {
  const mode = process.env.NEXT_PUBLIC_API_MODE;

  if (mode === "mock") {
    return mockCustomers;
  }

  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/customers`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load customers");
  }

  return response.json() as Promise<CustomerListDto>;
}