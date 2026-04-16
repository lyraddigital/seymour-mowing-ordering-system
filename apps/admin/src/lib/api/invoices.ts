import type { InvoiceListDto } from "@shared";
import { mockInvoices } from "@/lib/mocks/invoices";

export async function getInvoices(): Promise<InvoiceListDto> {
  const mode = process.env.NEXT_PUBLIC_API_MODE;

  if (mode === "mock") {
    return mockInvoices;
  }

  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/invoices`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load invoices");
  }

  return response.json() as Promise<InvoiceListDto>;
}