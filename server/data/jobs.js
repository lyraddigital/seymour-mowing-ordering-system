const { sub, isAfter } = require("date-fns");

const jobs = [
  {
    date: "2024-08-01T12:00:00.000Z",
    jobName: "Taking a poo",
    customerCode: "CUST-01",
    status: "Unpaid",
    quantity: 1,
    cost: 23.3,
    total: 23.3,
  },
  {
    date: "2024-07-01T12:00:00.000Z",
    jobName: "Burning down the house",
    customerCode: "CUST-02",
    status: "Paid",
    quantity: 2,
    cost: 20.3,
    total: 40.6,
  },
];

function getPaidJobs(daysBack) {
  const today = new Date();
  const fromDate = sub(today, { days: daysBack });

  return jobs.filter((j) => isAfter(j.date, fromDate));
}

function getUnpaidJobs() {
  return jobs.filter((j) => j.status === "Unpaid");
}

function getLatestJobs(count) {
  return jobs.sort((j) => j.date).slice(0, count);
}

module.exports = {
  getUnpaidJobs,
  getPaidJobs,
  getLatestJobs,
};
