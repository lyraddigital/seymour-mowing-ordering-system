export const customers = [
  {
    jobCode: "JOB-01",
    date: "1/8/2024",
    name: "Taking a poo",
    customerName: "Seymour Petstock",
    status: "Unpaid",
  },
  {
    jobCode: "JOB-02",
    date: "31/7/2024",
    name: "Burning down the house",
    customerName: "Seymour Pizza",
    quantity: 2,
    status: "Paid",
    cost: 20.3,
    total: 40.6,
  },
];

export const getJobs = () => customers;
