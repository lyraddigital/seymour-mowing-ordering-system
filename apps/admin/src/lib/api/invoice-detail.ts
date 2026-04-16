import type { InvoiceDetailDto } from "@shared";
import { getMockInvoiceDetail } from "@/lib/mocks/invoice-detail";

export async function getInvoiceDetail(id: string): Promise<InvoiceDetailDto> {
  const mode = process.env.NEXT_PUBLIC_API_MODE;

  if (mode === "mock") {
    const invoice = getMockInvoiceDetail(id);

    if (!invoice) {
      throw new Error(`Invoice not found for id: ${id}`);
    }

    return invoice;
  }

  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/invoices/${id}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to load invoice");
  }

  return response.json() as Promise<InvoiceDetailDto>;
}