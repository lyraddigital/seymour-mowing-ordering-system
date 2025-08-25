"server only";

import { getNextCustomerCounter } from "@/app/core/data";

export async function getNextUniqueCustomerNumber(): Promise<string> {
  const nextCustomerNumber = await getNextCustomerCounter();

  return `C-${nextCustomerNumber.toString().padStart(6, "0")}`;
}
