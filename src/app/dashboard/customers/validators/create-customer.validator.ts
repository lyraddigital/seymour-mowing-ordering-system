import { object, string } from "zod";

import { validateSchema, ValidationResult } from "@/app/core/validators";

import { formFields } from "@/app/dashboard/customers/constants";
import { CreateCustomer } from "@/app/dashboard/customers/types";

const CreateCustomerSchema = object({
  customerName: string().nonempty({ error: "Customer Name is required" }),
  // contactName: string().nonempty({ error: "Contact Name is required" }),
  // contactEmail: string().nonempty({ error: "Contact Email is required" }),
  // contactPhone: string().nonempty({ error: "Contact Phone is required" }),
  // profilePic: string().nonempty({ error: "Profile Picture is required" }),
});

function validateCustomerCreation(
  formData: FormData
): ValidationResult<CreateCustomer> {
  return validateSchema(CreateCustomerSchema, {
    customerName: formData.get(formFields.customerName),
    contactName: formData.get(formFields.contactName),
    contactEmail: formData.get(formFields.contactEmail),
    contactPhone: formData.get(formFields.contactPhone),
    profilePic: formData.get(formFields.profilePic),
  } as CreateCustomer);
}

export default validateCustomerCreation;
