import type { CustomerDetailDto } from "@shared";
import { getMockCustomerDetail } from "@/lib/mocks/customer-detail";

export async function getCustomerDetail(id: string): Promise<CustomerDetailDto> {
  const mode = process.env.NEXT_PUBLIC_API_MODE;

  if (mode === "mock") {
    const customer = getMockCustomerDetail(id);

    if (!customer) {
      throw new Error(`Customer not found for id: ${id}`);
    }

    return customer;
  }

  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/customers/${id}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load customer");
  }

  return response.json() as Promise<CustomerDetailDto>;
}