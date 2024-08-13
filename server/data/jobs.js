const jobs = [
  {
    date: "2024-08-01T12:00:00.000Z",
    jobName: "Taking a poo",
    customerCode: "CUST-01",
    status: "NotStarted",
    quantity: 1,
    cost: 23.3,
    total: 23.3,
  },
  {
    date: "2024-07-01T12:00:00.000Z",
    jobName: "Burning down the house",
    customerCode: "CUST-02",
    status: "Started",
    quantity: 2,
    cost: 20.3,
    total: 40.6,
  },
];

function getLatestJobs(count) {
  return jobs.sort((j) => j.date).slice(0, count);
}

module.exports = {
  getLatestJobs,
};
