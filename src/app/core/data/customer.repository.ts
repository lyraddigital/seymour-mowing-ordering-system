import { Prisma } from "@prisma/client";

import { getDbClient } from "@/app/core/data/client";
import { Customer, PagedData } from "@/app/core/data/models";

function createCustomerNumber(id: number): string {
  return `C-${id.toString().padStart(7, '0')}`;
}

export async function getCustomersPage(
  limit: number = 30,
  lastKey?: Record<string, unknown>
): Promise<PagedData<Customer>> {
  const dbClient = await getDbClient();
  const customers = await dbClient.customer.findMany();

  return {
    items: customers.map<Customer>((customer) => ({
      id: customer.id,
      customerNumber: customer.customerNumber!,
      customerName: customer.customerName,
      contactName: customer.contactName,
      contactEmail: customer.contactEmail,
      contactPhone: customer.contactPhone,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    })),
  };
}

export async function saveCustomer(customer: Omit<Prisma.CustomerCreateInput, 'customerNumber' | 'id'>): Promise<void> {
  const dbClient = await getDbClient();

  await dbClient.$transaction(async (tx) => {
    const newCustomer = await tx.customer.create({
      data: { ...customer }
    });

    const newCustomerNumber = createCustomerNumber(newCustomer.id);

    await tx.customer.update({
      where: { id: newCustomer.id },
      data: { customerNumber: { set: newCustomerNumber } },
    });
  });  
}
