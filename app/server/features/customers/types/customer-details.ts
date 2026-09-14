export interface CustomerDetails {
  id: string;
  archivedAt: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  notes: string | null;
}
