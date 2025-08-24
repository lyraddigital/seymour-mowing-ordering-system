"use server";

import { serverFormAction } from "@/app/core/actions";
import { FormActionState } from "@/app/core/validators";

import { CreateCustomer } from "@/app/dashboard/customers/types";
import { validateCustomerCreation } from "@/app/dashboard/customers/validators";

export default async function createCustomer(
  _: FormActionState<CreateCustomer> | undefined,
  data: FormData
): Promise<FormActionState<CreateCustomer> | undefined> {
  return await serverFormAction(
    data,
    validateCustomerCreation,
    async (createCustomer) => {
      // if (!customer) {
      //   throw new Error(pageErrors.genericError);
      // }
      // await createCustomerInDB(customer);
    }
  );
}
