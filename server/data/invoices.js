const { subDays, isAfter } = require("date-fns");

const invoices = [
  {
    issueDate: "2024-08-01T12:00:00.000Z",
    dueDate: "2024-08-22T12:00:00.000Z",
    startDate: "2024-07-01T12:00:00.000Z",
    endDate: "2024-07-31T12:00:00.000Z",
    invoiceNumber: "#INV-01",
    customerCode: "CUST-01",
    status: "Unpaid",
    total: 255.2,
    paid: 230.3,
    payments: [
      {
        date: "2024-08-10T12:00:00.000Z",
        amount: 230.3,
      },
    ],
  },
  {
    issueDate: "2024-08-01T12:00:00.000Z",
    dueDate: "2024-08-22T12:00:00.000Z",
    startDate: "2024-07-01T12:00:00.000Z",
    endDate: "2024-07-31T12:00:00.000Z",
    invoiceNumber: "#INV-02",
    customerCode: "CUST-02",
    status: "Paid",
    total: 250.2,
    paid: 250.2,
    payments: [
      {
        date: "2024-08-10T12:00:00.000Z",
        amount: 250.2,
      },
    ],
  },
];

function getUnpaidInvoices() {
  return invoices.filter((inv) => inv.status !== "Paid");
}

function getPaymentsForLastDays(daysBack) {
  const today = new Date();
  const lastDate = subDays(today, daysBack);

  return invoices
    .flatMap((inv) => inv.payments)
    .filter((p) => isAfter(p.date, lastDate));
}

module.exports = {
  getUnpaidInvoices,
  getPaymentsForLastDays,
};
