const express = require("express");
const { createHandler } = require("graphql-http/lib/use/express");
const { buildSchema } = require("graphql");

var schema = buildSchema(`
    type DashboardSummary {
       totalAmountOwed: Float!
       numberOfCustomersOwing: Int!
       amountReceivedLastThirty: Float!
    }

    type DashboardCustomer {       
       customerCode: String!
       customerName: String!
       amountOwing: Float!
    }

    type DashboardJob {
        date: String!
        jobName: String!
        customerName: String!
        status: String!
        quantity: Int
        cost: Float
        total: Float
    }

    type Dashboard {
        summary: DashboardSummary!
        customersOwing: [DashboardCustomer!]!
        latestJobs: [DashboardJob!]!
    }

    type Query {
      getDashboard: Dashboard
    }
`);

const root = {
  getDashboard() {
    return {
      summary: {
        totalAmountOwed: 254.63,
        numberOfCustomersOwing: 2,
        amountReceivedLastThirty: 2356.98,
      },
      customersOwing: [
        {
          customerCode: "CUST-01",
          customerName: "Seymour Petstock",
          amountOwing: 234.33,
        },
        {
          customerCode: "CUST-02",
          customerName: "Seymour Pizza",
          amountOwing: 20.3,
        },
      ],
      latestJobs: [
        {
          date: "2024-08-01T12:00:00.000Z",
          jobName: "Taking a poo",
          customerName: "Seymour Petstock",
          status: "Unpaid",
        },
        {
          date: "2024-07-31T12:00:00.000Z",
          jobName: "Burning down the house",
          customerName: "Seymour Pizza",
          status: "Paid",
          quantity: 2,
          cost: 20.3,
          total: 40.6,
        },
      ],
    };
  },
};

const app = express();

// Create and use the GraphQL handler.
app.all(
  "/graphql",
  createHandler({
    schema: schema,
    rootValue: root,
  })
);

app.listen(4000);
console.log("Running a GraphQL API server at http://localhost:4000/graphql");
