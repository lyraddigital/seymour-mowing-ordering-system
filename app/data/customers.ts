export const customers = [
  {
    customerCode: "SP-01",
    customerName: "Seymour Petstock",
    amountOwing: 234.33,
  },
  {
    customerCode: "SP-02",
    customerName: "Seymour Pizza",
    amountOwing: 20.3,
  },
];

export const getCustomers = () => customers;
export const getCustomerByCode = (customerCode: string) =>
  customers.find((c) => c.customerCode === customerCode);
