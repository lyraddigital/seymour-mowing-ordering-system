import type { CustomerListDto } from "@shared";

export const mockCustomers: CustomerListDto = {
  items: [
    {
      id: "cust-1",
      name: "Smith Residence",
      email: "smith@example.com",
      phone: "0400 111 222",
      suburb: "Wallan"
    },
    {
      id: "cust-2",
      name: "Jones Property",
      email: "jones@example.com",
      phone: "0400 222 333",
      suburb: "Wandong"
    },
    {
      id: "cust-3",
      name: "Greenvale Childcare",
      email: "admin@greenvalechildcare.com.au",
      phone: "03 9000 1234",
      suburb: "Greenvale"
    },
    {
      id: "cust-4",
      name: "Brown Family Home",
      email: "brown@example.com",
      phone: "0400 333 444",
      suburb: "Craigieburn"
    }
  ]
};