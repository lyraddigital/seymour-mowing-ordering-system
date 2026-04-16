import type { InvoiceListDto, InvoiceListFilter } from "@shared";
import { getMockInvoices } from "@/lib/mocks/invoices";

export type GetInvoicesParams = {
  filter?: InvoiceListFilter;
};

export async function getInvoices(
  params: GetInvoicesParams = {}
): Promise<InvoiceListDto> {
  const mode = process.env.NEXT_PUBLIC_API_MODE;

  if (mode === "mock") {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getMockInvoices(params);
  }

  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured");
  }

  const searchParams = new URLSearchParams();

  if (params.filter) {
    searchParams.set("filter", params.filter);
  }

  const response = await fetch(`${baseUrl}/invoices?${searchParams.toString()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load invoices");
  }

  return response.json() as Promise<InvoiceListDto>;
}