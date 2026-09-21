export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  postcode?: string;
  notes?: string;
}
