export interface CustomerFormValues {
  name: string;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  suburb?: string | null;
  postcode?: string | null;
  notes?: string | null;
}
