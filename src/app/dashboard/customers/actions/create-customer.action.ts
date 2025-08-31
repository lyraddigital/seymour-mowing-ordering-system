"use server";

import { serverFormAction } from "@/app/core/actions";
import { saveCustomer } from "@/app/core/data";
import { revalidatePath } from "next/cache";
import { Customer } from "@/app/core/data/models";
import { getNextUniqueCustomerNumber } from "@/app/core/services";
import { FormActionState } from "@/app/core/validators";

import { createCustomerFeatureErrors } from "@/app/dashboard/customers/constants";
import { CreateCustomer } from "@/app/dashboard/customers/types";
import { validateCustomerCreation } from "@/app/dashboard/customers/validators";
import { pagePaths } from "@/app/core/configuration";

export default async function createCustomer(
  _: FormActionState<CreateCustomer> | undefined,
  data: FormData
): Promise<FormActionState<CreateCustomer> | undefined> {
  return await serverFormAction(
    data,
    validateCustomerCreation,
    async (createCustomer) => {
      if (!createCustomer) {
        throw new Error("No create customer data provided");
      }

      const customerNumber = await getNextUniqueCustomerNumber();

      const customer: Customer = {
        customerNumber,
        customerName: createCustomer.customerName!,
        contactName: createCustomer.contactName!,
        contactEmail: createCustomer.contactEmail!,
        contactPhone: createCustomer.contactPhone!,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await saveCustomer(customer);

      revalidatePath(pagePaths.customers);
    },
    createCustomerFeatureErrors.genericError
  );
}
