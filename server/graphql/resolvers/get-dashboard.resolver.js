const { getCustomerByCode } = require("../../data/customers");
const {
  getUnpaidJobs,
  getPaidJobs,
  getLatestJobs,
} = require("../../data/jobs");

module.exports = () => {
  const unpaidJobs = getUnpaidJobs();
  const paidJobs = getPaidJobs(30);
  const latestJobs = getLatestJobs();
  const totalAmountOwed = unpaidJobs
    .map((uj) => uj.total)
    .reduce((amountOwed, t) => amountOwed + t);
  const amountReceivedLastThirty = paidJobs
    .map((pj) => pj.total)
    .reduce((amountReceived, t) => amountReceived + t);
  const numberOfCustomersOwing = new Set(
    unpaidJobs.map((uj) => uj.customerCode)
  ).size;
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

  for (let uj of unpaidJobs) {
    const existingCustomerOwing = customersOwing.find(
      (c) => c.customerCode === uj.customerCode
    );

    if (!existingCustomerOwing) {
      customersOwing.push({
        customerCode: uj.customerCode,
        customerName: getCustomerByCode(uj.customerCode).name,
        amountOwing: uj.total,
      });
    } else {
      existingCustomerOwing.amountOwing += uj.total;
    }
  }

  return {
    summary: {
      totalAmountOwed,
      numberOfCustomersOwing,
      amountReceivedLastThirty,
    },
    customersOwing,
    latestJobs: latestJobsWithCustomerNames,
  };
};
