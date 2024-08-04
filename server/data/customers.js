const customers = [
  {
    code: "CUST-01",
    name: "Local Petstock",
  },
  {
    code: "CUST-02",
    name: "Local Pizza",
  },
];

function getCustomerByCode(code) {
  return customers.find((c) => c.code === code);
}

module.exports = {
  getCustomerByCode,
};
