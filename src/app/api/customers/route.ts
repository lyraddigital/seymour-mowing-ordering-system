import { NextResponse } from "next/server";

import { getCustomersPage } from "@/app/core/data/customer.repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageSize = Number(searchParams.get("pageSize")) || 30;
  const keyParam = searchParams.get("key");
  const key = keyParam ? JSON.parse(keyParam) : undefined;

  const data = await getCustomersPage(pageSize, key);

  return NextResponse.json(data);
}
