import { Prisma } from "@prisma/client";

import { getDbClient } from "@/app/core/data/client";
import { Customer } from "@/app/core/data/models";
import { DatasourcePageOptions, PagedData } from "@/app/core/types";

function createCustomerNumber(id: number): string {
  return `C-${id.toString().padStart(7, '0')}`;
}

export async function getCustomersPage(options?: { paging?: DatasourcePageOptions }): Promise<PagedData<Customer>> {
  const dbClient = await getDbClient();
  const pageNumber = options?.paging?.pageNumber || 1;
  const pageSize = options?.paging?.pageSize || 30;

  const [customers, totalCount] = await dbClient.$transaction([
    dbClient.customer.findMany({
      skip: (pageNumber - 1) * pageSize,
      take: pageSize
    }),
    dbClient.customer.count()
  ]);

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
    totalCount
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
