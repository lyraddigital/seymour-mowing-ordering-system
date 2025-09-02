import { NextResponse } from "next/server";

import { getCustomersPage } from "@/app/core/data/customer.repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const pageNumber = Number(searchParams.get("pageNumber")) || 1;

  const data = await getCustomersPage(pageNumber, pageSize);

  return NextResponse.json(data);
}
