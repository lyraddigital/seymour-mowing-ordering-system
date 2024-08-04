const customers = [
  {
    code: "CUST-01",
    name: "Seymour Petstock",
  },
  {
    code: "CUST-02",
    name: "Seymour Pizza",
  },
];

function getCustomerByCode(code) {
  return customers.find((c) => c.code === code);
}

module.exports = {
  getCustomerByCode,
};
