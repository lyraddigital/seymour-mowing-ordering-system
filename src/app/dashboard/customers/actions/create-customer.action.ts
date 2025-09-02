"use server";

import { serverFormAction } from "@/app/core/actions";
import { saveCustomer } from "@/app/core/data";
import { FormActionState } from "@/app/core/validators";

import { createCustomerFeatureErrors } from "@/app/dashboard/customers/constants";
import { CreateCustomer } from "@/app/dashboard/customers/types";
import { validateCustomerCreation } from "@/app/dashboard/customers/validators";

export default async function createCustomer(
  _: FormActionState<CreateCustomer> | undefined,
  data: FormData
): Promise<FormActionState<CreateCustomer> | undefined> {
  return await serverFormAction(
    data,
    validateCustomerCreation,
    async (customer) => {
      if (!customer) {
        throw new Error("No create customer data provided");
      }

      await saveCustomer({
        customerName: customer.customerName!,
        contactName: customer.contactName!,
        contactEmail: customer.contactEmail!,
        contactPhone: customer.contactPhone!
      });
    },
    createCustomerFeatureErrors.genericError
  );
}
