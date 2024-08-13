const { getCustomerByCode } = require("../../data/customers");
const { getLatestJobs } = require("../../data/jobs");
const {
  getUnpaidInvoices,
  getPaymentsForLastDays,
} = require("../../data/invoices");

module.exports = () => {
  const latestJobs = getLatestJobs();
  const latestPayments = getPaymentsForLastDays(30);
  const unpaidInvoices = getUnpaidInvoices();
  const totalAmountOwed = unpaidInvoices
    .map((uj) => uj.total - uj.paid)
    .reduce((amountOwed, t) => amountOwed + t);
  const amountReceivedLastThirty = latestPayments
    .map((pj) => pj.amount)
    .reduce((amountReceived, t) => amountReceived + t);
  const numberOfCustomersOwing = new Set(
    unpaidInvoices.map((uj) => uj.customerCode)
  ).size;
  const unpaidInvoicesWithCustomerNames = unpaidInvoices.map((ui) => {
    const customer = getCustomerByCode(ui.customerCode);

    return {
      invoiceNumber: ui.invoiceNumber,
      status: ui.status,
      dueDate: ui.dueDate,
      total: ui.total,
      customerName: customer?.name,
    };
  });

  const latestJobsWithCustomerNames = latestJobs.map((lj) => {
    const customer = getCustomerByCode(lj.customerCode);

    return {
      date: lj.date,
      jobName: lj.jobName,
      customerName: customer?.name,
      status: lj.status,
      quantity: lj.quantity,
      cost: lj.cost,
      total: lj.total,
    };
  });
  const customersOwing = [];

  for (let ui of unpaidInvoices) {
    const existingCustomerOwing = customersOwing.find(
      (c) => c.customerCode === ui.customerCode
    );

    if (!existingCustomerOwing) {
      customersOwing.push({
        customerCode: ui.customerCode,
        customerName: getCustomerByCode(ui.customerCode).name,
        amountOwing: ui.total,
      });
    } else {
      existingCustomerOwing.amountOwing += ui.total;
    }
  }

  return {
    summary: {
      totalAmountOwed,
      numberOfCustomersOwing,
      amountReceivedLastThirty,
    },
    customersOwing,
    unpaidInvoices: unpaidInvoicesWithCustomerNames,
    latestJobs: latestJobsWithCustomerNames,
  };
};
